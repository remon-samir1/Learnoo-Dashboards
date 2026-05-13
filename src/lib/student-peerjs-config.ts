/** PeerJS + WebRTC config for student live viewers (matches Learnoo peer server). */

export const STUDENT_PEER_JS_OPTIONS = {
  host: "peer.learnoo.app",
  path: "/server",
  port: 443,
  secure: true,
} as const;

export const STUDENT_PEER_ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  {
    urls: "turn:global.relay.metered.ca:80",
    username: "f29e7283f4043b41d539ce22",
    credential: "+61zZCdLwcLhN0KX",
  },
  {
    urls: "turn:global.relay.metered.ca:80?transport=tcp",
    username: "f29e7283f4043b41d539ce22",
    credential: "+61zZCdLwcLhN0KX",
  },
  {
    urls: "turn:global.relay.metered.ca:443",
    username: "f29e7283f4043b41d539ce22",
    credential: "+61zZCdLwcLhN0KX",
  },
  {
    urls: "turns:global.relay.metered.ca:443?transport=tcp",
    username: "f29e7283f4043b41d539ce22",
    credential: "+61zZCdLwcLhN0KX",
  },
];
