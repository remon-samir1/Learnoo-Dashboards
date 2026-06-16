"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/src/stores/authStore";
import {
  getEchoInstance,
  refreshEchoAuth,
  listenForOTP,
  type OTPPayload,
} from "@/src/lib/echo";

interface UseEchoOTPReturn {
  otp: string | null;
  isConnected: boolean;
  clearOTP: () => void;
}

export function useEchoOTP(): UseEchoOTPReturn {
  const { user, isAuthenticated, token } = useAuth();
  const [otp, setOtp] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const cleanupRef = useRef<(() => void) | null>(null);
  const isListeningRef = useRef(false);

  const clearOTP = useCallback(() => {
    setOtp(null);
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user || !token) {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
        isListeningRef.current = false;
      }
      return;
    }

    const echo = getEchoInstance();
    if (!echo) {
      console.warn("[Echo] Echo instance not available");
      return;
    }

    refreshEchoAuth();

    const userId = user.id;
    console.log("[useEchoOTP] User ID:", userId, "User object:", user);
    if (!userId) {
      console.warn("[Echo] User ID not available");
      return;
    }

    if (isListeningRef.current) {
      return;
    }

    isListeningRef.current = true;

    const cleanup = listenForOTP(userId, (payload: OTPPayload) => {
      const receivedOtp = payload?.user?.otp;
      if (receivedOtp) {
        setOtp(receivedOtp);
      }
    });

    cleanupRef.current = cleanup;

    const checkConnection = () => {
      const pusher = echo.connector.pusher;
      if (pusher && pusher.connection) {
        setIsConnected(pusher.connection.state === "connected");
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 5000);

    echo.connector.pusher.connection.bind("connected", () => {
      setIsConnected(true);
    });

    echo.connector.pusher.connection.bind("disconnected", () => {
      setIsConnected(false);
    });

    echo.connector.pusher.connection.bind("error", (err: Error) => {
      console.error("[Echo] Connection error:", err.message);
      setIsConnected(false);
    });

    return () => {
      clearInterval(interval);
      echo.connector.pusher.connection.unbind("connected");
      echo.connector.pusher.connection.unbind("disconnected");
      echo.connector.pusher.connection.unbind("error");

      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
      isListeningRef.current = false;
    };
  }, [isAuthenticated, user, token]);

  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
      isListeningRef.current = false;
    };
  }, []);

  return {
    otp,
    isConnected,
    clearOTP,
  };
}