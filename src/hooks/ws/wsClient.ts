import { fetchWsToken } from "@/api/wsAuthApi";

type Listener = (msg: MessageEvent<string>) => void;

/**
 * Convert the HTTP-flavoured backend base URL into a safe WebSocket URL.
 *
 * - `https://host` -> `wss://host/ws` (always)
 * - `http://host`  -> `ws://host/ws`  ONLY in dev. In production this throws to
 *   refuse plaintext WS connections (defense in depth against an env
 *   misconfiguration that would otherwise downgrade transport).
 *
 * Exported for unit testing.
 */
export function deriveWsUrl(baseUrl: string, isProd: boolean): string {
  if (!baseUrl) {
    throw new Error("VITE_BACKEND_URL is not set; cannot open WebSocket");
  }
  let wsBase: string;
  if (baseUrl.startsWith("https://")) {
    wsBase = "wss://" + baseUrl.slice("https://".length);
  } else if (baseUrl.startsWith("http://")) {
    if (isProd) {
      throw new Error(
        "Refusing to open ws:// WebSocket in production; require wss://"
      );
    }
    wsBase = "ws://" + baseUrl.slice("http://".length);
  } else {
    throw new Error(
      "VITE_BACKEND_URL must start with http:// or https://, got: " + baseUrl
    );
  }
  return wsBase.replace(/\/+$/, "") + "/ws";
}

class WSClient {
  private ws: WebSocket | null = null;
  private refs = 0;
  private listeners = new Set<Listener>();
  private closeTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private sendQueue: string[] = [];
  private backoffMs = 500;
  private connecting = false;

  constructor(private readonly url: string) {}

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: "PING", ts: Date.now() }));
      }
    }, 25000);
  }
  private stopHeartbeat() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = null;
  }

  private flushQueue() {
    while (
      this.ws &&
      this.ws.readyState === WebSocket.OPEN &&
      this.sendQueue.length
    ) {
      this.ws.send(this.sendQueue.shift()!);
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer || this.refs <= 0) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      void this.connect();
      this.backoffMs = Math.min(this.backoffMs * 2, 8000);
    }, this.backoffMs);
  }

  /**
   * Open the WebSocket. PLS 03 CSWH mitigation: we fetch a fresh WS JWT first
   * (Sa-Token cookie authorizes the mint), open the socket, and send AUTH as
   * the very first frame. The backend will not subscribe the connection to any
   * user channel until AUTH is verified.
   */
  private async connect() {
    if (this.ws || this.connecting || this.refs <= 0) return;
    this.connecting = true;

    let token: string;
    try {
      const resp = await fetchWsToken();
      token = resp.token;
    } catch (e) {
      console.error("[WS] failed to fetch WS JWT:", e);
      this.connecting = false;
      this.scheduleReconnect();
      return;
    }

    const socket = new WebSocket(this.url);
    this.ws = socket;

    socket.onopen = () => {
      try {
        socket.send(JSON.stringify({ type: "AUTH", token }));
      } catch (e) {
        console.error("[WS] AUTH send failed:", e);
        socket.close();
        return;
      }
      console.log("[WS] Connected:", this.url);
      this.backoffMs = 500;
      this.flushQueue();
      this.startHeartbeat();
      this.connecting = false;
    };
    socket.onclose = (ev) => {
      console.log("[WS] Closed:", ev.code, ev.reason);
      this.stopHeartbeat();
      this.ws = null;
      this.connecting = false;
      this.scheduleReconnect();
    };
    socket.onerror = (e) => console.error("[WS] Error:", e);
    socket.onmessage = (e) => {
      for (const l of this.listeners) l(e);
    };
  }

  subscribe(listener: Listener) {
    if (this.closeTimer) {
      clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }
    this.refs++;
    void this.connect();
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
      this.refs--;
      if (this.refs <= 0) {
        this.closeTimer = setTimeout(() => {
          this.stopHeartbeat();
          this.ws?.close();
          this.ws = null;
        }, 300);
      }
    };
  }

  send(data: string | object) {
    const payload = typeof data === "string" ? data : JSON.stringify(data);
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(payload);
      return true;
    }
    this.sendQueue.push(payload);
    void this.connect();
    return false;
  }
}

const clients = new Map<string, WSClient>();

export function getWS(userId: string): WSClient {
  // URL no longer carries userId; identity is established by the AUTH frame
  // verified against the WS JWT sub claim. Map by userId only so different
  // logged-in accounts (e.g. across browser profiles) don't share a client.
  const url = deriveWsUrl(
    import.meta.env.VITE_BACKEND_URL,
    Boolean(import.meta.env.PROD)
  );
  if (!clients.has(userId)) {
    clients.set(userId, new WSClient(url));
  }
  return clients.get(userId)!;
}
