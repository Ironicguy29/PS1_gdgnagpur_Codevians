'use client';

/**
 * Consultation Room — full-screen LiveKit video call
 * Route: /consultation/[appointmentId]
 * 
 * Accessed by both doctors and patients. The page:
 * 1. Reads role + appointmentId from URL / localStorage
 * 2. Calls backend to get a short-lived LiveKit token
 * 3. Connects to the LiveKit room
 * 4. Renders video tiles + chat sidebar + controls
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
    LiveKitRoom,
    VideoConference,
    RoomAudioRenderer,
    ControlBar,
    useTracks,
    useParticipants,
    useLocalParticipant,
    useConnectionState,
} from '@livekit/components-react';
import { Track, ConnectionState } from 'livekit-client';
import api from '@/lib/api';
import { useToast } from '@/components/providers/ToastProvider';
import {
    Video, VideoOff, Mic, MicOff, Monitor, Phone, Send,
    Wifi, WifiOff, Clock, Users, ChevronRight, FileText,
    MessageSquare, X, Loader2, CheckCircle2, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ChatMessage {
    sender_name: string;
    sender_role: 'doctor' | 'patient';
    message: string;
    message_type: string;
    sentAt: string;
}

interface SessionInfo {
    sessionId: string;
    status: string;
    chatMessages?: ChatMessage[];
}

// ─── Waiting Room ─────────────────────────────────────────────────────────────

function WaitingRoom({ appointmentId, role, doctorName }: {
    appointmentId: string;
    role: 'doctor' | 'patient';
    doctorName?: string;
}) {
    const [deviceOk, setDeviceOk] = useState<{ camera: boolean | null; mic: boolean | null }>({
        camera: null, mic: null
    });

    useEffect(() => {
        // Quick device check
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(() => setDeviceOk({ camera: true, mic: true }))
            .catch(() => setDeviceOk({ camera: false, mic: false }));
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 max-w-md w-full text-center space-y-6">
                {/* Animated pulse ring */}
                <div className="relative w-24 h-24 mx-auto">
                    <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping" />
                    <div className="relative w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center">
                        <Video className="w-10 h-10 text-white" />
                    </div>
                </div>

                <div>
                    <h1 className="text-2xl font-bold text-white">
                        {role === 'patient' ? 'Waiting Room' : 'Starting Consultation'}
                    </h1>
                    <p className="text-slate-400 mt-2 text-sm">
                        {role === 'patient'
                            ? `Dr. ${doctorName ?? 'your doctor'} will admit you shortly`
                            : 'Patient will be admitted once you join'}
                    </p>
                </div>

                {/* Device check */}
                <div className="space-y-2 text-left">
                    <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Connection Check</p>
                    <DeviceCheckRow label="Camera" status={deviceOk.camera} />
                    <DeviceCheckRow label="Microphone" status={deviceOk.mic} />
                    <DeviceCheckRow label="Internet" status={true} />
                </div>

                <div className="flex items-center justify-center gap-2 text-slate-400 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Connecting to secure room…
                </div>
            </div>
        </div>
    );
}

function DeviceCheckRow({ label, status }: { label: string; status: boolean | null }) {
    return (
        <div className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-2">
            <span className="text-slate-300 text-sm">{label}</span>
            {status === null ? <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                : status ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                : <AlertCircle className="w-4 h-4 text-red-400" />}
        </div>
    );
}

// ─── Chat Sidebar ─────────────────────────────────────────────────────────────

function ChatSidebar({ sessionId, userId, role, userName, onClose }: {
    sessionId: string;
    userId: string;
    role: 'doctor' | 'patient';
    userName: string;
    onClose: () => void;
}) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    // Load initial history
    useEffect(() => {
        api.get(`/telemedicine/${sessionId}`).then(r => {
            setMessages(r.data?.chatMessages ?? []);
        }).catch(() => {});
    }, [sessionId]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;
        setSending(true);
        try {
            const res = await api.post('/telemedicine/message', {
                sessionId,
                message: input.trim(),
                messageType: 'text',
                senderRole: role,
                senderName: userName,
            });
            setMessages(prev => [...prev, res.data.message]);
            setInput('');
        } catch {
            toast('Failed to send message', 'error');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-900 border-l border-white/10">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-400" />
                    <span className="text-white font-semibold text-sm">Consultation Chat</span>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                    <p className="text-slate-500 text-xs text-center mt-8">
                        Chat history will appear here. Messages are saved securely.
                    </p>
                )}
                {messages.map((msg, i) => (
                    <div key={i} className={`flex flex-col ${msg.sender_role === role ? 'items-end' : 'items-start'}`}>
                        <span className="text-[10px] text-slate-500 mb-1 px-1">{msg.sender_name}</span>
                        <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${
                            msg.sender_role === role
                                ? 'bg-blue-600 text-white rounded-br-sm'
                                : 'bg-white/10 text-slate-200 rounded-bl-sm'
                        }`}>
                            {msg.message_type === 'instruction' && (
                                <span className="block text-[10px] font-semibold text-blue-200 mb-1">📋 Medical Instruction</span>
                            )}
                            {msg.message}
                        </div>
                        <span className="text-[9px] text-slate-600 mt-1 px-1">
                            {new Date(msg.sentAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-white/10">
                <div className="flex gap-2">
                    <input
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                        placeholder="Type a message…"
                        className="flex-1 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                    <button
                        onClick={handleSend}
                        disabled={sending || !input.trim()}
                        className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center disabled:opacity-50 hover:bg-blue-700 transition-colors"
                    >
                        {sending ? <Loader2 className="w-4 h-4 text-white animate-spin" />
                               : <Send className="w-4 h-4 text-white" />}
                    </button>
                </div>
                {role === 'doctor' && (
                    <button
                        onClick={() => setInput('[Medical Instruction] ')}
                        className="mt-2 text-[10px] text-blue-400 hover:text-blue-300 transition-colors"
                    >
                        + Add Medical Instruction
                    </button>
                )}
            </div>
        </div>
    );
}

// ─── Call Timer ──────────────────────────────────────────────────────────────

function CallTimer({ startedAt }: { startedAt: Date | null }) {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        if (!startedAt) return;
        const interval = setInterval(() => {
            setElapsed(Math.round((Date.now() - startedAt.getTime()) / 1000));
        }, 1000);
        return () => clearInterval(interval);
    }, [startedAt]);

    const format = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    };

    return (
        <div className="flex items-center gap-1.5 text-slate-300 text-sm">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-mono">{format(elapsed)}</span>
        </div>
    );
}

// ─── Connection Quality Indicator ─────────────────────────────────────────────

function ConnectionQualityBadge() {
    const connectionState = useConnectionState();
    const isConnected = connectionState === ConnectionState.Connected;
    const isConnecting = connectionState === ConnectionState.Connecting || connectionState === ConnectionState.Reconnecting;

    if (isConnecting) return (
        <div className="flex items-center gap-1.5 text-yellow-400 text-xs">
            <Loader2 className="w-3 h-3 animate-spin" /> Connecting
        </div>
    );
    if (!isConnected) return (
        <div className="flex items-center gap-1.5 text-red-400 text-xs">
            <WifiOff className="w-3 h-3" /> Disconnected
        </div>
    );
    return (
        <div className="flex items-center gap-1.5 text-emerald-400 text-xs">
            <Wifi className="w-3 h-3" /> Connected
        </div>
    );
}

// ─── Inner Room (rendered inside LiveKitRoom context) ─────────────────────────

function InnerRoom({ appointmentId, sessionId, role, userName, userId, onLeave }: {
    appointmentId: string;
    sessionId: string;
    role: 'doctor' | 'patient';
    userName: string;
    userId: string;
    onLeave: () => void;
}) {
    const [chatOpen, setChatOpen] = useState(false);
    const [callStartedAt, setCallStartedAt] = useState<Date | null>(null);
    const connectionState = useConnectionState();
    const participants = useParticipants();

    useEffect(() => {
        if (connectionState === ConnectionState.Connected && !callStartedAt) {
            setCallStartedAt(new Date());
            // Notify backend of join event
            api.post('/telemedicine/start', { appointmentId, role }).catch(() => {});
        }
    }, [connectionState, callStartedAt, appointmentId, role]);

    const handleLeave = useCallback(async () => {
        try {
            if (role === 'doctor') {
                await api.post('/telemedicine/end', { appointmentId });
            }
        } catch {/* swallow */}
        onLeave();
    }, [appointmentId, role, onLeave]);

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col">
            {/* Top Bar */}
            <div className="h-14 bg-slate-900/80 backdrop-blur border-b border-white/10 flex items-center justify-between px-4 flex-shrink-0">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center text-white text-xs font-bold">✚</div>
                        <span className="text-white font-semibold text-sm">ArogyaMitra Consultation</span>
                    </div>
                    <div className="hidden md:flex items-center gap-3 text-xs text-slate-400">
                        <span>Appt: {appointmentId.slice(-8)}</span>
                        <span>•</span>
                        <Users className="w-3 h-3" />
                        <span>{participants.length} participant{participants.length !== 1 ? 's' : ''}</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <CallTimer startedAt={callStartedAt} />
                    <ConnectionQualityBadge />
                    <button
                        onClick={() => setChatOpen(o => !o)}
                        className="flex items-center gap-1.5 text-slate-300 hover:text-white text-xs bg-white/10 rounded-lg px-3 py-1.5 transition-colors"
                    >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Chat
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex flex-1 overflow-hidden">
                {/* Video Area — uses LiveKit's built-in VideoConference layout */}
                <div className="flex-1 relative">
                    <VideoConference />
                    <RoomAudioRenderer />

                    {/* Custom leave button overlay (supplements LiveKit controls) */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
                        <button
                            onClick={handleLeave}
                            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-5 py-2.5 rounded-full shadow-xl shadow-red-900/50 transition-all hover:scale-105"
                        >
                            <Phone className="w-4 h-4 rotate-[135deg]" />
                            {role === 'doctor' ? 'End Consultation' : 'Leave Call'}
                        </button>
                    </div>
                </div>

                {/* Chat Sidebar */}
                {chatOpen && (
                    <div className="w-80 flex-shrink-0">
                        <ChatSidebar
                            sessionId={sessionId}
                            userId={userId}
                            role={role}
                            userName={userName}
                            onClose={() => setChatOpen(false)}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ConsultationRoomPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const { toast } = useToast();

    const appointmentId = params?.appointmentId as string;

    const [tokenData, setTokenData] = useState<{
        token: string; roomName: string; url: string; sessionId: string
    } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<any>(null);
    const [role, setRole] = useState<'doctor' | 'patient'>('patient');

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (!userData) {
            router.push('/');
            return;
        }
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);

        // Role comes from localStorage or query param
        const queryRole = searchParams?.get('role') as 'doctor' | 'patient' | null;
        const userRole = queryRole ?? (parsedUser.role === 'doctor' ? 'doctor' : 'patient');
        setRole(userRole);

        // Set auth header from localStorage token
        const authToken = localStorage.getItem('token');
        if (authToken) {
            api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
        }

        fetchToken(appointmentId, userRole);
    }, [appointmentId]);

    const fetchToken = async (apptId: string, userRole: 'doctor' | 'patient') => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.post('/telemedicine/token', {
                appointmentId: apptId,
                role: userRole,
            });
            setTokenData(res.data);
        } catch (err: any) {
            const msg = err.response?.data?.message ?? 'Failed to join consultation';
            setError(msg);
            toast(msg, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleLeave = () => {
        toast('Consultation ended. Redirecting…', 'info');
        setTimeout(() => {
            router.push(role === 'doctor' ? '/dashboard/doctor' : '/dashboard/patient/telemedicine');
        }, 1500);
    };

    if (loading) return <WaitingRoom appointmentId={appointmentId} role={role} />;

    if (error) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                <div className="bg-white/5 backdrop-blur border border-white/10 rounded-3xl p-8 max-w-sm w-full text-center space-y-4">
                    <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
                    <h2 className="text-white font-bold text-lg">Unable to Join</h2>
                    <p className="text-slate-400 text-sm">{error}</p>
                    <button
                        onClick={() => router.back()}
                        className="bg-white/10 hover:bg-white/20 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    if (!tokenData) return null;

    return (
        <LiveKitRoom
            token={tokenData.token}
            serverUrl={tokenData.url}
            video={true}
            audio={true}
            onDisconnected={handleLeave}
            data-lk-theme="default"
            style={{ height: '100dvh' }}
            options={{
                // Adaptive quality for low-bandwidth / rural networks
                adaptiveStream: true,
                dynacast: true,
                videoCaptureDefaults: {
                    resolution: { width: 1280, height: 720, frameRate: 30 },
                },
            }}
        >
            <InnerRoom
                appointmentId={appointmentId}
                sessionId={tokenData.sessionId}
                role={role}
                userName={user?.name ?? 'User'}
                userId={user?._id ?? user?.id ?? ''}
                onLeave={handleLeave}
            />
        </LiveKitRoom>
    );
}
