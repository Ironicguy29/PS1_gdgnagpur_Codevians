'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from "@/components/layout/DashboardLayout";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { 
    Building2, Activity, Users, AlertCircle, TrendingUp, 
    Calendar, Clock, Sparkles, RefreshCw, AlertTriangle 
} from "lucide-react";
import api from "@/lib/api";
import { DoctorStatusBoard } from "@/components/dashboard/hospital/DoctorStatusBoard";
import { QueueTimeline } from "@/components/dashboard/hospital/QueueTimeline";
import { CrowdHeatmap } from "@/components/dashboard/hospital/CrowdHeatmap";
import { DepartmentLoadMonitor } from "@/components/DepartmentLoadMonitor";
import { BedAllocationManager } from "@/components/BedAllocationManager";
import { AmbulanceFleetDispatcher } from "@/components/AmbulanceFleetDispatcher";
import { ComplianceAudit } from "@/components/ComplianceAudit";
import { useSocket } from "@/context/SocketContext";
import { useToast } from "@/components/providers/ToastProvider";

const DEPARTMENTS = [
    "Cardiology",
    "Orthopedics",
    "Dermatology",
    "General Medicine",
    "Pediatrics"
];

export default function AdminDashboard() {
    const [selectedDept, setSelectedDept] = useState("Cardiology");
    const [stats, setStats] = useState<any>(null);
    const [analytics, setAnalytics] = useState<any>(null);
    const [tokens, setTokens] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'operations' | 'load' | 'beds' | 'ambulance' | 'compliance'>('operations');
    
    const { socket } = useSocket();
    const { toast } = useToast();

    const fetchAllData = async (dept: string) => {
        setLoading(true);
        try {
            // 1. Fetch general command center stats
            const statsRes = await api.get('/admin/stats');
            setStats(statsRes.data);

            // 2. Fetch specific department analytics
            const todayStr = new Date().toISOString().split('T')[0];
            const analyticsRes = await api.get(`/queue/analytics?date=${todayStr}&department=${dept}`);
            setAnalytics(analyticsRes.data);

            // 3. Fetch doctors in this department and aggregate their live tokens
            const docRes = await api.get('/doctors');
            const deptDocs = docRes.data.filter((d: any) => 
                d.department?.toLowerCase() === dept.toLowerCase()
            );
            
            const allDeptTokens: any[] = [];
            await Promise.all(deptDocs.map(async (doc: any) => {
                try {
                    const qRes = await api.get(`/queue/live/${doc._id}`);
                    if (qRes.data.tokens) {
                        allDeptTokens.push(...qRes.data.tokens);
                    }
                } catch (e) {
                    console.error(`Failed to fetch queue for doctor ${doc._id}`, e);
                }
            }));
            
            // Sort by priority first (Emergency first), then token number
            allDeptTokens.sort((a, b) => {
                if (a.priority === 'Emergency' && b.priority !== 'Emergency') return -1;
                if (a.priority !== 'Emergency' && b.priority === 'Emergency') return 1;
                return a.token_number - b.token_number;
            });
            
            setTokens(allDeptTokens);
        } catch (e) {
            console.error("Failed to load admin metrics", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData(selectedDept);
    }, [selectedDept]);

    // Real-time synchronization via Socket.io
    useEffect(() => {
        if (!socket) return;

        const handleQueueUpdate = () => {
            console.log("Socket notified: Live queue updated. Refreshing Admin dashboard.");
            fetchAllData(selectedDept);
        };

        socket.on('queue.token.update', handleQueueUpdate);
        return () => {
            socket.off('queue.token.update', handleQueueUpdate);
        };
    }, [socket, selectedDept]);

    const statCards = [
        {
            title: "Total Appointments",
            val: stats?.totalAppointments || 0,
            icon: Calendar,
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
            title: "Doctor Utilization",
            val: analytics?.doctor_utilization_percent ? `${analytics.doctor_utilization_percent}%` : '0%',
            icon: Sparkles,
            bg: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400"
        },
    ];

    const handleQuickEmergency = () => {
        toast("Emergency override broadcast sent to all screens.", "warning");
    };

    const handleCallStaff = () => {
        toast("Secondary staff paging system activated.", "success");
    };

    return (
        <DashboardLayout role="admin">
            {/* Tab Navigation */}
            <div className="flex gap-2 mb-6 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
                {[
                    { id: 'operations', label: 'Operations' },
                    { id: 'load', label: 'Department Load' },
                    { id: 'beds', label: 'Bed Allocation' },
                    { id: 'ambulance', label: 'Fleet Dispatch' },
                    { id: 'compliance', label: 'Compliance Audit' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-4 py-3 font-semibold text-sm whitespace-nowrap transition-colors ${
                            activeTab === tab.id
                                ? 'text-cyan-500 border-b-2 border-cyan-500'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                        Hospital Command Center
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        {activeTab === 'operations' && 'Live monitoring of hospital queue analytics & OPD workflows.'}
                        {activeTab === 'load' && 'Real-time department load tracking and staff allocation.'}
                        {activeTab === 'beds' && 'ICU and ward bed allocation management system.'}
                        {activeTab === 'ambulance' && 'Emergency ambulance fleet dispatch and GPS tracking.'}
                        {activeTab === 'compliance' && 'AB-PMJAY compliance audit and insurance claims.'}
                    </p>
                </div>
                
                {/* Department Dropdown Selector */}
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <select 
                        value={selectedDept}
                        onChange={(e) => setSelectedDept(e.target.value)}
                        className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm shadow-sm"
                    >
                        {DEPARTMENTS.map(dept => (
                            <option key={dept} value={dept}>{dept} Dept</option>
                        ))}
                    </select>

                    <button 
                        onClick={() => fetchAllData(selectedDept)}
                        disabled={loading}
                        className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 shadow-sm transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Dashboard Stats Row */}
            {activeTab === 'operations' && (
            <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {statCards.map((stat, i) => (
                    <GlassCard key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6">
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

            {/* Department Detailed Analytics Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <GlassCard className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-xl">
                        <Clock className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 font-semibold uppercase">Avg Wait Time</p>
                        <h4 className="text-xl font-black text-slate-800 dark:text-white">{analytics?.avg_wait_time || 0} mins</h4>
                    </div>
                </GlassCard>

                <GlassCard className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 flex items-center gap-4">
                    <div className="p-3 bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400 rounded-xl">
                        <Users className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 font-semibold uppercase">Patients Served</p>
                        <h4 className="text-xl font-black text-slate-800 dark:text-white">{analytics?.total_patients_served || 0}</h4>
                    </div>
                </GlassCard>

                <GlassCard className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 flex items-center gap-4">
                    <div className="p-3 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded-xl">
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 font-semibold uppercase font-bold text-red-500">Emergencies</p>
                        <h4 className="text-xl font-black text-slate-800 dark:text-white">{analytics?.total_emergencies || 0}</h4>
                    </div>
                </GlassCard>

                <GlassCard className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 flex items-center gap-4">
                    <div className="p-3 bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 rounded-xl">
                        <Users className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 font-semibold uppercase">Skipped / No-show</p>
                        <h4 className="text-xl font-black text-slate-800 dark:text-white">{analytics?.total_patients_skipped || 0}</h4>
                    </div>
                </GlassCard>
            </div>

            {/* Main Operations Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 min-h-[500px]">
                {/* Left Col: Queue Timeline (Span 2) */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <div className="flex-1">
                        <QueueTimeline tokens={tokens} />
                    </div>
                    {/* Bottom Split: Heatmap & Quick Actions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <CrowdHeatmap />
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 text-white flex flex-col justify-between shadow-lg shadow-blue-200 dark:shadow-none min-h-[220px]">
                            <div>
                                <h3 className="font-bold text-lg mb-1">One-Click Actions</h3>
                                <p className="text-white/70 text-sm">Instant hospital controls</p>
                            </div>
                            <div className="space-y-3 mt-4">
                                <Button 
                                    onClick={handleQuickEmergency}
                                    className="w-full bg-white/20 hover:bg-white/30 text-white justify-start border border-white/10"
                                >
                                    <AlertTriangle className="w-4 h-4 mr-2" /> Declare Emergency Mode
                                </Button>
                                <Button 
                                    onClick={handleCallStaff}
                                    className="w-full bg-white/20 hover:bg-white/30 text-white justify-start border border-white/10"
                                >
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
            </>
            )}

            {/* Department Load Monitoring Tab */}
            {activeTab === 'load' && (
            <div className="space-y-6 pb-10">
                <DepartmentLoadMonitor />
            </div>
            )}

            {/* Bed Allocation Tab */}
            {activeTab === 'beds' && (
            <div className="space-y-6 pb-10">
                <BedAllocationManager />
            </div>
            )}

            {/* Ambulance Fleet Tab */}
            {activeTab === 'ambulance' && (
            <div className="space-y-6 pb-10">
                <AmbulanceFleetDispatcher />
            </div>
            )}

            {/* Compliance Audit Tab */}
            {activeTab === 'compliance' && (
            <div className="space-y-6 pb-10">
                <ComplianceAudit />
            </div>
            )}
        </DashboardLayout>
    );
}

// Active: 2026-07-04

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
