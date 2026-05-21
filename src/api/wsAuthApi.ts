import { http } from "@/lib/http";

/**
 * Response from POST /ws/token. The backend mints a short-lived HS256 JWT
 * scoped to WebSocket connection auth (aud=chronoflow-ws, purpose=websocket-auth,
 * ttl ~60s). The session cookie carried by `http` (withCredentials) authorizes
 * the mint; the resulting token must be sent as the first WS message.
 */
export interface WsTokenResponse {
  token: string;
  /** Unix epoch seconds. */
  exp: number;
}

/**
 * Fetch a fresh WS JWT immediately before opening a WebSocket. Always call
 * this per-connection (and per-reconnect) — tokens are intentionally short-lived
 * and the backend may treat the jti as single-use.
 *
 * Authentication: relies on the Sa-Token session cookie; no body needed.
 * If the session has expired, the standard 401 interceptor will refresh and
 * retry transparently.
 */
export async function fetchWsToken(): Promise<WsTokenResponse> {
  const res = await http.post<WsTokenResponse>("/ws/token");
  return res.data;
}
