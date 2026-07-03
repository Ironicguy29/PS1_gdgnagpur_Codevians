'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import CountUp from 'react-countup';
import {
  Activity, Users, Clock, Siren, Stethoscope, Building2,
  CalendarCheck, Cpu, MessageSquare, Bell, ShieldCheck, HeartHandshake,
  Pill, PhoneCall, ArrowRight, CheckCircle2, ChevronRight, Menu, X, Sun, Moon,
  Sparkles, Check, ArrowUpRight, Bot, Send, ShieldAlert, Navigation
} from 'lucide-react';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

// Mockup Components for Role Switcher
// TODO: replace with real screenshot
const PatientMockup = () => (
  <div className="w-full h-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between font-sans text-left">
    <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-850 pb-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600">
          <Users size={20} aria-hidden="true" />
        </div>
        <div>
          <h4 className="text-[14px] font-medium text-zinc-900 dark:text-zinc-50">Rajesh Kumar</h4>
          <p className="text-[11px] text-zinc-505 dark:text-zinc-400">ABHA: 91-8273-2831-92</p>
        </div>
      </div>
      <span className="text-[11px] font-normal px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-250/30">
        Verified
      </span>
    </div>
    
    <div className="py-6 space-y-4">
      <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 border border-zinc-100 dark:border-zinc-800/80">
        <span className="text-[11px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block font-medium">Current Token</span>
        <div className="flex items-baseline justify-between mt-1">
          <span className="text-3xl font-medium text-zinc-900 dark:text-zinc-50">#A-402</span>
          <span className="text-[13px] font-normal text-emerald-600 dark:text-emerald-500">OPD Cardiology</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="border border-zinc-100 dark:border-zinc-800 rounded-xl p-3 bg-zinc-50/50 dark:bg-zinc-900/50">
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block">Queue Position</span>
          <span className="text-lg font-medium text-zinc-900 dark:text-zinc-50 mt-1 block">3rd</span>
        </div>
        <div className="border border-zinc-100 dark:border-zinc-800 rounded-xl p-3 bg-zinc-50/50 dark:bg-zinc-900/50">
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block">Estimated Wait</span>
          <span className="text-lg font-medium text-zinc-900 dark:text-zinc-50 mt-1 block">14 mins</span>
        </div>
      </div>
    </div>

    <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 flex items-center justify-between">
      <span className="text-[11px] text-zinc-500 dark:text-zinc-400">AI Recommendation: Proceed to Desk 4</span>
      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
    </div>
  </div>
);

// TODO: replace with real screenshot
const DoctorMockup = () => (
  <div className="w-full h-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between font-sans text-left">
    <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-850 pb-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600">
          <Stethoscope size={20} aria-hidden="true" />
        </div>
        <div>
          <h4 className="text-[14px] font-medium text-zinc-900 dark:text-zinc-50">Dr. Anjali Mehta</h4>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Cardiology Specialist</p>
        </div>
      </div>
      <span className="text-[11px] font-normal px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-250/30 flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Online
      </span>
    </div>

    <div className="py-5 space-y-3.5">
      <div className="flex items-center justify-between p-3 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
        <div>
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block">Next Patient</span>
          <span className="text-[13px] font-medium text-zinc-900 dark:text-zinc-50">Aarav Sharma</span>
        </div>
        <span className="text-[11px] text-zinc-500 block font-mono">Token #A-403</span>
      </div>

      <div className="border border-zinc-100 dark:border-zinc-800 rounded-xl p-4 space-y-2">
        <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium block">Digital Prescription Assistant</span>
        <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div className="w-3/4 h-full bg-emerald-600"></div>
        </div>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">ABHA records fetched successfully. Smart suggestions available.</p>
      </div>
    </div>

    <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 flex justify-between items-center text-[11px] text-zinc-500">
      <span>Completed Sessions: 12 today</span>
      <button className="text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-0.5">
        View Schedule <ChevronRight size={12} />
      </button>
    </div>
  </div>
);

// TODO: replace with real screenshot
const AdminMockup = () => (
  <div className="w-full h-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between font-sans text-left">
    <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-850 pb-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600">
          <Building2 size={20} aria-hidden="true" />
        </div>
        <div>
          <h4 className="text-[14px] font-medium text-zinc-900 dark:text-zinc-50">Command Desk</h4>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Nagpur General HQ</p>
        </div>
      </div>
      <span className="text-[11px] font-normal px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-250/30">
        Emergency Mode
      </span>
    </div>

    <div className="py-4 space-y-3.5">
      <div className="grid grid-cols-2 gap-3">
        <div className="border border-zinc-150 dark:border-zinc-800 rounded-xl p-3 bg-zinc-50/50 dark:bg-zinc-900/50">
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block">ICU Beds Ready</span>
          <span className="text-xl font-medium text-zinc-900 dark:text-zinc-50 mt-0.5 block">14 / 20</span>
        </div>
        <div className="border border-zinc-150 dark:border-zinc-800 rounded-xl p-3 bg-zinc-50/50 dark:bg-zinc-900/50">
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block">General Occupancy</span>
          <span className="text-xl font-medium text-zinc-900 dark:text-zinc-50 mt-0.5 block">92%</span>
        </div>
      </div>

      <div className="p-3 bg-rose-50/30 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/40 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Siren size={16} className="text-rose-600 dark:text-rose-500 animate-pulse" />
          <span className="text-[11px] font-medium text-zinc-900 dark:text-zinc-50">Critical Dispatch #02</span>
        </div>
        <span className="text-[11px] text-rose-600 dark:text-rose-400 font-mono">ETA 3m</span>
      </div>
    </div>

    <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 flex justify-between items-center text-[11px] text-zinc-500">
      <span>AI Flow Index: Stable</span>
      <button className="text-emerald-600 hover:text-emerald-700 font-medium">Open Telemetry</button>
    </div>
  </div>
);

// TODO: replace with real screenshot
const AmbulanceMockup = () => (
  <div className="w-full h-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between font-sans text-left">
    <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-850 pb-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600">
          <Siren size={20} aria-hidden="true" />
        </div>
        <div>
          <h4 className="text-[14px] font-medium text-zinc-900 dark:text-zinc-50">Vehicle MH-31-EQ</h4>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Emergency Fleet unit</p>
        </div>
      </div>
      <span className="text-[11px] font-normal px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-250/30 animate-pulse">
        En Route
      </span>
    </div>

    <div className="py-4 space-y-3.5">
      <div className="p-3.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800/80">
        <div className="flex justify-between items-center">
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block font-medium">Destination Desk</span>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-medium">Nagpur General ER</span>
        </div>
        <div className="flex items-baseline justify-between mt-1">
          <span className="text-2xl font-medium text-zinc-900 dark:text-zinc-50">ETA 4.5m</span>
          <span className="text-[13px] font-normal text-zinc-500">Route Optimized</span>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] p-2 bg-rose-50/20 dark:bg-rose-950/10 border border-rose-100/50 dark:border-rose-950/50 rounded-lg">
        <span className="text-zinc-500 dark:text-zinc-400">Patient Vitals Transmission</span>
        <span className="text-rose-600 dark:text-rose-450 font-bold">ECG Connected</span>
      </div>
    </div>

    <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 flex justify-between items-center text-[11px] text-zinc-500">
      <span>Command Link: Secure</span>
      <button className="text-emerald-600 hover:text-emerald-700 font-medium">Re-route GPS</button>
    </div>
  </div>
);

// TODO: replace with real screenshot
const PharmacyMockup = () => (
  <div className="w-full h-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between font-sans text-left">
    <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-850 pb-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600">
          <Pill size={20} aria-hidden="true" />
        </div>
        <div>
          <h4 className="text-[14px] font-medium text-zinc-900 dark:text-zinc-50">Pharmacy Depot 1</h4>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Inventory & Lab Station</p>
        </div>
      </div>
      <span className="text-[11px] font-normal px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-250/30">
        Synced
      </span>
    </div>

    <div className="py-4 space-y-3.5">
      <div className="p-3.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800/80">
        <span className="text-[11px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block font-medium">Active Prescription Dispatch</span>
        <div className="flex justify-between items-baseline mt-1.5">
          <span className="text-lg font-medium text-zinc-900 dark:text-zinc-50">Token #A-402</span>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-200/20 font-mono">Prepared</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-[11px]">
        <div className="border border-zinc-100 dark:border-zinc-800 rounded-lg p-2.5">
          <span className="text-zinc-500 dark:text-zinc-400 block">Pending Orders</span>
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">3 Queueing</span>
        </div>
        <div className="border border-zinc-100 dark:border-zinc-800 rounded-lg p-2.5">
          <span className="text-zinc-500 dark:text-zinc-400 block">Lab Reports</span>
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">8 Uploaded</span>
        </div>
      </div>
    </div>

    <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 flex justify-between items-center text-[11px] text-zinc-500">
      <span>Inventory Alert: None</span>
      <button className="text-emerald-600 hover:text-emerald-700 font-medium">Verify Stock</button>
    </div>
  </div>
);

export default function Home() {
  const router = useRouter();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeRole, setActiveRole] = useState<'patient' | 'doctor' | 'admin' | 'ambulance' | 'pharmacy'>('patient');
  const prefersReducedMotion = useReducedMotion();

  // Floating AI Assistant chat state
  const [aiOpen, setAiOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'bot', text: string }>>([
    { sender: 'bot', text: 'Hi! I am the ArogyaMitra AI Assistant. How can I help you navigate your healthcare journey today?' }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      const scrolled = window.scrollY > 20;
      setIsScrolled(prev => (prev !== scrolled ? scrolled : prev));
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSendMessage = (textToSend?: string) => {
    const query = textToSend || inputVal;
    if (!query.trim()) return;

    const userMessage = { sender: 'user' as const, text: query };
    setMessages(prev => [...prev, userMessage]);
    setInputVal('');
    setIsTyping(true);

    setTimeout(() => {
      let botResponse = 'I can help you navigate. Try asking about "triage registration", "beds availability", or "ambulance tracking".';
      const q = query.toLowerCase();

      if (q.includes('register') || q.includes('token') || q.includes('abha')) {
        botResponse = 'You can register instantly using your ABHA ID. Scroll to the "Seamless Patient Journey" workflow section below to learn how, or click "Get Started" in the navbar to sign up.';
      } else if (q.includes('bed') || q.includes('icu') || q.includes('occupancy')) {
        botResponse = 'Real-time bed availability is synced dynamically on the platform. The Live Stats bar currently monitors available beds across the public health network.';
      } else if (q.includes('ambulance') || q.includes('emergency')) {
        botResponse = 'Emergency dispatch features are integrated directly with live GPS and pre-triage alerts. Switch to the "Ambulance" tab in the Role Switcher to preview the active route interface.';
      }

      setMessages(prev => [...prev, { sender: 'bot', text: botResponse }]);
      setIsTyping(false);
    }, 1200);
  };

  // Stagger configurations for Hero Text animation
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : 0.08,
      },
    },
  };

  const lineVariants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: prefersReducedMotion ? 0 : 0.4, ease: 'easeOut' as const },
    },
  };

  // Intersection hooks for Live Stats counters
  const { ref: liveStatsRef, inView: liveStatsInView } = useInView({
    triggerOnce: true,
    threshold: 0.15,
  });

  return (
    <main className="min-h-screen w-full bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 transition-colors duration-300 font-sans relative overflow-x-hidden">
      
      {/* Skip-to-content Link for Accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-emerald-600 text-white px-4 py-2 rounded-md z-50 text-[13px] font-normal focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
      >
        Skip to content
      </a>

      {/* 1. STICKY NAVBAR */}
      <nav 
        className={`sticky top-0 left-0 w-full z-40 transition-all duration-200 border-b ${
          isScrolled 
            ? 'py-4 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-zinc-200 dark:border-zinc-800 shadow-sm' 
            : 'py-6 bg-transparent border-transparent'
        }`}
      >
        <div className="max-w-[1100px] mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <Link 
            href="/" 
            className="flex items-center gap-2 group focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 rounded-lg"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shadow-md shadow-emerald-600/10">
              <Activity size={20} className="text-white" aria-hidden="true" />
            </div>
            <div>
              <span className="text-[16px] font-medium tracking-tight text-zinc-900 dark:text-zinc-50">
                Arogya<span className="text-emerald-600 font-medium">Mitra</span>
              </span>
              <span className="block text-[13px] font-normal text-zinc-500 dark:text-zinc-400">National Health Grid</span>
            </div>
          </Link>

          {/* Links Center */}
          <div className="hidden md:flex items-center gap-8">
            <a 
              href="#features" 
              className="text-[13px] font-normal text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 rounded-md px-1 py-0.5"
            >
              Features
            </a>
            <a 
              href="#workflow" 
              className="text-[13px] font-normal text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 rounded-md px-1 py-0.5"
            >
              Patient Journey
            </a>
            <a 
              href="#portals" 
              className="text-[13px] font-normal text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 rounded-md px-1 py-0.5"
            >
              Role Portals
            </a>
            <a 
              href="#faq" 
              className="text-[13px] font-normal text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 rounded-md px-1 py-0.5"
            >
              FAQs
            </a>
          </div>

          {/* Actions Right */}
          <div className="flex items-center gap-3">
            {mounted && (
              <button 
                onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-full border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:outline-none" 
                aria-label="Toggle visual theme"
              >
                {resolvedTheme === 'dark' ? (
                  <Sun size={20} className="text-zinc-400 hover:text-zinc-50" />
                ) : (
                  <Moon size={20} className="text-zinc-500 hover:text-zinc-900" />
                )}
              </button>
            )}

            <button
              onClick={() => router.push('/auth/select')}
              className="px-4 py-2 text-[13px] font-normal text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 rounded-full transition-all focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 outline-none"
            >
              Sign In
            </button>
            <button
              onClick={() => router.push('/auth/select')}
              className="px-5 py-2 h-[38px] flex items-center justify-center text-[13px] font-normal bg-emerald-600 text-white rounded-full hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-600/10 active:scale-[0.97] transition-all focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 outline-none"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <section id="main-content" className="py-[120px] md:py-[120px] py-[80px] px-6 relative z-10 bg-white dark:bg-zinc-950 flex flex-col items-center justify-center overflow-hidden">
        <div className="max-w-[1100px] w-full mx-auto flex flex-col items-center text-center">
          
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6 w-full flex flex-col items-center"
          >
            {/* Live Indicator Badge */}
            <motion.div 
              variants={lineVariants}
              className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/40 text-emerald-700 dark:text-emerald-400 text-[13px] font-normal"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              ABHA-Integrated Live Scheduler
            </motion.div>

            {/* Title */}
            <motion.h1 
              variants={lineVariants}
              className="text-4xl md:text-[56px] font-medium tracking-[-0.02em] text-zinc-900 dark:text-white leading-[1.1] max-w-[800px]"
            >
              Healthcare at the <br className="hidden md:inline" /> Speed of Light.
            </motion.h1>

            {/* Subheadline (max 12 words) */}
            <motion.p 
              variants={lineVariants}
              className="text-[16px] font-normal leading-[1.6] text-zinc-500 dark:text-zinc-400 max-w-[500px]"
            >
              AI-powered queue management, triage, and bed tracking for Indian hospitals.
            </motion.p>

            {/* Call to Actions */}
            <motion.div 
              variants={lineVariants}
              className="flex flex-wrap gap-4 pt-4 justify-center"
            >
              <a
                href="#portals"
                className="px-6 h-[48px] inline-flex items-center justify-center text-[13px] font-normal bg-emerald-600 hover:bg-emerald-500 text-white rounded-full shadow-lg shadow-emerald-600/10 active:scale-[0.97] transition-all focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 outline-none"
              >
                Choose Your Portal →
              </a>
              
              <a
                href="#live-stats"
                className="px-6 h-[48px] inline-flex items-center justify-center text-[13px] font-normal border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 rounded-full active:scale-[0.97] transition-all focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 outline-none"
              >
                Explore Live Map
              </a>
            </motion.div>

            {/* Metric Pills below Hero */}
            <motion.div 
              variants={lineVariants}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-12 max-w-[750px] w-full border-t border-zinc-100 dark:border-zinc-900 mt-12"
            >
              <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-150/40 dark:border-zinc-850 rounded-2xl p-4 flex flex-col items-center">
                <span className="text-xl font-medium text-emerald-600 dark:text-emerald-500">50+</span>
                <span className="text-[13px] font-normal text-zinc-500 dark:text-zinc-400 mt-1">Hospitals Connected</span>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-150/40 dark:border-zinc-850 rounded-2xl p-4 flex flex-col items-center">
                <span className="text-xl font-medium text-emerald-600 dark:text-emerald-500">2.4M+</span>
                <span className="text-[13px] font-normal text-zinc-500 dark:text-zinc-400 mt-1">Patients Served</span>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-150/40 dark:border-zinc-850 rounded-2xl p-4 flex flex-col items-center">
                <span className="text-xl font-medium text-emerald-600 dark:text-emerald-500">98%</span>
                <span className="text-[13px] font-normal text-zinc-500 dark:text-zinc-400 mt-1">Queue Accuracy</span>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-150/40 dark:border-zinc-850 rounded-2xl p-4 flex flex-col items-center">
                <span className="text-xl font-medium text-emerald-600 dark:text-emerald-500">24/7</span>
                <span className="text-[13px] font-normal text-zinc-500 dark:text-zinc-400 mt-1">Emergency Dispatch</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 3. ROLE SWITCHER SECTION */}
      <section id="portals" className="py-[120px] md:py-[120px] py-[80px] px-6 border-t border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950">
        <div className="max-w-[1100px] mx-auto space-y-12">
          
          <div className="text-center space-y-3">
            <h2 className="text-[32px] font-medium text-zinc-900 dark:text-white tracking-tight">Access Your Command Hub</h2>
            <p className="text-[16px] font-normal text-zinc-500 dark:text-zinc-400 max-w-[600px] mx-auto leading-[1.6]">
              ArogyaMitra coordinates hospital logistics by dividing interfaces across specialized dashboard gateways.
            </p>
          </div>

          <div className="flex flex-col items-center gap-10">
            {/* Tab Navigation row */}
            <div className="flex flex-wrap justify-center gap-2 p-1.5 bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200/60 dark:border-zinc-800 rounded-full max-w-full overflow-x-auto">
              {[
                { id: 'patient', label: 'Patient' },
                { id: 'doctor', label: 'Doctor' },
                { id: 'admin', label: 'Hospital Admin' },
                { id: 'ambulance', label: 'Ambulance' },
                { id: 'pharmacy', label: 'Pharmacy/Lab' }
              ].map((tab) => {
                const isActive = activeRole === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveRole(tab.id as any)}
                    className="relative px-5 py-2 text-[13px] font-medium rounded-full outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 transition-colors"
                  >
                    {isActive && (
                      <motion.div
                        layoutId="active-tab-indicator"
                        className="absolute inset-0 bg-white dark:bg-zinc-800 border border-zinc-200/50 dark:border-zinc-700/50 rounded-full shadow-sm"
                        transition={prefersReducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 350, damping: 30 }}
                      />
                    )}
                    <span className={`relative z-10 transition-colors ${
                      isActive ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                    }`}>
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* 2-Column switching panel */}
            <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center pt-4">
              
              {/* Feature List Column */}
              <div className="lg:col-span-5 space-y-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeRole}
                    initial={{ opacity: 0, x: prefersReducedMotion ? 0 : -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: prefersReducedMotion ? 0 : 10 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-6"
                  >
                    <div>
                      <span className="text-[13px] font-normal text-emerald-600 dark:text-emerald-500 uppercase tracking-widest block font-mono">Gateway Interface</span>
                      <h3 className="text-2xl font-medium text-zinc-900 dark:text-white capitalize mt-1">
                        {activeRole === 'admin' ? 'Hospital Administration' : `${activeRole} Portal`}
                      </h3>
                    </div>

                    <ul className="space-y-4">
                      {activeRole === 'patient' && (
                        <>
                          <li className="flex items-start gap-3">
                            <span className="mt-1 w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/40">
                              <Check size={12} className="text-emerald-600" />
                            </span>
                            <span className="text-[16px] font-normal leading-[1.6] text-zinc-500 dark:text-zinc-400">
                              Register immediately with a verified Government <strong>ABHA Health ID</strong>.
                            </span>
                          </li>
                          <li className="flex items-start gap-3">
                            <span className="mt-1 w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/40">
                              <Check size={12} className="text-emerald-600" />
                            </span>
                            <span className="text-[16px] font-normal leading-[1.6] text-zinc-500 dark:text-zinc-400">
                              View live queue wait-times and smart counter assignments in real time.
                            </span>
                          </li>
                          <li className="flex items-start gap-3">
                            <span className="mt-1 w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/40">
                              <Check size={12} className="text-emerald-600" />
                            </span>
                            <span className="text-[16px] font-normal leading-[1.6] text-zinc-500 dark:text-zinc-400">
                              Get digital prescription summaries and token receipts sent straight to SMS/WhatsApp.
                            </span>
                          </li>
                        </>
                      )}

                      {activeRole === 'doctor' && (
                        <>
                          <li className="flex items-start gap-3">
                            <span className="mt-1 w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/40">
                              <Check size={12} className="text-emerald-600" />
                            </span>
                            <span className="text-[16px] font-normal leading-[1.6] text-zinc-500 dark:text-zinc-400">
                              Access unified patient clinical summaries and historical consulting timelines instantly.
                            </span>
                          </li>
                          <li className="flex items-start gap-3">
                            <span className="mt-1 w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/40">
                              <Check size={12} className="text-emerald-600" />
                            </span>
                            <span className="text-[16px] font-normal leading-[1.6] text-zinc-500 dark:text-zinc-400">
                              Generate digital prescription slips pre-filled with AI diagnosis suggestions.
                            </span>
                          </li>
                          <li className="flex items-start gap-3">
                            <span className="mt-1 w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/40">
                              <Check size={12} className="text-emerald-600" />
                            </span>
                            <span className="text-[16px] font-normal leading-[1.6] text-zinc-500 dark:text-zinc-400">
                              Track the active clinic queue order, marking consultations done with one-click.
                            </span>
                          </li>
                        </>
                      )}

                      {activeRole === 'admin' && (
                        <>
                          <li className="flex items-start gap-3">
                            <span className="mt-1 w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/40">
                              <Check size={12} className="text-emerald-600" />
                            </span>
                            <span className="text-[16px] font-normal leading-[1.6] text-zinc-500 dark:text-zinc-400">
                              Monitor real-time bed allocations, ICU ventilators, and ward occupancy levels.
                            </span>
                          </li>
                          <li className="flex items-start gap-3">
                            <span className="mt-1 w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/40">
                              <Check size={12} className="text-emerald-600" />
                            </span>
                            <span className="text-[16px] font-normal leading-[1.6] text-zinc-500 dark:text-zinc-400">
                              Manage incoming emergency alerts, pre-triaging units before ambulances land.
                            </span>
                          </li>
                          <li className="flex items-start gap-3">
                            <span className="mt-1 w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/40">
                              <Check size={12} className="text-emerald-600" />
                            </span>
                            <span className="text-[16px] font-normal leading-[1.6] text-zinc-500 dark:text-zinc-400">
                              Export operational statistics and audit records for Ayushman Bharat compliance.
                            </span>
                          </li>
                        </>
                      )}

                      {activeRole === 'ambulance' && (
                        <>
                          <li className="flex items-start gap-3">
                            <span className="mt-1 w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/40">
                              <Check size={12} className="text-emerald-600" />
                            </span>
                            <span className="text-[16px] font-normal leading-[1.6] text-zinc-500 dark:text-zinc-400">
                              Receive immediate traffic-optimized GPS routes to nearby available trauma centers.
                            </span>
                          </li>
                          <li className="flex items-start gap-3">
                            <span className="mt-1 w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/40">
                              <Check size={12} className="text-emerald-600" />
                            </span>
                            <span className="text-[16px] font-normal leading-[1.6] text-zinc-500 dark:text-zinc-400">
                              Transmit critical patient ECG stats directly to triage desks while en route.
                            </span>
                          </li>
                          <li className="flex items-start gap-3">
                            <span className="mt-1 w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/40">
                              <Check size={12} className="text-emerald-600" />
                            </span>
                            <span className="text-[16px] font-normal leading-[1.6] text-zinc-500 dark:text-zinc-400">
                              Update fleet dispatch coordinate logs for state-level emergency tracking.
                            </span>
                          </li>
                        </>
                      )}

                      {activeRole === 'pharmacy' && (
                        <>
                          <li className="flex items-start gap-3">
                            <span className="mt-1 w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/40">
                              <Check size={12} className="text-emerald-600" />
                            </span>
                            <span className="text-[16px] font-normal leading-[1.6] text-zinc-500 dark:text-zinc-400">
                              Pull incoming prescription receipts directly from consultation rooms.
                            </span>
                          </li>
                          <li className="flex items-start gap-3">
                            <span className="mt-1 w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/40">
                              <Check size={12} className="text-emerald-600" />
                            </span>
                            <span className="text-[16px] font-normal leading-[1.6] text-zinc-500 dark:text-zinc-400">
                              Upload diagnostic results and radiology scans directly to secure cloud vaults.
                            </span>
                          </li>
                          <li className="flex items-start gap-3">
                            <span className="mt-1 w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/40">
                              <Check size={12} className="text-emerald-600" />
                            </span>
                            <span className="text-[16px] font-normal leading-[1.6] text-zinc-500 dark:text-zinc-400">
                              Update local medicine stock and essential diagnostics inventory trackers.
                            </span>
                          </li>
                        </>
                      )}
                    </ul>

                    <div className="pt-2">
                      <button
                        onClick={() => router.push(`/auth/${activeRole}/login`)}
                        className="px-6 h-[42px] inline-flex items-center justify-center text-[13px] font-normal border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 rounded-full active:scale-[0.97] transition-all focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 outline-none"
                      >
                        Enter {activeRole === 'admin' ? 'Admin' : activeRole} Portal →
                      </button>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Graphical Mockup Column */}
              <div className="lg:col-span-7 flex justify-center items-center relative min-h-[350px]">
                {/* Background decorative glow */}
                <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/5 to-emerald-500/10 rounded-3xl filter blur-3xl pointer-events-none" />
                
                <div className="w-full relative z-10 max-w-[480px]">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeRole}
                      initial={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.95 }}
                      transition={{ duration: 0.25 }}
                    >
                      {activeRole === 'patient' && <PatientMockup />}
                      {activeRole === 'doctor' && <DoctorMockup />}
                      {activeRole === 'admin' && <AdminMockup />}
                      {activeRole === 'ambulance' && <AmbulanceMockup />}
                      {activeRole === 'pharmacy' && <PharmacyMockup />}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* 4. LIVE STATS BAR */}
      <section id="live-stats" ref={liveStatsRef} className="bg-zinc-50 dark:bg-zinc-900/30 border-t border-b border-zinc-200 dark:border-zinc-800 relative z-10 overflow-hidden py-10 px-6">
        <div className="max-w-[1100px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-4">
          
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <div>
              <span className="text-[13px] font-normal uppercase tracking-wider text-emerald-600 dark:text-emerald-500 font-mono block">Live Telemetry</span>
              <span className="text-[16px] font-normal text-zinc-900 dark:text-zinc-50 leading-[1.6]">Nagpur Grid Status</span>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-12 flex-1 md:justify-end md:pl-16">
            <div>
              <span className="text-[13px] font-normal text-zinc-500 dark:text-zinc-400 block">Available Beds</span>
              <span className="text-[24px] font-medium text-zinc-900 dark:text-zinc-50 tracking-tight font-mono">
                {liveStatsInView ? <CountUp start={0} end={742} duration={1.2} /> : 0}
              </span>
            </div>
            <div>
              <span className="text-[13px] font-normal text-zinc-500 dark:text-zinc-400 block">Doctors Online</span>
              <span className="text-[24px] font-medium text-zinc-900 dark:text-zinc-50 tracking-tight font-mono">
                {liveStatsInView ? <CountUp start={0} end={183} duration={1.2} /> : 0}
              </span>
            </div>
            <div>
              <span className="text-[13px] font-normal text-zinc-500 dark:text-zinc-400 block">Ambulances Active</span>
              <span className="text-[24px] font-medium text-zinc-900 dark:text-zinc-50 tracking-tight font-mono">
                {liveStatsInView ? <CountUp start={0} end={42} duration={1.2} /> : 0}
              </span>
            </div>
            <div>
              <span className="text-[13px] font-normal text-zinc-500 dark:text-zinc-400 block">Avg Wait Time</span>
              <span className="text-[24px] font-medium text-zinc-900 dark:text-zinc-50 tracking-tight font-mono">
                {liveStatsInView ? <CountUp start={0} end={18} duration={1.2} /> : 0}m
              </span>
            </div>
          </div>

        </div>
      </section>

      {/* 5. WORKFLOW SECTION */}
      <section id="workflow" className="py-[120px] md:py-[120px] py-[80px] px-6 bg-white dark:bg-zinc-950 border-b border-zinc-150/40 dark:border-zinc-900/60 relative z-10">
        <div className="max-w-[1100px] mx-auto space-y-16">
          
          <div className="text-center space-y-3">
            <h2 className="text-[32px] font-medium text-zinc-900 dark:text-white tracking-tight">Seamless Patient Journey</h2>
            <p className="text-[16px] font-normal text-zinc-500 dark:text-zinc-400 max-w-[600px] mx-auto leading-[1.6]">
              ArogyaMitra digitizes hospital queues from the initial symptom down to drug collections.
            </p>
          </div>

          <div className="relative">
            {/* Timeline connection line (desktop only) */}
            <div className="absolute top-10 left-[12%] right-[12%] h-[1px] bg-zinc-200 dark:bg-zinc-800 z-0 hidden md:block" />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 relative z-10">
              
              {/* Step 1 */}
              <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-4">
                <div className="w-[56px] h-[56px] rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/20 flex items-center justify-center text-[16px] font-medium text-emerald-600">
                  1
                </div>
                <h4 className="text-[16px] font-medium text-zinc-900 dark:text-zinc-50">Verify ABHA ID</h4>
                <p className="text-[13px] font-normal leading-[1.6] text-zinc-500 dark:text-zinc-400 max-w-[220px]">
                  Provide your government ABHA details to securely import your clinical history and start.
                </p>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-4">
                <div className="w-[56px] h-[56px] rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/20 flex items-center justify-center text-[16px] font-medium text-emerald-600">
                  2
                </div>
                <h4 className="text-[16px] font-medium text-zinc-900 dark:text-zinc-50">Smart Routing</h4>
                <p className="text-[13px] font-normal leading-[1.6] text-zinc-500 dark:text-zinc-400 max-w-[220px]">
                  Our AI engine forecasts queues and alerts you of transit/OPD delay spikes before you travel.
                </p>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-4">
                <div className="w-[56px] h-[56px] rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/20 flex items-center justify-center text-[16px] font-medium text-emerald-600">
                  3
                </div>
                <h4 className="text-[16px] font-medium text-zinc-900 dark:text-zinc-50">Digital Check-in</h4>
                <p className="text-[13px] font-normal leading-[1.6] text-zinc-500 dark:text-zinc-400 max-w-[220px]">
                  Scan the counter barcode to automatically register with the triage nurse. No queues.
                </p>
              </div>

              {/* Step 4 */}
              <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-4">
                <div className="w-[56px] h-[56px] rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/20 flex items-center justify-center text-[16px] font-medium text-emerald-600">
                  4
                </div>
                <h4 className="text-[16px] font-medium text-zinc-900 dark:text-zinc-50">Instant prescription</h4>
                <p className="text-[13px] font-normal leading-[1.6] text-zinc-500 dark:text-zinc-400 max-w-[220px] pb-2">
                  View prescriptions on your mobile, pick up drugs, and head home comfortably.
                </p>
                <button
                  onClick={() => router.push('/auth/select')}
                  className="text-[13px] font-medium text-emerald-600 hover:text-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 outline-none flex items-center gap-1 group"
                >
                  Get Your Token Free <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* 6. FEATURES BENTO GRID */}
      <section id="features" className="py-[120px] md:py-[120px] py-[80px] px-6 bg-white dark:bg-zinc-950">
        <div className="max-w-[1100px] mx-auto space-y-16">
          
          <div className="text-center space-y-3">
            <h2 className="text-[32px] font-medium text-zinc-900 dark:text-white tracking-tight">Platform Capabilities</h2>
            <p className="text-[16px] font-normal text-zinc-500 dark:text-zinc-400 max-w-[600px] mx-auto leading-[1.6]">
              A complete, integrated ecosystem driving efficiency across emergency services and standard healthcare paths.
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Large Card 1: Smart Queue AI */}
            <div className="md:col-span-2 relative group p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 transition-all duration-150 hover:scale-[1.02] flex flex-col justify-between min-h-[300px] text-left">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-emerald-600">
                  <Activity size={20} aria-hidden="true" />
                </div>
                <div>
                  <h4 className="text-[16px] font-medium text-zinc-900 dark:text-zinc-50">Smart Queue AI</h4>
                  <p className="text-[13px] font-normal leading-[1.6] text-zinc-500 dark:text-zinc-400 mt-2 max-w-[480px]">
                    Analyzes consulting delays, staff density, and incoming triage priority to forecast queue speeds. It balances workloads by shifting patient tokens across open counters dynamically.
                  </p>
                </div>
              </div>
              <div className="border-t border-zinc-200/50 dark:border-zinc-850 pt-4 text-[13px] text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Live Queue Balancer Active
              </div>
            </div>

            {/* Small Card 1: ABHA ID Integration */}
            <div className="md:col-span-1 relative group p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 transition-all duration-150 hover:scale-[1.02] flex flex-col justify-between min-h-[300px] text-left">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-emerald-600">
                  <ShieldCheck size={20} aria-hidden="true" />
                </div>
                <div>
                  <h4 className="text-[16px] font-medium text-zinc-900 dark:text-zinc-50">ABHA Integration</h4>
                  <p className="text-[13px] font-normal leading-[1.6] text-zinc-500 dark:text-zinc-400 mt-2">
                    Verify patient clinical identities instantly against Ayushman Bharat digital registries, streamlining the triage process.
                  </p>
                </div>
              </div>
              <div className="text-[13px] font-mono text-zinc-500 dark:text-zinc-400">
                NDHM COMPLIANT
              </div>
            </div>

            {/* Small Card 2: Doctor Availability */}
            <div className="md:col-span-1 relative group p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 transition-all duration-150 hover:scale-[1.02] flex flex-col justify-between min-h-[300px] text-left">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-emerald-600">
                  <Stethoscope size={20} aria-hidden="true" />
                </div>
                <div>
                  <h4 className="text-[16px] font-medium text-zinc-900 dark:text-zinc-50">Doctor Availability</h4>
                  <p className="text-[13px] font-normal leading-[1.6] text-zinc-500 dark:text-zinc-400 mt-2">
                    Keep live tabs on OPD doctor check-ins, leaves, and specialist consultations across departments.
                  </p>
                </div>
              </div>
              <div className="text-[13px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Live Status Stream
              </div>
            </div>

            {/* Large Card 2: Emergency Triage */}
            <div className="md:col-span-2 relative group p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 transition-all duration-150 hover:scale-[1.02] flex flex-col justify-between min-h-[300px] text-left">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-emerald-600">
                  <Siren size={20} aria-hidden="true" />
                </div>
                <div>
                  <h4 className="text-[16px] font-medium text-zinc-900 dark:text-zinc-50">Emergency Triage</h4>
                  <p className="text-[13px] font-normal leading-[1.6] text-zinc-500 dark:text-zinc-400 mt-2 max-w-[480px]">
                    Fast-track priority ambulance dispatches by linking GPS streams directly to ER desks. It monitors ECG vitals mid-route, preparing ICU rooms and emergency staff before patient arrival.
                  </p>
                </div>
              </div>
              <div className="border-t border-zinc-200/50 dark:border-zinc-850 pt-4 text-[13px] text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span> Priority Ambulance Link Up
              </div>
            </div>

            {/* Small Card 3: Multilingual AI */}
            <div className="md:col-span-1 relative group p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 transition-all duration-150 hover:scale-[1.02] flex flex-col justify-between min-h-[300px] text-left">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-emerald-600">
                  <MessageSquare size={20} aria-hidden="true" />
                </div>
                <div>
                  <h4 className="text-[16px] font-medium text-zinc-900 dark:text-zinc-50">Multilingual AI</h4>
                  <p className="text-[13px] font-normal leading-[1.6] text-zinc-500 dark:text-zinc-400 mt-2">
                    Translate token workflows, prescriptions, and updates into 12 local Indian languages effortlessly.
                  </p>
                </div>
              </div>
              <div className="text-[13px] text-zinc-500 dark:text-zinc-400 font-medium">
                12+ Languages Supported
              </div>
            </div>

            {/* Small Card 4: Digital Twin System */}
            <div className="md:col-span-2 relative group p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 transition-all duration-150 hover:scale-[1.02] flex flex-col justify-between min-h-[300px] text-left">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-emerald-600">
                  <Cpu size={20} aria-hidden="true" />
                </div>
                <div>
                  <h4 className="text-[16px] font-medium text-zinc-900 dark:text-zinc-50">Digital Twin System</h4>
                  <p className="text-[13px] font-normal leading-[1.6] text-zinc-500 dark:text-zinc-400 mt-2 max-w-[480px]">
                    Create complete, real-time spatial digital twin models of linked hospitals. View exact bed positions, corridor densities, and ward logistics on a single spatial command map.
                  </p>
                </div>
              </div>
              <div className="text-[13px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Spatial Engine Active
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 7. TRUST SECTION */}
      <section className="py-[120px] md:py-[120px] py-[80px] px-6 bg-zinc-50 dark:bg-zinc-900/20 border-t border-b border-zinc-150/40 dark:border-zinc-900 relative z-10">
        <div className="max-w-[1100px] mx-auto space-y-16">
          
          <div className="text-center space-y-3">
            <span className="text-[13px] font-normal text-emerald-600 dark:text-emerald-500 uppercase tracking-widest block font-mono">Endorsements</span>
            <h2 className="text-[32px] font-medium text-zinc-900 dark:text-white tracking-tight">Trusted by State Health Systems</h2>
          </div>

          {/* Logos Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center justify-items-center opacity-60">
            <div className="text-[16px] font-medium text-zinc-500 dark:text-zinc-400 tracking-wider">
              National Health Authority
            </div>
            <div className="text-[16px] font-medium text-zinc-500 dark:text-zinc-400 tracking-wider">
              Maharashtra Health Dept
            </div>
            <div className="text-[16px] font-medium text-zinc-500 dark:text-zinc-400 tracking-wider">
              Karnataka Health Grid
            </div>
            <div className="text-[16px] font-medium text-zinc-500 dark:text-zinc-400 tracking-wider">
              Delhi Health Services
            </div>
          </div>

          {/* Testimonial Pull-quote Card */}
          <div className="max-w-[800px] mx-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-8 shadow-sm text-left space-y-6">
            <p className="text-[16px] font-normal leading-[1.6] text-zinc-700 dark:text-zinc-300">
              “ArogyaMitra cut patient waiting times by 65%. It has completely restructured our morning OPD rush, allowing our clinicians to focus on triage and immediate consults without sorting through heaps of physical paperwork.”
            </p>
            <div className="flex items-center gap-3 border-t border-zinc-100 dark:border-zinc-800 pt-6">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 font-medium text-sm">
                RS
              </div>
              <div>
                <h4 className="text-[14px] font-medium text-zinc-900 dark:text-zinc-50">Dr. Rajesh Sharma</h4>
                <p className="text-[13px] font-normal text-zinc-500 dark:text-zinc-400">Chief Medical Officer, Nagpur General Hospital</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 8. FAQ SECTION */}
      <section id="faq" className="py-[120px] md:py-[120px] py-[80px] px-6 bg-white dark:bg-zinc-950 relative z-10">
        <div className="max-w-[800px] mx-auto space-y-12">
          
          <div className="text-center space-y-3">
            <h2 className="text-[32px] font-medium text-zinc-900 dark:text-white tracking-tight">Frequently Asked Questions</h2>
            <p className="text-[16px] font-normal text-zinc-500 dark:text-zinc-400">
              Get detailed answers on security synchronization, registration compliance, and network systems.
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4 w-full">
            <AccordionItem value="faq-1">
              <AccordionTrigger>How does the AI queue management system predict waiting times?</AccordionTrigger>
              <AccordionContent>
                ArogyaMitra analyses historical consulting trends, real-time patient load, department density, and doctor check-in speeds to generate highly accurate queue forecasts.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-2">
              <AccordionTrigger>Is Ayushman Bharat / ABHA ID registration mandatory?</AccordionTrigger>
              <AccordionContent>
                No, but it is highly recommended. Integrating your ABHA ID allows the system to securely sync your clinical history and generate digital tokens instantly.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-3">
              <AccordionTrigger>How do ambulances connect with the emergency triage desk?</AccordionTrigger>
              <AccordionContent>
                All fleet ambulances are equipped with real-time GPS coordinates that feed optimized routing patterns to the digital twin system, prep-triaging emergency units before arrival.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-4">
              <AccordionTrigger>Can doctors access the system when internet access is down?</AccordionTrigger>
              <AccordionContent>
                Yes. ArogyaMitra has a built-in offline synchronization layer that holds clinical data locally on client devices until the hospital network restores.
              </AccordionContent>
            </AccordionItem>
          </Accordion>

        </div>
      </section>

      {/* 9. FOOTER */}
      <footer className="py-16 px-6 border-t border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-950 relative z-10">
        <div className="max-w-[1100px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 text-left">
          
          {/* Column 1: Platform Links */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
                <Activity size={18} className="text-white" />
              </div>
              <span className="text-[16px] font-medium tracking-tight text-zinc-900 dark:text-zinc-50">
                Arogya<span className="text-emerald-600">Mitra</span>
              </span>
            </div>
            <p className="text-[13px] font-normal leading-[1.6] text-zinc-500 dark:text-zinc-400">
              Digitizing and simplifying emergency patient flows for state and national clinics across India.
            </p>
            <div className="pt-2">
              <a 
                href="/DEMO_CREDENTIALS.md" 
                className="text-[13px] font-medium text-emerald-600 hover:text-emerald-700 underline focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 outline-none"
              >
                Access Demo Credentials
              </a>
            </div>
          </div>

          {/* Column 2: Compliance Badges */}
          <div className="space-y-4">
            <h5 className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100 uppercase tracking-widest block font-mono">Compliance</h5>
            <div className="flex flex-wrap gap-2">
              <span className="px-2.5 py-1 text-[13px] font-normal rounded-full bg-zinc-200/50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300/30 dark:border-zinc-700/50">
                ABHA ID Integrated
              </span>
              <span className="px-2.5 py-1 text-[13px] font-normal rounded-full bg-zinc-200/50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300/30 dark:border-zinc-700/50">
                NDHM Standard
              </span>
              <span className="px-2.5 py-1 text-[13px] font-normal rounded-full bg-zinc-200/50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300/30 dark:border-zinc-700/50">
                Ayushman Bharat (AB-PMJAY)
              </span>
            </div>
          </div>

          {/* Column 3: Emergency Helpline */}
          <div className="space-y-4">
            <h5 className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100 uppercase tracking-widest block font-mono">Helplines</h5>
            <div className="space-y-2">
              <div className="text-[24px] font-medium text-emerald-600 dark:text-emerald-500 font-mono tracking-tight">
                108 / 102
              </div>
              <p className="text-[13px] font-normal text-zinc-500 dark:text-zinc-400 leading-[1.6]">
                Government central emergency ambulance coordination command centers.
              </p>
            </div>
          </div>

        </div>

        {/* Bottom copyright row */}
        <div className="max-w-[1100px] mx-auto mt-16 pt-8 border-t border-zinc-200 dark:border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-4 text-[13px] font-normal text-zinc-400 dark:text-zinc-500">
          <div>
            © {new Date().getFullYear()} ArogyaMitra. Built for state health platforms. Open-source under MIT License.
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>

      {/* Floating AI Assistant Chat Window (Bottom-Right) */}
      <div className="fixed bottom-6 right-6 z-[999] flex flex-col items-end gap-3">
        
        <AnimatePresence>
          {aiOpen && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: prefersReducedMotion ? 1 : 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: prefersReducedMotion ? 1 : 0.95 }}
              transition={{ duration: 0.2 }}
              className="w-[330px] h-[440px] rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-2xl shadow-2xl flex flex-col justify-between overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600">
                    <Bot size={18} className="animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-50">AI Health Advisor</h4>
                    <span className="block text-[8px] text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider">Map Smart Automation</span>
                  </div>
                </div>
                <button
                  onClick={() => setAiOpen(false)}
                  className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
                  aria-label="Close AI advisor"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Message History */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 flex flex-col text-left">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`max-w-[85%] p-3 rounded-2xl text-[13px] leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-emerald-600 text-white font-normal self-end rounded-tr-none'
                        : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 font-normal self-start rounded-tl-none border border-zinc-200/50 dark:border-zinc-800'
                    }`}
                  >
                    {msg.text}
                  </div>
                ))}
                {isTyping && (
                  <div className="bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-450 border border-zinc-200/50 dark:border-zinc-800 self-start rounded-2xl rounded-tl-none p-3 max-w-[80%] text-[13px] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    Analyzing query...
                  </div>
                )}
              </div>

              {/* Suggestion Prompts */}
              <div className="px-4 py-2 border-t border-zinc-100 dark:border-zinc-900 flex gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none">
                <button 
                  onClick={() => handleSendMessage('How to register with ABHA ID?')}
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-[11px] font-medium text-zinc-600 dark:text-zinc-300 hover:text-emerald-600 dark:hover:text-emerald-500 transition-colors"
                >
                  ABHA Registration
                </button>
                <button 
                  onClick={() => handleSendMessage('Check beds occupancy')}
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-[11px] font-medium text-zinc-600 dark:text-zinc-300 hover:text-emerald-600 dark:hover:text-emerald-500 transition-colors"
                >
                  Beds Occupancy
                </button>
              </div>

              {/* Inputs */}
              <div className="p-3 border-t border-zinc-200 dark:border-zinc-900 flex gap-2">
                <input
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask a question..."
                  className="flex-1 h-9 px-3 rounded-xl border border-zinc-250 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-600"
                  aria-label="Message inputs"
                />
                <button
                  onClick={() => handleSendMessage()}
                  className="w-9 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center text-white transition-colors focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 outline-none"
                  aria-label="Send message"
                >
                  <Send size={16} />
                </button>
              </div>

            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Trigger Bubble */}
        <button
          onClick={() => setAiOpen(!aiOpen)}
          className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center relative group focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 outline-none"
          aria-label="Toggle AI Advisor Assistant"
        >
          <span className="absolute inset-0 rounded-full animate-ping bg-emerald-500/25 z-0" />
          <Bot size={24} className="z-10" />
        </button>

      </div>

    </main>
  );
}
