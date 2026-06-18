"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/src/stores/authStore";
import {
  getEchoInstance,
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

    const userId = user.id;
    console.log("[useEchoOTP] User ID:", userId, "User object:", user);
    if (!userId) {
      console.warn("[Echo] User ID not available");
      return;
    }

    const pusher = echo.connector.pusher;

    // ✅ ابدأ الـ subscription بس لما الـ connection يكون جاهز
    const startListening = () => {
      if (isListeningRef.current) return;
      isListeningRef.current = true;

      console.log("[Echo] Starting to listen, connection state:", pusher.connection.state);

      const cleanup = listenForOTP(userId, (payload: OTPPayload) => {
        console.log("[Echo] Raw payload received:", JSON.stringify(payload));
        const receivedOtp = payload?.user?.otp;
        if (receivedOtp) {
          setOtp(receivedOtp);
        }
      });

      cleanupRef.current = cleanup;
    };

    // ✅ لو متصل فعلاً ابدأ فوراً، لو لسه بيتصل استنى الـ event
    if (pusher.connection.state === "connected") {
      setIsConnected(true);
      startListening();
    } else {
      pusher.connection.bind("connected", () => {
        setIsConnected(true);
        startListening();
      });
    }

    pusher.connection.bind("disconnected", () => {
      console.warn("[Echo] Disconnected");
      setIsConnected(false);
    });

    pusher.connection.bind("error", (err: Error) => {
      console.error("[Echo] Connection error:", err);
      setIsConnected(false);
    });

    return () => {
      pusher.connection.unbind("connected");
      pusher.connection.unbind("disconnected");
      pusher.connection.unbind("error");

      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
      isListeningRef.current = false;
    };
  }, [isAuthenticated, user, token]);

  // cleanup عند unmount
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