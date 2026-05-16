import { useState, useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { apiFetch, API_BASE } from "../lib/api";




export interface LiveAlert {
  id: string;
  timestamp: string;
  severity: "critical" | "high" | "medium" | "low";
  type: string;
  sourceIp: string;
  targetUrl: string;
  userAgent?: string;
  statusCode?: number;
}

export type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

interface UseLiveAlertsReturn {
  
  alerts: LiveAlert[];
  
  status: ConnectionStatus;
  
  isHistoryLoaded: boolean;
  
  totalReceived: number;
  
  clearAlerts: () => void;
  
  reconnect: () => void;
}

const BACKEND_URL = API_BASE;
const MAX_ALERTS = 200;




export function useLiveAlerts(): UseLiveAlertsReturn {
  const [alerts, setAlerts] = useState<LiveAlert[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);
  const [totalReceived, setTotalReceived] = useState(0);

  const socketRef = useRef<Socket | null>(null);

  
  const connect = useCallback(async () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setTimeout(() => {
      setStatus("connecting");
    }, 0);

    try {
      const tokenRes = await apiFetch("/api/auth/ws-token");
      if (!tokenRes.ok) throw new Error("Failed to get ws token");
      const { wsToken } = await tokenRes.json();

      const socket = io(BACKEND_URL, {
        transports: ["websocket", "polling"],
        reconnectionAttempts: 10,
        reconnectionDelay: 2000,
        auth: { token: wsToken },
      });

      socketRef.current = socket;

      socket.on("connect", () => {
        setStatus("connected");
      });

      socket.on("disconnect", () => {
        setStatus("disconnected");
      });

      socket.on("connect_error", () => {
        setStatus("error");
      });

      socket.on("liveAlert", (newAlert: LiveAlert) => {
        setAlerts((prev) => {
          if (prev.some((a) => a.id === newAlert.id)) return prev;
          const updated = [newAlert, ...prev];
          return updated.slice(0, MAX_ALERTS);
        });
        setTotalReceived((prev) => prev + 1);
      });

      return socket;
    } catch (err) {
      console.error("[useLiveAlerts] Connection error:", err);
      setStatus("error");
      return null;
    }
  }, []);

  
  useEffect(() => {
    let activeSocket: Socket | null = null;
    
    connect().then(socket => {
      if (socket) activeSocket = socket;
    });

    apiFetch("/api/alerts")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setAlerts(data.slice(0, MAX_ALERTS));
          setTotalReceived(data.length);
        }
        setIsHistoryLoaded(true);
      })
      .catch((err) => {
        console.error("[useLiveAlerts] Failed to fetch history:", err);
        setIsHistoryLoaded(true); 
      });

    return () => {
      if (activeSocket) activeSocket.disconnect();
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [connect]);

  
  const clearAlerts = useCallback(() => {
    setAlerts([]);
    setTotalReceived(0);
  }, []);

  const reconnect = useCallback(() => {
    connect();
  }, [connect]);

  return {
    alerts,
    status,
    isHistoryLoaded,
    totalReceived,
    clearAlerts,
    reconnect,
  };
}
