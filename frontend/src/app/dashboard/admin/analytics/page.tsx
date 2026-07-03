"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import {
    Activity, TrendingUp, Users, Clock, Calendar, Beaker,
    Download, ShieldCheck, AlertTriangle, Sparkles, RefreshCw,
    Percent, DollarSign, Stethoscope, Landmark, PlaneTakeoff, HeartHandshake
} from "lucide-react";
import api from "@/lib/api";
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    LineChart,
    Line,
    BarChart,
    Bar
} from "recharts";

export default function AdminAnalyticsDashboard() {
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState<any>(null);
    const [forecastData, setForecastData] = useState<any[]>([]);
    const [showForecast, setShowForecast] = useState(false);
    const [forecastLoading, setForecastLoading] = useState(false);
    const [filterText, setFilterText] = useState("");

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const res = await api.get("/admin/analytics");
            setStats(res.data);
        } catch (e) {
            console.error("Failed to load admin analytics", e);
        } finally {
            setLoading(false);
        }
    };

    const fetchForecast = async () => {
        setForecastLoading(true);
        try {
            const res = await api.get("/admin/analytics/forecast");
            if (res.data.success) {
                setForecastData(res.data.predictions);
                setShowForecast(true);
            }
        } catch (e) {
            console.error("Failed to fetch AI trend forecast", e);
        } finally {
            setForecastLoading(false);
        }
    };

    const handleExport = () => {
        window.open(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1"}/admin/analytics/export`, "_blank");
    };

    useEffect(() => {
        fetchAnalytics();
    }, []);

    // Combine history and forecast to plot on the same chart smoothly
    const getCombinedChartData = () => {
        if (!stats?.dailyTrends) return [];
        
        const history = stats.dailyTrends.map((d: any) => ({
            date: d.date,
            actualPatients: d.patients,
            actualRevenue: d.revenue,
            type: "Historical"
        }));

        if (!showForecast || forecastData.length === 0) {
            return history;
        }

        const forecasts = forecastData.map((d: any) => ({
            date: d.date,
            forecastedPatients: d.predicted_patients,
            forecastedRevenue: d.predicted_revenue,
            type: "AI Projected"
        }));

        return [...history, ...forecasts];
    };

    const combinedData = getCombinedChartData();

    // Format currency to readable INR
    const formatINR = (val: number) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0
        }).format(val);
    };

    // Filter audit logs
    const filteredLogs = stats?.safetyLogs?.filter((log: any) => {
        const detailMatch = log.details?.toLowerCase().includes(filterText.toLowerCase());
        const actionMatch = log.action?.toLowerCase().includes(filterText.toLowerCase());
        const nameMatch = log.patient_id?.name?.toLowerCase().includes(filterText.toLowerCase());
        return detailMatch || actionMatch || nameMatch;
    }) || [];

    return (
        <DashboardLayout role="admin">
            <div className="space-y-8 p-6 text-slate-100 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 min-h-screen">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
                            Hospital Business Intelligence
                        </h1>
                        <p className="text-sm text-slate-400 mt-1">
                            Executive command dashboard providing operational, financial, and clinical safety compliance analytics.
                        </p>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3">
                        <Button 
                            onClick={fetchAnalytics}
                            variant="outline" 
                            size="sm"
                            className="bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-200"
                        >
                            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                            Refresh Stats
                        </Button>

                        <Button 
                            onClick={handleExport}
                            variant="outline" 
                            size="sm"
                            className="bg-emerald-950/40 border-emerald-900/60 hover:bg-emerald-900/50 text-emerald-300"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Excel Export
                        </Button>

                        <Button 
                            onClick={fetchForecast}
                            disabled={forecastLoading}
                            size="sm"
                            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium shadow-md shadow-violet-900/20"
                        >
                            <Sparkles className={`w-4 h-4 mr-2 ${forecastLoading ? "animate-pulse" : ""}`} />
                            {forecastLoading ? "Calculating Forecast..." : "AI Trend Forecast"}
                        </Button>
                    </div>
                </div>

                {/* KPI Metrics Panel */}
                {loading || !stats ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-32 bg-slate-900/40 animate-pulse rounded-2xl border border-slate-800" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        
                        {/* Patient Volumes Card */}
                        <GlassCard className="relative group overflow-hidden border-slate-800 bg-slate-900/30">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Patient Volume</span>
                                    <h3 className="text-3xl font-extrabold mt-1 text-slate-100">{stats.kpis.dailyPatients}</h3>
                                </div>
                                <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                                    <Users className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="mt-4 flex items-center justify-between text-xs border-t border-slate-800/80 pt-3 text-slate-400">
                                <div>Weekly: <span className="font-semibold text-slate-200">{stats.kpis.weeklyPatients}</span></div>
                                <div>Monthly: <span className="font-semibold text-slate-200">{stats.kpis.monthlyPatients}</span></div>
                            </div>
                        </GlassCard>

                        {/* Financial Ledger Card */}
                        <GlassCard className="relative group overflow-hidden border-slate-800 bg-slate-900/30">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Net Profit</span>
                                    <h3 className="text-3xl font-extrabold mt-1 text-slate-100">{formatINR(stats.kpis.profit)}</h3>
                                </div>
                                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                    <TrendingUp className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="mt-4 flex items-center justify-between text-xs border-t border-slate-800/80 pt-3 text-slate-400">
                                <div>Rev: <span className="font-semibold text-emerald-300">{formatINR(stats.kpis.revenue)}</span></div>
                                <div>Exp: <span className="font-semibold text-rose-300">{formatINR(stats.kpis.expenses)}</span></div>
                            </div>
                        </GlassCard>

                        {/* Clinical Efficiency Card */}
                        <GlassCard className="relative group overflow-hidden border-slate-800 bg-slate-900/30">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="text-xs font-semibold text-violet-400 uppercase tracking-wider">Avg Waiting Time</span>
                                    <h3 className="text-3xl font-extrabold mt-1 text-slate-100">{stats.kpis.averageWaitingTime} <span className="text-lg font-medium text-slate-400">min</span></h3>
                                </div>
                                <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
                                    <Clock className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="mt-4 flex items-center justify-between text-xs border-t border-slate-800/80 pt-3 text-slate-400">
                                <div>Doctor Util: <span className="font-semibold text-slate-200">{stats.kpis.doctorUtilization}</span></div>
                                <div>Bed Occ: <span className="font-semibold text-slate-200">{stats.kpis.bedOccupancy}</span></div>
                            </div>
                        </GlassCard>

                        {/* Ancillary Operations Card */}
                        <GlassCard className="relative group overflow-hidden border-slate-800 bg-slate-900/30">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Operational Load</span>
                                    <h3 className="text-3xl font-extrabold mt-1 text-slate-100">{stats.kpis.appointments} <span className="text-sm font-medium text-slate-400">Appts</span></h3>
                                </div>
                                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                                    <Activity className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="mt-4 flex items-center justify-between text-xs border-t border-slate-800/80 pt-3 text-slate-400">
                                <div>Emergencies: <span className="font-semibold text-slate-200">{stats.kpis.emergencyCases}</span></div>
                                <div>Ambulance: <span className="font-semibold text-slate-200">{stats.kpis.ambulanceTrips}</span></div>
                            </div>
                        </GlassCard>

                    </div>
                )}

                {/* Main Visualizations Grid */}
                {!loading && stats && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        
                        {/* Timeline Trend Visualizer (Span 2) */}
                        <div className="lg:col-span-2 space-y-8">
                            
                            {/* Operational & Financial Timeline */}
                            <GlassCard className="border-slate-800 bg-slate-900/30">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-100">Operational & Financial Timeline</h2>
                                        <p className="text-xs text-slate-400">Patient count vs. Revenue & Expenses over 30 days</p>
                                    </div>
                                    {showForecast && (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-950 text-violet-300 border border-violet-800">
                                            AI Forecast Overlay Active
                                        </span>
                                    )}
                                </div>
                                
                                <div className="h-[320px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={combinedData}>
                                            <defs>
                                                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25}/>
                                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                                </linearGradient>
                                                <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25}/>
                                                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                                                </linearGradient>
                                                <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.25}/>
                                                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.4} />
                                            <XAxis 
                                                dataKey="date" 
                                                stroke="#94a3b8" 
                                                fontSize={10} 
                                                tickLine={false}
                                            />
                                            <YAxis yAxisId="left" stroke="#8b5cf6" fontSize={10} tickLine={false} />
                                            <YAxis yAxisId="right" orientation="right" stroke="#06b6d4" fontSize={10} tickLine={false} />
                                            <Tooltip 
                                                contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", color: "#f8fafc" }} 
                                            />
                                            <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: "11px" }} />
                                            
                                            {/* Historical Data */}
                                            <Area 
                                                yAxisId="left" 
                                                type="monotone" 
                                                name="Revenue (INR)" 
                                                dataKey="actualRevenue" 
                                                stroke="#8b5cf6" 
                                                fillOpacity={1} 
                                                fill="url(#colorRev)" 
                                                strokeWidth={2.5}
                                            />
                                            <Area 
                                                yAxisId="right" 
                                                type="monotone" 
                                                name="Daily Patients" 
                                                dataKey="actualPatients" 
                                                stroke="#06b6d4" 
                                                fillOpacity={1} 
                                                fill="url(#colorPatients)" 
                                                strokeWidth={2}
                                            />

                                            {/* AI Forecast Projections */}
                                            {showForecast && (
                                                <Line 
                                                    yAxisId="left"
                                                    type="monotone"
                                                    name="Forecast Revenue"
                                                    dataKey="forecastedRevenue"
                                                    stroke="#ec4899"
                                                    strokeWidth={2.5}
                                                    strokeDasharray="5 5"
                                                    dot={{ r: 4, stroke: "#ec4899", strokeWidth: 2 }}
                                                />
                                            )}
                                            {showForecast && (
                                                <Line 
                                                    yAxisId="right"
                                                    type="monotone"
                                                    name="Forecast Patients"
                                                    dataKey="forecastedPatients"
                                                    stroke="#f59e0b"
                                                    strokeWidth={2}
                                                    strokeDasharray="5 5"
                                                    dot={{ r: 4, stroke: "#f59e0b", strokeWidth: 2 }}
                                                />
                                            )}
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </GlassCard>

                            {/* Departmental Comparison */}
                            <GlassCard className="border-slate-800 bg-slate-900/30">
                                <div className="mb-6">
                                    <h2 className="text-xl font-bold text-slate-100">Department Performance</h2>
                                    <p className="text-xs text-slate-400">Total Patient count vs total billing per clinical department</p>
                                </div>

                                <div className="h-[280px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={stats.departmentComparison}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.4} />
                                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                                            <YAxis yAxisId="left" stroke="#10b981" fontSize={10} tickLine={false} />
                                            <YAxis yAxisId="right" orientation="right" stroke="#3b82f6" fontSize={10} tickLine={false} />
                                            <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155" }} />
                                            <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: "11px" }} />
                                            <Bar yAxisId="left" dataKey="revenue" name="Billing (INR)" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={30} />
                                            <Bar yAxisId="right" dataKey="patients" name="Consultations" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={30} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </GlassCard>

                        </div>

                        {/* Right Sidebar: Hourly Trends, Ancillary distributions, and AI Insights */}
                        <div className="space-y-8">
                            
                            {/* Hourly Peak Activity Area */}
                            <GlassCard className="border-slate-800 bg-slate-900/30">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-100">Hourly Patient Load</h2>
                                    <p className="text-xs text-slate-400 mb-4">Patient volume distribution across operational hours</p>
                                </div>

                                <div className="h-[180px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={stats.hourlyTrends}>
                                            <defs>
                                                <linearGradient id="colorHourly" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25}/>
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                                            <XAxis dataKey="hour" stroke="#94a3b8" fontSize={9} />
                                            <YAxis stroke="#94a3b8" fontSize={9} />
                                            <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155" }} />
                                            <Area type="monotone" dataKey="patients" stroke="#3b82f6" fillOpacity={1} fill="url(#colorHourly)" strokeWidth={2} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </GlassCard>

                            {/* Ancillary Operations Distribution */}
                            <GlassCard className="border-slate-800 bg-slate-900/30">
                                <h2 className="text-lg font-bold text-slate-100 mb-4">Operations Breakdown</h2>
                                
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-400">Medicine Dispensing Sales</span>
                                        <span className="font-semibold text-emerald-400">{formatINR(stats.kpis.medicineSales)}</span>
                                    </div>
                                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: "35%" }}></div>
                                    </div>

                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-400">Lab Diagnostic Billings</span>
                                        <span className="font-semibold text-blue-400">{formatINR(stats.kpis.labRevenue)}</span>
                                    </div>
                                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                        <div className="bg-blue-500 h-full rounded-full" style={{ width: "45%" }}></div>
                                    </div>

                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-400">Approved Insurance Claims</span>
                                        <span className="font-semibold text-violet-400">{formatINR(stats.kpis.claimsApprovedAmount)}</span>
                                    </div>
                                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                        <div className="bg-violet-500 h-full rounded-full" style={{ width: "65%" }}></div>
                                    </div>
                                </div>
                            </GlassCard>

                            {/* AI Insights Card */}
                            <GlassCard className="relative overflow-hidden border-violet-900/50 bg-slate-950/60 p-6 shadow-2xl">
                                <div className="absolute top-0 right-0 p-3 text-violet-500 opacity-20">
                                    <Sparkles className="w-16 h-16" />
                                </div>
                                <div className="flex items-center gap-2 mb-3">
                                    <Sparkles className="w-5 h-5 text-violet-400" />
                                    <h3 className="text-md font-bold text-slate-200">AI Hospital Projections</h3>
                                </div>
                                
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    {showForecast ? (
                                        `AI projections forecast a weekly patient load increase of ${Math.round(
                                            forecastData.reduce((acc, curr) => acc + curr.predicted_patients, 0) / 7
                                        )} patients/day. Projecting revenue growth to stabilize around ${formatINR(
                                            forecastData[forecastData.length - 1].predicted_revenue
                                        )} daily by next week.`
                                    ) : (
                                        "Generate an AI-driven projection to view estimated clinic demands, anticipated patient caseloads, and cashflow outlook for the next 7 days."
                                    )}
                                </p>
                                
                                {!showForecast && (
                                    <Button
                                        onClick={fetchForecast}
                                        disabled={forecastLoading}
                                        className="mt-4 w-full bg-violet-950/80 border border-violet-800/80 hover:bg-violet-900/80 text-violet-300 text-xs font-semibold py-2 rounded-xl"
                                    >
                                        Compute AI Estimates
                                    </Button>
                                )}
                            </GlassCard>

                        </div>

                    </div>
                )}

                {/* Clinical Medication Safety Audit Log Table */}
                {!loading && stats && (
                    <GlassCard className="border-slate-800 bg-slate-900/30">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                                    Clinical Safety Audit Logs
                                </h2>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Trace safety check audits, prescription evaluations, and clinician overrides for compliance.
                                </p>
                            </div>

                            <input 
                                type="text"
                                placeholder="Filter by action, patient name or warning detail..."
                                value={filterText}
                                onChange={(e) => setFilterText(e.target.value)}
                                className="px-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-violet-500 w-full md:w-80"
                            />
                        </div>

                        <div className="overflow-x-auto rounded-xl border border-slate-800">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-300 font-semibold uppercase">
                                        <th className="p-4">Timestamp</th>
                                        <th className="p-4">Action</th>
                                        <th className="p-4">Operator</th>
                                        <th className="p-4">Patient ID / Name</th>
                                        <th className="p-4">Details</th>
                                        <th className="p-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-850 bg-slate-900/10">
                                    {filteredLogs.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="p-8 text-center text-slate-500">
                                                No clinical safety records match your query.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredLogs.map((log: any) => {
                                            const isOverride = log.action.toLowerCase().includes("override") || log.action.toLowerCase().includes("bypass") || log.details.toLowerCase().includes("bypass") || log.details.toLowerCase().includes("override");
                                            const isWarning = log.details.toLowerCase().includes("warning") || log.details.toLowerCase().includes("critical");

                                            return (
                                                <tr key={log._id} className="hover:bg-slate-800/20 transition-colors">
                                                    <td className="p-4 text-slate-400 font-mono whitespace-nowrap">
                                                        {new Date(log.timestamp).toLocaleString()}
                                                    </td>
                                                    <td className="p-4 font-semibold text-slate-200">
                                                        {log.action}
                                                    </td>
                                                    <td className="p-4 whitespace-nowrap">
                                                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                                                            {log.user_type}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 font-medium text-slate-300 whitespace-nowrap">
                                                        {log.patient_id?.name || log.patient_id || "System"}
                                                    </td>
                                                    <td className="p-4 text-slate-400 max-w-sm truncate" title={log.details}>
                                                        {log.details}
                                                    </td>
                                                    <td className="p-4">
                                                        {isOverride ? (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-amber-950 text-amber-300 border border-amber-900">
                                                                Override Active
                                                            </span>
                                                        ) : isWarning ? (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-rose-950 text-rose-300 border border-rose-900">
                                                                Flagged Warn
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-950 text-emerald-300 border border-emerald-900">
                                                                Compliant Pass
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </GlassCard>
                )}

            </div>
        </DashboardLayout>
    );
}
