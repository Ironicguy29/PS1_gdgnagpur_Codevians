'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Stethoscope, Building2, Beaker, Pill, Truck,
  ArrowLeft, ArrowRight, Activity, ShieldCheck, Cpu, Globe,
  HelpCircle, Shield, LifeBuoy, Flame, CheckCircle2, ChevronRight,
  Menu, X, Sparkles, Moon, Sun, Settings, LogIn, KeyRound
} from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import CountUp from 'react-countup';
import { useInView } from 'react-intersection-observer';
import Lenis from 'lenis';

export default function SelectPortal() {
  const router = useRouter();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('EN');
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Ref for card spotlight hover tracking
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const backButtonRef = useRef<HTMLButtonElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // InView hooks for lazy counting stats
  const { ref: statsRef, inView: statsInView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  // 1. Initial page animations & scroll setup
  useEffect(() => {
    // Scroll tracking for glass header transparency
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll);

    // Initial page fade-in
    gsap.fromTo('.gateway-animate-in',
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out' }
    );

    // Back to Home reveal
    gsap.fromTo(backButtonRef.current,
      { opacity: 0, x: -35 },
      { opacity: 1, x: 0, duration: 0.6, delay: 0.4, ease: 'back.out(1.7)' }
    );

    // Dynamic 3D tilt effect and spotlights tracking
    const handleMouseMoveCard = (e: MouseEvent, index: number) => {
      const card = cardsRef.current[index];
      if (!card) return;
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);

      // 3D rotation tilt calculation
      const cardWidth = rect.width;
      const cardHeight = rect.height;
      const centerX = rect.left + cardWidth / 2;
      const centerY = rect.top + cardHeight / 2;
      const mouseX = e.clientX - centerX;
      const mouseY = e.clientY - centerY;
      
      const rotateX = (mouseY / (cardHeight / 2)) * -6; // Max 6 deg
      const rotateY = (mouseX / (cardWidth / 2)) * 6; // Max 6 deg
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px) scale(1.04)`;
    };

    const handleMouseLeaveCard = (index: number) => {
      const card = cardsRef.current[index];
      if (!card) return;
      card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px) scale(1)`;
    };

    // Attach mouse handlers to cards
    cardsRef.current.forEach((card, idx) => {
      if (!card) return;
      const onMove = (e: MouseEvent) => handleMouseMoveCard(e, idx);
      const onLeave = () => handleMouseLeaveCard(idx);
      
      card.addEventListener('mousemove', onMove);
      card.addEventListener('mouseleave', onLeave);

      // Clean up local listeners
      card.setAttribute('data-listeners', 'true');
    });

    // 2. Custom Canvas Background Rendering: Gradient mesh, ECG, and moving rays
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        let animFrameId: number;
        
        const resizeCanvas = () => {
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // ECG Heartbeat properties
        let ecgOffset = 0;
        const ecgSpeed = 2.5;
        const ecgPoints: { x: number; y: number }[] = [];

        // Particles
        const particles: { x: number; y: number; r: number; dx: number; dy: number; alpha: number }[] = [];
        for (let i = 0; i < 40; i++) {
          particles.push({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            r: Math.random() * 2 + 1,
            dx: (Math.random() - 0.5) * 0.4,
            dy: (Math.random() - 0.5) * 0.4,
            alpha: Math.random() * 0.5 + 0.1,
          });
        }

        const renderCanvas = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          const isLight = document.documentElement.classList.contains('light');
          
          // A. Draw Gradient Mesh base
          const gradient = ctx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, 10,
            canvas.width / 2, canvas.height / 2, canvas.width
          );
          if (isLight) {
            gradient.addColorStop(0, '#f8fafc');
            gradient.addColorStop(0.5, '#f1f5f9');
            gradient.addColorStop(1, '#e2e8f0');
          } else {
            gradient.addColorStop(0, '#090d1a');
            gradient.addColorStop(0.5, '#04060f');
            gradient.addColorStop(1, '#020306');
          }
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // B. Draw breathing aurora glowing blobs
          const time = Date.now() * 0.0008;
          ctx.save();
          ctx.globalCompositeOperation = isLight ? 'multiply' : 'screen';
          
          // Blob 1 (Cyan)
          const b1x = canvas.width * 0.25 + Math.sin(time) * 100;
          const b1y = canvas.height * 0.35 + Math.cos(time * 0.8) * 80;
          const g1 = ctx.createRadialGradient(b1x, b1y, 0, b1x, b1y, 450);
          g1.addColorStop(0, isLight ? 'rgba(14, 165, 233, 0.12)' : 'rgba(6, 182, 212, 0.15)');
          g1.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = g1;
          ctx.beginPath();
          ctx.arc(b1x, b1y, 450, 0, Math.PI * 2);
          ctx.fill();

          // Blob 2 (Blue/Indigo)
          const b2x = canvas.width * 0.75 + Math.cos(time * 0.9) * 120;
          const b2y = canvas.height * 0.65 + Math.sin(time * 1.1) * 90;
          const g2 = ctx.createRadialGradient(b2x, b2y, 0, b2x, b2y, 500);
          g2.addColorStop(0, isLight ? 'rgba(99, 102, 241, 0.10)' : 'rgba(99, 102, 241, 0.12)');
          g2.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = g2;
          ctx.beginPath();
          ctx.arc(b2x, b2y, 500, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();

          // C. Draw glowing ECG heartbeat pulse line at bottom
          ctx.save();
          ctx.beginPath();
          ctx.strokeStyle = isLight ? 'rgba(2, 132, 199, 0.45)' : 'rgba(6, 182, 212, 0.25)';
          ctx.lineWidth = 2.0;
          ctx.shadowBlur = 12;
          ctx.shadowColor = isLight ? '#0284c7' : '#06b6d4';
          
          const ecgY = canvas.height * 0.8;
          ecgOffset += ecgSpeed;
          if (ecgOffset > canvas.width + 200) {
            ecgOffset = -100;
          }

          ctx.moveTo(0, ecgY);
          for (let x = 0; x < canvas.width; x += 1) {
            let dy = 0;
            // Create a heartbeat spike pattern near the offset point
            const dist = Math.abs(x - ecgOffset);
            if (dist < 40) {
              const normal = dist / 40; // 0 to 1
              if (normal < 0.1) dy = -85;
              else if (normal < 0.2) dy = 65;
              else if (normal < 0.3) dy = -30;
              else if (normal < 0.4) dy = 15;
              else dy = Math.sin(normal * Math.PI) * 4;
            } else {
              // Subtle noise flat line
              dy = Math.sin((x + time * 50) * 0.05) * 1.5;
            }
            ctx.lineTo(x, ecgY + dy);
          }
          ctx.stroke();
          ctx.restore();

          // D. Draw particles
          ctx.save();
          for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            p.x += p.dx;
            p.y += p.dy;

            // wrap around boundaries
            if (p.x < 0) p.x = canvas.width;
            if (p.x > canvas.width) p.x = 0;
            if (p.y < 0) p.y = canvas.height;
            if (p.y > canvas.height) p.y = 0;

            ctx.fillStyle = isLight ? `rgba(2, 132, 199, ${p.alpha * 0.8})` : `rgba(103, 232, 249, ${p.alpha})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();

          animFrameId = requestAnimationFrame(renderCanvas);
        };
        renderCanvas();

        return () => {
          cancelAnimationFrame(animFrameId);
          window.removeEventListener('resize', resizeCanvas);
        };
      }
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Magnetic effect implementation for Back Button
  const handleBackButtonMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = backButtonRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - (rect.left + rect.width / 2);
    const y = e.clientY - (rect.top + rect.height / 2);
    
    // Magnetic pull
    gsap.to(btn, {
      x: x * 0.35,
      y: y * 0.35,
      duration: 0.3,
      ease: 'power2.out',
    });
  };

  const handleBackButtonMouseLeave = () => {
    const btn = backButtonRef.current;
    if (!btn) return;
    gsap.to(btn, {
      x: 0,
      y: 0,
      duration: 0.5,
      ease: 'elastic.out(1.2, 0.4)',
    });
  };

  const portals = [
    {
      id: 'patient',
      title: 'Patient Portal',
      desc: 'Book appointments, track queue, manage ABHA, digital prescriptions, medical reports and AI assistance.',
      icon: <User className="w-7 h-7 text-emerald-400 group-hover:-translate-y-1.5 transition-transform duration-300" />,
      color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30',
      glow: 'shadow-emerald-500/10',
      href: '/auth/patient/login'
    },
    {
      id: 'doctor',
      title: 'Doctor Station',
      desc: 'OPD management, appointments, patient history, prescriptions, diagnosis and AI clinical support.',
      icon: <Stethoscope className="w-7 h-7 text-cyan-400 group-hover:-translate-y-1.5 transition-transform duration-300" />,
      color: 'from-cyan-500/20 to-blue-500/10 border-cyan-500/30',
      glow: 'shadow-cyan-500/10',
      href: '/auth/doctor/login'
    },
    {
      id: 'admin',
      title: 'Admin HQ',
      desc: 'Hospital analytics, dashboards, staff management, reports, emergency monitoring and resource allocation.',
      icon: <Building2 className="w-7 h-7 text-slate-300 group-hover:-translate-y-1.5 transition-transform duration-300" />,
      color: 'from-slate-700/20 to-slate-800/10 border-slate-600/30',
      glow: 'shadow-slate-500/5',
      href: '/auth/admin/login'
    },
    {
      id: 'lab',
      title: 'Lab Portal',
      desc: 'Diagnostic requests, report generation, pathology workflow, AI analysis and result publishing.',
      icon: <Beaker className="w-7 h-7 text-indigo-400 group-hover:-translate-y-1.5 transition-transform duration-300" />,
      color: 'from-indigo-500/20 to-purple-500/10 border-indigo-500/30',
      glow: 'shadow-indigo-500/10',
      href: '/auth/lab/login'
    },
    {
      id: 'pharmacy',
      title: 'Pharmacy Portal',
      desc: 'Inventory, medicine dispensing, prescription validation, stock alerts and billing.',
      icon: <Pill className="w-7 h-7 text-pink-400 group-hover:-translate-y-1.5 transition-transform duration-300" />,
      color: 'from-pink-500/20 to-rose-500/10 border-pink-500/30',
      glow: 'shadow-pink-500/10',
      href: '/auth/pharmacy/login'
    },
    {
      id: 'driver',
      title: 'Driver Portal',
      desc: 'Ambulance dispatch, GPS navigation, emergency routing, hospital coordination and live status.',
      icon: <Truck className="w-7 h-7 text-amber-400 group-hover:-translate-y-1.5 transition-transform duration-300" />,
      color: 'from-amber-500/20 to-red-500/10 border-amber-500/30',
      glow: 'shadow-amber-500/10',
      href: '/auth/driver/login'
    }
  ];

  const timelineNodes = [
    { name: 'Patient', color: 'text-emerald-400' },
    { name: 'Hospital', color: 'text-cyan-400' },
    { name: 'Doctor', color: 'text-blue-400' },
    { name: 'Lab', color: 'text-indigo-400' },
    { name: 'Pharmacy', color: 'text-pink-400' },
    { name: 'Recovery', color: 'text-teal-400' }
  ];

  return (
    <div className="min-h-screen w-full text-slate-800 dark:text-slate-200 relative overflow-x-hidden select-none bg-slate-50 dark:bg-[#030611] font-sans pb-12 flex flex-col justify-between">
      
      {/* GLSL ECG Canvas Background */}
      <canvas ref={canvasRef} className="fixed inset-0 w-full h-full -z-20 pointer-events-none" />

      {/* Subtle Noise Texture overlay */}
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none -z-10" />

      {/* 1. Floating Glass Navbar Header */}
      <nav className={`fixed top-0 left-0 w-full z-40 transition-all duration-300 ${
        scrollY > 20 
          ? 'py-3.5 bg-white/85 dark:bg-[#090d1a]/85 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/5 shadow-lg dark:shadow-2xl' 
          : 'py-5 bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-2.5 cursor-pointer group" onClick={() => router.push('/')}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <Activity className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">Arogya<span className="text-cyan-600 dark:text-cyan-400">Mitra</span></span>
              <span className="block text-[7.5px] tracking-[0.2em] text-slate-500 uppercase font-semibold">Gateway Control</span>
            </div>
          </div>

          {/* Links */}
          <div className="hidden lg:flex items-center gap-8">
            {['Home', 'Features', 'Hospitals', 'About', 'Contact'].map((link) => (
              <a
                key={link}
                href={link === 'Home' ? '/' : `#${link.toLowerCase()}`}
                className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors tracking-wide uppercase"
              >
                {link}
              </a>
            ))}
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-full border border-slate-200 dark:border-white/5 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors" 
              aria-label="Toggle Theme"
            >
              {mounted && resolvedTheme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              )}
            </button>

            {/* Language Selector */}
            <div className="relative">
              <button 
                onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                className="px-3 py-1.5 rounded-full border border-slate-200 dark:border-white/5 bg-slate-100 dark:bg-white/5 text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1.5"
              >
                <Globe className="w-3.5 h-3.5" />
                {selectedLanguage}
              </button>
              
              <AnimatePresence>
                {showLanguageDropdown && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 p-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl shadow-2xl flex flex-col gap-1 z-50 min-w-[80px]"
                  >
                    {['EN', 'HI', 'MR'].map((lang) => (
                      <button
                        key={lang}
                        onClick={() => {
                          setSelectedLanguage(lang);
                          setShowLanguageDropdown(false);
                        }}
                        className="px-2.5 py-1 text-left text-xs font-medium text-slate-700 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                      >
                        {lang}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button 
              onClick={() => router.push('/auth/select')}
              className="px-4 py-1.5 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:border-cyan-400 transition-colors"
            >
              Get Started
            </button>
          </div>

        </div>
      </nav>

      {/* Main Body Grid */}
      <div className="max-w-7xl w-full mx-auto px-6 pt-28 pb-12 flex-1 flex flex-col justify-center gap-8 relative z-10">
        
        {/* Floating Back Button */}
        <div className="flex justify-start">
          <button
            ref={backButtonRef}
            onClick={() => router.push('/')}
            onMouseMove={handleBackButtonMouseMove}
            onMouseLeave={handleBackButtonMouseLeave}
            className="flex items-center gap-2.5 px-5 h-11 rounded-full bg-white/80 dark:bg-[#0a0f1d]/70 hover:bg-slate-100 dark:hover:bg-[#0d1428]/95 border border-slate-200/80 dark:border-white/10 backdrop-blur-md text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all shadow-md dark:shadow-xl hover:border-cyan-500/30 cursor-pointer outline-none focus:ring-2 focus:ring-cyan-500/50"
            aria-label="Back to Home"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Back to Home</span>
          </button>
        </div>

        {/* Hero Header */}
        <div className="text-center space-y-4 max-w-4xl mx-auto gateway-animate-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-xs font-semibold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            ArogyaMitra Operating System
          </div>
          <h2 className="text-4xl md:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            Choose Your Access Portal
          </h2>
          <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Secure biometric and tokenized gateway authorization protocols. Pick your designated platform access below.
          </p>
        </div>

        {/* 2. Unified Clinical Timeline Flow */}
        <div className="py-6 w-full max-w-5xl mx-auto gateway-animate-in">
          <div className="relative p-6 rounded-3xl border border-slate-200/80 dark:border-white/5 bg-white/70 dark:bg-[#070b16]/40 backdrop-blur-xl shadow-md dark:shadow-none">
            <div className="absolute top-3 left-6 text-[10px] uppercase font-bold tracking-widest text-slate-500">
              Interactive Patient Lifecycle Flow
            </div>
            
            {/* Timeline nodes */}
            <div className="grid grid-cols-6 items-center text-center pt-4 relative">
              {timelineNodes.map((node, index) => (
                <div key={index} className="flex flex-col items-center relative z-10">
                  <div className={`w-8 h-8 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 flex items-center justify-center shadow-lg group hover:border-cyan-500/30 transition-colors`}>
                    <div className="w-2.5 h-2.5 rounded-full bg-cyan-500 dark:bg-cyan-400 animate-pulse" />
                  </div>
                  <span className={`text-[11px] font-bold mt-2 uppercase tracking-wider ${node.color}`}>{node.name}</span>
                </div>
              ))}

              {/* Connecting glowing vector line */}
              <div className="absolute top-[30px] left-[8.33%] right-[8.33%] h-[1px] bg-gradient-to-r from-emerald-500 via-cyan-500 to-teal-500 opacity-30 -z-10" />
            </div>
          </div>
        </div>

        {/* 3. Portal Selection Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto w-full pt-4 gateway-animate-in">
          {portals.map((portal, i) => (
            <div
              key={portal.id}
              ref={(el) => { cardsRef.current[i] = el; }}
              onClick={() => router.push(portal.href)}
              className="relative p-7 rounded-3xl bg-white/80 dark:bg-[#090d1a]/55 border border-slate-200/80 dark:border-white/10 hover:border-cyan-500/40 backdrop-blur-md overflow-hidden cursor-pointer transition-all duration-300 group flex flex-col justify-between min-h-[290px] shadow-xl dark:shadow-none"
              style={{
                boxShadow: hoveredCard === i ? "0 20px 40px -15px rgba(6, 182, 212, 0.25)" : undefined
              }}
              onMouseEnter={() => setHoveredCard(i)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              {/* Spotlight pointer hover glow */}
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{
                  background: `radial-gradient(350px circle at var(--mouse-x, 0px) var(--mouse-y, 0px), rgba(6, 182, 212, 0.12), transparent 80%)`
                }}
              />

              {/* Accent colored background aura behind icon */}
              <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-cyan-500/5 to-transparent rounded-tr-3xl group-hover:from-cyan-500/15 transition-all`} />

              <div className="space-y-5 relative z-10">
                {/* Large Gradient Icon wrapper */}
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${portal.color} flex items-center justify-center shadow-2xl group-hover:scale-105 transition-transform duration-300`}>
                  {portal.icon}
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors flex items-center gap-1.5">
                    {portal.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-light">
                    {portal.desc}
                  </p>
                </div>
              </div>

              {/* Enter CTA bottom button */}
              <div className="pt-6 relative z-10 flex items-center justify-between border-t border-slate-200/80 dark:border-white/5 mt-4">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-500 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">Authorization Required</span>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 dark:border-white/5 bg-slate-100 dark:bg-white/5 text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:bg-cyan-500 group-hover:text-white dark:group-hover:text-slate-900 group-hover:border-cyan-400 transition-all">
                  <span>Enter Portal</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* 4. Counting Statistics Banner */}
        <div ref={statsRef} className="py-8 w-full max-w-5xl mx-auto stats-section gateway-animate-in border-t border-slate-200/80 dark:border-white/5 mt-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            
            <div className="p-4 rounded-2xl bg-white/70 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 backdrop-blur-md shadow-md dark:shadow-none">
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {statsInView ? <CountUp start={0} end={50} suffix="+" duration={2.5} /> : "0+"}
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-1.5 font-bold">Government Hospitals</div>
            </div>

            <div className="p-4 rounded-2xl bg-white/70 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 backdrop-blur-md shadow-md dark:shadow-none">
              <div className="text-3xl font-extrabold text-cyan-600 dark:text-cyan-400">
                {statsInView ? <CountUp start={0} end={2} suffix="M+" duration={2.5} /> : "0M+"}
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-1.5 font-bold">Patients Served</div>
            </div>

            <div className="p-4 rounded-2xl bg-white/70 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 backdrop-blur-md shadow-md dark:shadow-none">
              <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {statsInView ? <CountUp start={0} end={99.9} decimals={1} suffix="%" duration={2.5} /> : "0%"}
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-1.5 font-bold">System Uptime</div>
            </div>

            <div className="p-4 rounded-2xl bg-white/70 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 backdrop-blur-md shadow-md dark:shadow-none">
              <div className="text-3xl font-extrabold text-rose-600 dark:text-rose-400">
                {statsInView ? "24×7" : "24×7"}
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-1.5 font-bold">Emergency Support</div>
            </div>

          </div>
        </div>

      </div>

      {/* 5. Portal Footer */}
      <footer className="w-full border-t border-slate-200 dark:border-white/10 bg-slate-100/90 dark:bg-[#02040a]/90 py-10 px-6 mt-12 relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          <div className="space-y-3.5">
            <h4 className="text-xs uppercase font-extrabold text-slate-900 dark:text-white tracking-widest">Need Immediate Help?</h4>
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 text-sm font-semibold">
              <Flame className="w-4 h-4 animate-bounce" />
              Emergency Toll-Free: 108 / 102
            </div>
            <p className="text-xs text-slate-500">
              National Health Authority Call Center support open 24 hours.
            </p>
          </div>

          <div className="space-y-3.5">
            <h4 className="text-xs uppercase font-extrabold text-slate-900 dark:text-white tracking-widest">Gateway Resources</h4>
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-600 dark:text-slate-400">
              <a href="#" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">Terms of Use</a>
              <a href="#" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">API Docs</a>
              <a href="#" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">Support Center</a>
            </div>
          </div>

          <div className="space-y-3.5">
            <h4 className="text-xs uppercase font-extrabold text-slate-900 dark:text-white tracking-widest">Government Links</h4>
            <div className="flex flex-col gap-1.5 text-xs text-slate-600 dark:text-slate-400">
              <a href="https://abdm.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">NHA (Ayushman Bharat)</a>
              <a href="https://www.mohfw.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">Ministry of Health & Family Welfare</a>
            </div>
          </div>

          <div className="space-y-3.5 text-right md:text-left">
            <h4 className="text-xs uppercase font-extrabold text-slate-900 dark:text-white tracking-widest">Network Status</h4>
            <div className="flex items-center gap-1.5 justify-end md:justify-start pt-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">All Gateway Nodes Operational</span>
            </div>
            <p className="text-[11px] text-slate-500 pt-1">
              Encryption: TLS 1.3 / AES-256
            </p>
          </div>

        </div>
      </footer>
    </div>
  );
}
