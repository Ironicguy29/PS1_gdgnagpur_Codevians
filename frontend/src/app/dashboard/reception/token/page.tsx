'use client';
import { useState } from 'react';
import DashboardLayout from "@/components/layout/DashboardLayout";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Ticket, Users, Stethoscope, Clock, CheckCircle } from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";

export default function TokenGenerationPage() {
    const { toast } = useToast();
    const [step, setStep] = useState(1);
    const [selectedDepartment, setSelectedDepartment] = useState("");

    // Mock Data
    const DEPARTMENTS = [
        { id: "cardio", name: "Cardiology", queue: 12, wait: "45m" },
        { id: "ortho", name: "Orthopedics", queue: 5, wait: "15m" },
        { id: "general", name: "General Medicine", queue: 25, wait: "1h 10m" },
        { id: "pediatrics", name: "Pediatrics", queue: 8, wait: "20m" },
    ];

    const handleGenerate = () => {
        setStep(3); // Success state
        toast("Token #105 Generated Successfully", "success");
    };

    return (
        <DashboardLayout role="reception">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                    Generate OPD Token 🎟️
                </h1>
                <p className="text-slate-500 dark:text-slate-400">Assign patients to departments.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
                {/* Left Panel: Form */}
                <GlassCard className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8">
                    {step === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-left-4">
                            <div className="space-y-2">
                                <Label>Patient Identifier</Label>
                                <div className="flex gap-2">
                                    <Input placeholder="Enter ABHA ID or Mobile" defaultValue="9876543210" />
                                    <Button onClick={() => setStep(2)}>Verify</Button>
                                </div>
                            </div>

                            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 opacity-50 pointer-events-none">
                                <div className="h-4 w-1/3 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
                                <div className="h-3 w-1/2 bg-slate-100 dark:bg-slate-800 rounded" />
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <div className="flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center font-bold text-blue-600 dark:text-blue-200">
                                    RK
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 dark:text-white">Rahul Kumar</h3>
                                    <p className="text-sm text-slate-500">Male, 34 Years</p>
                                </div>
                                <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setStep(1)}>Change</Button>
                            </div>

                            <div className="space-y-3">
                                <Label>Select Department</Label>
                                <div className="grid grid-cols-1 gap-3">
                                    {DEPARTMENTS.map((dept) => (
                                        <div
                                            key={dept.id}
                                            onClick={() => setSelectedDepartment(dept.id)}
                                            className={`p-4 rounded-xl border cursor-pointer transition-all flex justify-between items-center ${selectedDepartment === dept.id
                                                    ? 'bg-blue-600 text-white border-blue-600 shadow-lg'
                                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Stethoscope className="w-5 h-5" />
                                                <span className="font-medium">{dept.name}</span>
                                            </div>
                                            <div className={`text-xs flex items-center gap-3 ${selectedDepartment === dept.id ? 'text-blue-100' : 'text-slate-500'}`}>
                                                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {dept.queue}</span>
                                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {dept.wait}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <Button onClick={handleGenerate} disabled={!selectedDepartment} className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 dark:shadow-none">
                                Generate Token <Ticket className="w-5 h-5 ml-2" />
                            </Button>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="text-center py-8 animate-in zoom-in duration-300">
                            <div className="mx-auto w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
                                <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Token Generated!</h2>
                            <p className="text-slate-500 mb-8">Token sent to patient via SMS.</p>
                            <Button onClick={() => { setStep(1); setSelectedDepartment(""); }} variant="outline">
                                Process Next Patient
                            </Button>
                        </div>
                    )}
                </GlassCard>

                {/* Right Panel: Preview */}
                <div className="hidden lg:flex items-center justify-center">
                    <div className={`w-80 bg-white dark:bg-slate-900 rounded-3xl p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 transition-all duration-500 ${step === 3 ? 'scale-110 rotate-0 border-solid border-blue-500 shadow-2xl' : 'rotate-2 scale-95 opacity-50'}`}>
                        <div className="text-center border-b border-slate-100 dark:border-slate-800 pb-6 mb-6">
                            <h3 className="font-bold text-xl text-slate-800 dark:text-white uppercase tracking-widest">ArogyaMitra</h3>
                            <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">OPD Token</p>
                        </div>
                        <div className="text-center space-y-2 mb-8">
                            <h1 className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter">105</h1>
                            <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">General Medicine</Badge>
                        </div>
                        <div className="space-y-4 text-sm text-slate-500">
                            <div className="flex justify-between">
                                <span>Date</span>
                                <span className="font-bold text-slate-700 dark:text-slate-300">Oct 24, 2024</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Est. Time</span>
                                <span className="font-bold text-slate-700 dark:text-slate-300">11:30 AM</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
