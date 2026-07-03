'use client';

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Activity, TrendingUp, Users, Clock, Calendar, ShieldCheck, 
    AlertTriangle, Sparkles, RefreshCw, Eye, Search, Heart, 
    ShieldAlert, BrainCircuit, Table2, Loader2
} from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/components/providers/ToastProvider";
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
    Tooltip, Legend, PieChart, Pie, Cell
} from "recharts";
import { motion } from "framer-motion";

// Colors for triage pie chart
const TRIAGE_COLORS: Record<string, string> = {
    critical: "#ef4444", // Red
    emergency: "#ef4444", // Red
    urgent: "#f97316", // Orange
    routine: "#22c55e", // Green
    selfcare: "#3b82f6", // Blue
    care: "#3b82f6" // Blue
};

const DEFAULT_COLORS = ["#6366f1", "#a855f7", "#ec4899", "#f43f5e", "#10b981", "#3b82f6"];

export default function AdminAIAnalyticsPage() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const { toast } = useToast();

    useEffect(() => {
        fetchAdminStats();
    }, []);

    const fetchAdminStats = async () => {
        setLoading(true);
        try {
            const res = await api.get('/ai-clinical/admin-stats');
            setStats(res.data);
        } catch (err: any) {
            console.error("Failed to load admin AI statistics:", err);
            toast("Could not retrieve AI clinical telemetry data.", "error");
        } finally {
            setLoading(false);
        }
    };

    // Prepare Triage Pie Chart Data
    const getTriageData = () => {
        if (!stats?.triageStats) return [];
        return stats.triageStats.map((item: any) => ({
            name: item._id || "Routine",
            value: item.count || 0
        }));
    };

    // Prepare Department Bar Chart Data
    const getDeptData = () => {
        if (!stats?.deptStats) return [];
        return stats.deptStats.map((item: any) => ({
            department: item._id || "General Medicine",
            count: item.count || 0
        }));
    };

    // Filter audits based on search query
    const filteredAudits = stats?.recentAudits?.filter((audit: any) => {
        const patientIdMatch = audit.patient_id?.toString()?.toLowerCase().includes(searchQuery.toLowerCase());
        const detailsMatch = audit.details?.toLowerCase().includes(searchQuery.toLowerCase());
        const actionMatch = audit.action?.toLowerCase().includes(searchQuery.toLowerCase());
        return patientIdMatch || detailsMatch || actionMatch;
    }) || [];

    const totalConsultsAnalyzed = stats?.triageStats?.reduce((sum: number, item: any) => sum + (item.count || 0), 0) || 0;

    return (
        <DashboardLayout role="admin">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                        <BrainCircuit className="w-8 h-8 text-blue-600 animate-pulse" />
                        AI Clinical Analytics & Safety
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        System-wide monitoring of AI symptom checks, chronic disease risk factors, and safety compliance audits.
                    </p>
                </div>
                <Button 
                    onClick={fetchAdminStats}
                    disabled={loading}
                    variant="outline"
                    className="flex items-center gap-2 rounded-xl"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Telemetry
                </Button>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Aggregating AI clinical telemetry logs...</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* KPI Widgets */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <GlassCard className="bg-gradient-to-br from-white to-blue-50/10 dark:from-slate-900 dark:to-blue-950/5">
                            <div className="flex justify-between items-start">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Symptom Checks</p>
                                <Activity className="w-5 h-5 text-blue-500" />
                            </div>
                            <h2 className="text-3xl font-black text-slate-855 dark:text-white mt-2">
                                {totalConsultsAnalyzed}
                            </h2>
                            <p className="text-[10px] text-emerald-500 font-semibold mt-1">✓ AI Triage Engines Operational</p>
                        </GlassCard>

                        <GlassCard className="bg-gradient-to-br from-white to-rose-50/10 dark:from-slate-900 dark:to-rose-950/5">
                            <div className="flex justify-between items-start">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg Cardiovascular Risk</p>
                                <ShieldAlert className="w-5 h-5 text-rose-500" />
                            </div>
                            <h2 className="text-3xl font-black text-slate-855 dark:text-white mt-2">
                                {stats?.riskMetrics?.avgCardioRisk ? stats.riskMetrics.avgCardioRisk.toFixed(1) : "0.0"}%
                            </h2>
                            <p className="text-[10px] text-slate-400 font-semibold mt-1">Based on patient EMR vitals</p>
                        </GlassCard>

                        <GlassCard className="bg-gradient-to-br from-white to-amber-50/10 dark:from-slate-900 dark:to-amber-950/5">
                            <div className="flex justify-between items-start">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg Diabetes Risk</p>
                                <TrendingUp className="w-5 h-5 text-amber-500" />
                            </div>
                            <h2 className="text-3xl font-black text-slate-855 dark:text-white mt-2">
                                {stats?.riskMetrics?.avgDiabetesRisk ? stats.riskMetrics.avgDiabetesRisk.toFixed(1) : "0.0"}%
                            </h2>
                            <p className="text-[10px] text-slate-400 font-semibold mt-1">Type-2 chronic markers</p>
                        </GlassCard>

                        <GlassCard className="bg-gradient-to-br from-white to-emerald-50/10 dark:from-slate-900 dark:to-emerald-950/5">
                            <div className="flex justify-between items-start">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg Patient Wellness</p>
                                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                            </div>
                            <h2 className="text-3xl font-black text-slate-855 dark:text-white mt-2">
                                {stats?.riskMetrics?.avgWellness ? stats.riskMetrics.avgWellness.toFixed(1) : "0.0"}/100
                            </h2>
                            <p className="text-[10px] text-emerald-500 font-semibold mt-1">General cohort health level</p>
                        </GlassCard>
                    </div>

                    {/* Charts Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Triage Urgency Distribution */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                            <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Triage Urgency Cohorts</h3>
                            <div className="h-72 flex items-center justify-center">
                                {getTriageData().length === 0 ? (
                                    <p className="text-xs text-slate-400 italic">No triage statistics logged.</p>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={getTriageData()}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={90}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {getTriageData().map((entry: any, index: number) => {
                                                    const colorKey = entry.name.toLowerCase();
                                                    const color = TRIAGE_COLORS[colorKey] || DEFAULT_COLORS[index % DEFAULT_COLORS.length];
                                                    return <Cell key={`cell-${index}`} fill={color} />;
                                                })}
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>

                        {/* Specialist Department Referrals */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                            <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Specialist Routing Referrals</h3>
                            <div className="h-72">
                                {getDeptData().length === 0 ? (
                                    <p className="text-xs text-slate-400 italic">No referral data recorded.</p>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={getDeptData()}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                            <XAxis dataKey="department" stroke="#94a3b8" fontSize={10} />
                                            <YAxis stroke="#94a3b8" fontSize={10} />
                                            <Tooltip />
                                            <Bar dataKey="count" fill="#4f46e5" radius={[10, 10, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Audit Logs Table */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                                <Table2 className="w-5 h-5 text-indigo-600" />
                                Patient Safety & AI Clinical Audit Trail
                            </h3>
                            <div className="relative w-full md:w-72">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Filter by action or details..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Timestamp</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Action Type</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Subject Patient</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Details</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {filteredAudits.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-8 text-center text-slate-450 text-xs italic">
                                                No compliance audit logs match the filter query.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredAudits.map((audit: any) => (
                                            <tr key={audit._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                                                <td className="px-6 py-4 text-xs text-slate-400 font-semibold whitespace-nowrap">
                                                    {new Date(audit.createdAt).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30">
                                                        {audit.action}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-xs font-mono text-slate-500 dark:text-slate-400">
                                                    {audit.patient_id || "System"}
                                                </td>
                                                <td className="px-6 py-4 text-xs text-slate-700 dark:text-slate-300">
                                                    {audit.details}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
