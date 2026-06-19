"use client";

import Echo from "laravel-echo";
import Pusher from "pusher-js";
import Cookies from "js-cookie";

declare global {
  interface Window {
    Pusher: typeof Pusher;
    Echo: Echo<any>;
  }
}

let echoInstance: Echo<any> | null = null;

function getEchoConfig() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.learnoo.app';
const isProd = process.env.NODE_ENV === "production";
console.log(process.env.NODE_ENV);
  return {
    broadcaster: "reverb" as const,
    key: "ecnn3pfvurlo73fkabhm",
    wsHost: isProd ? "api.learnoo.app" : "31.97.36.130", 
    
    wsPort: 8090,
    wssPort:  8090,
    
    forceTLS: isProd, 
    
    enabledTransports: ["ws" as const, "wss" as const],

    authorizer: (channel: { name: string }) => ({
      authorize: (socketId: string, callback: Function) => {
        const token = sessionStorage.getItem("pending_auth_token") || Cookies.get("token");

        console.log("[Echo] Authorizing channel:", channel.name);
        console.log("[Echo] Token:", token ? "present" : "MISSING ❌");

        fetch("/api/broadcasting/auth", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Bearer ${token || ""}`,
          },
          body: new URLSearchParams({
            socket_id: socketId,
            channel_name: channel.name,
          }),
        })
          .then((res) => {
            console.log("[Echo] Auth response status:", res.status);
            return res.json();
          })
          .then((data) => {
            console.log("[Echo] Auth response data:", data);
            callback(false, data);
          })
          .catch((err) => {
            console.error("[Echo] Auth request failed:", err);
            callback(true, err);
          });
      },
    }),
  };
}

export function getEchoInstance(): Echo<any> | null {
  if (typeof window === "undefined") return null;

  if (!echoInstance) {
    window.Pusher = Pusher;
    const config = getEchoConfig();
    echoInstance = new Echo(config);

    echoInstance.connector.pusher.connection.bind("connected", () => {
      console.log("[Echo] ✅ Connected to WebSocket server");
    });

    echoInstance.connector.pusher.connection.bind("disconnected", () => {
      console.log("[Echo] ❌ Disconnected from WebSocket server");
    });

    echoInstance.connector.pusher.connection.bind("error", (error: Error) => {
      console.error("[Echo] Connection error:", error);
    });

    echoInstance.connector.pusher.connection.bind("reconnecting", () => {
      console.log("[Echo] Reconnecting...");
    });

    echoInstance.connector.pusher.connection.bind("reconnected", () => {
      console.log("[Echo] Reconnected");
    });
  }

  return echoInstance;
}

export function disconnectEcho(): void {
  if (echoInstance) {
    echoInstance.disconnect();
    echoInstance = null;
    console.log("[Echo] Disconnected and cleaned up");
  }
}

export type OTPPayload = {
  user: {
    otp: string;
  };
};

export type OTPCallback = (payload: OTPPayload) => void;

export function listenForOTP(userId: string | number, callback: OTPCallback): () => void {
  const echo = getEchoInstance();
  if (!echo) {
    console.warn("[Echo] Echo instance not available");
    return () => { };
  }

  const channelName = `auto-otp.${userId}`;
  console.log("[Echo] Calling echo.private() for channel:", channelName);

  const channel = echo.private(channelName);

  channel.subscribed(() => {
    console.log(`✅ [Echo] Subscribed successfully to: private-${channelName}`);
  });

  channel.error((err: unknown) => {
    console.error(`❌ [Echo] Channel subscription failed:`, JSON.stringify(err));
  });

  // ✅ نقطة قبل اسم الـ event
  channel.listen("SendOtpEvent", (payload: OTPPayload) => {
    console.log("[Echo] 🎉 OTP received! Raw payload:", JSON.stringify(payload));
    callback(payload);
  });

  return () => {
    channel.stopListening("SendOtpEvent");
    echo.leave(channelName);
    console.log(`[Echo] Left channel: ${channelName}`);
  };
}