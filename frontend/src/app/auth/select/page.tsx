"use client";
import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { User, Stethoscope, Building2 } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';

export default function SelectPortal() {
    const portals = [
        {
            id: 'patient',
            title: 'Patient Portal',
            desc: 'Book Appointments, Queue Tracking & ABHA',
            icon: <User className="w-8 h-8" />,
            color: 'from-emerald-500 to-teal-600',
            href: '/auth/patient/login'
        },
        {
            id: 'doctor',
            title: 'Doctor Station',
            desc: 'OPD Management & Patient History',
            icon: <Stethoscope className="w-8 h-8" />,
            color: 'from-blue-600 to-indigo-600',
            href: '/auth/doctor/login'
        },
        {
            id: 'admin',
            title: 'Admin HQ',
            desc: 'Hospital Stats & Staff Control',
            icon: <Building2 className="w-8 h-8" />,
            color: 'from-slate-700 to-slate-900',
            href: '/auth/admin/login'
        }
    ];

    return (
        <main className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />

            <div className="text-center mb-12 relative z-10">
                <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Choose Your Access Portal</h1>
                <p className="text-slate-600 dark:text-slate-400">Secure entry for Patients, Doctors, and Administrators</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full relative z-10">
                {portals.map((portal, i) => (
                    <Link key={portal.id} href={portal.href} className="flex-1 min-h-[250px] flex">
                        <GlassCard delay={i * 0.1} className="w-full flex flex-col items-center justify-center text-center p-8 hover:bg-white/20 dark:bg-white/5 dark:hover:bg-white/10 group">
                            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${portal.color} flex items-center justify-center text-white mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                                {portal.icon}
                            </div>
                            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">{portal.title}</h3>
                            <p className="text-slate-500 dark:text-slate-400">{portal.desc}</p>
                        </GlassCard>
                    </Link>
                ))}
            </div>
        </main>
    );
}
