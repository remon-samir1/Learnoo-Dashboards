"use client";

import Pusher from "pusher-js";

let pusherClient: Pusher | null = null;

export function getPusherClient() {
  if (!pusherClient) {
    Pusher.logToConsole = true;

    pusherClient = new Pusher("ecnn3pfvurlo73fkabhm", {
      cluster: "mt1",
      wsHost: "31.97.36.130",
      wsPort: 8090,
      forceTLS: false,
      enabledTransports: ["ws"],
      enableStats: false,
    });
  }

  return pusherClient;
}