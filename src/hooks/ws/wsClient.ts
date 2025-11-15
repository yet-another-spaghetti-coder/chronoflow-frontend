type Listener = (msg: MessageEvent<string>) => void;

class WSClient {
  private ws: WebSocket | null = null;
  private refs = 0;
  private listeners = new Set<Listener>();
  private closeTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setTimeout> | null = null;
  private sendQueue: string[] = [];
  private backoffMs = 500;

  constructor(private readonly url: string) {}

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: "PING", ts: Date.now() }));
      }
    }, 25000) as unknown as ReturnType<typeof setInterval>;
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
      this.connect();
      this.backoffMs = Math.min(this.backoffMs * 2, 8000);
    }, this.backoffMs);
  }

  private connect() {
    if (this.ws) return;
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log("[WS] Connected:", this.url);
      this.backoffMs = 500;
      this.flushQueue();
      this.startHeartbeat();
    };
    this.ws.onclose = () => {
      console.log("[WS] Closed:", this.url);
      this.stopHeartbeat();
      this.ws = null;
      this.scheduleReconnect();
    };
    this.ws.onerror = (e) => console.error("[WS] Error:", e);
    this.ws.onmessage = (e) => {
      for (const l of this.listeners) l(e);
    };
  }

  subscribe(listener: Listener) {
    if (this.closeTimer) {
      clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }
    this.refs++;
    this.connect();
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
    // queue until connected
    this.sendQueue.push(payload);
    this.connect();
    return false;
  }
}

const clients = new Map<string, WSClient>();

export function getWS(userId: string): WSClient {
  const base = import.meta.env.VITE_BACKEND_URL;
  const url = `${base}/ws?userId=${encodeURIComponent(userId)}`;

  if (!clients.has(userId)) {
    clients.set(userId, new WSClient(url));
  }
  return clients.get(userId)!;
}
