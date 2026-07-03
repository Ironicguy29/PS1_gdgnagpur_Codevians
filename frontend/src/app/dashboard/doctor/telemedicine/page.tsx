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
    Video, PhoneCall, Users, Clock, Calendar, RefreshCw,
    CheckCircle2, Loader2, PlayCircle, Eye, AlertCircle,
    User
} from 'lucide-react';

interface Session {
    _id: string;
    appointment_id: string;
    patient_id: any;
    status: string;
    consultationType?: string;
    startedAt?: string;
    endedAt?: string;
    durationSeconds?: number;
    patientJoinedAt?: string;
    summary?: any;
}

const StatusBadge = ({ status }: { status: string }) => {
    const map: Record<string, string> = {
        waiting:   'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
        active:    'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
        completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
        cancelled: 'bg-slate-100 text-slate-500',
        missed:    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    };
    return <Badge className={`${map[status] ?? ''} border-0 text-xs font-medium capitalize`}>{status}</Badge>;
};

export default function DoctorTelemedicinePage() {
    const router = useRouter();
    const { toast } = useToast();

    const [user, setUser] = useState<any>(null);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [startingId, setStartingId] = useState<string | null>(null);

    useEffect(() => {
        const u = localStorage.getItem('user');
        const t = localStorage.getItem('token');
        if (!u) { router.push('/'); return; }
        const parsed = JSON.parse(u);
        setUser(parsed);
        if (t) api.defaults.headers.common['Authorization'] = `Bearer ${t}`;
        loadSessions(parsed._id);
    }, []);

    const loadSessions = async (userId: string) => {
        setLoading(true);
        try {
            const res = await api.get(`/telemedicine/doctor/${userId}`);
            setSessions(res.data ?? []);
        } catch {
            toast('Failed to load telemedicine sessions', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleStart = async (session: Session) => {
        setStartingId(session._id);
        try {
            // Get token first to ensure room is ready
            await api.post('/telemedicine/token', {
                appointmentId: session.appointment_id,
                role: 'doctor',
            });
            router.push(`/consultation/${session.appointment_id}?role=doctor`);
        } catch (err: any) {
            toast(err.response?.data?.message ?? 'Failed to start consultation', 'error');
        } finally {
            setStartingId(null);
        }
    };

    const activeSessions = sessions.filter(s => ['waiting', 'active'].includes(s.status));
    const pastSessions   = sessions.filter(s => s.status === 'completed');

    const patientName = (s: Session) =>
        s.patient_id?.user_id?.name ?? s.patient_id?.name ?? 'Patient';

    return (
        <DashboardLayout role="doctor">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <Video className="w-8 h-8 text-blue-600" />
                        Online Consultations
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Manage your telemedicine appointments and join active sessions.
                    </p>
                </div>
                <Button onClick={() => user && loadSessions(user._id)} variant="outline" className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" /> Refresh
                </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
                {[
                    { label: 'Active / Waiting', value: activeSessions.length, icon: PlayCircle, color: 'text-emerald-600' },
                    { label: 'Completed Today',  value: pastSessions.length,   icon: CheckCircle2, color: 'text-blue-600' },
                    { label: 'Total Sessions',   value: sessions.length,        icon: Video, color: 'text-indigo-600' },
                ].map(stat => (
                    <GlassCard key={stat.label} className="text-center">
                        <stat.icon className={`w-6 h-6 ${stat.color} mx-auto mb-2`} />
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                        <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
                    </GlassCard>
                ))}
            </div>

            {/* Active / Waiting Sessions */}
            <section className="mb-10">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <PlayCircle className="w-5 h-5 text-emerald-500" />
                    Waiting & Active Patients
                </h2>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-7 h-7 text-blue-500 animate-spin" />
                    </div>
                ) : activeSessions.length === 0 ? (
                    <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center text-slate-500">
                        <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                        <p className="font-semibold">No patients waiting</p>
                        <p className="text-sm mt-1">Telemedicine sessions will appear here once appointments are booked.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {activeSessions.map(session => (
                            <GlassCard key={session._id} className={`border-l-4 ${
                                session.status === 'active'
                                    ? 'border-l-emerald-500'
                                    : 'border-l-yellow-400'
                            } hover:shadow-lg transition-all`}>
                                <div className="flex items-center gap-4 flex-wrap">
                                    {/* Avatar */}
                                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 font-bold text-slate-600 dark:text-slate-300 text-lg">
                                        {patientName(session)[0]}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <p className="font-bold text-slate-800 dark:text-white">{patientName(session)}</p>
                                            <StatusBadge status={session.status} />
                                        </div>
                                        <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                                            <span className="capitalize">{session.consultationType ?? 'Video'} consultation</span>
                                            {session.patientJoinedAt && (
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    Patient in room since {new Date(session.patientJoinedAt).toLocaleTimeString('en-IN', { timeStyle: 'short' })}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* CTA */}
                                    <Button
                                        onClick={() => handleStart(session)}
                                        disabled={startingId === session._id}
                                        className={`flex items-center gap-2 ${
                                            session.status === 'active'
                                                ? 'bg-emerald-600 hover:bg-emerald-700'
                                                : 'bg-blue-600 hover:bg-blue-700'
                                        } text-white shadow-lg`}
                                    >
                                        {startingId === session._id
                                            ? <><Loader2 className="w-4 h-4 animate-spin" /> Opening…</>
                                            : session.status === 'active'
                                                ? <><Video className="w-4 h-4" /> Rejoin Call</>
                                                : <><PlayCircle className="w-4 h-4" /> Admit Patient</>
                                        }
                                    </Button>
                                </div>
                            </GlassCard>
                        ))}
                    </div>
                )}
            </section>

            {/* Completed Sessions */}
            {pastSessions.length > 0 && (
                <section>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-blue-500" />
                        Recent Completed Sessions
                    </h2>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50">
                                    {['Patient', 'Date', 'Duration', 'Diagnosis'].map(h => (
                                        <th key={h} className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {pastSessions.slice(0, 10).map(session => (
                                    <tr key={session._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                                        <td className="px-6 py-4">
                                            <p className="font-medium text-slate-800 dark:text-white text-sm">{patientName(session)}</p>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {session.startedAt
                                                ? new Date(session.startedAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })
                                                : '—'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {session.durationSeconds
                                                ? `${Math.floor(session.durationSeconds / 60)}m ${session.durationSeconds % 60}s`
                                                : '—'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300 max-w-xs truncate">
                                            {session.summary?.diagnosis ?? '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}
        </DashboardLayout>
    );
}
