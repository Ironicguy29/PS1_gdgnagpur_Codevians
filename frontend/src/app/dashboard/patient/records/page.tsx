'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from "@/components/layout/DashboardLayout";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
    FileText, Calendar, Search, Filter, ClipboardList, 
    Download, Eye, ChevronDown, ChevronUp, Stethoscope, Activity, Heart,
    Thermometer, ShieldAlert, Sparkles, User, Percent, HelpCircle
} from "lucide-react";
import api from "@/lib/api";

export default function PatientRecords() {
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [visits, setVisits] = useState<any[]>([]);
    const [vitalsHistory, setVitalsHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Filters & Search
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedDept, setSelectedDept] = useState("All");
    const [expandedVisit, setExpandedVisit] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'timeline' | 'vitals' | 'profile'>('timeline');

    useEffect(() => {
        const u = localStorage.getItem('user');
        if (u) {
            const parsedUser = JSON.parse(u);
            setUser(parsedUser);
            fetchEMRData(parsedUser._id);
        }
    }, []);

    const fetchEMRData = async (patientId: string) => {
        setLoading(true);
        try {
            const [profileRes, visitsRes, vitalsRes] = await Promise.all([
                api.get(`/emr/profile/${patientId}`),
                api.get(`/emr/visits/${patientId}`),
                api.get(`/emr/vitals/${patientId}`)
            ]);
            setProfile(profileRes.data);
            setVisits(visitsRes.data);
            setVitalsHistory(vitalsRes.data);
        } catch (e) {
            console.error("Failed to load patient EMR records", e);
        } finally {
            setLoading(false);
        }
    };

    // Filtered visits
    const filteredVisits = visits.filter(visit => {
        const matchesSearch = 
            visit.doctor_id?.user_id?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            visit.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            visit.diagnosis?.primary_diagnosis?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            visit.prescription?.medicines?.some((m: any) => m.name.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesDept = selectedDept === "All" || visit.department === selectedDept;

        return matchesSearch && matchesDept;
    });

    const departments = ["All", ...Array.from(new Set(visits.map(v => v.department)))];

    const getBMIColor = (bmi: number) => {
        if (bmi < 18.5) return 'text-sky-500';
        if (bmi < 25) return 'text-emerald-500';
        if (bmi < 30) return 'text-amber-500';
        return 'text-red-500';
    };

    const handleDownloadSummary = () => {
        window.print();
    };

    return (
        <DashboardLayout role="patient">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8 print:hidden">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <ClipboardList className="w-8 h-8 text-blue-500" /> Digital Health Records
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">View, search, and track your clinical history and prescriptions.</p>
                </div>
                <Button onClick={handleDownloadSummary} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-200 dark:shadow-none flex items-center gap-2">
                    <Download className="w-4 h-4" /> Export Health File
                </Button>
            </div>

            {/* Quick Profile Overview (Printable Header) */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center font-bold text-xl">
                            {user?.name?.[0] || 'P'}
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 dark:text-white text-lg leading-tight">{user?.name}</h3>
                            <p className="text-xs text-slate-400 mt-0.5">ID: {user?.patient_id || 'PAT-NEW'}</p>
                        </div>
                    </div>
                    <div className="flex flex-col justify-center border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 md:pl-6">
                        <span className="text-xs text-slate-400 font-semibold uppercase">ABHA Number</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{user?.abha_id || '--'}</span>
                    </div>
                    <div className="flex flex-col justify-center border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 md:pl-6">
                        <span className="text-xs text-slate-400 font-semibold uppercase">Blood Group</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{user?.blood_group || '--'}</span>
                    </div>
                    <div className="flex flex-col justify-center border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 md:pl-6">
                        <span className="text-xs text-slate-400 font-semibold uppercase">Primary Allergies</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                            {profile?.allergies?.length > 0 ? (
                                profile.allergies.map((a: string, i: number) => (
                                    <Badge key={i} className="bg-red-50 text-red-600 hover:bg-red-50 dark:bg-red-950/20 dark:text-red-400 text-[10px] py-0 px-2">
                                        {a}
                                    </Badge>
                                ))
                            ) : (
                                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">No Known Allergies</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 mb-8 gap-6 print:hidden">
                {(['timeline', 'vitals', 'profile'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`pb-4 px-2 text-sm font-semibold capitalize transition-all relative ${
                            activeTab === tab 
                                ? 'text-blue-500' 
                                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                        }`}
                    >
                        {tab === 'timeline' ? 'Visit Timeline' : tab === 'vitals' ? 'Vitals Trends' : 'Lifelong Health Profile'}
                        {activeTab === tab && (
                            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
                        )}
                    </button>
                ))}
            </div>

            {/* Loading Indicator */}
            {loading && (
                <div className="py-20 text-center text-slate-400 font-semibold">
                    <Activity className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-2" />
                    Fetching medical record ledger...
                </div>
            )}

            {!loading && (
                <>
                    {/* Tab 1: Visit Timeline */}
                    {activeTab === 'timeline' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Main timeline listing (span 2) */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Search and Filter Controls */}
                                <div className="flex flex-col sm:flex-row gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm print:hidden">
                                    <div className="flex-1 relative">
                                        <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Search by diagnosis, doctor or medicine..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm text-slate-800 dark:text-white"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Filter className="w-4 h-4 text-slate-400" />
                                        <select
                                            value={selectedDept}
                                            onChange={(e) => setSelectedDept(e.target.value)}
                                            className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-white"
                                        >
                                            {departments.map(dept => (
                                                <option key={dept} value={dept}>{dept}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Timeline */}
                                <div className="space-y-4">
                                    {filteredVisits.length === 0 ? (
                                        <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-slate-400">
                                            No clinical encounters match the filter.
                                        </div>
                                    ) : (
                                        filteredVisits.map((visit) => (
                                            <div 
                                                key={visit._id}
                                                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
                                            >
                                                {/* Header Panel */}
                                                <div 
                                                    onClick={() => setExpandedVisit(expandedVisit === visit._id ? null : visit._id)}
                                                    className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
                                                            <Stethoscope className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                                                                {visit.doctor_id?.user_id?.name || 'Consulting Specialist'}
                                                            </h4>
                                                            <p className="text-xs text-slate-400 mt-0.5">{visit.department} • {new Date(visit.date).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</p>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-4">
                                                        <Badge className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900 text-xs">
                                                            {visit.diagnosis?.primary_diagnosis || 'Check-up'}
                                                        </Badge>
                                                        {expandedVisit === visit._id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                                                    </div>
                                                </div>

                                                {/* Expandable Body */}
                                                {expandedVisit === visit._id && (
                                                    <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-900/30 space-y-6">
                                                        {/* Symptoms & Vitals Row */}
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                            <div>
                                                                <h5 className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider mb-2">Presented Symptoms</h5>
                                                                <div className="flex flex-wrap gap-1.5">
                                                                    {visit.symptoms?.map((sym: string, i: number) => (
                                                                        <Badge key={i} variant="outline" className="bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800">
                                                                            {sym}
                                                                        </Badge>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            {visit.vitals && (
                                                                <div>
                                                                    <h5 className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider mb-2">Recorded Vitals</h5>
                                                                    <div className="grid grid-cols-3 gap-2 text-center">
                                                                        <div className="bg-white dark:bg-slate-950 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                                                                            <span className="text-[10px] text-slate-400 block">Temp</span>
                                                                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{visit.vitals.temperature}°F</span>
                                                                        </div>
                                                                        <div className="bg-white dark:bg-slate-950 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                                                                            <span className="text-[10px] text-slate-400 block">Blood Press</span>
                                                                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{visit.vitals.blood_pressure}</span>
                                                                        </div>
                                                                        <div className="bg-white dark:bg-slate-950 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                                                                            <span className="text-[10px] text-slate-400 block">SpO2</span>
                                                                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{visit.vitals.oxygen_saturation}%</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Prescribed Medicines */}
                                                        {visit.prescription && visit.prescription.medicines?.length > 0 && (
                                                            <div>
                                                                <div className="flex justify-between items-center mb-2.5">
                                                                    <h5 className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider">Digital Prescription</h5>
                                                                    {visit.prescription.status && (
                                                                        <Badge className={`text-[10px] uppercase font-bold tracking-wider ${
                                                                            visit.prescription.status === 'Completed' || visit.prescription.status === 'Dispensed'
                                                                                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                                                                : visit.prescription.status === 'Ready'
                                                                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse'
                                                                                : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                                                        }`}>
                                                                            {visit.prescription.status === 'Generated' ? 'Processing' : visit.prescription.status === 'Ready' ? 'Ready for Pickup' : visit.prescription.status}
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                <div className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                                                                    {visit.prescription.medicines.map((m: any, idx: number) => (
                                                                        <div key={idx} className="p-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                                                            <div>
                                                                                <p className="text-sm font-bold text-slate-900 dark:text-white">{m.name} <span className="text-xs font-medium text-slate-400">({m.dosage})</span></p>
                                                                                <p className="text-xs text-slate-500 mt-0.5">{m.frequency} • {m.duration} • {m.before_food ? 'Before Food' : 'After Food'}</p>
                                                                            </div>
                                                                            {m.instructions && (
                                                                                <span className="text-xs italic text-slate-400 bg-slate-50 dark:bg-slate-900 py-1 px-2.5 rounded-lg">
                                                                                    {m.instructions}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Lab Orders */}
                                                        {visit.lab_orders?.length > 0 && (
                                                            <div>
                                                                <h5 className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider mb-2">Requested Laboratory Diagnostics</h5>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {visit.lab_orders.map((order: any, oIdx: number) => (
                                                                        <div key={oIdx} className="bg-white dark:bg-slate-950 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
                                                                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{order.tests?.join(', ')}</span>
                                                                            <Badge className={`text-[10px] ${
                                                                                order.status === 'Completed' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                                                                            }`}>
                                                                                {order.status}
                                                                            </Badge>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Clinical Impression & Instructions */}
                                                        {visit.diagnosis?.clinical_impression && (
                                                            <div>
                                                                <h5 className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider mb-1">Clinical Impressions</h5>
                                                                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800">{visit.diagnosis.clinical_impression}</p>
                                                            </div>
                                                        )}

                                                        {visit.treatment_plan && (
                                                            <div>
                                                                <h5 className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider mb-1">Treatment Plan / Instructions</h5>
                                                                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800">{visit.treatment_plan}</p>
                                                            </div>
                                                        )}

                                                        {/* Follow-up */}
                                                        {visit.follow_up_date && (
                                                            <div className="pt-2 flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400">
                                                                <Calendar className="w-4 h-4" /> Next Follow-up Consultation scheduled for: {new Date(visit.follow_up_date).toLocaleDateString('en-IN', { dateStyle: 'long' })}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Right Col: Chronic Diseases & Medications (Span 1) */}
                            <div className="space-y-6">
                                <GlassCard className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6">
                                    <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                                        <ShieldAlert className="w-5 h-5 text-red-500" /> Chronic Conditions
                                    </h3>
                                    <div className="space-y-2">
                                        {profile?.existing_diseases?.length > 0 ? (
                                            profile.existing_diseases.map((d: string, i: number) => (
                                                <div key={i} className="p-3 bg-red-50/50 dark:bg-red-950/10 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900 rounded-xl text-sm font-bold flex items-center gap-2">
                                                    ● {d}
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-slate-400 text-sm text-center py-4">No chronic conditions flagged.</p>
                                        )}
                                    </div>
                                </GlassCard>

                                <GlassCard className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6">
                                    <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                                        <Activity className="w-5 h-5 text-blue-500" /> Current Medications
                                    </h3>
                                    <div className="space-y-2">
                                        {profile?.current_medications?.length > 0 ? (
                                            profile.current_medications.map((m: string, i: number) => (
                                                <div key={i} className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-700 dark:text-slate-300 font-semibold flex items-center justify-between">
                                                    <span>{m}</span>
                                                    <Badge className="bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400">Daily</Badge>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-slate-400 text-sm text-center py-4">No ongoing medications listed.</p>
                                        )}
                                    </div>
                                </GlassCard>
                            </div>
                        </div>
                    )}

                    {/* Tab 2: Vitals Trends */}
                    {activeTab === 'vitals' && (
                        <div className="space-y-8">
                            {/* Trend charts / metrics comparison */}
                            {vitalsHistory.length === 0 ? (
                                <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-slate-400">
                                    No logged vitals history yet.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* BP & Weight logs */}
                                    <GlassCard className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6">
                                        <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                                            <Heart className="w-5 h-5 text-red-500" /> Blood Pressure & Heart Rate Trends
                                        </h3>
                                        {/* Simple SVG Chart to look wow */}
                                        <div className="h-64 w-full bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 relative flex flex-col justify-end">
                                            <svg className="w-full h-full" viewBox="0 0 400 200">
                                                <g stroke="#cbd5e1" strokeWidth="0.5" strokeDasharray="3 3">
                                                    <line x1="0" y1="50" x2="400" y2="50" />
                                                    <line x1="0" y1="100" x2="400" y2="100" />
                                                    <line x1="0" y1="150" x2="400" y2="150" />
                                                </g>
                                                {/* Pulse rate line */}
                                                <path 
                                                    d={`M ${vitalsHistory.map((v, i) => `${(i / Math.max(vitalsHistory.length - 1, 1)) * 360 + 20} ${200 - ((v.heart_rate - 40) / 120) * 160}`).join(' L ')}`} 
                                                    fill="none" 
                                                    stroke="#f43f5e" 
                                                    strokeWidth="3"
                                                    strokeLinecap="round"
                                                />
                                                {/* Data dots */}
                                                {vitalsHistory.map((v, i) => (
                                                    <circle 
                                                        key={i} 
                                                        cx={(i / Math.max(vitalsHistory.length - 1, 1)) * 360 + 20} 
                                                        cy={200 - ((v.heart_rate - 40) / 120) * 160} 
                                                        r="5" 
                                                        fill="#f43f5e" 
                                                        stroke="white" 
                                                        strokeWidth="2"
                                                    />
                                                ))}
                                            </svg>
                                            <div className="flex justify-between text-[10px] text-slate-400 mt-2 px-4">
                                                {vitalsHistory.map((v, i) => (
                                                    <span key={i}>{new Date(v.recorded_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </GlassCard>

                                    <GlassCard className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6">
                                        <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                                            <Thermometer className="w-5 h-5 text-amber-500" /> Temperature & SpO2 Logs
                                        </h3>
                                        <div className="h-64 w-full bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 relative flex flex-col justify-end">
                                            <svg className="w-full h-full" viewBox="0 0 400 200">
                                                <g stroke="#cbd5e1" strokeWidth="0.5" strokeDasharray="3 3">
                                                    <line x1="0" y1="50" x2="400" y2="50" />
                                                    <line x1="0" y1="100" x2="400" y2="100" />
                                                    <line x1="0" y1="150" x2="400" y2="150" />
                                                </g>
                                                {/* Temperature rate line */}
                                                <path 
                                                    d={`M ${vitalsHistory.map((v, i) => `${(i / Math.max(vitalsHistory.length - 1, 1)) * 360 + 20} ${200 - ((v.temperature - 95) / 10) * 160}`).join(' L ')}`} 
                                                    fill="none" 
                                                    stroke="#eab308" 
                                                    strokeWidth="3"
                                                    strokeLinecap="round"
                                                />
                                                {vitalsHistory.map((v, i) => (
                                                    <circle 
                                                        key={i} 
                                                        cx={(i / Math.max(vitalsHistory.length - 1, 1)) * 360 + 20} 
                                                        cy={200 - ((v.temperature - 95) / 10) * 160} 
                                                        r="5" 
                                                        fill="#eab308" 
                                                        stroke="white" 
                                                        strokeWidth="2"
                                                    />
                                                ))}
                                            </svg>
                                            <div className="flex justify-between text-[10px] text-slate-400 mt-2 px-4">
                                                {vitalsHistory.map((v, i) => (
                                                    <span key={i}>{new Date(v.recorded_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </GlassCard>

                                    {/* Detailed Vitals Comparison Grid */}
                                    <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                                        <div className="p-5 border-b border-slate-100 dark:border-slate-800 font-bold text-slate-800 dark:text-white">
                                            Historical Vitals Ledger
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse text-sm">
                                                <thead>
                                                    <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800">
                                                        <th className="p-4">Date</th>
                                                        <th className="p-4">BP</th>
                                                        <th className="p-4">Pulse</th>
                                                        <th className="p-4">Temp</th>
                                                        <th className="p-4">Oxygen</th>
                                                        <th className="p-4">BMI</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                    {vitalsHistory.map((v, idx) => (
                                                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                                            <td className="p-4 font-semibold">{new Date(v.recorded_at).toLocaleDateString('en-IN')}</td>
                                                            <td className="p-4">{v.blood_pressure}</td>
                                                            <td className="p-4">{v.heart_rate} bpm</td>
                                                            <td className="p-4">{v.temperature}°F</td>
                                                            <td className="p-4">{v.oxygen_saturation}%</td>
                                                            <td className={`p-4 font-bold ${getBMIColor(v.bmi)}`}>{v.bmi}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tab 3: Medical Profile */}
                    {activeTab === 'profile' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <GlassCard className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-6">
                                <div>
                                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4 text-sm uppercase tracking-wider">
                                        <User className="w-5 h-5 text-blue-500" /> Patient Demographics
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-xs text-slate-400 font-semibold block uppercase">Age / Gender</span>
                                            <span className="font-bold text-slate-800 dark:text-slate-200">{user?.age} Yrs / {user?.gender}</span>
                                        </div>
                                        <div>
                                            <span className="text-xs text-slate-400 font-semibold block uppercase">Phone Number</span>
                                            <span className="font-bold text-slate-800 dark:text-slate-200">{user?.phone}</span>
                                        </div>
                                        <div className="col-span-2">
                                            <span className="text-xs text-slate-400 font-semibold block uppercase">Address</span>
                                            <span className="font-bold text-slate-800 dark:text-slate-200">{user?.address}, {user?.city}, {user?.state} - {user?.pincode}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
                                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4 text-sm uppercase tracking-wider">
                                        <Sparkles className="w-5 h-5 text-blue-500" /> Lifestyle & Habits
                                    </h3>
                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                        <div>
                                            <span className="text-xs text-slate-400 font-semibold block uppercase">Smoking</span>
                                            <span className="font-bold text-slate-800 dark:text-slate-200 capitalize">{profile?.lifestyle?.smoking || 'Non-smoker'}</span>
                                        </div>
                                        <div>
                                            <span className="text-xs text-slate-400 font-semibold block uppercase">Alcohol</span>
                                            <span className="font-bold text-slate-800 dark:text-slate-200 capitalize">{profile?.lifestyle?.alcohol || 'Occasional'}</span>
                                        </div>
                                        <div>
                                            <span className="text-xs text-slate-400 font-semibold block uppercase">Pregnancy Status</span>
                                            <span className="font-bold text-slate-800 dark:text-slate-200">{profile?.lifestyle?.pregnancy_status || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                            </GlassCard>

                            <GlassCard className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-6">
                                <div>
                                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4 text-sm uppercase tracking-wider">
                                        <HelpCircle className="w-5 h-5 text-blue-500" /> Medical & Surgical History
                                    </h3>
                                    <div className="grid grid-cols-1 gap-4 text-sm">
                                        <div>
                                            <span className="text-xs text-slate-400 font-semibold block uppercase">Past Surgeries</span>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {profile?.past_surgeries?.length > 0 ? (
                                                    profile.past_surgeries.map((s: string, idx: number) => (
                                                        <Badge key={idx} variant="outline" className="text-slate-600 dark:text-slate-300">{s}</Badge>
                                                    ))
                                                ) : (
                                                    <span className="text-slate-400 italic">No past surgeries declared.</span>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-xs text-slate-400 font-semibold block uppercase">Family Medical History</span>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {profile?.family_history?.length > 0 ? (
                                                    profile.family_history.map((h: string, idx: number) => (
                                                        <Badge key={idx} variant="outline" className="text-slate-600 dark:text-slate-300">{h}</Badge>
                                                    ))
                                                ) : (
                                                    <span className="text-slate-400 italic">No family history declared.</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
                                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4 text-sm uppercase tracking-wider">
                                        <FileText className="w-5 h-5 text-blue-500" /> Insurance Ledger
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-xs text-slate-400 font-semibold block uppercase">Provider</span>
                                            <span className="font-bold text-slate-800 dark:text-slate-200">{profile?.insurance?.provider || '--'}</span>
                                        </div>
                                        <div>
                                            <span className="text-xs text-slate-400 font-semibold block uppercase">Policy Number</span>
                                            <span className="font-bold text-slate-800 dark:text-slate-200">{profile?.insurance?.policy_number || '--'}</span>
                                        </div>
                                    </div>
                                </div>
                            </GlassCard>
                        </div>
                    )}
                </>
            )}
        </DashboardLayout>
    );
}
