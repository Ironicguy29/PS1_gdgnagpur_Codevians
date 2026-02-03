'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from "@/components/layout/DashboardLayout";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Building2, Activity, Users, AlertCircle, TrendingUp } from "lucide-react";
import api from "@/lib/api";
import { DoctorStatusBoard } from "@/components/dashboard/hospital/DoctorStatusBoard";
import { QueueTimeline } from "@/components/dashboard/hospital/QueueTimeline";
import { CrowdHeatmap } from "@/components/dashboard/hospital/CrowdHeatmap";

export default function AdminDashboard() {
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/admin/stats');
                setStats(res.data);
            } catch (e) { }
        };
        fetchStats();
    }, []);

    const statCards = [
        {
            title: "Total Appointments",
            val: stats?.totalAppointments || 0,
            icon: CalendarIcon,
            bg: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
        },
        {
            title: "Active Queues",
            val: stats?.activeQueues || 0,
            icon: Activity,
            bg: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
        },
        {
            title: "Pending Cases",
            val: stats?.pendingAppointments || 0,
            icon: AlertCircle,
            bg: "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400"
        },
        {
            title: "Occupancy Rate",
            val: stats?.occupancyRate || '0%',
            icon: Building2,
            bg: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400"
        },
    ];

    function CalendarIcon(props: any) {
        return (
            <svg
                {...props}
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M8 2v4" />
                <path d="M16 2v4" />
                <rect width="18" height="18" x="3" y="4" rx="2" />
                <path d="M3 10h18" />
            </svg>
        )
    }

    return (
        <DashboardLayout role="admin">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                        Hospital Command Center 🏛️
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">Live monitoring of hospital operations.</p>
                </div>
                <Button variant="outline">
                    <TrendingUp className="w-4 h-4 mr-2" /> Download Report
                </Button>
            </div>

            {/* Dashboard Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {statCards.map((stat, i) => (
                    <GlassCard key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.title}</p>
                                <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{stat.val}</h3>
                            </div>
                            <div className={`p-3 rounded-xl ${stat.bg}`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                        </div>
                    </GlassCard>
                ))}
            </div>

            {/* Main Operations Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 h-[500px]">
                {/* Left Col: Queue Timeline (Span 2) */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <div className="flex-1">
                        <QueueTimeline />
                    </div>
                    {/* Bottom Split: Heatmap & Quick Actions */}
                    <div className="h-64 grid grid-cols-2 gap-6">
                        <CrowdHeatmap />
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 text-white flex flex-col justify-between shadow-lg shadow-blue-200 dark:shadow-none">
                            <div>
                                <h3 className="font-bold text-lg mb-1">One-Click Actions</h3>
                                <p className="text-white/70 text-sm">Instant hospital controls</p>
                            </div>
                            <div className="space-y-3">
                                <Button className="w-full bg-white/20 hover:bg-white/30 text-white justify-start border border-white/10">
                                    <AlertCircle className="w-4 h-4 mr-2" /> Declare Emergency
                                </Button>
                                <Button className="w-full bg-white/20 hover:bg-white/30 text-white justify-start border border-white/10">
                                    <Users className="w-4 h-4 mr-2" /> Call Additional Staff
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Col: Doctor Status */}
                <div className="h-full">
                    <DoctorStatusBoard />
                </div>
            </div>
        </DashboardLayout>
    );
}
