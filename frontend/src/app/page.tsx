'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import {
  User, Stethoscope, Building2, ArrowRight, Clock, Siren, Users,
  MessageSquare, Bell, CalendarCheck, Activity, ShieldCheck, Cpu,
  Search, Shield, MapPin, Sparkles, ChevronDown, CheckCircle2,
  TrendingUp, Star, HelpCircle, Eye, Zap, Flame, ShieldAlert,
  ArrowUpRight, HeartHandshake, PhoneCall, Bot, Send, X, ArrowLeftRight, Pill, Loader2,
  Sun, Moon
} from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

const BackgroundShader = dynamic(() => import('@/components/landing/BackgroundShader'), { ssr: false });
const HospitalMap = dynamic(() => import('@/components/HospitalMap'), { ssr: false });
const InfiniteLights = dynamic(() => import('@/components/Hero/InfiniteLights'), { ssr: false });

export default function Home() {
  const router = useRouter();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [faqSearch, setFaqSearch] = useState('');
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [journeyTab, setJourneyTab] = useState<'patient' | 'hospital' | 'government'>('patient');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Real-time status ticker with state fluctuations
  const [bedsCount, setBedsCount] = useState(742);
  const [docsCount, setDocsCount] = useState(183);
  const [ambsCount, setAmbsCount] = useState(42);
  const [waitingCount, setWaitingCount] = useState(2531);
  const [waitTimeCount, setWaitTimeCount] = useState(18);
  const [emergencyCount, setEmergencyCount] = useState(29);

  // Fluctuations deltas
  const [bedsDelta, setBedsDelta] = useState<'up' | 'down'>('up');
  const [docsDelta, setDocsDelta] = useState<'up' | 'down'>('up');
  const [ambsDelta, setAmbsDelta] = useState<'up' | 'down'>('up');

  // Floating AI Assistant chat state
  const [aiOpen, setAiOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'bot', text: string }>>([
    { sender: 'bot', text: 'Hi! I am the ArogyaMitra AI Advisor. Ask me anything like "Find nearest cardiology unit" or "I need O-Negative blood" and I will automatically configure the Map for you!' }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Ref for card spotlight hover physics
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    // 1. Initialize Lenis Smooth Scroll
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 2,
    });

    const raf = (time: number) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);

    // Track scroll for navbar transparency (only triggers state when crossing threshold)
    const handleScroll = () => {
      const scrolled = window.scrollY > 20;
      setIsScrolled(prev => (prev !== scrolled ? scrolled : prev));
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    // 2. Initialize GSAP ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);

    // Hero title stagger reveal
    gsap.fromTo('.hero-reveal', 
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: 'power4.out', delay: 0.1 }
    );

    // Live status fluctuating loop
    const statusInterval = setInterval(() => {
      setBedsCount(prev => {
        const delta = Math.random() > 0.5 ? 1 : -1;
        setBedsDelta(delta > 0 ? 'up' : 'down');
        return prev + delta;
      });
      setDocsCount(prev => {
        const delta = Math.random() > 0.6 ? 1 : -1;
        setDocsDelta(delta > 0 ? 'up' : 'down');
        return prev + delta;
      });
      setAmbsCount(prev => {
        const delta = Math.random() > 0.5 ? 1 : -1;
        setAmbsDelta(delta > 0 ? 'up' : 'down');
        return prev + delta;
      });
      setWaitingCount(prev => prev + (Math.random() > 0.5 ? 3 : -3));
      setEmergencyCount(prev => prev + (Math.random() > 0.6 ? 1 : -1));
    }, 4500);

    return () => {
      lenis.destroy();
      window.removeEventListener('scroll', handleScroll);
      clearInterval(statusInterval);
    };
  }, []);

  const features = [
    { title: "Smart Registration", desc: "ABHA-integrated rapid patient onboarding.", icon: <ShieldCheck className="w-6 h-6 text-emerald-400" /> },
    { title: "Dynamic Queues", desc: "AI predicts wait times & optimizes flow.", icon: <Activity className="w-6 h-6 text-cyan-400" /> },
    { title: "Emergency Triage", desc: "Priority routing for critical cases.", icon: <Siren className="w-6 h-6 text-rose-400" /> },
    { title: "Doctor Availability", desc: "Real-time tracking of OPD staff.", icon: <Stethoscope className="w-6 h-6 text-indigo-400" /> },
    { title: "Smart Scheduling", desc: "Slot allocation & appointment booking.", icon: <CalendarCheck className="w-6 h-6 text-amber-400" /> },
    { title: "Digital Tokens", desc: "Paperless token generation via SMS.", icon: <Cpu className="w-6 h-6 text-purple-400" /> },
    { title: "Crowd Monitor", desc: "AI-based density analysis & alerts.", icon: <Users className="w-6 h-6 text-sky-400" /> },
    { title: "Multilingual AI", desc: "Voice/Chat support in native languages.", icon: <MessageSquare className="w-6 h-6 text-pink-400" /> },
    { title: "Instant Alerts", desc: "SMS/WhatsApp notifications for updates.", icon: <Bell className="w-6 h-6 text-yellow-400" /> },
    { title: "Admin Insights", desc: "Centralized hospital performance stats.", icon: <Building2 className="w-6 h-6 text-slate-400" /> },
  ];

  const testimonials = [
    { name: "Dr. Rajesh Sharma", role: "Chief Medical Officer", text: "ArogyaMitra cut patient waiting times by 65%. It has completely restructured our morning OPD rush.", rating: 5, hospital: "Nagpur General Hospital" },
    { name: "Ananya Patel", role: "Patient", text: "Generating an ABHA token on my phone before leaving home saved me 3 hours of queueing.", rating: 5, hospital: "Mahanagar Health Center" },
    { name: "Vijay Deshmukh", role: "Emergency Lead", text: "The real-time ambulance tracking and automated emergency triage has saved dozens of critical lives.", rating: 5, hospital: "Central Multi-Specialty" },
    { name: "Priya Nair", role: "Lab Director", text: "The integrated lab reporting and AI report analysis speeds up diagnostic delivery significantly.", rating: 5, hospital: "Arogya Diagnostics" },
  ];

  const faqData = [
    { q: "How does the AI queue management system predict waiting times?", a: "ArogyaMitra analyses historical consulting trends, real-time patient load, department density, and doctor check-in speeds to generate highly accurate queue forecasts." },
    { q: "Is Ayushman Bharat / ABHA ID registration mandatory?", a: "No, but it is highly recommended. Integrating your ABHA ID allows the system to securely sync your clinical history and generate digital tokens instantly." },
    { q: "How do ambulances connect with the emergency triage desk?", a: "All fleet ambulances are equipped with real-time GPS coordinates that feed optimized routing patterns to the digital twin system, prep-triaging emergency units before arrival." },
    { q: "Can doctors access the system when internet access is down?", a: "Yes. ArogyaMitra has a built-in offline synchronization layer that holds clinical data locally on client devices until the hospital network restores." }
  ];

  const filteredFaqs = faqData.filter(faq => 
    faq.q.toLowerCase().includes(faqSearch.toLowerCase()) || 
    faq.a.toLowerCase().includes(faqSearch.toLowerCase())
  );

  const handleMouseMoveCard = (e: React.MouseEvent<HTMLDivElement>, index: number) => {
    const card = cardsRef.current[index];
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty("--mouse-x", `${x}px`);
    card.style.setProperty("--mouse-y", `${y}px`);
  };

  // Triggers map filters and scrolls down
  const triggerMapAction = (search: string, category?: string, onlyEmergency?: boolean) => {
    window.dispatchEvent(new CustomEvent('map-action', {
      detail: { search, category, onlyEmergency }
    }));
    document.getElementById('facility-map')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (textToSend?: string) => {
    const query = textToSend || inputVal;
    if (!query.trim()) return;

    const userMessage = { sender: 'user' as const, text: query };
    setMessages(prev => [...prev, userMessage]);
    setInputVal('');
    setIsTyping(true);

    setTimeout(() => {
      let botResponse = 'I can help search facilities! Try searching "chest pain", "ICU beds", or "Blood Bank".';
      const q = query.toLowerCase();

      if (q.includes('chest') || q.includes('heart') || q.includes('cardio')) {
        botResponse = 'Chest pain detected. I have updated the Nagpur Intelligence Map to filter for cardiology hospitals, highlighted emergency centers, and simulated the routing path. Please scroll down to review details.';
        triggerMapAction('Cardiology', 'hospital', true);
      } else if (q.includes('blood') || q.includes('plasma')) {
        botResponse = 'Searching blood banks. I have filtered the Discovery Map for nearby Blood Donation centers and highlighted availability reserves. Please scroll down to review.';
        triggerMapAction('Blood Bank', 'blood_bank');
      } else if (q.includes('pharmacy') || q.includes('medicine')) {
        botResponse = 'Searching active pharmacies. Filters updated. Review stock details below.';
        triggerMapAction('Pharmacy', 'pharmacy');
      } else if (q.includes('icu') || q.includes('bed')) {
        botResponse = 'Searching hospitals with active ICU beds. Filtering Nagpur map hubs.';
        triggerMapAction('ICU');
      }

      setMessages(prev => [...prev, { sender: 'bot', text: botResponse }]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <main className="min-h-screen w-full bg-slate-50 dark:bg-[#030712] text-slate-900 dark:text-slate-100 overflow-x-hidden relative selection:bg-cyan-500 selection:text-slate-900 transition-colors duration-300">
      {/* WebGL Canvas Shader Background */}
      <BackgroundShader />

      {/* 1. Floating Glassmorphism Navbar */}
      <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        isScrolled 
          ? 'py-4 bg-white/80 dark:bg-[#090d16]/75 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 shadow-lg dark:shadow-2xl' 
          : 'py-6 bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => router.push('/')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25 group-hover:scale-105 transition-all">
              <Activity className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Arogya<span className="text-cyan-600 dark:text-cyan-400">Mitra</span></span>
              <span className="block text-[8px] tracking-[0.25em] text-slate-500 dark:text-slate-400 uppercase font-semibold">Enterprise Hub</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">Features</a>
            <a href="#facility-map" className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">Discovery Map</a>
            <a href="#workflow" className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 hover:text-cyan-400 transition-colors">Workflow</a>
            <a href="#analytics" className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 hover:text-cyan-400 transition-colors">Analytics</a>
            <a href="#faq" className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 hover:text-cyan-400 transition-colors">FAQs</a>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="p-2.5 rounded-full border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors" 
              aria-label="Toggle Theme"
            >
              {mounted && resolvedTheme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              )}
            </button>
            <button
              onClick={() => router.push('/auth/select')}
              className="px-5 py-2.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-800 dark:text-white transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => router.push('/auth/select')}
              className="px-5 py-2.5 rounded-full text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-1"
            >
              Get Started <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </nav>

      {/* 2. Hero Section with Codrops Infinite Lights 3D Background */}
      <section className="relative min-h-[95vh] pt-32 pb-20 px-6 flex flex-col justify-center items-center overflow-hidden z-10 bg-[#030712]">
        
        {/* ── Codrops Infinite Lights WebGL Full Highway Scene ── */}
        <div aria-hidden="true" className="absolute inset-0 z-0 pointer-events-none">
          <InfiniteLights />
        </div>

        {/* Hero Overlay Content Floating Above Highway */}
        <div className="max-w-4xl w-full mx-auto flex flex-col items-center text-center gap-0 relative z-10 pointer-events-auto">

          {/* Text Block */}
          <div className="space-y-6 w-full backdrop-blur-[2px] p-6 rounded-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold uppercase tracking-widest hero-reveal shadow-[0_0_15px_rgba(6,182,212,0.2)]">
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-cyan-300" />
              Next-Gen AI Healthcare Highway
            </div>

            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight leading-[1.05] hero-reveal">
              Healthcare <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-fuchsia-400 drop-shadow-[0_0_35px_rgba(6,182,212,0.4)]">
                At The Speed of Light.
              </span>
            </h1>

            <p className="text-base md:text-lg text-slate-300 font-light max-w-xl leading-relaxed hero-reveal mx-auto">
              Real-time AI synchronization across Patients, Doctors, Hospitals, Ambulances, and Government Healthcare. Predict queues and fast-track emergency dispatch.
            </p>

            <div className="flex flex-wrap gap-4 pt-2 hero-reveal justify-center">
              <button
                onClick={() => router.push('/auth/select')}
                className="px-8 h-14 rounded-full text-sm font-bold bg-gradient-to-r from-cyan-500 via-blue-600 to-fuchsia-600 hover:from-cyan-400 hover:to-fuchsia-500 text-white transition-all shadow-[0_0_25px_rgba(6,182,212,0.4)] hover:scale-[1.03] flex items-center gap-2"
              >
                Choose Portal Gateway <ArrowRight className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => document.getElementById('facility-map')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-8 h-14 rounded-full text-sm font-bold bg-black/60 hover:bg-black/80 border border-white/20 text-white transition-all hover:scale-[1.03] backdrop-blur-xl flex items-center gap-2 shadow-lg"
              >
                Explore Live Map
              </button>
            </div>

            {/* Hero text stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 border-t border-white/10 max-w-2xl hero-reveal mx-auto mt-6 backdrop-blur-sm rounded-2xl bg-black/20 p-4">
              <div>
                <div className="text-2xl font-extrabold text-white">50+</div>
                <div className="text-[10px] text-slate-400 uppercase tracking-widest mt-1 font-mono">Hospitals Linked</div>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-cyan-400">2.4M+</div>
                <div className="text-[10px] text-slate-400 uppercase tracking-widest mt-1 font-mono">Patients Served</div>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-fuchsia-400">98%</div>
                <div className="text-[10px] text-slate-400 uppercase tracking-widest mt-1 font-mono">Queue Accuracy</div>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-rose-400">24x7</div>
                <div className="text-[10px] text-slate-400 uppercase tracking-widest mt-1 font-mono">Emergency Dispatch</div>
              </div>
            </div>
          </div>
          {/* ── END text column ── */}

        </div>

      </section>

      {/* 3. Quick Action Bar (Interactive Gateway panels) */}
      <section className="relative z-20 -mt-10 px-6">
        <div className="max-w-7xl mx-auto p-6 rounded-3xl border border-white/10 bg-[#090d16]/75 backdrop-blur-2xl shadow-2xl grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 text-center">
          
          <button
            onClick={() => triggerMapAction('')}
            className="flex flex-col items-center gap-2.5 p-3 rounded-2xl hover:bg-white/[0.03] transition-colors group"
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
              <Building2 className="w-4.5 h-4.5" />
            </div>
            <span className="text-xs font-bold text-slate-300 group-hover:text-white">Find Hospital</span>
          </button>

          <button
            onClick={() => router.push('/auth/select')}
            className="flex flex-col items-center gap-2.5 p-3 rounded-2xl hover:bg-white/[0.03] transition-colors group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
              <CalendarCheck className="w-4.5 h-4.5" />
            </div>
            <span className="text-xs font-bold text-slate-300 group-hover:text-white">Book Appointment</span>
          </button>

          <button
            onClick={() => triggerMapAction('', '', true)}
            className="flex flex-col items-center gap-2.5 p-3 rounded-2xl hover:bg-white/[0.03] transition-colors group"
          >
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 group-hover:scale-105 transition-transform">
              <Siren className="w-4.5 h-4.5 animate-pulse" />
            </div>
            <span className="text-xs font-bold text-slate-300 group-hover:text-white">Emergency</span>
          </button>

          <button
            onClick={() => triggerMapAction('Blood Bank', 'blood_bank')}
            className="flex flex-col items-center gap-2.5 p-3 rounded-2xl hover:bg-white/[0.03] transition-colors group"
          >
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 group-hover:scale-105 transition-transform">
              <HeartHandshake className="w-4.5 h-4.5" />
            </div>
            <span className="text-xs font-bold text-slate-300 group-hover:text-white">Blood Bank</span>
          </button>

          <button
            onClick={() => triggerMapAction('Pharmacy', 'pharmacy')}
            className="flex flex-col items-center gap-2.5 p-3 rounded-2xl hover:bg-white/[0.03] transition-colors group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
              <Pill className="w-4.5 h-4.5" />
            </div>
            <span className="text-xs font-bold text-slate-300 group-hover:text-white">Pharmacy Search</span>
          </button>

          <button
            onClick={() => triggerMapAction('Clinic', 'clinic')}
            className="flex flex-col items-center gap-2.5 p-3 rounded-2xl hover:bg-white/[0.03] transition-colors group"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
              <Stethoscope className="w-4.5 h-4.5" />
            </div>
            <span className="text-xs font-bold text-slate-300 group-hover:text-white">Find Doctor</span>
          </button>

          <button
            onClick={() => router.push('/auth/select')}
            className="flex flex-col items-center gap-2.5 p-3 rounded-2xl hover:bg-white/[0.03] transition-colors group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
              <Zap className="w-4.5 h-4.5" />
            </div>
            <span className="text-xs font-bold text-slate-300 group-hover:text-white">Telemedicine</span>
          </button>

          <button
            onClick={() => router.push('/auth/select')}
            className="flex flex-col items-center gap-2.5 p-3 rounded-2xl hover:bg-white/[0.03] transition-colors group"
          >
            <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-4.5 h-4.5" />
            </div>
            <span className="text-xs font-bold text-slate-300 group-hover:text-white">Health Records</span>
          </button>

        </div>
      </section>

      {/* 4. Live Healthcare Status Ticker (Fluctuating counters) */}
      <section className="py-16 px-6 relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          
          <div className="p-5 rounded-2xl border border-white/5 bg-slate-900/10 backdrop-blur-md flex flex-col justify-between min-h-[100px]">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Available Beds</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-extrabold text-white">{bedsCount}</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                bedsDelta === 'up' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
              }`}>
                {bedsDelta === 'up' ? '↑' : '↓'} Live
              </span>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-white/5 bg-slate-900/10 backdrop-blur-md flex flex-col justify-between min-h-[100px]">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Doctors Online</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-extrabold text-white">{docsCount}</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                docsDelta === 'up' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
              }`}>
                {docsDelta === 'up' ? '↑' : '↓'} Active
              </span>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-white/5 bg-slate-900/10 backdrop-blur-md flex flex-col justify-between min-h-[100px]">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Ambulances Active</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-extrabold text-white">{ambsCount}</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                ambsDelta === 'up' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
              }`}>
                {ambsDelta === 'up' ? '↑' : '↓'} Road
              </span>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-white/5 bg-slate-900/10 backdrop-blur-md flex flex-col justify-between min-h-[100px]">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Waiting Patients</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-extrabold text-white">{waitingCount}</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">Total</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-white/5 bg-slate-900/10 backdrop-blur-md flex flex-col justify-between min-h-[100px]">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Avg Waiting Time</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-extrabold text-white">{waitTimeCount}m</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400">Queue</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-white/5 bg-slate-900/10 backdrop-blur-md flex flex-col justify-between min-h-[100px]">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Emergency Cases</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-extrabold text-white">{emergencyCount}</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400">Triage</span>
            </div>
          </div>

        </div>
      </section>

      {/* 5. Live discovery Map */}
      <section id="discovery-map" className="py-20 px-6 relative z-10 bg-slate-950/20 border-t border-white/5">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-xs uppercase tracking-[0.25em] text-cyan-400 font-bold">Interactive Discovery</h2>
            <h3 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">Live Nagpur Health Intelligence Mapping</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Find clinical specializations, inspect ICU capacity, track ambulances, and plan routes with real-time updates.
            </p>
          </div>

          {/* Render leaflet container */}
          <div className="w-full">
            <HospitalMap />
          </div>
        </div>
      </section>

      {/* 6. Onboarding Role journeys (Interactive tab connects) */}
      <section id="workflow" className="py-24 px-6 relative z-10 border-t border-white/5">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-xs uppercase tracking-[0.25em] text-cyan-400 font-bold">Workflows</h2>
            <h3 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">Seamless Connecting Journeys</h3>
            <p className="text-slate-400 text-sm">
              Discover how ArogyaMitra coordinates logistics between roles in the healthcare grid.
            </p>

            <div className="flex justify-center gap-3.5 pt-4">
              <button
                onClick={() => setJourneyTab('patient')}
                className={`px-4 py-2 text-xs font-bold rounded-full transition-colors ${
                  journeyTab === 'patient' 
                    ? 'bg-cyan-500 text-slate-900' 
                    : 'bg-white/5 hover:bg-white/10 text-slate-300'
                }`}
              >
                Patient Journey
              </button>
              <button
                onClick={() => setJourneyTab('hospital')}
                className={`px-4 py-2 text-xs font-bold rounded-full transition-colors ${
                  journeyTab === 'hospital' 
                    ? 'bg-cyan-500 text-slate-900' 
                    : 'bg-white/5 hover:bg-white/10 text-slate-300'
                }`}
              >
                Hospital Admin
              </button>
              <button
                onClick={() => setJourneyTab('government')}
                className={`px-4 py-2 text-xs font-bold rounded-full transition-colors ${
                  journeyTab === 'government' 
                    ? 'bg-cyan-500 text-slate-900' 
                    : 'bg-white/5 hover:bg-white/10 text-slate-300'
                }`}
              >
                Government
              </button>
            </div>
          </div>

          <div className="relative">
            {/* Visual connecting lines */}
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-transparent z-0 hidden lg:block" />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 relative z-10">
              
              {journeyTab === 'patient' && (
                <>
                  <div className="p-6 rounded-3xl border border-white/5 bg-slate-900/30 backdrop-blur-md space-y-4">
                    <span className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-xs font-bold text-cyan-400">1</span>
                    <h4 className="text-sm font-bold text-white">Generate Token</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">Enter credentials, verify ABHA ID, and book an immediate OPD token prior to arrival.</p>
                  </div>
                  <div className="p-6 rounded-3xl border border-white/5 bg-slate-900/30 backdrop-blur-md space-y-4">
                    <span className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-xs font-bold text-cyan-400">2</span>
                    <h4 className="text-sm font-bold text-white">Real-Time Routing</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">View traffic-sensitive ETA and coordinates directly via OpenStreetMap trackers.</p>
                  </div>
                  <div className="p-6 rounded-3xl border border-white/5 bg-slate-900/30 backdrop-blur-md space-y-4">
                    <span className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-xs font-bold text-cyan-400">3</span>
                    <h4 className="text-sm font-bold text-white">Consult Desk</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">Present digital code. Doctor reads sync profile immediately without paper registrations.</p>
                  </div>
                  <div className="p-6 rounded-3xl border border-white/5 bg-slate-900/30 backdrop-blur-md space-y-4">
                    <span className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-xs font-bold text-cyan-400">4</span>
                    <h4 className="text-sm font-bold text-white">Digital Checkout</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">Collect prescription on mobile, grab packaged medicines, and depart clinic smoothly.</p>
                  </div>
                </>
              )}

              {journeyTab === 'hospital' && (
                <>
                  <div className="p-6 rounded-3xl border border-white/5 bg-slate-900/30 backdrop-blur-md space-y-4">
                    <span className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-xs font-bold text-cyan-400">1</span>
                    <h4 className="text-sm font-bold text-white">Monitor Capacity</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">Review active ICU, ward, and ventilator beds on the administrative dashboard.</p>
                  </div>
                  <div className="p-6 rounded-3xl border border-white/5 bg-slate-900/30 backdrop-blur-md space-y-4">
                    <span className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-xs font-bold text-cyan-400">2</span>
                    <h4 className="text-sm font-bold text-white">Triage Dispatch</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">Receive incoming ambulance alerts and coordinate ER staff ahead of emergency arrival.</p>
                  </div>
                  <div className="p-6 rounded-3xl border border-white/5 bg-slate-900/30 backdrop-blur-md space-y-4">
                    <span className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-xs font-bold text-cyan-400">3</span>
                    <h4 className="text-sm font-bold text-white">OPD Optimization</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">Dynamically allocate doctor schedules to bottlenecked departments based on wait spikes.</p>
                  </div>
                  <div className="p-6 rounded-3xl border border-white/5 bg-slate-900/30 backdrop-blur-md space-y-4">
                    <span className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-xs font-bold text-cyan-400">4</span>
                    <h4 className="text-sm font-bold text-white">Analytics Export</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">Export audit logs for government regulatory compliance and performance grants.</p>
                  </div>
                </>
              )}

              {journeyTab === 'government' && (
                <>
                  <div className="p-6 rounded-3xl border border-white/5 bg-slate-900/30 backdrop-blur-md space-y-4">
                    <span className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-xs font-bold text-cyan-400">1</span>
                    <h4 className="text-sm font-bold text-white">Track Metrics</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">Monitor healthcare density, bed reserves, and emergency responses across all public clinics.</p>
                  </div>
                  <div className="p-6 rounded-3xl border border-white/5 bg-slate-900/30 backdrop-blur-md space-y-4">
                    <span className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-xs font-bold text-cyan-400">2</span>
                    <h4 className="text-sm font-bold text-white">Detect Outbreaks</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">Review localized anomaly spikes in fever or influenza reports via real-time symptom query heatmaps.</p>
                  </div>
                  <div className="p-6 rounded-3xl border border-white/5 bg-slate-900/30 backdrop-blur-md space-y-4">
                    <span className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-xs font-bold text-cyan-400">3</span>
                    <h4 className="text-sm font-bold text-white">Distribute Funds</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">Allocate medical supplies and grants based on actual, transparent utilization statistics.</p>
                  </div>
                  <div className="p-6 rounded-3xl border border-white/5 bg-slate-900/30 backdrop-blur-md space-y-4">
                    <span className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-xs font-bold text-cyan-400">4</span>
                    <h4 className="text-sm font-bold text-white">Policy Directives</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">Issue real-time public directives and guidelines instantly visible on all patient portals.</p>
                  </div>
                </>
              )}

            </div>
          </div>

        </div>
      </section>

      {/* 7. Feature grids */}
      <section id="features" className="py-20 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <h2 className="text-xs uppercase tracking-[0.25em] text-cyan-400 font-bold">Platform Capabilities</h2>
            <h3 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">Integrated Enterprise Stack</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Explore the specialized modules built to drive efficient operations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat, i) => (
              <div
                key={i}
                ref={(el) => { cardsRef.current[i] = el; }}
                onMouseMove={(e) => handleMouseMoveCard(e, i)}
                onMouseEnter={() => setHoveredCard(i)}
                onMouseLeave={() => setHoveredCard(null)}
                className="relative group p-6 rounded-3xl bg-slate-900/40 border border-white/10 backdrop-blur-md overflow-hidden transition-all duration-300 hover:border-cyan-500/50 hover:bg-slate-900/60"
              >
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{
                    background: `radial-gradient(400px circle at var(--mouse-x, 0px) var(--mouse-y, 0px), rgba(6, 182, 212, 0.1), transparent 80%)`
                  }}
                />
                
                <div className="relative z-10 space-y-4">
                  <div className="w-11 h-11 rounded-xl bg-slate-950 border border-white/10 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                    {feat.icon}
                  </div>
                  
                  <div className="space-y-1">
                    <h4 className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors">{feat.title}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">{feat.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. FAQs accordions */}
      <section id="faq" className="py-20 px-6 border-t border-white/5 relative z-10 bg-slate-950/20">
        <div className="max-w-4xl mx-auto space-y-10">
          
          <div className="text-center space-y-3">
            <h3 className="text-3xl font-extrabold text-white tracking-tight">Frequently Asked Questions</h3>
            <p className="text-slate-400 text-sm">Have queries about data syncing or registration? We have got you covered.</p>
            
            <div className="relative max-w-md mx-auto pt-2">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search queries..."
                value={faqSearch}
                onChange={(e) => setFaqSearch(e.target.value)}
                className="w-full h-11 pl-11 pr-4 rounded-full bg-slate-900/60 border border-white/10 focus:border-cyan-500/50 focus:outline-none text-xs text-white placeholder-slate-500 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-4">
            {filteredFaqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div key={idx} className="rounded-2xl border border-white/10 bg-slate-900/20 overflow-hidden">
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex justify-between items-center hover:bg-white/[0.02] transition-colors"
                  >
                    <span className="font-semibold text-white text-xs md:text-sm">{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {isOpen && (
                    <div className="p-5 pt-0 text-xs text-slate-400 leading-relaxed border-t border-white/5 bg-slate-950/20">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* 9. Portal selection login cards */}
      <section className="py-20 px-6 border-t border-white/5 relative z-10 bg-slate-950/30">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-xs uppercase tracking-[0.25em] text-cyan-400 font-bold">Secure Access</h2>
            <h3 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">Select Your Access Portal</h3>
            <p className="text-slate-400 text-sm">
              Log into your specialized workspace to manage patient care, coordinates, or government telemetry.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            
            <div 
              onClick={() => router.push('/auth/patient/login')}
              className="p-6 rounded-3xl border border-white/5 bg-slate-900/40 hover:border-cyan-500/40 transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[180px] group"
            >
              <div className="space-y-4">
                <span className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <User className="w-5 h-5" />
                </span>
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">Patient Portal</h4>
                  <p className="text-xs text-slate-400 mt-1">Book consultations, manage ABHA ID, and view medical summaries.</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-cyan-400 mt-4 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Sign In <ArrowRight className="w-3 h-3" />
              </span>
            </div>

            <div 
              onClick={() => router.push('/auth/doctor/login')}
              className="p-6 rounded-3xl border border-white/5 bg-slate-900/40 hover:border-cyan-500/40 transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[180px] group"
            >
              <div className="space-y-4">
                <span className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Stethoscope className="w-5 h-5" />
                </span>
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">Doctor Station</h4>
                  <p className="text-xs text-slate-400 mt-1">Verify clinical history, prescribe items, and track live queue metrics.</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-cyan-400 mt-4 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Sign In <ArrowRight className="w-3 h-3" />
              </span>
            </div>

            <div 
              onClick={() => router.push('/auth/admin/login')}
              className="p-6 rounded-3xl border border-white/5 bg-slate-900/40 hover:border-cyan-500/40 transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[180px] group"
            >
              <div className="space-y-4">
                <span className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Building2 className="w-5 h-5" />
                </span>
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">Hospital Admin</h4>
                  <p className="text-xs text-slate-400 mt-1">Manage bed allocation, dispatch ambulances, and analyze performance.</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-cyan-400 mt-4 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Sign In <ArrowRight className="w-3 h-3" />
              </span>
            </div>

            <div 
              onClick={() => router.push('/auth/driver/login')}
              className="p-6 rounded-3xl border border-white/5 bg-slate-900/40 hover:border-cyan-500/40 transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[180px] group"
            >
              <div className="space-y-4">
                <span className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Siren className="w-5 h-5" />
                </span>
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">Ambulance Fleet</h4>
                  <p className="text-xs text-slate-400 mt-1">Update response location status and navigate critical routes.</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-cyan-400 mt-4 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Sign In <ArrowRight className="w-3 h-3" />
              </span>
            </div>

            <div 
              onClick={() => router.push('/auth/pharmacy/login')}
              className="p-6 rounded-3xl border border-white/5 bg-slate-900/40 hover:border-cyan-500/40 transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[180px] group"
            >
              <div className="space-y-4">
                <span className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Pill className="w-5 h-5" />
                </span>
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">Pharmacy / Lab</h4>
                  <p className="text-xs text-slate-400 mt-1">Onboard prescriptions, upload diagnostics, and track inventory.</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-cyan-400 mt-4 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Sign In <ArrowRight className="w-3 h-3" />
              </span>
            </div>

          </div>

        </div>
      </section>

      {/* 10. Footer Section */}
      <footer className="py-16 px-6 border-t border-white/10 bg-slate-950 relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight text-white">Arogya<span className="text-cyan-400">Mitra</span></span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Accelerating public clinic logistics using WebGL twin systems, local synchronization, and secure automated ABHA triaging.
            </p>
          </div>

          <div className="space-y-4">
            <h5 className="text-xs font-bold text-white uppercase tracking-widest">Platform</h5>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li><a href="#features" className="hover:text-cyan-400 transition-colors">Core Modules</a></li>
              <li><a href="#facility-map" className="hover:text-cyan-400 transition-colors">Discovery Maps</a></li>
              <li><a href="#workflow" className="hover:text-cyan-400 transition-colors">Workflow Journeys</a></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h5 className="text-xs font-bold text-white uppercase tracking-widest">Compliance</h5>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-emerald-400" /> ABHA Integrated</li>
              <li className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-emerald-400" /> Ayushman Bharat (AB-PMJAY)</li>
              <li className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-emerald-400" /> NDHM Compliant</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h5 className="text-xs font-bold text-white uppercase tracking-widest">Helpline & Command</h5>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-rose-400">
                <PhoneCall className="w-4 h-4 animate-bounce" /> Emergency Support: 108 / 102
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Connect directly to central dispatcher command control centers.
              </p>
            </div>
          </div>

        </div>

        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-[10px] text-slate-600">
            © {new Date().getFullYear()} ArogyaMitra. Built for state and national hackathon platforms. Open-source under MIT License.
          </div>
          <div className="flex gap-6 text-[10px] text-slate-600">
            <a href="#" className="hover:text-cyan-400 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-cyan-400 transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>

      {/* 11. Floating AI Assistant Chat Window (Bottom-Right) */}
      <div className="fixed bottom-6 right-6 z-[999] flex flex-col items-end gap-3">
        
        <AnimatePresence>
          {aiOpen && (
            <div
              className="w-[330px] h-[440px] rounded-3xl border border-white/10 bg-[#090d16]/95 backdrop-blur-2xl shadow-2xl flex flex-col justify-between overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 bg-gradient-to-r from-cyan-950/30 to-blue-950/30 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400">
                    <Bot className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">AI Health Advisor</h4>
                    <span className="block text-[8px] text-slate-400 font-semibold uppercase tracking-wider">Map Smart Automation</span>
                  </div>
                </div>
                <button
                  onClick={() => setAiOpen(false)}
                  className="p-1.5 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Message History */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3.5 flex flex-col">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`max-w-[85%] p-3 rounded-2xl text-[11px] leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-cyan-500 text-slate-950 font-bold self-end rounded-tr-none'
                        : 'bg-white/5 text-slate-300 font-light self-start rounded-tl-none border border-white/5'
                    }`}
                  >
                    {msg.text}
                  </div>
                ))}
                {isTyping && (
                  <div className="bg-white/5 text-slate-400 border border-white/5 self-start rounded-2xl rounded-tl-none p-3 max-w-[80%] text-[10px] flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                    Analyzing clinical query...
                  </div>
                )}
              </div>

              {/* Suggestion Prompts */}
              <div className="px-4 py-2 border-t border-white/5 flex gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none">
                <button 
                  onClick={() => handleSendMessage('I have chest pain')}
                  className="px-2.5 py-1.5 rounded-lg bg-white/[0.02] border border-white/5 text-[9px] font-bold text-slate-300 hover:text-cyan-400 hover:bg-white/5 transition-colors"
                >
                  Chest Pain
                </button>
                <button 
                  onClick={() => handleSendMessage('Search O-Negative blood')}
                  className="px-2.5 py-1.5 rounded-lg bg-white/[0.02] border border-white/5 text-[9px] font-bold text-slate-300 hover:text-cyan-400 hover:bg-white/5 transition-colors"
                >
                  O- Blood Bank
                </button>
                <button 
                  onClick={() => handleSendMessage('Nearest ICU beds')}
                  className="px-2.5 py-1.5 rounded-lg bg-white/[0.02] border border-white/5 text-[9px] font-bold text-slate-300 hover:text-cyan-400 hover:bg-white/5 transition-colors"
                >
                  ICU Beds
                </button>
              </div>

              {/* Inputs */}
              <div className="p-3 border-t border-white/5 flex gap-2">
                <input
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type symptom or map command..."
                  className="flex-1 h-9 px-3 rounded-xl border border-white/10 bg-slate-900 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                />
                <button
                  onClick={() => handleSendMessage()}
                  className="w-9 h-9 rounded-xl bg-cyan-500 hover:bg-cyan-400 flex items-center justify-center text-slate-950 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>

            </div>
          )}
        </AnimatePresence>

        {/* Floating Trigger Bubble */}
        <button
          onClick={() => setAiOpen(!aiOpen)}
          className="w-14 h-14 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center relative group"
        >
          <span className="absolute inset-0 rounded-full animate-ping bg-cyan-500/25 z-0" />
          <Bot className="w-6 h-6 z-10" />
        </button>

      </div>

    </main>
  );
}
