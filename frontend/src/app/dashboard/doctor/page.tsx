'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from "@/components/layout/DashboardLayout";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Users, Clock, CheckCircle, ChevronRight, Play } from "lucide-react";
import api from "@/lib/api";

export default function DoctorDashboard() {
    const [queue, setQueue] = useState<any>(null);
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            const u = JSON.parse(userData);
            setUser(u);
            fetchQueue(u._id);
        }
    }, []);

    const fetchQueue = async (id: string) => {
        try {
            const res = await api.get(`/queue/live/${id}`);
            setQueue(res.data);
        } catch (e) { }
    };

    const nextPatient = async () => {
        setLoading(true);
        try {
            const res = await api.post('/queue/next', { doctorId: user._id });
            setQueue(res.data);
        } catch (e) { alert('Error updating queue'); }
        finally { setLoading(false); }
    };

    return (
        <DashboardLayout role="doctor">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                    OPD Control Station 🩺
                </h1>
                <p className="text-slate-500 dark:text-slate-400">Manage your daily patient queue efficiently.</p>
            </div>

            {/* Call to Action - Main Queue Control */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                <GlassCard className="lg:col-span-2 bg-gradient-to-br from-blue-600 to-indigo-700 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 p-4">
                        <div className="text-center md:text-left">
                            <p className="text-blue-100 font-medium mb-1">Current Token</p>
                            <h2 className="text-6xl md:text-8xl font-bold tracking-tighter">{queue?.current_token || '00'}</h2>
                            <p className="text-sm text-blue-100 mt-2 flex items-center gap-2">
                                <Users className="w-4 h-4" /> Mrs. Sunita Devi (65F) - General Checkup
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 w-full md:w-auto">
                            <Button
                                size="lg"
                                onClick={nextPatient}
                                disabled={loading}
                                className="h-14 px-8 text-lg bg-white text-blue-600 hover:bg-blue-50 shadow-xl border-none"
                            >
                                {loading ? "Calling..." : <><Play className="w-5 h-5 mr-2 fill-current" /> Call Next Patient</>}
                            </Button>
                            <Button variant="outline" className="text-white border-white/30 hover:bg-white/10">
                                Skip Patient
                            </Button>
                        </div>
                    </div>
                </GlassCard>

                <div className="space-y-4">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500">Waiting</p>
                            <p className="text-2xl font-bold text-slate-800 dark:text-white">{queue?.total_waiting || 0}</p>
                        </div>
                        <div className="p-3 bg-orange-100 text-orange-600 rounded-xl dark:bg-orange-900/30">
                            <Users className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500">Completed</p>
                            <p className="text-2xl font-bold text-slate-800 dark:text-white">{queue?.current_token || 0}</p>
                        </div>
                        <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl dark:bg-emerald-900/30">
                            <CheckCircle className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500">Avg Time</p>
                            <p className="text-2xl font-bold text-slate-800 dark:text-white">8m 30s</p>
                        </div>
                        <div className="p-3 bg-purple-100 text-purple-600 rounded-xl dark:bg-purple-900/30">
                            <Clock className="w-6 h-6" />
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
