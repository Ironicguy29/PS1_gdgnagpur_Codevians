'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  User, Stethoscope, Building2, ArrowRight, Loader2,
  Clock, Siren, Users, MessageSquare, Bell, CalendarCheck,
  Activity, ShieldCheck, Cpu
} from 'lucide-react';
import api, { setAuthToken } from "@/lib/api";

type PortalType = 'patient' | 'doctor' | 'admin';

export default function Home() {
  const router = useRouter();
  const [activePortal, setActivePortal] = useState<PortalType>('patient');
  const [formData, setFormData] = useState({ identifier: '', password: '', name: '', phone: '' });
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const features = [
    { title: "Smart Registration", desc: "ABHA-integrated rapid patient onboarding.", icon: <ShieldCheck className="w-6 h-6 text-emerald-500" /> },
    { title: "Dynamic Queues", desc: "AI predicts wait times & optimizes flow.", icon: <Activity className="w-6 h-6 text-blue-500" /> },
    { title: "Emergency Triage", desc: "Priority routing for critical cases.", icon: <Siren className="w-6 h-6 text-red-500" /> },
    { title: "Doctor Availability", desc: "Real-time tracking of OPD staff.", icon: <Stethoscope className="w-6 h-6 text-indigo-500" /> },
    { title: "Smart Scheduling", desc: "Slot allocation & appointment booking.", icon: <CalendarCheck className="w-6 h-6 text-orange-500" /> },
    { title: "Digital Tokens", desc: "Paperless token generation via SMS.", icon: <Cpu className="w-6 h-6 text-purple-500" /> },
    { title: "Crowd Monitor", desc: "AI-based density analysis & alerts.", icon: <Users className="w-6 h-6 text-cyan-500" /> },
    { title: "Multilingual AI", desc: "Voice/Chat support in native languages.", icon: <MessageSquare className="w-6 h-6 text-pink-500" /> },
    { title: "Instant Alerts", desc: "SMS/WhatsApp notifications for updates.", icon: <Bell className="w-6 h-6 text-yellow-500" /> },
    { title: "Admin Insights", desc: "Centralized hospital performance stats.", icon: <Building2 className="w-6 h-6 text-slate-500" /> },
  ];

  const portalConfig = {
    patient: {
      title: "Patient Portal",
      desc: "Book & Track Appointments",
      icon: <User className="w-6 h-6" />,
      color: "from-emerald-500 to-teal-600"
    },
    doctor: {
      title: "Doctor Station",
      desc: "Manage OPD & Patients",
      icon: <Stethoscope className="w-6 h-6" />,
      color: "from-blue-600 to-indigo-600"
    },
    admin: {
      title: "Admin HQ",
      desc: "Hospital Controls",
      icon: <Building2 className="w-6 h-6" />,
      color: "from-slate-700 to-slate-900"
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = isLogin
        ? { [activePortal === 'patient' ? 'abha_id' : 'email']: formData.identifier, password: formData.password }
        : { ...formData, role: activePortal };

      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const { data } = await api.post(endpoint, payload);

      if (data.token) {
        setAuthToken(data.token);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        router.push(`/dashboard/${activePortal}`);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full bg-[#f8fafc] overflow-x-hidden scroll-smooth">
      {/* 1. Hero Section */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center p-4 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-50 via-white to-teal-50 -z-10" />
        <div className="absolute top-20 right-20 w-96 h-96 bg-blue-200/20 rounded-full blur-[100px]" />

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl mx-auto z-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100/50 border border-blue-200 text-blue-700 text-sm font-semibold mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Live in 50+ Government Hospitals
          </div>
          <h1 className="text-6xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6">
            Healthcare <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-500">Reimagined.</span>
          </h1>
          <p className="text-xl text-slate-600 font-light mb-10 max-w-2xl mx-auto">
            Zero Wait Time. AI-Powered Triage. Smart Queues.
            <br className="hidden md:block" />
            Join the revolution in public healthcare efficiency.
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              size="lg"
              className="rounded-full px-8 h-12 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 transition-all hover:scale-105"
              onClick={() => router.push('/auth/select')}
            >
              Get Your Token <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="rounded-full px-8 h-12 border-slate-300 text-slate-600 hover:bg-slate-50 transition-all"
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Explore Features
            </Button>
          </div>
        </motion.div>
      </section>

      {/* 2. Problem vs Solution */}
      <section className="py-24 px-4 bg-white relative">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="p-8 rounded-3xl bg-red-50 border border-red-100"
          >
            <h3 className="text-2xl font-bold text-red-800 mb-4 flex items-center gap-2">
              <Clock className="w-6 h-6" /> The Old Way
            </h3>
            <ul className="space-y-4 text-red-700/80">
              <li className="flex gap-2">❌ Manual queuing for 4-6 hours</li>
              <li className="flex gap-2">❌ Unpredictable doctor availability</li>
              <li className="flex gap-2">❌ Chaos during emergency cases</li>
            </ul>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="p-8 rounded-3xl bg-emerald-50 border border-emerald-100 shadow-xl"
          >
            <h3 className="text-2xl font-bold text-emerald-800 mb-4 flex items-center gap-2">
              <ShieldCheck className="w-6 h-6" /> The ArogyaMitra Way
            </h3>
            <ul className="space-y-4 text-emerald-700/80">
              <li className="flex gap-2">✅ AI-Predicted Wait Times</li>
              <li className="flex gap-2">✅ Real-time Doctor Tracking</li>
              <li className="flex gap-2">✅ Automated Priority Triage</li>
            </ul>
          </motion.div>
        </div>
      </section>

      {/* 3. Feature Showcase */}
      <section id="features" className="py-24 px-4 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-800 mb-4">10 Core Modules</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              A comprehensive suite of tools designed to modernize every aspect of hospital management.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feat, i) => (
              <GlassCard key={i} delay={i * 0.05} className="bg-white/40 hover:bg-white/60">
                <div className="mb-4 p-3 bg-white rounded-xl w-fit shadow-sm">{feat.icon}</div>
                <h3 className="font-semibold text-slate-800 mb-2">{feat.title}</h3>
                <p className="text-sm text-slate-500">{feat.desc}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Portal Access */}
      <section id="portals" className="py-24 px-4 bg-gradient-to-b from-white to-blue-50 dark:from-slate-900 dark:to-slate-950">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-2xl mx-auto">
            Secure, role-based access for all stakeholders. Choose your portal to login or register.
          </p>

          <Button
            size="lg"
            className="rounded-full px-12 h-16 text-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-200 dark:shadow-blue-900/20 transition-all hover:scale-105"
            onClick={() => router.push('/auth/select')}
          >
            Enter Portal <ArrowRight className="ml-2 w-6 h-6" />
          </Button>

          <div className="mt-12 grid grid-cols-3 gap-8 opacity-60">
            <div className="text-center">
              <div className="font-bold text-2xl text-slate-800 dark:text-slate-200">2M+</div>
              <div className="text-sm text-slate-500">Patients Served</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-2xl text-slate-800 dark:text-slate-200">50+</div>
              <div className="text-sm text-slate-500">Hospitals</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-2xl text-slate-800 dark:text-slate-200">100%</div>
              <div className="text-sm text-slate-500">Paperless</div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
