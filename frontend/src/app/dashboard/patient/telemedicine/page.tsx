'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/providers/ToastProvider';
import api from '@/lib/api';
import {
    Video, VideoOff, Calendar, Clock, User, ChevronRight,
    Download, Eye, RefreshCw, PhoneCall, Wifi, MessageSquare,
    FileText, CheckCircle2, AlertCircle, Loader2
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TelemedicineSession {
    _id: string;
    appointment_id: string;
    status: 'waiting' | 'active' | 'completed' | 'cancelled' | 'missed';
    consultationType: string;
    startedAt?: string;
    endedAt?: string;
    durationSeconds?: number;
    summary?: {
        diagnosis?: string;
        notes?: string;
        follow_up_date?: string;
    };
    chatMessages?: any[];
}

interface Appointment {
    _id: string;
    date: string;
    slot_time: string;
    status: string;
    doctor_name?: string;
    specialization?: string;
    consultation_type?: string;
    session?: TelemedicineSession;
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function SessionStatusBadge({ status }: { status: string }) {
    const config: Record<string, { label: string; cls: string }> = {
        waiting:   { label: 'Waiting Room', cls: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300' },
        active:    { label: 'Live Now',     cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' },
        completed: { label: 'Completed',    cls: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' },
        cancelled: { label: 'Cancelled',    cls: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
        missed:    { label: 'Missed',       cls: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' },
    };
    const c = config[status] ?? config.cancelled;
    return <Badge className={`${c.cls} border-0 font-medium text-xs`}>{c.label}</Badge>;
}

// ─── Format duration ──────────────────────────────────────────────────────────

function formatDuration(seconds: number) {
    if (!seconds) return 'N/A';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PatientTelemedicinePage() {
    const router = useRouter();
    const { toast } = useToast();

    const [user, setUser] = useState<any>(null);
    const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
    const [pastSessions, setPastSessions] = useState<TelemedicineSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [joiningId, setJoiningId] = useState<string | null>(null);
    const [selectedSession, setSelectedSession] = useState<TelemedicineSession | null>(null);

    useEffect(() => {
        const u = localStorage.getItem('user');
        const t = localStorage.getItem('token');
        if (!u) { router.push('/'); return; }
        const parsed = JSON.parse(u);
        setUser(parsed);
        if (t) api.defaults.headers.common['Authorization'] = `Bearer ${t}`;
        loadData(parsed._id);
    }, []);

    const loadData = async (userId: string) => {
        setLoading(true);
        try {
            // Fetch upcoming appointments
            const apptRes = await api.get(`/appointments/patient/${userId}`);
            const appointments: Appointment[] = (apptRes.data || [])
                .filter((a: any) => a.status === 'booked')
                .filter((a: any) => {
                    const d = new Date(a.date);
                    return d >= new Date(Date.now() - 86400000); // today onwards
                })
                .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

            // For each appointment, check if there's a telemedicine session
            const enriched = await Promise.all(
                appointments.map(async (appt) => {
                    try {
                        const sRes = await api.get(`/telemedicine/${appt._id}`);
                        return { ...appt, session: sRes.data.status !== 'not_started' ? sRes.data : undefined };
                    } catch { return appt; }
                })
            );
            setUpcomingAppointments(enriched);

            // Past telemedicine sessions
            const sessRes = await api.get(`/telemedicine/patient/${userId}`);
            setPastSessions((sessRes.data || []).filter((s: any) => s.status === 'completed'));
        } catch (err) {
            console.error('Failed to load telemedicine data', err);
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = async (appointment: Appointment) => {
        setJoiningId(appointment._id);
        try {
            const res = await api.post('/telemedicine/token', {
                appointmentId: appointment._id,
                role: 'patient',
            });
            if (res.data.token) {
                router.push(`/consultation/${appointment._id}?role=patient`);
            }
        } catch (err: any) {
            toast(err.response?.data?.message ?? 'Failed to join consultation', 'error');
        } finally {
            setJoiningId(null);
        }
    };

    const isJoinable = (appt: Appointment) => {
        const apptDate = new Date(appt.date);
        const now = new Date();
        const diff = apptDate.getTime() - now.getTime();
        // Joinable 10 min before and up to 60 min after scheduled time
        return diff <= 10 * 60 * 1000 && diff >= -60 * 60 * 1000;
    };

    const getTypeIcon = (type: string) => {
        if (type === 'audio') return <PhoneCall className="w-4 h-4 text-blue-500" />;
        return <Video className="w-4 h-4 text-blue-500" />;
    };

    return (
        <DashboardLayout role="patient">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <Video className="w-8 h-8 text-blue-600" />
                        Telemedicine
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Secure video & audio consultations from the comfort of your home.
                    </p>
                </div>
                <Button
                    onClick={() => user && loadData(user._id)}
                    variant="outline"
                    className="flex items-center gap-2"
                >
                    <RefreshCw className="w-4 h-4" /> Refresh
                </Button>
            </div>

            {/* How It Works Banner */}
            <GlassCard className="bg-gradient-to-r from-blue-600/10 to-indigo-600/10 border-blue-200 dark:border-blue-900/30 mb-8">
                <div className="flex flex-wrap gap-6 items-center">
                    {[
                        { icon: Calendar, label: 'Book Appointment', desc: 'Choose Video or Audio type' },
                        { icon: Wifi, label: 'Join Waiting Room', desc: 'Device & connection check' },
                        { icon: Video, label: 'Consult Doctor',   desc: 'HD secure video call' },
                        { icon: FileText, label: 'Receive Records',  desc: 'Prescription & summary' },
                    ].map((step, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-blue-600/20 flex items-center justify-center flex-shrink-0">
                                <step.icon className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-800 dark:text-white">{step.label}</p>
                                <p className="text-xs text-slate-500">{step.desc}</p>
                            </div>
                            {i < 3 && <ChevronRight className="w-4 h-4 text-slate-400 hidden sm:block" />}
                        </div>
                    ))}
                </div>
            </GlassCard>

            {/* Upcoming Consultations */}
            <section className="mb-10">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    Upcoming Consultations
                </h2>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-7 h-7 text-blue-500 animate-spin" />
                    </div>
                ) : upcomingAppointments.length === 0 ? (
                    <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center text-slate-500">
                        <VideoOff className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                        <p className="font-semibold">No upcoming online consultations</p>
                        <p className="text-sm mt-1">Book an appointment and select "Video" or "Audio" as the type.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {upcomingAppointments.map((appt) => {
                            const joinable = isJoinable(appt);
                            const hasSession = !!appt.session;
                            const sessionStatus = appt.session?.status;

                            return (
                                <GlassCard key={appt._id} className="hover:shadow-lg transition-all duration-200">
                                    <div className="flex items-center gap-4 flex-wrap">
                                        {/* Type icon */}
                                        <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center flex-shrink-0">
                                            {getTypeIcon(appt.consultation_type ?? 'video')}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                                <p className="font-bold text-slate-800 dark:text-white">
                                                    {appt.doctor_name ?? 'Assigned Doctor'}
                                                </p>
                                                {appt.specialization && (
                                                    <span className="text-xs text-slate-500">• {appt.specialization}</span>
                                                )}
                                                {hasSession && sessionStatus && (
                                                    <SessionStatusBadge status={sessionStatus} />
                                                )}
                                            </div>
                                            <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    {new Date(appt.date).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {appt.slot_time}
                                                </span>
                                                <span className="capitalize text-blue-600 dark:text-blue-400 font-medium">
                                                    {appt.consultation_type ?? 'Video'} Consultation
                                                </span>
                                            </div>
                                        </div>

                                        {/* CTA */}
                                        <div className="flex items-center gap-3">
                                            {sessionStatus === 'active' && (
                                                <Button
                                                    onClick={() => handleJoin(appt)}
                                                    disabled={joiningId === appt._id}
                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 flex items-center gap-2"
                                                >
                                                    {joiningId === appt._id
                                                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Joining…</>
                                                        : <><Video className="w-4 h-4" /> Join Now</>
                                                    }
                                                </Button>
                                            )}
                                            {joinable && sessionStatus !== 'active' && (
                                                <Button
                                                    onClick={() => handleJoin(appt)}
                                                    disabled={joiningId === appt._id}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                                                >
                                                    {joiningId === appt._id
                                                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Preparing…</>
                                                        : <><Video className="w-4 h-4" /> Enter Waiting Room</>
                                                    }
                                                </Button>
                                            )}
                                            {!joinable && sessionStatus !== 'active' && (
                                                <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg">
                                                    Joins opens 10 min before
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </GlassCard>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* Past Consultations */}
            <section>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-slate-500" />
                    Consultation History
                </h2>

                {loading ? null : pastSessions.length === 0 ? (
                    <div className="border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-8 text-center text-slate-500">
                        <p className="text-sm">No past telemedicine consultations found.</p>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                                    {['Date', 'Duration', 'Diagnosis', 'Follow-up', 'Actions'].map(h => (
                                        <th key={h} className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {pastSessions.map(session => (
                                    <tr key={session._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                                        <td className="px-6 py-4">
                                            <p className="font-medium text-slate-800 dark:text-white text-sm">
                                                {session.startedAt
                                                    ? new Date(session.startedAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })
                                                    : '—'}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {formatDuration(session.durationSeconds ?? 0)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300 max-w-xs truncate">
                                            {session.summary?.diagnosis ?? '—'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {session.summary?.follow_up_date
                                                ? new Date(session.summary.follow_up_date).toLocaleDateString('en-IN')
                                                : '—'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Button
                                                onClick={() => setSelectedSession(session)}
                                                variant="ghost"
                                                size="sm"
                                                className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                                            >
                                                <Eye className="w-3.5 h-3.5" /> View Summary
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* Session Summary Modal */}
            {selectedSession && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl">
                        <div className="bg-slate-50 dark:bg-slate-900/80 px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <h3 className="font-bold text-slate-900 dark:text-white">Consultation Summary</h3>
                            <Button onClick={() => setSelectedSession(null)} variant="ghost" className="h-8 w-8 p-0 rounded-full">✕</Button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl text-sm">
                                <div>
                                    <p className="text-slate-400 text-xs">Date</p>
                                    <p className="font-medium text-slate-800 dark:text-white">
                                        {selectedSession.startedAt
                                            ? new Date(selectedSession.startedAt).toLocaleString('en-IN')
                                            : '—'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-slate-400 text-xs">Duration</p>
                                    <p className="font-medium text-slate-800 dark:text-white">
                                        {formatDuration(selectedSession.durationSeconds ?? 0)}
                                    </p>
                                </div>
                            </div>
                            {selectedSession.summary?.diagnosis && (
                                <div>
                                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Diagnosis</p>
                                    <p className="text-slate-700 dark:text-slate-300">{selectedSession.summary.diagnosis}</p>
                                </div>
                            )}
                            {selectedSession.summary?.notes && (
                                <div>
                                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Doctor's Notes</p>
                                    <p className="text-slate-700 dark:text-slate-300">{selectedSession.summary.notes}</p>
                                </div>
                            )}
                            {selectedSession.summary?.follow_up_date && (
                                <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 rounded-xl px-4 py-2">
                                    <Calendar className="w-4 h-4" />
                                    Follow-up: {new Date(selectedSession.summary.follow_up_date).toLocaleDateString('en-IN')}
                                </div>
                            )}
                            <div>
                                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">
                                    Chat ({selectedSession.chatMessages?.length ?? 0} messages)
                                </p>
                                <div className="max-h-40 overflow-y-auto space-y-2">
                                    {(selectedSession.chatMessages ?? []).slice(0, 10).map((msg: any, i) => (
                                        <div key={i} className="text-xs text-slate-600 dark:text-slate-400">
                                            <span className="font-semibold">{msg.sender_name}</span>: {msg.message}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
