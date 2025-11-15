import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getWS } from "./wsClient";

export interface WSMessage {
  raw: string;
  parsed?: unknown;
}

type Outbound = string | Record<string, unknown>;

function safeParse(input: string): unknown | undefined {
  try {
    return JSON.parse(input);
  } catch {
    return undefined;
  }
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
      const parsed = safeParse(raw);
      setMessagesRef.current((prev) => [...prev, { raw, parsed }]);

      // invalidate feed + unread on any incoming WS event
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
