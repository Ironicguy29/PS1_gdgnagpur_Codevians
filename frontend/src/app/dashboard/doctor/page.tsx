'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from "@/components/layout/DashboardLayout";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Users, Clock, CheckCircle, ChevronRight, Play } from "lucide-react";
import api from "@/lib/api";
import { QueueTimeline } from "@/components/dashboard/hospital/QueueTimeline";
import { AIWaitTimePredictor } from "@/components/dashboard/hospital/AIWaitTimePredictor";

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

            {/* Main Control Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Left: Active Patient Control */}
                <GlassCard className="lg:col-span-2 bg-gradient-to-br from-blue-600 to-indigo-700 text-white relative overflow-hidden shadow-xl shadow-blue-200 dark:shadow-none min-h-[300px] flex flex-col justify-between">
                    <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 p-6">
                        <div className="text-center md:text-left">
                            <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                                <span className="px-3 py-1 rounded-full bg-white/10 text-xs font-medium border border-white/20">Token In-Progress</span>
                                <span className="px-3 py-1 rounded-full bg-green-400/20 text-green-300 text-xs font-medium border border-green-400/20 animate-pulse">● Live</span>
                            </div>
                            <h2 className="text-7xl md:text-9xl font-bold tracking-tighter drop-shadow-lg">{queue?.current_token || '00'}</h2>
                            <div className="space-y-1 mt-4">
                                <p className="text-xl font-medium">Mrs. Sunita Devi <span className="opacity-70 text-sm">(65F)</span></p>
                                <p className="text-blue-100/80 text-sm flex items-center justify-center md:justify-start gap-2">
                                    <Users className="w-4 h-4" /> General Checkup • Visit #3
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4 w-full md:w-64">
                            <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
                                <div className="flex justify-between text-sm mb-1 text-blue-100">
                                    <span>Consultation Time</span>
                                    <span>08:45</span>
                                </div>
                                <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-green-400 h-full w-[60%]" />
                                </div>
                            </div>
                            <Button
                                size="lg"
                                onClick={nextPatient}
                                disabled={loading}
                                className="h-14 w-full text-lg bg-white text-blue-600 hover:bg-blue-50 shadow-xl border-none font-bold"
                            >
                                {loading ? "Processing..." : <><Play className="w-5 h-5 mr-2 fill-current" /> Call Next</>}
                            </Button>
                            <div className="grid grid-cols-2 gap-3">
                                <Button variant="outline" className="text-white border-white/30 hover:bg-white/10 hover:text-white">
                                    Skip
                                </Button>
                                <Button variant="outline" className="text-red-200 border-red-200/30 hover:bg-red-500/20 hover:text-red-100 hover:border-red-200/50">
                                    Mark Emergency
                                </Button>
                            </div>
                        </div>
                    </div>
                </GlassCard>

                {/* Right: AI Insights */}
                <div className="h-full">
                    <AIWaitTimePredictor />
                </div>
            </div>

            {/* Bottom: Queue Timeline */}
            <div className="h-64 mb-8">
                <QueueTimeline />
            </div>
        </DashboardLayout>
    );
}
