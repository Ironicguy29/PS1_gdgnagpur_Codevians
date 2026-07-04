'use client';
import { useState } from 'react';
import DashboardLayout from "@/components/layout/DashboardLayout";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, UserPlus, QrCode, CreditCard, ChevronRight } from "lucide-react";

export default function ReceptionDashboard() {
    const [searchQuery, setSearchQuery] = useState("");

    return (
        <DashboardLayout role="reception">
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                        Registration Desk 🖥️
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">Patient onboarding and token generation.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Quick Actions */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Search Patient */}
                    <GlassCard className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Find Patient</h2>
                        <div className="flex gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                                <Input
                                    placeholder="Search by ABHA ID, Name or Mobile"
                                    className="pl-10 h-12 text-lg bg-slate-50 border-slate-200 dark:bg-slate-950 dark:border-slate-800"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <Button className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                                Search
                            </Button>
                        </div>

                        <div className="mt-8 flex gap-4">
                            <Button variant="outline" className="flex-1 h-32 flex flex-col gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 border-dashed border-2">
                                <QrCode className="w-8 h-8 text-slate-400" />
                                <span className="font-semibold text-slate-600 dark:text-slate-300">Scan ABHA QR</span>
                            </Button>
                            <Button variant="outline" className="flex-1 h-32 flex flex-col gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 border-dashed border-2">
                                <CreditCard className="w-8 h-8 text-slate-400" />
                                <span className="font-semibold text-slate-600 dark:text-slate-300">Read Insurance Card</span>
                            </Button>
                        </div>
                    </GlassCard>

                    {/* Pending Registrations */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6">
                        <h3 className="font-semibold text-slate-800 dark:text-white mb-4">Recent Registrations</h3>
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                                            {i === 1 ? 'RK' : i === 2 ? 'SD' : 'AJ'}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-700 dark:text-slate-200">Rahul Kumar</p>
                                            <p className="text-xs text-slate-500">ABHA: 91-8928-1111</p>
                                        </div>
                                    </div>
                                    <Button size="sm" variant="ghost" className="text-slate-400 group-hover:text-blue-600">
                                        View <ChevronRight className="w-4 h-4 ml-1" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right: New Registration */}
                <GlassCard className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-8 h-full flex flex-col justify-between">
                    <div>
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-6 backdrop-blur-md">
                            <UserPlus className="w-6 h-6 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">New Registration</h2>
                        <p className="text-emerald-100 mb-8">Register a patient without ABHA ID manually.</p>

                        <div className="space-y-4">
                            <Input placeholder="Full Name" className="bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:ring-emerald-400" />
                            <Input placeholder="Mobile Number" className="bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:ring-emerald-400" />
                            <div className="grid grid-cols-2 gap-4">
                                <Input placeholder="Age" className="bg-white/10 border-white/20 text-white placeholder:text-white/60" />
                                <Input placeholder="Gender" className="bg-white/10 border-white/20 text-white placeholder:text-white/60" />
                            </div>
                        </div>
                    </div>

                    <Button className="w-full mt-8 bg-white text-teal-700 hover:bg-emerald-50 font-bold h-12 shadow-xl border-none">
                        Create Profile
                    </Button>
                </GlassCard>
            </div>
        </DashboardLayout>
    );
}

// Active: 2026-07-04

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
