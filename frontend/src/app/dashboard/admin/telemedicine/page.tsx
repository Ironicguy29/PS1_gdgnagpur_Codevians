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
    Video, Users, Clock, Calendar, RefreshCw, Wifi,
    CheckCircle2, AlertCircle, Loader2, PhoneCall, BarChart2,
    TrendingUp, Eye, XCircle
} from 'lucide-react';

interface TeleSession {
    _id: string;
    appointment_id: string;
    status: string;
    consultationType?: string;
    startedAt?: string;
    endedAt?: string;
    durationSeconds?: number;
    patient_id?: any;
}

interface Analytics {
    total_sessions: number;
    sessions_today: number;
    completed_sessions: number;
    cancelled_sessions: number;
    missed_sessions: number;
    avg_duration_mins: number;
    call_success_rate: number;
}

const StatusBadge = ({ status }: { status: string }) => {
    const map: Record<string, string> = {
        waiting:   'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
        active:    'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
        completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
        cancelled: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
        missed:    'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    };
    return <Badge className={`${map[status] ?? map.cancelled} border-0 text-xs font-medium capitalize`}>{status}</Badge>;
};

export default function AdminTelemedicinePage() {
    const router = useRouter();
    const { toast } = useToast();

    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeSessions, setActiveSessions] = useState<TeleSession[]>([]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [analyticsRes] = await Promise.all([
                api.get('/telemedicine/admin/analytics'),
            ]);
            setAnalytics(analyticsRes.data);
        } catch (err) {
            toast('Failed to load telemedicine analytics', 'error');
        } finally {
            setLoading(false);
        }
    };

    const kpiCards = analytics ? [
        {
            label:    'Total Sessions',
            value:    analytics.total_sessions,
            icon:     Video,
            color:    'from-blue-500 to-blue-600',
            iconBg:   'bg-blue-500/20',
        },
        {
            label:    'Today\'s Consultations',
            value:    analytics.sessions_today,
            icon:     Calendar,
            color:    'from-indigo-500 to-indigo-600',
            iconBg:   'bg-indigo-500/20',
        },
        {
            label:    'Avg. Duration',
            value:    `${analytics.avg_duration_mins}m`,
            icon:     Clock,
            color:    'from-emerald-500 to-emerald-600',
            iconBg:   'bg-emerald-500/20',
        },
        {
            label:    'Call Success Rate',
            value:    `${analytics.call_success_rate}%`,
            icon:     TrendingUp,
            color:    'from-teal-500 to-teal-600',
            iconBg:   'bg-teal-500/20',
        },
        {
            label:    'Completed',
            value:    analytics.completed_sessions,
            icon:     CheckCircle2,
            color:    'from-green-500 to-green-600',
            iconBg:   'bg-green-500/20',
        },
        {
            label:    'Cancelled',
            value:    analytics.cancelled_sessions,
            icon:     XCircle,
            color:    'from-rose-500 to-rose-600',
            iconBg:   'bg-rose-500/20',
        },
        {
            label:    'Missed',
            value:    analytics.missed_sessions,
            icon:     AlertCircle,
            color:    'from-amber-500 to-amber-600',
            iconBg:   'bg-amber-500/20',
        },
    ] : [];

    return (
        <DashboardLayout role="admin">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <Video className="w-8 h-8 text-blue-600" />
                        Telemedicine Analytics
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Monitor online consultations, network quality, and doctor utilisation.
                    </p>
                </div>
                <Button onClick={loadData} variant="outline" className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" /> Refresh
                </Button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                </div>
            ) : (
                <>
                    {/* KPI Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                        {kpiCards.map((card) => (
                            <GlassCard key={card.label} className="relative overflow-hidden">
                                <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${card.color} opacity-5 rounded-full -mr-6 -mt-6`} />
                                <div className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center mb-3`}>
                                    <card.icon className="w-5 h-5 text-blue-600" />
                                </div>
                                <p className="text-xs text-slate-400 mb-1">{card.label}</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">{card.value}</p>
                            </GlassCard>
                        ))}
                    </div>

                    {/* Breakdown Chart (static bars) */}
                    {analytics && (
                        <GlassCard className="mb-8">
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                                <BarChart2 className="w-5 h-5 text-blue-500" />
                                Session Outcome Distribution
                            </h2>
                            <div className="space-y-4">
                                {[
                                    { label: 'Completed', value: analytics.completed_sessions, total: analytics.total_sessions, color: 'bg-emerald-500' },
                                    { label: 'Cancelled', value: analytics.cancelled_sessions, total: analytics.total_sessions, color: 'bg-rose-400' },
                                    { label: 'Missed',    value: analytics.missed_sessions,    total: analytics.total_sessions, color: 'bg-amber-400' },
                                ].map(row => {
                                    const pct = row.total > 0 ? Math.round((row.value / row.total) * 100) : 0;
                                    return (
                                        <div key={row.label} className="space-y-1">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-600 dark:text-slate-300 font-medium">{row.label}</span>
                                                <span className="text-slate-400">{row.value} ({pct}%)</span>
                                            </div>
                                            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${row.color} rounded-full transition-all duration-700`}
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </GlassCard>
                    )}

                    {/* Quality Summary */}
                    <GlassCard>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <Wifi className="w-5 h-5 text-blue-500" />
                            Platform Summary
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="text-center p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
                                <p className="text-3xl font-bold text-blue-600">{analytics?.call_success_rate ?? 0}%</p>
                                <p className="text-sm text-slate-500 mt-1">Call Success Rate</p>
                            </div>
                            <div className="text-center p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
                                <p className="text-3xl font-bold text-emerald-600">{analytics?.avg_duration_mins ?? 0}m</p>
                                <p className="text-sm text-slate-500 mt-1">Avg. Consultation Duration</p>
                            </div>
                            <div className="text-center p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
                                <p className="text-3xl font-bold text-indigo-600">{analytics?.sessions_today ?? 0}</p>
                                <p className="text-sm text-slate-500 mt-1">Sessions Today</p>
                            </div>
                        </div>
                        <p className="text-xs text-slate-400 mt-4">
                            Powered by <span className="font-semibold text-blue-500">LiveKit Cloud</span> — end-to-end encrypted, HIPAA-ready infrastructure.
                        </p>
                    </GlassCard>
                </>
            )}
        </DashboardLayout>
    );
}

// Active: 2026-07-04

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
