'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from "@/components/layout/DashboardLayout";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
    Sparkles, Activity, ShieldAlert, CheckCircle2, Heart, Calendar, 
    ChevronRight, ArrowLeft, Clock, Pill, TrendingUp, AlertTriangle, 
    Loader2, HelpCircle, RefreshCw, User, Plus, Trash2, Eye, 
    BookOpen, HeartPulse, RefreshCw as ResetIcon
} from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/components/providers/ToastProvider";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

// Common medical symptom suggestions
const PRESET_SYMPTOMS = [
    "Fever", "Cough", "Chest Pain", "Shortness of Breath", "Headache", 
    "Fatigue", "Nausea", "Sore Throat", "Muscle Pain", "Dizziness",
    "Abdominal Pain", "Joint Stiffness", "Back Pain", "Skin Rash"
];

export default function PatientAIAssistantPage() {
    const [user, setUser] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'symptom' | 'risk' | 'history'>('symptom');
    const [loading, setLoading] = useState(false);
    
    // Symptom Checker State
    const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
    const [symptomInput, setSymptomInput] = useState('');
    const [description, setDescription] = useState('');
    const [assessmentResult, setAssessmentResult] = useState<any>(null);
    
    // Health Risk Calculator State
    const [healthScoreResult, setHealthScoreResult] = useState<any>(null);
    const [calculatingRisk, setCalculatingRisk] = useState(false);
    
    // History Logs
    const [pastAssessments, setPastAssessments] = useState<any[]>([]);
    const [pastScores, setPastScores] = useState<any[]>([]);
    const [selectedHistoryItem, setSelectedHistoryItem] = useState<any>(null);
    
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            const parsed = JSON.parse(userData);
            setUser(parsed);
            fetchHistory(parsed._id);
        }
    }, []);

    const fetchHistory = async (patientId: string) => {
        try {
            const [assessRes, scoreRes] = await Promise.all([
                api.get(`/ai-clinical/assessments/${patientId}`),
                api.get(`/ai-clinical/scores/${patientId}`)
            ]);
            setPastAssessments(assessRes.data || []);
            setPastScores(scoreRes.data || []);
        } catch (err) {
            console.error("Failed to fetch clinical AI history:", err);
        }
    };

    // Symptom Checker Handlers
    const handleAddSymptom = (symptom: string) => {
        const trimmed = symptom.trim();
        if (trimmed && !selectedSymptoms.includes(trimmed)) {
            setSelectedSymptoms([...selectedSymptoms, trimmed]);
            setSymptomInput('');
        }
    };

    const handleRemoveSymptom = (index: number) => {
        setSelectedSymptoms(selectedSymptoms.filter((_, i) => i !== index));
    };

    const handleRunSymptomCheck = async () => {
        if (selectedSymptoms.length === 0) {
            toast("Please select or type at least one symptom.", "warning");
            return;
        }
        setLoading(true);
        try {
            const payload = {
                symptoms: selectedSymptoms,
                description,
                patientId: user?._id
            };
            const res = await api.post('/ai-clinical/check-symptoms', payload);
            setAssessmentResult(res.data);
            toast("Symptom check completed successfully!", "success");
            if (user) fetchHistory(user._id);
        } catch (err: any) {
            toast(err.response?.data?.message || "Failed to analyze symptoms.", "error");
        } finally {
            setLoading(false);
        }
    };

    // Health Risk Handler
    const handleCalculateHealthScore = async () => {
        setCalculatingRisk(true);
        try {
            const res = await api.post('/ai-clinical/calculate-health-score', {
                patientId: user?._id
            });
            setHealthScoreResult(res.data);
            toast("Comprehensive wellness risk scoring complete!", "success");
            if (user) fetchHistory(user._id);
        } catch (err: any) {
            toast(err.response?.data?.message || "Failed to run health score calculation.", "error");
        } finally {
            setCalculatingRisk(false);
        }
    };

    // Triage styling helper
    const getTriageTheme = (level: string) => {
        switch (level?.toLowerCase()) {
            case 'critical':
            case 'emergency':
                return {
                    bg: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/30',
                    text: 'text-red-700 dark:text-red-400',
                    badge: 'bg-red-500 text-white animate-pulse',
                    desc: 'Emergency Medical Care Required. Immediate attention needed.'
                };
            case 'urgent':
                return {
                    bg: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/30',
                    text: 'text-amber-700 dark:text-amber-400',
                    badge: 'bg-amber-500 text-white',
                    desc: 'Urgent Care recommended. Seek medical attention today.'
                };
            case 'routine':
                return {
                    bg: 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800/30',
                    text: 'text-green-700 dark:text-green-400',
                    badge: 'bg-green-600 text-white',
                    desc: 'Routine clinic follow-up recommended.'
                };
            default:
                return {
                    bg: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/30',
                    text: 'text-blue-700 dark:text-blue-400',
                    badge: 'bg-blue-600 text-white',
                    desc: 'Self-care or general wellness checks.'
                };
        }
    };

    return (
        <DashboardLayout role="patient">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                        <Sparkles className="w-8 h-8 text-blue-600 animate-pulse" />
                        AI Clinical Assistant
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        AI-guided pre-diagnostics, chronic disease risk profiling, and specialist matching.
                    </p>
                </div>
                
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 self-start">
                    <button
                        onClick={() => setActiveTab('symptom')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                            activeTab === 'symptom'
                                ? "bg-white dark:bg-slate-900 text-blue-600 shadow-sm"
                                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                        }`}
                    >
                        Symptom Checker
                    </button>
                    <button
                        onClick={() => setActiveTab('risk')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                            activeTab === 'risk'
                                ? "bg-white dark:bg-slate-900 text-blue-600 shadow-sm"
                                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                        }`}
                    >
                        Health Risk Index
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                            activeTab === 'history'
                                ? "bg-white dark:bg-slate-900 text-blue-600 shadow-sm"
                                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                        }`}
                    >
                        Assessment Log
                    </button>
                </div>
            </div>

            {/* Disclaimer Banner */}
            <div className="mb-6 bg-slate-50 dark:bg-slate-900 border-l-4 border-amber-500 p-4 rounded-r-2xl flex gap-3 text-xs text-slate-600 dark:text-slate-400">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block mb-0.5">Clinical Decision Support Tool Disclaimer</span>
                    This system provides pre-diagnostic guidance based on clinical models. It is designed to assist, not replace, professional consultations. 
                    <span className="font-extrabold text-red-500 block mt-1">If you are experiencing severe chest pain, sudden numbness, difficulty breathing, or another emergency, call 108 immediately.</span>
                </div>
            </div>

            {/* Content Tabs */}
            <AnimatePresence mode="wait">
                {/* 1. SYMPTOM CHECKER */}
                {activeTab === 'symptom' && (
                    <motion.div
                        key="symptom-tab"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                    >
                        {/* Symptom Input Column */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
                                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-blue-600" /> Start Symptom Check
                                </h3>

                                {/* Preset Suggestions */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quick Select Symptoms</label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {PRESET_SYMPTOMS.map((sym) => {
                                            const isSelected = selectedSymptoms.includes(sym);
                                            return (
                                                <button
                                                    key={sym}
                                                    type="button"
                                                    disabled={isSelected}
                                                    onClick={() => handleAddSymptom(sym)}
                                                    className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                                                        isSelected
                                                            ? "bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800 dark:border-slate-700"
                                                            : "bg-blue-50/30 border-blue-100 hover:bg-blue-50 text-blue-600 dark:bg-blue-900/10 dark:border-blue-900/20 dark:text-blue-400"
                                                    }`}
                                                >
                                                    + {sym}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Custom Input */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Add Other Symptom</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Type a symptom e.g. Fever"
                                            value={symptomInput}
                                            onChange={(e) => setSymptomInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddSymptom(symptomInput)}
                                            className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        />
                                        <Button 
                                            size="sm"
                                            onClick={() => handleAddSymptom(symptomInput)}
                                            className="bg-blue-600 text-white hover:bg-blue-700 rounded-xl"
                                        >
                                            Add
                                        </Button>
                                    </div>
                                </div>

                                {/* Selected Chips */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Selected ({selectedSymptoms.length})</label>
                                    {selectedSymptoms.length === 0 ? (
                                        <p className="text-xs text-slate-400 italic">No symptoms selected yet.</p>
                                    ) : (
                                        <div className="flex flex-wrap gap-1.5 p-2.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                                            {selectedSymptoms.map((sym, idx) => (
                                                <span 
                                                    key={idx}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                                                >
                                                    {sym}
                                                    <Trash2 
                                                        className="w-3 h-3 text-red-500 hover:text-red-600 cursor-pointer ml-1" 
                                                        onClick={() => handleRemoveSymptom(idx)}
                                                    />
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Description */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Context & Severity Description</label>
                                    <textarea
                                        rows={3}
                                        placeholder="Describe the severity, duration, and onset of symptoms. e.g. Gradual onset of headache since yesterday, worsening in the evening."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                                    />
                                </div>

                                {/* Run Button */}
                                <Button
                                    onClick={handleRunSymptomCheck}
                                    disabled={loading || selectedSymptoms.length === 0}
                                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Analyzing Symptoms...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-4 h-4 text-amber-300" />
                                            Analyze Symptoms
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>

                        {/* Symptom Checker Output Column */}
                        <div className="lg:col-span-2 space-y-6">
                            {assessmentResult ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="space-y-6"
                                >
                                    {/* Urgency & Triage Card */}
                                    {(() => {
                                        const theme = getTriageTheme(assessmentResult.triage_level);
                                        return (
                                            <div className={`p-6 rounded-3xl border ${theme.bg} transition-all space-y-4`}>
                                                <div className="flex items-center justify-between">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${theme.badge}`}>
                                                        Triage: {assessmentResult.triage_level}
                                                    </span>
                                                    <Badge className="bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                                                        Recommended: {assessmentResult.recommended_department}
                                                    </Badge>
                                                </div>
                                                
                                                <div className="space-y-1">
                                                    <h3 className={`text-xl font-black ${theme.text}`}>
                                                        {theme.desc}
                                                    </h3>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                                        Analysis calculated based on matching {selectedSymptoms.length} patient symptoms.
                                                    </p>
                                                </div>

                                                {/* Critical / Emergency CTA */}
                                                {(assessmentResult.triage_level?.toLowerCase() === 'critical' || assessmentResult.triage_level?.toLowerCase() === 'emergency') && (
                                                    <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">
                                                        <div className="flex gap-2.5 items-start">
                                                            <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                                            <div className="text-xs text-red-700 dark:text-red-400">
                                                                <span className="font-bold block">Smart Ambulance Dispatch Available</span>
                                                                We have detected critical metrics. You can dispatch an emergency ambulance to your current GPS position.
                                                            </div>
                                                        </div>
                                                        <Button
                                                            onClick={() => router.push('/dashboard/patient/appointments?emergency=true')}
                                                            className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2 px-4 rounded-xl shrink-0 animate-pulse"
                                                        >
                                                            Dispatch Emergency Ambulance
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}

                                    {/* Condition Diagnoses Cards */}
                                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
                                        <h4 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                                            <BookOpen className="w-5 h-5 text-indigo-600" />
                                            Differential Diagnosis Breakdown
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {assessmentResult.potential_conditions?.map((cond: any, index: number) => (
                                                <div 
                                                    key={index} 
                                                    className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 space-y-2"
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <span className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate max-w-[70%]">
                                                            {cond.condition || cond.condition_name}
                                                        </span>
                                                        <Badge className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-extrabold border-0">
                                                            {cond.probability > 1 ? cond.probability : Math.round(cond.probability * 100)}% Match
                                                        </Badge>
                                                    </div>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                                        {cond.details || cond.explanation}
                                                    </p>
                                                    <div className="flex flex-wrap gap-1 pt-1.5">
                                                        {(cond.risk_factors || cond.factors)?.map((rf: string, i: number) => (
                                                            <span key={i} className="text-[9px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/20 px-1.5 py-0.5 rounded">
                                                                ⚠ {rf}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Recommendations & Match Booking */}
                                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
                                        <h4 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                                            <HeartPulse className="w-5 h-5 text-emerald-500" />
                                            Specialist Routing & Recommendation
                                        </h4>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                                            <div className="md:col-span-2 space-y-3">
                                                <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5">
                                                    <span className="font-bold text-slate-800 dark:text-slate-200 block">Suggested Clinical Next Steps:</span>
                                                    {assessmentResult.suggested_next_steps?.map((step: string, idx: number) => (
                                                        <div key={idx} className="flex gap-2 items-start">
                                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                                            <span>{step}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Booking Action Box */}
                                            <div className="md:col-span-1 p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 text-center space-y-3">
                                                <p className="text-[10px] uppercase font-bold text-slate-400">Match Specialization</p>
                                                <p className="text-sm font-black text-slate-800 dark:text-white">
                                                    {assessmentResult.recommended_department}
                                                </p>
                                                <Button
                                                    onClick={() => router.push(`/dashboard/patient/appointments?department=${encodeURIComponent(assessmentResult.recommended_department)}`)}
                                                    className="w-full bg-blue-600 text-white hover:bg-blue-700 text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1 shadow"
                                                >
                                                    Book Clinic Slot <ChevronRight className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center py-24 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-400 text-center">
                                    <HeartPulse className="w-16 h-16 text-slate-200 dark:text-slate-800 mb-4 animate-pulse" />
                                    <p className="font-bold text-slate-800 dark:text-slate-200 text-lg">Awaiting Symptom Input</p>
                                    <p className="text-sm text-slate-400 max-w-sm mt-1 px-4">
                                        Select symptoms on the left panel and click Analyze to receive conditional diagnostics and specialist routing suggestions.
                                    </p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* 2. HEALTH RISK INDEX */}
                {activeTab === 'risk' && (
                    <motion.div
                        key="risk-tab"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Run Panel */}
                            <div className="lg:col-span-1">
                                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
                                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-indigo-600" />
                                        Wellness Risk Profiler
                                    </h3>
                                    
                                    <p className="text-xs text-slate-500 leading-relaxed">
                                        This module reads lifestyle indices, allergy lists, existing comorbidities, and recent diagnostic vitals recorded in your Electronic Medical Record (EMR) to evaluate chronic health risks.
                                    </p>

                                    <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
                                        <div className="flex justify-between">
                                            <span>Primary Profile:</span>
                                            <span className="font-bold text-slate-800 dark:text-slate-200">{user?.name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Age & Gender:</span>
                                            <span className="font-bold text-slate-800 dark:text-slate-200">{user?.age || '35'} yrs • {user?.gender || 'Male'}</span>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={handleCalculateHealthScore}
                                        disabled={calculatingRisk}
                                        className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                                    >
                                        {calculatingRisk ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Running Analysis...
                                            </>
                                        ) : (
                                            <>
                                                <RefreshCw className="w-4 h-4" />
                                                Analyze EMR Vitals & Risks
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>

                            {/* Scoring Output Panel */}
                            <div className="lg:col-span-2">
                                {healthScoreResult ? (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="space-y-6"
                                    >
                                        {/* Risk Gauges Grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            {/* Wellness Score Card */}
                                            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col items-center justify-between text-center relative overflow-hidden">
                                                <h4 className="font-bold text-slate-400 text-xs uppercase tracking-wider">Overall Wellness Index</h4>
                                                
                                                <div className="relative my-4 flex items-center justify-center">
                                                    <svg className="w-28 h-28 transform -rotate-90">
                                                        <circle cx="56" cy="56" r="48" className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="8" fill="transparent" />
                                                        <circle cx="56" cy="56" r="48" className="stroke-emerald-500" strokeWidth="8" fill="transparent" 
                                                            strokeDasharray={301.6} 
                                                            strokeDashoffset={301.6 - (301.6 * (healthScoreResult.wellness_score || 80)) / 100}
                                                        />
                                                    </svg>
                                                    <span className="absolute text-2xl font-black text-slate-800 dark:text-white">
                                                        {healthScoreResult.wellness_score}/100
                                                    </span>
                                                </div>

                                                <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 font-extrabold border-0">
                                                    Excellent Baseline
                                                </Badge>
                                            </div>

                                            {/* Cardiovascular Risk Card */}
                                            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col items-center justify-between text-center relative overflow-hidden">
                                                <h4 className="font-bold text-slate-400 text-xs uppercase tracking-wider">Cardiovascular Risk</h4>
                                                
                                                <div className="relative my-4 flex items-center justify-center">
                                                    <svg className="w-28 h-28 transform -rotate-90">
                                                        <circle cx="56" cy="56" r="48" className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="8" fill="transparent" />
                                                        <circle cx="56" cy="56" r="48" className="stroke-rose-500" strokeWidth="8" fill="transparent" 
                                                            strokeDasharray={301.6} 
                                                            strokeDashoffset={301.6 - (301.6 * (healthScoreResult.cardiovascular_risk || 12)) / 100}
                                                        />
                                                    </svg>
                                                    <span className="absolute text-2xl font-black text-slate-800 dark:text-white">
                                                        {healthScoreResult.cardiovascular_risk}%
                                                    </span>
                                                </div>

                                                <Badge className={`border-0 font-extrabold ${
                                                    (healthScoreResult.cardiovascular_risk || 12) > 20 
                                                        ? 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300' 
                                                        : 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300'
                                                }`}>
                                                    {(healthScoreResult.cardiovascular_risk || 12) > 20 ? 'Elevated Risk' : 'Normal Range'}
                                                </Badge>
                                            </div>

                                            {/* Diabetes Risk Card */}
                                            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col items-center justify-between text-center relative overflow-hidden">
                                                <h4 className="font-bold text-slate-400 text-xs uppercase tracking-wider">Diabetes (Type-2) Risk</h4>
                                                
                                                <div className="relative my-4 flex items-center justify-center">
                                                    <svg className="w-28 h-28 transform -rotate-90">
                                                        <circle cx="56" cy="56" r="48" className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="8" fill="transparent" />
                                                        <circle cx="56" cy="56" r="48" className="stroke-amber-500" strokeWidth="8" fill="transparent" 
                                                            strokeDasharray={301.6} 
                                                            strokeDashoffset={301.6 - (301.6 * (healthScoreResult.diabetes_risk || 15)) / 100}
                                                        />
                                                    </svg>
                                                    <span className="absolute text-2xl font-black text-slate-800 dark:text-white">
                                                        {healthScoreResult.diabetes_risk}%
                                                    </span>
                                                </div>

                                                <Badge className={`border-0 font-extrabold ${
                                                    (healthScoreResult.diabetes_risk || 15) > 25
                                                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                                                        : 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300'
                                                }`}>
                                                    {(healthScoreResult.diabetes_risk || 15) > 25 ? 'Moderate Risk' : 'Low Baseline'}
                                                </Badge>
                                            </div>
                                        </div>

                                        {/* Recommendations & Factors */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Influencing Profile Factors */}
                                            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
                                                <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                                    <Activity className="w-4 h-4 text-blue-600" />
                                                    Key Risk Factors Found
                                                </h4>
                                                <div className="space-y-2">
                                                    {healthScoreResult.factors?.map((f: string, i: number) => (
                                                        <div key={i} className="flex gap-2 items-start text-xs text-slate-600 dark:text-slate-400">
                                                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5 shrink-0" />
                                                            <span>{f}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Actionable Wellness Plan */}
                                            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
                                                <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                                    <Heart className="w-4 h-4 text-rose-500" />
                                                    Wellness Plan Recommendations
                                                </h4>
                                                <div className="space-y-2">
                                                    {healthScoreResult.recommendations?.map((rec: string, i: number) => (
                                                        <div key={i} className="flex gap-2 items-start text-xs text-slate-600 dark:text-slate-400">
                                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                                            <span>{rec}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center py-24 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-400 text-center">
                                        <TrendingUp className="w-16 h-16 text-slate-200 dark:text-slate-800 mb-4" />
                                        <p className="font-bold text-slate-800 dark:text-slate-200 text-lg">No Vitals Score Computed Yet</p>
                                        <p className="text-sm text-slate-400 max-w-sm mt-1 px-4">
                                            Run the wellness profiler to analyze chronic risks using blood pressure logs, SPO2 readings, weight indices, and comorbidities.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* 3. ASSESSMENT LOG / HISTORY */}
                {activeTab === 'history' && (
                    <motion.div
                        key="history-tab"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                    >
                        {/* History list column */}
                        <div className="lg:col-span-1 space-y-6">
                            {/* Symptom assessments logs */}
                            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
                                <h3 className="font-bold text-slate-900 dark:text-white text-base">Past Symptom Checks</h3>
                                {pastAssessments.length === 0 ? (
                                    <p className="text-xs text-slate-400 italic">No past evaluations logged.</p>
                                ) : (
                                    <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                                        {pastAssessments.map((item) => (
                                            <div 
                                                key={item._id}
                                                onClick={() => setSelectedHistoryItem({ type: 'symptom', data: item })}
                                                className={`p-3 rounded-2xl border text-xs cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                                                    selectedHistoryItem?.data?._id === item._id 
                                                        ? 'bg-blue-50/50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-900/30' 
                                                        : 'border-slate-100 dark:border-slate-800'
                                                }`}
                                            >
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="font-bold text-slate-800 dark:text-slate-200">
                                                        {item.symptoms?.slice(0, 3).join(', ')}...
                                                    </span>
                                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                                                        item.triage_level?.toLowerCase() === 'critical' || item.triage_level?.toLowerCase() === 'emergency'
                                                            ? 'bg-red-500 text-white'
                                                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                                    }`}>
                                                        {item.triage_level}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                                                    <span>{item.recommended_department}</span>
                                                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Health Scores logs */}
                            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
                                <h3 className="font-bold text-slate-900 dark:text-white text-base">Past Wellness Scores</h3>
                                {pastScores.length === 0 ? (
                                    <p className="text-xs text-slate-400 italic">No past wellness indexes calculated.</p>
                                ) : (
                                    <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                                        {pastScores.map((item) => (
                                            <div 
                                                key={item._id}
                                                onClick={() => setSelectedHistoryItem({ type: 'score', data: item })}
                                                className={`p-3 rounded-2xl border text-xs cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                                                    selectedHistoryItem?.data?._id === item._id 
                                                        ? 'bg-indigo-50/50 border-indigo-200 dark:bg-indigo-900/10 dark:border-indigo-900/30' 
                                                        : 'border-slate-100 dark:border-slate-800'
                                                }`}
                                            >
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="font-bold text-slate-800 dark:text-slate-200">
                                                        Wellness Index
                                                    </span>
                                                    <span className="text-emerald-500 font-black">
                                                        {item.wellness_score}/100
                                                    </span>
                                                </div>
                                                <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                                                    <span>Cardio Risk: {item.cardiovascular_risk}%</span>
                                                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* History Detail view column */}
                        <div className="lg:col-span-2">
                            {selectedHistoryItem ? (
                                <motion.div
                                    key={selectedHistoryItem.data._id}
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6"
                                >
                                    <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-4">
                                        <div>
                                            <h3 className="text-lg font-black text-slate-900 dark:text-white">
                                                {selectedHistoryItem.type === 'symptom' 
                                                    ? 'Historical Symptom Evaluation' 
                                                    : 'Historical Health Risk Index'}
                                            </h3>
                                            <p className="text-xs text-slate-400 mt-1">
                                                Analysis Date: {new Date(selectedHistoryItem.data.createdAt).toLocaleString()}
                                            </p>
                                        </div>
                                        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 font-extrabold border-0">
                                            {selectedHistoryItem.type === 'symptom' ? 'Symptom Checker' : 'Wellness Index'}
                                        </Badge>
                                    </div>

                                    {/* 3a. Symptom History View */}
                                    {selectedHistoryItem.type === 'symptom' && (
                                        <div className="space-y-6">
                                            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl">
                                                <div>
                                                    <span className="text-slate-400 font-bold uppercase tracking-wider block mb-1">Symptoms Evaluated</span>
                                                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                                                        {selectedHistoryItem.data.symptoms?.join(', ')}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-slate-400 font-bold uppercase tracking-wider block mb-1">Recommended Department</span>
                                                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                                                        {selectedHistoryItem.data.recommended_department}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Analysis & Condition Matching</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {selectedHistoryItem.data.potential_conditions?.map((cond: any, idx: number) => (
                                                        <div key={idx} className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 text-xs space-y-1.5">
                                                            <div className="flex justify-between items-center font-bold">
                                                                <span className="text-slate-800 dark:text-slate-200">{cond.condition || cond.condition_name}</span>
                                                                <span className="text-blue-600">{cond.probability > 1 ? cond.probability : Math.round(cond.probability * 100)}%</span>
                                                            </div>
                                                            <p className="text-slate-400 leading-relaxed">{cond.details || cond.explanation}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Clinical Guidance Next Steps</h4>
                                                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                                                    {selectedHistoryItem.data.suggested_next_steps?.map((step: string, idx: number) => (
                                                        <div key={idx} className="flex gap-2 items-start text-xs text-slate-600 dark:text-slate-400">
                                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                                            <span>{step}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <Button
                                                onClick={() => router.push(`/dashboard/patient/appointments?department=${encodeURIComponent(selectedHistoryItem.data.recommended_department)}`)}
                                                className="w-full bg-blue-600 text-white hover:bg-blue-700 font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5"
                                            >
                                                Book OPD Slot in {selectedHistoryItem.data.recommended_department} <ChevronRight className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    )}

                                    {/* 3b. Score History View */}
                                    {selectedHistoryItem.type === 'score' && (
                                        <div className="space-y-6">
                                            <div className="grid grid-cols-3 gap-4 text-center">
                                                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Wellness Index</p>
                                                    <p className="text-2xl font-black text-emerald-500 mt-1">{selectedHistoryItem.data.wellness_score}</p>
                                                </div>
                                                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Cardio Risk</p>
                                                    <p className="text-2xl font-black text-rose-500 mt-1">{selectedHistoryItem.data.cardiovascular_risk}%</p>
                                                </div>
                                                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Diabetes Risk</p>
                                                    <p className="text-2xl font-black text-amber-500 mt-1">{selectedHistoryItem.data.diabetes_risk}%</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contributing Risk Metrics</h4>
                                                    <div className="space-y-2">
                                                        {selectedHistoryItem.data.factors?.map((f: string, idx: number) => (
                                                            <div key={idx} className="flex gap-2 items-start text-xs text-slate-600 dark:text-slate-400">
                                                                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5 shrink-0" />
                                                                <span>{f}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Personalized Chronic Disease Recommendations</h4>
                                                    <div className="space-y-2">
                                                        {selectedHistoryItem.data.recommendations?.map((rec: string, idx: number) => (
                                                            <div key={idx} className="flex gap-2 items-start text-xs text-slate-600 dark:text-slate-400">
                                                                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                                                <span>{rec}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center py-24 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-400 text-center">
                                    <Eye className="w-16 h-16 text-slate-200 dark:text-slate-800 mb-4" />
                                    <p className="font-bold text-slate-800 dark:text-slate-200 text-lg">No Log Selection</p>
                                    <p className="text-sm text-slate-400 max-w-sm mt-1 px-4">
                                        Select any historical symptom check or health score on the left panel to review its detailed differential diagnostics and recommendations.
                                    </p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </DashboardLayout>
    );
}

// Active: 2026-07-04

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
