import { useCallback, useEffect, useRef, useState } from "react";

export type WebSocketStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

export type WebSocketMessage = {
  type: string;
  [key: string]: unknown;
};

export type UseWebSocketOptions = {
  url: string;
  onMessage?: (message: WebSocketMessage) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
  reconnect?: boolean;
  reconnectInterval?: number;
};

export function useWebSocket({
  url,
  onMessage,
  onOpen,
  onClose,
  onError,
  reconnect = true,
  reconnectInterval = 3000,
}: UseWebSocketOptions) {
  const [status, setStatus] = useState<WebSocketStatus>("disconnected");
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<Timer | null>(null);

  // Use refs for callbacks to avoid dependency issues
  const onMessageRef = useRef(onMessage);
  const onOpenRef = useRef(onOpen);
  const onCloseRef = useRef(onClose);
  const onErrorRef = useRef(onError);

  // Update refs when callbacks change
  useEffect(() => {
    onMessageRef.current = onMessage;
    onOpenRef.current = onOpen;
    onCloseRef.current = onClose;
    onErrorRef.current = onError;
  }, [onMessage, onOpen, onClose, onError]);

  const sendMessage = (message: WebSocketMessage | string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const data =
        typeof message === "string" ? message : JSON.stringify(message);
      wsRef.current.send(data);
    }
  };

  const connect = useCallback(() => {
    try {
      setStatus("connecting");
      const ws = new WebSocket(url);

      ws.onopen = () => {
        setStatus("connected");
        onOpenRef.current?.();
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          setMessages((prev) => [...prev, message]);
          onMessageRef.current?.(message);
        } catch {
          // If not JSON, create a basic message object
          const message = { type: "text", data: event.data };
          setMessages((prev) => [...prev, message]);
          onMessageRef.current?.(message);
        }
      };

      ws.onclose = () => {
        setStatus("disconnected");
        onCloseRef.current?.();

        if (reconnect) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };

      ws.onerror = (error) => {
        setStatus("error");
        onErrorRef.current?.(error);
      };

      wsRef.current = ws;
    } catch (error) {
      setStatus("error");
      if (error instanceof Event) {
        onErrorRef.current?.(error);
      }
    }
  }, [url, reconnect, reconnectInterval]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setStatus("disconnected");
  }, []);

  useEffect(() => {
    connect();

    return () => {
      // Cleanup on unmount - disable reconnect and close
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]); // Reconnect when connect function changes (url, reconnect settings)

  return {
    status,
    messages,
    sendMessage,
    connect,
    disconnect,
  };
}
