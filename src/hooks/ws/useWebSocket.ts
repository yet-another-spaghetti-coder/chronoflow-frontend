import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getWS } from "./wsClient";
import {
  WsServerMessageSchema,
  type WsServerMessage,
} from "@/lib/validation/schema";

export interface WSMessage {
  raw: string;
  parsed?: WsServerMessage;
}

type Outbound = string | Record<string, unknown>;

/**
 * Parse an inbound WS frame and validate it against the allow-listed message
 * envelope. Returns `undefined` if the frame is non-JSON or doesn't match a
 * known shape; the caller drops such messages instead of forwarding them.
 *
 * PLS 03: treat WS bytes as data, never as code. Bounding parse cost and
 * shape-checking before exposing to React state limits the blast radius of
 * an authenticated-but-misbehaving server (or future XSS reading messages).
 */
function safeValidateServerMessage(input: string): WsServerMessage | undefined {
  // Bound parse cost. 64KB matches the BE frame cap.
  if (!input || input.length > 64 * 1024) return undefined;
  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch {
    return undefined;
  }
  const result = WsServerMessageSchema.safeParse(parsed);
  return result.success ? result.data : undefined;
}

export function useWebSocket(userId: string) {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<WSMessage[]>([]);
  const queryClient = useQueryClient();

  const setMessagesRef = useRef(setMessages);
  const setConnectedRef = useRef(setConnected);

  setMessagesRef.current = setMessages;
  setConnectedRef.current = setConnected;

  const client = useMemo(() => getWS(userId), [userId]);

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = client.subscribe((evt: MessageEvent<string>) => {
      const raw = evt.data ?? "";
      const parsed = safeValidateServerMessage(raw);
      if (!parsed) {
        // Unknown or malformed frame: drop without invalidating queries.
        return;
      }
      setMessagesRef.current((prev) => [...prev, { raw, parsed }]);

      // PONG is a heartbeat reply, not a data event.
      if (parsed.type === "PONG") return;

      // invalidate feed + unread on any pushed notification event
      queryClient.invalidateQueries({
        predicate: (q) => {
          const k = q.queryKey as unknown[];
          return Array.isArray(k) && k[0] === "feed" && k[1] === userId;
        },
      });

      queryClient.invalidateQueries({
        predicate: (q) => {
          const k = q.queryKey as unknown[];
          return Array.isArray(k) && k[0] === "feed-unread" && k[1] === userId;
        },
      });
    });

    // use typed field instead of casting to any
    const ws: WebSocket | undefined = (client as unknown as { ws?: WebSocket })
      .ws;

    const handleOpen = () => setConnectedRef.current(true);
    const handleClose = () => setConnectedRef.current(false);

    if (ws) {
      setConnected(ws.readyState === WebSocket.OPEN);
      ws.addEventListener("open", handleOpen);
      ws.addEventListener("close", handleClose);
    } else {
      setConnected(false);
    }

    return () => {
      unsubscribe();
      if (ws) {
        ws.removeEventListener("open", handleOpen);
        ws.removeEventListener("close", handleClose);
      }
    };
  }, [client, userId, queryClient]);

  const send = (data: Outbound): boolean => client.send(data);
  const clearMessages = (): void => setMessages([]);

  return {
    connected,
    messages,
    send,
    clearMessages,
  };
}
