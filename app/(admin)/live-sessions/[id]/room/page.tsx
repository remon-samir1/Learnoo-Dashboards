'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Peer, DataConnection } from 'peerjs';
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, Users, ChevronLeft, Phone, X, MessageCircle, Send,
} from 'lucide-react';
import Link from 'next/link';
import { useLiveRoom } from '@/src/hooks/useLiveRooms';
import { getUserData } from '@/lib/auth';

const PEER_HOST = 'peer.learnoo.app';
const PEER_PORT = 443;
const PEER_PATH = '/server';

interface JoinRequest {
  peerId: string;
  name: string;
  conn: DataConnection;
}

interface ChatMessage {
  id: string;
  peerId: string;
  name: string;
  content: string;
  timestamp: number;
  isHost: boolean;
}

export default function LiveRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;
  const { data: liveRoom, isLoading } = useLiveRoom(parseInt(roomId));

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [connectedClients, setConnectedClients] = useState<Map<string, string>>(new Map());
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [showRequests, setShowRequests] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    // Dummy messages for preview
    // { id: '1', peerId: 'student1', name: 'Ahmed', content: 'Hello professor!', timestamp: Date.now() - 300000, isHost: false },
    // { id: '2', peerId: 'host', name: 'You', content: 'Welcome everyone! Ready to start?', timestamp: Date.now() - 240000, isHost: true },
    // { id: '3', peerId: 'student2', name: 'Sara', content: 'Yes, ready!', timestamp: Date.now() - 180000, isHost: false },
    // { id: '4', peerId: 'student3', name: 'Omar', content: 'Can you hear me?', timestamp: Date.now() - 60000, isHost: false },
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [dataConnections, setDataConnections] = useState<Map<string, DataConnection>>(new Map());
  const [showChat, setShowChat] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<Peer | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const userData = getUserData();
  const userName = userData?.attributes?.first_name
    ? `${userData.attributes.first_name} ${userData.attributes.last_name || ''}`
    : 'Instructor';

  // Initialize camera and PeerJS
  useEffect(() => {
    if (!roomId) return;

    let mounted = true;
    let peer: Peer | null = null;
    let stream: MediaStream | null = null;

    const init = async () => {
      try {
        // Get camera + mic
        if (!roomId) { return; }
        stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        if (!mounted) { stream.getTracks().forEach(t => t.stop()); return; }
        setLocalStream(stream);
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;

        peer = new Peer(roomId, {
          host: PEER_HOST, port: PEER_PORT, path: PEER_PATH, secure: true,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'turn:global.relay.metered.ca:80', username: 'f29e7283f4043b41d539ce22', credential: '+61zZCdLwcLhN0KX' },
              { urls: 'turn:global.relay.metered.ca:80?transport=tcp', username: 'f29e7283f4043b41d539ce22', credential: '+61zZCdLwcLhN0KX' },
              { urls: 'turn:global.relay.metered.ca:443', username: 'f29e7283f4043b41d539ce22', credential: '+61zZCdLwcLhN0KX' },
              { urls: 'turns:global.relay.metered.ca:443?transport=tcp', username: 'f29e7283f4043b41d539ce22', credential: '+61zZCdLwcLhN0KX' },
            ],
          }
        });
        peerRef.current = peer;


        // When connected to PeerJS server
        peer.on('open', (id) => {
          setStatus('connected');
        });

        peer.on('connection', (conn) => {
          console.log(conn)
          conn.on('data', (data: any) => {
            console.log(data)

            if (data && data.action == "join") {
              if (peer && data.id && streamRef.current) {
                peer.call(data.id, streamRef.current);
                setDataConnections(prev => new Map(prev).set(data.id, conn));

                setConnectedClients(prev => new Map(prev).set(data.id, data.name));
              }
            }

            if (data && data.action == "message") {
              setChatMessages(prev => [...prev, {
                id: data.id,
                peerId: data.id,
                name: data.name,
                content: data.content,
                timestamp: Date.now(),
                isHost: false,
              }]);
            }
          })
        });

      } catch (err) {
        console.error('Init error:', err);
        setStatus('error');
      }
    };

    init();

    return () => {
      mounted = false;
      stream?.getTracks().forEach(t => t.stop());
      peer?.destroy();
    };
  }, [roomId]);

  // Toggle audio/video
  const toggleAudio = () => {
    if (localStream) {
      const track = localStream.getAudioTracks()[0];
      if (track) { track.enabled = !track.enabled; setIsAudioEnabled(track.enabled); }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const track = localStream.getVideoTracks()[0];
      if (track) { track.enabled = !track.enabled; setIsVideoEnabled(track.enabled); }
    }
  };

  // Host calls a client (initiated by host)
  const callClient = (request: JoinRequest) => {
    const peer = peerRef.current;
    const stream = streamRef.current;
    if (!peer || !stream) return;

    // Remove from requests
    setJoinRequests(prev => prev.filter(r => r.peerId !== request.peerId));

    // Call the client
    const call = peer.call(request.peerId, stream);

    call.on('stream', (remoteStream) => {
      setRemoteStreams(prev => new Map(prev).set(request.peerId, remoteStream));
      setConnectedClients(prev => new Map(prev).set(request.peerId, request.name));
    });

    call.on('close', () => {
      setRemoteStreams(prev => {
        const next = new Map(prev);
        next.delete(request.peerId);
        return next;
      });
      setConnectedClients(prev => {
        const next = new Map(prev);
        next.delete(request.peerId);
        return next;
      });
    });

    // Notify client they're accepted
    request.conn.send({ type: 'accepted' });
  };

  // Reject join request
  const rejectClient = (request: JoinRequest) => {
    request.conn.send({ type: 'rejected' });
    request.conn.close();
    setJoinRequests(prev => prev.filter(r => r.peerId !== request.peerId));
  };

  const endSession = () => {
    localStream?.getTracks().forEach(t => t.stop());
    peerRef.current?.destroy();
    router.push('/live-sessions');
  };

  // Send chat message to all connected clients
  const sendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const content = newMessage.trim();
    const timestamp = Date.now();

    // Add to local chat
    const localMsg: ChatMessage = {
      id: `${timestamp}-host`,
      peerId: 'host',
      name: userName,
      content,
      timestamp,
      isHost: true,
    };
    setChatMessages(prev => [...prev, localMsg]);

    // Broadcast to all connected clients via data connections
    dataConnections.forEach((conn) => {
      if (conn.open) {
        conn.send({
          type: 'chat-message',
          name: userName,
          content,
          timestamp,
          isHost: true,
        });
      }
    });

    setNewMessage('');
  };

  const formatChatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0F172A]">
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
            <h1 className="text-lg font-bold text-white">{liveRoom?.attributes?.title || 'Live Session'}</h1>
            <div className="flex items-center gap-2 text-sm text-[#94A3B8]">
              <span className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-green-500' : status === 'connecting' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'}`} />
              <span>{status === 'connected' ? 'Live' : status === 'connecting' ? 'Connecting...' : 'Error'}</span>
              <span>•</span>
              <span>{remoteStreams.size + 1} participant(s)</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Join Requests Badge */}
          {joinRequests.length > 0 && (
            <button
              onClick={() => setShowRequests(!showRequests)}
              className="flex items-center gap-2 px-3 py-2 bg-amber-500 hover:bg-amber-600 rounded-lg text-white text-sm font-medium transition-colors animate-pulse"
            >
              <Phone className="w-4 h-4" />
              {joinRequests.length} Request{joinRequests.length > 1 ? 's' : ''}
            </button>
          )}
          <div className="flex items-center gap-2 px-3 py-2 bg-[#0F172A] rounded-lg">
            <Users className="w-4 h-4 text-[#94A3B8]" />
            <span className="text-sm text-white">{remoteStreams.size + 1}</span>
          </div>
          <button
            onClick={() => setShowChat(!showChat)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${showChat ? 'bg-[#2563EB] text-white' : 'bg-[#0F172A] text-[#94A3B8] hover:text-white'
              }`}
          >
            <MessageCircle className="w-4 h-4" />
            Chat
          </button>
        </div>
      </div>

      {/* Main Content - Full Width/Height */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Chat Panel - Left Side */}
        <div className={`w-80 bg-[#1E293B] border-r border-[#334155] flex flex-col transition-all duration-300 m-3 rounded-2xl border-2 overflow-hidden ${showChat ? 'opacity-100 visible' : 'opacity-0 invisible w-0 overflow-hidden border-0 m-0'}`}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#334155] bg-[#0F172A]">
            <h3 className="font-semibold text-white text-sm flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-[#2563EB]" />
              Live Chat
            </h3>
            <button
              onClick={() => setShowChat(false)}
              className="p-1 hover:bg-[#334155] rounded text-[#94A3B8]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {chatMessages.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.isHost ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-[#94A3B8]">
                    {msg.isHost ? 'You' : msg.name}
                  </span>
                  <span className="text-[10px] text-[#64748B]">{formatChatTime(msg.timestamp)}</span>
                </div>
                <div className={`max-w-[90%] px-3 py-2 rounded-lg text-sm ${msg.isHost
                  ? 'bg-[#2563EB] text-white rounded-br-none'
                  : 'bg-[#334155] text-white rounded-bl-none'
                  }`}>
                  {msg.content}
                </div>
              </div>
            ))}
          </div>

          {/* Chat Input */}
          <form onSubmit={sendChatMessage} className="p-3 border-t border-[#334155] bg-[#0F172A]">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 bg-[#1E293B] border border-[#334155] rounded-lg text-sm text-white placeholder:text-[#64748B] focus:outline-none focus:border-[#2563EB]"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="p-2 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>

        {/* Center - Host Video (Full Width/Height) */}
        <div className="flex-1 relative bg-[#0F172A] p-3">
          <div className="w-full h-full bg-[#1E293B] rounded-2xl overflow-hidden shadow-2xl border-2 border-[#334155]">
            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
            {!isVideoEnabled && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#1E293B]">
                <div className="w-32 h-32 rounded-full bg-[#334155] flex items-center justify-center">
                  <span className="text-5xl font-bold text-white">{userName.charAt(0).toUpperCase()}</span>
                </div>
              </div>
            )}
            <div className="absolute bottom-6 left-6 px-4 py-2 bg-black/60 rounded-lg text-base text-white font-medium flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
              {userName} (Host)
            </div>
            {!isAudioEnabled && (
              <div className="absolute bottom-6 right-6 p-3 bg-red-500/80 rounded-lg">
                <MicOff className="w-5 h-5 text-white" />
              </div>
            )}
          </div>
        </div>

        {/* Chat Panel - Right Side (Students) */}
        <div className={`w-80 bg-[#1E293B] border-l border-[#334155] flex flex-col transition-all duration-300 m-3 rounded-2xl border-2 overflow-hidden ${showChat ? 'opacity-100 visible' : 'opacity-0 invisible w-0 overflow-hidden border-0 m-0'}`}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#334155] bg-[#0F172A]">
            <h3 className="font-semibold text-white text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-[#2563EB]" />
              Students
            </h3>
            <span className="text-xs text-[#64748B]">{dataConnections.size} online</span>
          </div>

          {/* Students List */}
          <div className="flex-1 overflow-y-auto px-3 py-3">
            {dataConnections.size === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-[#64748B]">
                <Users className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-xs text-center">No students yet</p>
              </div>
            ) : (
              Array.from(dataConnections.entries()).map(([peerId, conn]) => (
                <div key={peerId} className="flex items-center gap-2 p-2 bg-[#0F172A] rounded-lg mb-2">
                  <div className="w-8 h-8 rounded-full bg-[#334155] flex items-center justify-center text-xs text-white font-medium">
                    {(connectedClients.get(peerId) || 'S').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{connectedClients.get(peerId) || 'Student'}</p>
                    <p className="text-[10px] text-green-500">Online</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Join Requests Sidebar */}
        {showRequests && (
          <div className="w-80 bg-[#1E293B] border-l border-[#334155] flex flex-col absolute right-0 top-0 bottom-0 z-10">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#334155]">
              <h3 className="font-semibold text-white">Join Requests</h3>
              <button
                onClick={() => setShowRequests(false)}
                className="p-1 hover:bg-[#334155] rounded text-[#94A3B8]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {joinRequests.length === 0 ? (
                <p className="text-center text-[#94A3B8] text-sm">No pending requests</p>
              ) : (
                joinRequests.map((request) => (
                  <div key={request.peerId} className="flex items-center gap-3 p-3 bg-[#0F172A] rounded-lg mb-2">
                    <div className="w-10 h-10 bg-[#334155] rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {request.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{request.name}</p>
                      <p className="text-xs text-[#64748B] truncate">{request.peerId}</p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => callClient(request)}
                        className="p-2 bg-green-500 hover:bg-green-600 rounded-lg text-white transition-colors"
                        title="Accept & Call"
                      >
                        <Phone className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => rejectClient(request)}
                        className="p-2 bg-red-500 hover:bg-red-600 rounded-lg text-white transition-colors"
                        title="Reject"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 px-6 py-4 bg-[#1E293B] border-t border-[#334155]">
        <button onClick={toggleAudio} className={`p-3 rounded-full transition-colors ${isAudioEnabled ? 'bg-[#334155] hover:bg-[#475569] text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}>
          {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>
        <button onClick={toggleVideo} className={`p-3 rounded-full transition-colors ${isVideoEnabled ? 'bg-[#334155] hover:bg-[#475569] text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}>
          {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </button>
        <button onClick={endSession} className="px-6 py-3 bg-red-500 hover:bg-red-600 rounded-full text-white font-medium transition-colors flex items-center gap-2">
          <PhoneOff className="w-5 h-5" /> End Session
        </button>
      </div>
    </div>
  );
}

