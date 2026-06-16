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

interface EchoConfig {
  broadcaster: "reverb";
  key: string;
  wsHost: string;
  wsPort: number;
  forceTLS: boolean;
  enabledTransports: ("ws" | "wss")[];
  authEndpoint: string;
  auth: {
    headers: {
      Authorization: string;
    };
  };
}

function getEchoConfig(): EchoConfig {
  const token = Cookies.get("token");
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.learnoo.app';

  return {
    broadcaster: "reverb",
    key: "ecnn3pfvurlo73fkabhm",
    wsHost: "31.97.36.130",
    wsPort: 8090,
    forceTLS: false,
    enabledTransports: ["ws"],
    authEndpoint: `${apiBaseUrl}/v1/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: `Bearer ${token || ""}`,
      },
    },
  };
}

export function getEchoInstance(): Echo<any> | null {
  if (typeof window === "undefined") return null;

  if (!echoInstance) {
    window.Pusher = Pusher;

    const config = getEchoConfig();

    echoInstance = new Echo(config);

    echoInstance.connector.pusher.connection.bind("connected", () => {
      console.log("[Echo] Connected to WebSocket server");
    });

    echoInstance.connector.pusher.connection.bind("disconnected", () => {
      console.log("[Echo] Disconnected from WebSocket server");
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

export function refreshEchoAuth(): void {
  if (echoInstance) {
    const token = Cookies.get("token");
    console.log("[Echo] Refreshing auth with token:", token ? "present" : "missing");
    const config = echoInstance.connector.pusher.config;
    if (config.auth && config.auth.headers) {
      config.auth.headers.Authorization = `Bearer ${token || ""}`;
      console.log("[Echo] Auth token refreshed");
    }
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
    return () => {};
  }

  const channelName = `auto-otp.${userId}`;
  const channel = echo.private(channelName);

  channel.subscribed(() => {
    console.log(`[Echo] Subscribed to channel: ${channelName}`);
  });

  channel.listen("SendOtpEvent", (payload: OTPPayload) => {
    console.log("[Echo] OTP received:", payload);
    callback(payload);
  });

  channel.error((err: Error) => {
    console.error(`[Echo] Channel error for ${channelName}:`, err);
  });

  console.log(`[Echo] Listening for OTP on channel: ${channelName}`);

  return () => {
    channel.stopListening("SendOtpEvent");
    echo.leaveChannel(channelName);
    console.log(`[Echo] Stopped listening on channel: ${channelName}`);
  };
}