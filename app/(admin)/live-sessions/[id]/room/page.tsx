'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Peer } from 'peerjs';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  MessageSquare,
  Users,
  Settings,
  ChevronLeft,
  Copy,
  Check,
  Monitor,
  MonitorOff,
  MoreVertical,
  Maximize2,
} from 'lucide-react';
import Link from 'next/link';
import { useLiveRoom } from '@/src/hooks/useLiveRooms';
import { getUserData } from '@/lib/auth';

interface Participant {
  id: string;
  name: string;
  stream?: MediaStream;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: Date;
}

const PEER_SERVER_HOST = 'peer.learnoo.app';
const PEER_SERVER_PORT = 443;
const PEER_SERVER_PATH = '/server';

export default function LiveRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;

  const { data: liveRoom, isLoading: isRoomLoading } = useLiveRoom([parseInt(roomId)]);

  const [peer, setPeer] = useState<Peer | null>(null);
  const [myPeerId, setMyPeerId] = useState<string>('');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [participants, setParticipants] = useState<Map<string, Participant>>(new Map());
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const userData = getUserData();
  const userName = userData?.attributes?.first_name
    ? `${userData.attributes.first_name} ${userData.attributes.last_name || ''}`
    : 'Instructor';

  // Initialize PeerJS and get user media
  useEffect(() => {
    if (!roomId) return;

    const initPeer = async (idToUse?: string): Promise<Peer | null> => {
      try {
        const isHostAttempt = idToUse === roomId;

        // Get user media if not already available
        let stream = localStream;
        if (!stream) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
          setLocalStream(stream);

          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        }

        const newPeer = new Peer(idToUse || '', {
          host: PEER_SERVER_HOST,
          port: PEER_SERVER_PORT,
          path: PEER_SERVER_PATH,
          secure: true,
          config: {
            iceServers: [
              {
                urls: "stun:stun.relay.metered.ca:80",
              },
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
            ],
          },
          debug: 2,
        });

        newPeer.on('open', (id) => {
          console.log('Connected to PeerJS server with ID:', id);
          setMyPeerId(id);
          setConnectionStatus('connected');

          if (!isHostAttempt) {
            // I am a participant, connect to the host
            console.log('Connecting to host:', roomId);
            const conn = newPeer.connect(roomId);
            conn.on('open', () => {
              console.log('Data connection to host opened, sending join action');
              conn.send({
                action: 'join',
                id: id,
                name: userName
              });
            });

            conn.on('error', (err) => {
              console.error('Data connection error:', err);
            });
          }
        });

        newPeer.on('error', (err) => {
          console.error('PeerJS error:', err);

          if (isHostAttempt && err.type === 'unavailable-id') {
            console.log('Room ID taken, joining as participant...');
            newPeer.destroy();
            initPeer(); // Try again without a specific ID to be a participant
            return;
          }

          setConnectionStatus('error');
        });

        newPeer.on('call', (call) => {
          console.log('Incoming call from:', call.peer);
          if (stream) {
            call.answer(stream);
          }

          call.on('stream', (remoteStream) => {
            setParticipants((prev) => {
              const updated = new Map(prev);
              const participant = updated.get(call.peer);
              if (participant) {
                updated.set(call.peer, { ...participant, stream: remoteStream });
              } else {
                // If we don't know this participant yet, add them
                updated.set(call.peer, {
                  id: call.peer,
                  name: 'Remote User',
                  stream: remoteStream,
                  isAudioEnabled: true,
                  isVideoEnabled: true,
                  isScreenSharing: false,
                });
              }
              return updated;
            });
          });
        });

        newPeer.on('connection', (conn) => {
          conn.on('data', (data: any) => {
            console.log('Data received:', data);
            if (data.action === 'join') {
              console.log('Participant joining:', data.id);
              // When a participant sends 'join', call them with our current stream
              const streamToShare = screenStreamRef.current || stream;
              if (streamToShare) {
                newPeer.call(data.id, streamToShare);
              }

              setParticipants((prev) => {
                if (prev.has(data.id)) return prev;
                const updated = new Map(prev);
                updated.set(data.id, {
                  id: data.id,
                  name: data.name || 'Participant',
                  isAudioEnabled: true,
                  isVideoEnabled: true,
                  isScreenSharing: false,
                });
                return updated;
              });
            } else if (typeof data === 'object' && data !== null) {
              const msg = data as { type: string; senderId: string; senderName: string; message: string };
              if (msg.type === 'chat') {
                setMessages((prev) => [
                  ...prev,
                  {
                    id: `${Date.now()}-${Math.random()}`,
                    senderId: msg.senderId,
                    senderName: msg.senderName,
                    message: msg.message,
                    timestamp: new Date(),
                  },
                ]);
              }
            }
          });
        });

        setPeer(newPeer);
        return newPeer;
      } catch (err) {
        console.error('Failed to initialize peer:', err);
        setConnectionStatus('error');
        return null;
      }
    };

    let peerInstance: Peer | null = null;

    initPeer(roomId).then((peer) => {
      peerInstance = peer;
    });

    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (peerInstance) {
        peerInstance.destroy();
      }
    };
  }, [roomId]);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleAudio = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  }, [localStream]);

  const toggleVideo = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  }, [localStream]);

  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      // Stop screen sharing
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
        screenStreamRef.current = null;
      }

      if (localStream && localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;

        // Update all active calls with the original stream
        if (peer) {
          Object.values(peer.connections).forEach((conns: any) => {
            conns.forEach((conn: any) => {
              if (conn.peerConnection && conn.localStream) {
                const videoTrack = localStream.getVideoTracks()[0];
                const sender = conn.peerConnection.getSenders().find((s: any) => s.track?.kind === 'video');
                if (sender && videoTrack) {
                  sender.replaceTrack(videoTrack);
                }
              }
            });
          });
        }
      }
      setIsScreenSharing(false);
    } else {
      // Start screen sharing
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
        screenStreamRef.current = screenStream;

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }

        // Update all active calls with the screen stream
        if (peer) {
          Object.values(peer.connections).forEach((conns: any) => {
            conns.forEach((conn: any) => {
              if (conn.peerConnection) {
                const videoTrack = screenStream.getVideoTracks()[0];
                const sender = conn.peerConnection.getSenders().find((s: any) => s.track?.kind === 'video');
                if (sender && videoTrack) {
                  sender.replaceTrack(videoTrack);
                }
              }
            });
          });
        }

        screenStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          screenStreamRef.current = null;
          if (localStream && localVideoRef.current) {
            localVideoRef.current.srcObject = localStream;

            // Revert tracks for all calls
            if (peer) {
              Object.values(peer.connections).forEach((conns: any) => {
                conns.forEach((conn: any) => {
                  if (conn.peerConnection) {
                    const videoTrack = localStream.getVideoTracks()[0];
                    const sender = conn.peerConnection.getSenders().find((s: any) => s.track?.kind === 'video');
                    if (sender && videoTrack) {
                      sender.replaceTrack(videoTrack);
                    }
                  }
                });
              });
            }
          }
        };

        setIsScreenSharing(true);
      } catch (err) {
        console.error('Failed to share screen:', err);
      }
    }
  }, [isScreenSharing, localStream, peer]);

  const sendMessage = useCallback(() => {
    if (!newMessage.trim() || !peer || !myPeerId) return;

    const messageData = {
      type: 'chat',
      senderId: myPeerId,
      senderName: userName,
      message: newMessage.trim(),
    };

    // Send to all connected peers
    Object.values(peer.connections).forEach((connections) => {
      if (Array.isArray(connections)) {
        connections.forEach((conn) => {
          if (conn.open) {
            conn.send(messageData);
          }
        });
      }
    });

    // Add to local messages
    setMessages((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random()}`,
        senderId: myPeerId,
        senderName: userName,
        message: newMessage.trim(),
        timestamp: new Date(),
      },
    ]);

    setNewMessage('');
  }, [newMessage, peer, myPeerId, userName]);

  const endCall = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (peer) {
      peer.destroy();
    }
    router.push('/live-sessions');
  }, [localStream, peer, router]);

  const copyRoomLink = useCallback(() => {
    const link = `${window.location.origin}/live-sessions/${roomId}/join`;
    navigator.clipboard.writeText(link);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  }, [roomId]);

  if (isRoomLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2563EB]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#0F172A]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-[#1E293B] border-b border-[#334155]">
        <div className="flex items-center gap-4">
          <Link href="/live-sessions">
            <button className="p-2 hover:bg-[#334155] rounded-full transition-colors">
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white">
              {liveRoom?.attributes?.title || 'Live Session'}
            </h1>
            <div className="flex items-center gap-2 text-sm text-[#94A3B8]">
              <span
                className={`w-2 h-2 rounded-full ${connectionStatus === 'connected'
                  ? 'bg-green-500'
                  : connectionStatus === 'connecting'
                    ? 'bg-yellow-500 animate-pulse'
                    : 'bg-red-500'
                  }`}
              />
              <span>
                {connectionStatus === 'connected'
                  ? 'Connected'
                  : connectionStatus === 'connecting'
                    ? 'Connecting...'
                    : 'Connection Error'}
              </span>
              <span>•</span>
              <span>{participants.size + 1} participant(s)</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={copyRoomLink}
            className="flex items-center gap-2 px-4 py-2 bg-[#334155] hover:bg-[#475569] rounded-lg text-white text-sm font-medium transition-colors"
          >
            {isCopied ? (
              <>
                <Check className="w-4 h-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy Invite Link
              </>
            )}
          </button>
          <button
            onClick={() => setShowParticipants(!showParticipants)}
            className={`p-2 rounded-lg transition-colors ${showParticipants ? 'bg-[#2563EB] text-white' : 'bg-[#334155] text-white hover:bg-[#475569]'
              }`}
          >
            <Users className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowChat(!showChat)}
            className={`p-2 rounded-lg transition-colors ${showChat ? 'bg-[#2563EB] text-white' : 'bg-[#334155] text-white hover:bg-[#475569]'
              }`}
          >
            <MessageSquare className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Grid */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-full">
            {/* Local Video */}
            <div className="relative bg-[#1E293B] rounded-xl overflow-hidden aspect-video">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              {!isVideoEnabled && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#1E293B]">
                  <div className="w-20 h-20 bg-[#334155] rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">
                      {userName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
              )}
              <div className="absolute bottom-4 left-4 flex items-center gap-2">
                <span className="px-2 py-1 bg-black/50 rounded text-xs text-white font-medium">
                  {userName} (You)
                </span>
                {!isAudioEnabled && <MicOff className="w-4 h-4 text-red-500" />}
              </div>
              {isScreenSharing && (
                <div className="absolute top-4 left-4 px-2 py-1 bg-[#2563EB] rounded text-xs text-white font-medium flex items-center gap-1">
                  <Monitor className="w-3 h-3" />
                  Sharing Screen
                </div>
              )}
            </div>

            {/* Remote Participants */}
            {Array.from(participants.entries()).map(([peerId, participant]) => (
              <div
                key={peerId}
                className="relative bg-[#1E293B] rounded-xl overflow-hidden aspect-video"
              >
                {participant.stream ? (
                  <video
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                    ref={(el) => {
                      if (el) el.srcObject = participant.stream || null;
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#1E293B]">
                    <div className="w-20 h-20 bg-[#334155] rounded-full flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">
                        {participant.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                )}
                <div className="absolute bottom-4 left-4 flex items-center gap-2">
                  <span className="px-2 py-1 bg-black/50 rounded text-xs text-white font-medium">
                    {participant.name}
                  </span>
                  {!participant.isAudioEnabled && <MicOff className="w-4 h-4 text-red-500" />}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar - Chat or Participants */}
        {(showChat || showParticipants) && (
          <div className="w-80 bg-[#1E293B] border-l border-[#334155] flex flex-col">
            {showChat ? (
              <>
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#334155]">
                  <h3 className="font-semibold text-white">Chat</h3>
                  <button
                    onClick={() => setShowChat(false)}
                    className="p-1 hover:bg-[#334155] rounded text-[#94A3B8]"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 ? (
                    <p className="text-center text-[#94A3B8] text-sm">
                      No messages yet. Start the conversation!
                    </p>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${msg.senderId === myPeerId ? 'items-end' : 'items-start'
                          }`}
                      >
                        <div
                          className={`max-w-[80%] px-3 py-2 rounded-lg ${msg.senderId === myPeerId
                            ? 'bg-[#2563EB] text-white'
                            : 'bg-[#334155] text-white'
                            }`}
                        >
                          <p className="text-sm">{msg.message}</p>
                        </div>
                        <span className="text-xs text-[#64748B] mt-1">
                          {msg.senderName} • {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
                <div className="p-4 border-t border-[#334155]">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Type a message..."
                      className="flex-1 px-3 py-2 bg-[#0F172A] border border-[#334155] rounded-lg text-white text-sm placeholder:text-[#64748B] focus:outline-none focus:border-[#2563EB]"
                    />
                    <button
                      onClick={sendMessage}
                      className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg text-white text-sm font-medium transition-colors"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#334155]">
                  <h3 className="font-semibold text-white">
                    Participants ({participants.size + 1})
                  </h3>
                  <button
                    onClick={() => setShowParticipants(false)}
                    className="p-1 hover:bg-[#334155] rounded text-[#94A3B8]"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  {/* Local User */}
                  <div className="flex items-center gap-3 p-3 bg-[#0F172A] rounded-lg mb-2">
                    <div className="w-8 h-8 bg-[#2563EB] rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {userName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{userName} (You)</p>
                      <p className="text-xs text-[#64748B]">Host</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {!isAudioEnabled && <MicOff className="w-4 h-4 text-red-500" />}
                      {!isVideoEnabled && <VideoOff className="w-4 h-4 text-red-500" />}
                    </div>
                  </div>

                  {/* Remote Participants */}
                  {Array.from(participants.entries()).map(([peerId, participant]) => (
                    <div key={peerId} className="flex items-center gap-3 p-3 bg-[#0F172A] rounded-lg mb-2">
                      <div className="w-8 h-8 bg-[#334155] rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-white">
                          {participant.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{participant.name}</p>
                        <p className="text-xs text-[#64748B]">Participant</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {!participant.isAudioEnabled && <MicOff className="w-4 h-4 text-red-500" />}
                        {!participant.isVideoEnabled && <VideoOff className="w-4 h-4 text-red-500" />}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Control Bar */}
      <div className="flex items-center justify-center gap-4 px-6 py-4 bg-[#1E293B] border-t border-[#334155]">
        <button
          onClick={toggleAudio}
          className={`p-3 rounded-full transition-colors ${isAudioEnabled
            ? 'bg-[#334155] hover:bg-[#475569] text-white'
            : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
        >
          {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>

        <button
          onClick={toggleVideo}
          className={`p-3 rounded-full transition-colors ${isVideoEnabled
            ? 'bg-[#334155] hover:bg-[#475569] text-white'
            : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
        >
          {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </button>

        <button
          onClick={toggleScreenShare}
          className={`p-3 rounded-full transition-colors ${isScreenSharing
            ? 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white'
            : 'bg-[#334155] hover:bg-[#475569] text-white'
            }`}
        >
          {isScreenSharing ? <Monitor className="w-5 h-5" /> : <MonitorOff className="w-5 h-5" />}
        </button>

        <button className="p-3 bg-[#334155] hover:bg-[#475569] rounded-full text-white transition-colors">
          <Settings className="w-5 h-5" />
        </button>

        <button
          onClick={endCall}
          className="px-6 py-3 bg-red-500 hover:bg-red-600 rounded-full text-white font-medium transition-colors flex items-center gap-2"
        >
          <PhoneOff className="w-5 h-5" />
          End Call
        </button>
      </div>
    </div>
  );
}
