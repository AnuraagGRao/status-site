import { useEffect, useState, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";

export interface LiveStatus {
  status: "working" | "away";
  activity?: string | null;
  spotify?: {
    track: string;
    artist: string;
    album: string;
    url: string;
  } | null;
  github?: {
    repo: string;
    commits: number;
    message: string;
    timestamp: string;
  } | null;
  gaming?: {
    game: string;
    status: string;
  } | null;
  timestamp: string;
}

interface UseStatusWebSocketOptions {
  enabled?: boolean;
  fallbackToPolling?: boolean;
  pollingInterval?: number;
}

/**
 * Hook to connect to live status updates via WebSocket with polling fallback
 * For real-time updates when available, falls back to REST polling on connection issues
 */
export function useStatusWebSocket(
  wsUrl: string,
  options: UseStatusWebSocketOptions = {}
) {
  const {
    enabled = true,
    fallbackToPolling = true,
    pollingInterval = 30000,
  } = options;

  const [status, setStatus] = useState<LiveStatus | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Polling fallback function
  const pollStatus = useCallback(async () => {
    try {
      const apiUrl = wsUrl.replace("/ws/", "/api/");
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error("Failed to fetch status");
      const data = await response.json();
      setStatus(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }, [wsUrl]);

  useEffect(() => {
    if (!enabled) return;

    // Try WebSocket connection first
    try {
      const socket = io(wsUrl, {
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });

      socket.on("connect", () => {
        console.log("WebSocket connected");
        setIsConnected(true);
        setError(null);
        
        // Clear polling if it was running
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      });

      socket.on("status", (data: LiveStatus) => {
        setStatus(data);
      });

      socket.on("disconnect", () => {
        console.log("WebSocket disconnected");
        setIsConnected(false);
        
        // Fall back to polling
        if (fallbackToPolling && !pollingRef.current) {
          console.log("Falling back to polling");
          pollStatus(); // Initial fetch
          pollingRef.current = setInterval(pollStatus, pollingInterval);
        }
      });

      socket.on("connect_error", (err) => {
        console.error("WebSocket connection error:", err);
        setError(err.message);
        
        // Fall back to polling
        if (fallbackToPolling && !pollingRef.current) {
          pollStatus();
          pollingRef.current = setInterval(pollStatus, pollingInterval);
        }
      });

      socketRef.current = socket;
    } catch (err) {
      console.error("Failed to initialize WebSocket:", err);
      
      // Fall back to polling immediately
      if (fallbackToPolling) {
        pollStatus();
        pollingRef.current = setInterval(pollStatus, pollingInterval);
      }
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [enabled, wsUrl, fallbackToPolling, pollingInterval, pollStatus]);

  return { status, isConnected, error };
}
