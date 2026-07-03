"use client";
import React from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface AuthShellProps {
    children: React.ReactNode;
    heading: string;
    subheading: string;
    role: string;
}

export default function AuthShell({ children, heading, subheading, role }: AuthShellProps) {
    const bgGradients: Record<string, string> = {
        patient: "from-emerald-500/20 to-teal-600/20",
        doctor: "from-blue-600/20 to-indigo-600/20",
        admin: "from-slate-700/20 to-slate-900/20",
        lab: "from-indigo-500/20 to-purple-600/20",
        driver: "from-amber-500/20 to-orange-600/20",
        pharmacy: "from-pink-500/20 to-rose-600/20",
        reception: "from-cyan-500/20 to-sky-600/20",
    };

    const accentColors: Record<string, string> = {
        patient: "text-emerald-600 dark:text-emerald-400",
        doctor: "text-blue-600 dark:text-blue-400",
        admin: "text-slate-600 dark:text-slate-400",
        lab: "text-indigo-600 dark:text-indigo-400",
        driver: "text-amber-600 dark:text-amber-400",
        pharmacy: "text-pink-600 dark:text-pink-400",
        reception: "text-cyan-600 dark:text-cyan-400",
    };

    const currentBg = bgGradients[role] || "from-blue-600/20 to-indigo-600/20";
    const currentAccent = accentColors[role] || "text-blue-600 dark:text-blue-400";

    return (
        <div className={`min-h-screen w-full flex bg-gradient-to-br ${currentBg} dark:from-slate-950 dark:to-slate-900`}>
            {/* Left Panel - Image/Brand */}
            <div className="hidden lg:flex w-1/2 items-center justify-center p-12 relative overflow-hidden">
                <div className="absolute inset-0 bg-white/40 dark:bg-black/20 backdrop-blur-3xl z-0" />
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                    className="relative z-10 max-w-lg"
                >
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">ArogyaMitra</h1>
                        <p className="text-xl text-slate-600 dark:text-slate-300">
                            Transforming Public Healthcare with AI-Driven Efficiency.
                        </p>
                    </div>
                    <div className="grid gap-4">
                        <div className="p-4 bg-white/60 dark:bg-slate-800/60 rounded-xl backdrop-blur-sm border border-white/50 dark:border-slate-700">
                            <h3 className="font-semibold text-slate-800 dark:text-slate-200">Secure Access</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Encrypted ABHA & Staff Authorization</p>
                        </div>
                        <div className="p-4 bg-white/60 dark:bg-slate-800/60 rounded-xl backdrop-blur-sm border border-white/50 dark:border-slate-700">
                            <h3 className="font-semibold text-slate-800 dark:text-slate-200">Real-Time Sync</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Live queue updates across all devices</p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Right Panel - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-12 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl">
                <div className="w-full max-w-md space-y-8">
                    <Link
                        href="/auth/select"
                        className="inline-flex items-center text-sm text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Portal Selection
                    </Link>

                    <div className="text-center lg:text-left">
                        <h2 className={`text-3xl font-bold tracking-tight ${currentAccent}`}>
                            {heading}
                        </h2>
                        <p className="mt-2 text-slate-600 dark:text-slate-400">
                            {subheading}
                        </p>
                    </div>

                    <div className="mt-8">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
