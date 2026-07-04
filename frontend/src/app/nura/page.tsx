'use client';

import { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  ArrowRight, 
  Activity, 
  Dna, 
  Flame, 
  TrendingUp, 
  Check, 
  ShieldCheck, 
  Sparkles,
  RefreshCw,
  Plus,
  Menu,
  X
} from 'lucide-react';

// Register ScrollTrigger client-side
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// ----------------- WIDGET 1: DIAGNOSTIC SHUFFLER -----------------
function DiagnosticShuffler() {
  const [cards, setCards] = useState([
    {
      id: 'epigenetic',
      title: 'Epigenetic Age',
      value: '-6.4 Yrs',
      metric: 'Methylation Rate: 0.88x',
      status: 'Optimal Rate',
      color: 'border-emerald-700/20 text-[#2E4036]'
    },
    {
      id: 'microbiome',
      title: 'Microbiome Score',
      value: '94 / 100',
      metric: 'Diversity Index: 4.85',
      status: 'High Diversity',
      color: 'border-amber-700/20 text-[#CC5833]'
    },
    {
      id: 'cortisol',
      title: 'Cortisol Curve',
      value: '11.2 μg/dL',
      metric: 'Peak Offset: -15 min',
      status: 'Balanced Rise',
      color: 'border-blue-700/20 text-slate-800'
    }
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCards(prev => {
        const next = [...prev];
        const last = next.pop()!;
        next.unshift(last);
        return next;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-[220px] flex items-center justify-center">
      {cards.map((card, index) => {
        // Position styles based on index
        let positionClass = '';
        if (index === 0) {
          // Front / Top
          positionClass = 'z-30 scale-100 translate-y-0 opacity-100 shadow-xl shadow-[#2E4036]/5';
        } else if (index === 1) {
          // Middle
          positionClass = 'z-20 scale-95 translate-y-[24px] opacity-75 pointer-events-none';
        } else {
          // Back / Bottom
          positionClass = 'z-10 scale-90 translate-y-[48px] opacity-40 pointer-events-none';
        }

        return (
          <div
            key={card.id}
            className={`absolute w-[90%] max-w-[280px] bg-white border rounded-[1.5rem] p-5 card-spring-transition ${positionClass} ${card.color}`}
            style={{
              transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase tracking-wider font-semibold opacity-60 font-outfit">
                {card.title}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            </div>
            
            <div className="text-[28px] font-bold tracking-tight font-outfit mb-1">
              {card.value}
            </div>
            
            <div className="text-[12px] font-mono opacity-80 mb-2">
              {card.metric}
            </div>

            <div className="pt-2 border-t border-black/5 flex items-center justify-between text-[10px] font-semibold font-sans-nura">
              <span className="opacity-60">Status:</span>
              <span className="underline decoration-wavy underline-offset-2">{card.status}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ----------------- WIDGET 2: TELEMETRY TYPEWRITER -----------------
const TELEMETRY_MESSAGES = [
  "Sequencing epigenetic biomarkers...",
  "Calibrating adrenal response curves...",
  "Analyzing microbiome diversity indexes...",
  "Optimizing circadian rhythm...",
  "Adjusting lipid profile metrics...",
  "Synthesizing customized peptide regimen..."
];

function TelemetryTypewriter() {
  const [msgIndex, setMsgIndex] = useState(0);
  const [subText, setSubText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [logs, setLogs] = useState<string[]>([
    "09:12:04 SYSTEM INITIALIZED",
    "09:12:05 SCANNING METHYLATION ENGINE",
    "09:12:08 CALIBRATING SENSOR ARRAYS"
  ]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    const currentFullText = TELEMETRY_MESSAGES[msgIndex];

    if (!isDeleting) {
      if (subText.length < currentFullText.length) {
        timer = setTimeout(() => {
          setSubText(currentFullText.substring(0, subText.length + 1));
        }, 60);
      } else {
        // Pause at the end
        timer = setTimeout(() => {
          setIsDeleting(true);
        }, 2200);
      }
    } else {
      if (subText.length > 0) {
        timer = setTimeout(() => {
          setSubText(currentFullText.substring(0, subText.length - 1));
        }, 30);
      } else {
        setIsDeleting(false);
        setMsgIndex(prev => (prev + 1) % TELEMETRY_MESSAGES.length);
        // Append a new log event
        setLogs(prev => {
          const timestamp = new Date().toTimeString().split(' ')[0];
          const newEvent = `${timestamp} - UPDATING METRICS`;
          return [newEvent, prev[0], prev[1]].slice(0, 3);
        });
      }
    }

    return () => clearTimeout(timer);
  }, [subText, isDeleting, msgIndex]);

  return (
    <div className="flex flex-col h-[220px] bg-[#1A1A1A] text-[#F2F0E9] font-mono p-5 rounded-[2rem] border border-white/10 select-none justify-between">
      {/* Live status bar */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#CC5833] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#CC5833]"></span>
          </span>
          <span className="text-[10px] font-bold text-white/60 tracking-wider">LIVE TELEMETRY STREAM</span>
        </div>
        <span className="text-[9px] text-white/40">ID: NURA-909</span>
      </div>

      {/* Primary Typewriter Content */}
      <div className="flex-1 py-4 flex flex-col justify-center">
        <div className="text-[13px] text-emerald-400 font-semibold tracking-wide h-[40px] flex items-center">
          &gt; {subText}
          <span className="w-1.5 h-4 bg-[#CC5833] ml-1 animate-pulse" />
        </div>
      </div>

      {/* Historical Logs */}
      <div className="space-y-1 pt-3 border-t border-white/5 text-[9px] text-white/50">
        {logs.map((log, index) => (
          <div key={index} className="flex justify-between">
            <span>{log}</span>
            <span className="text-emerald-500/60">OK</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ----------------- WIDGET 3: CURSOR PROTOCOL SCHEDULER -----------------
const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function CursorProtocolScheduler() {
  const [activeDay, setActiveDay] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const wednesdayRef = useRef<HTMLButtonElement>(null);
  const saveBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const ctx = gsap.context(() => {
      const animLoop = () => {
        if (!containerRef.current || !cursorRef.current || !wednesdayRef.current || !saveBtnRef.current) return;

        const parentRect = containerRef.current.getBoundingClientRect();
        const wedRect = wednesdayRef.current.getBoundingClientRect();
        const saveRect = saveBtnRef.current.getBoundingClientRect();

        // Calculate positions relative to parent container
        const wedX = (wedRect.left - parentRect.left) + wedRect.width / 2;
        const wedY = (wedRect.top - parentRect.top) + wedRect.height / 2;

        const saveX = (saveRect.left - parentRect.left) + saveRect.width / 2;
        const saveY = (saveRect.top - parentRect.top) + saveRect.height / 2;

        // Reset state
        setActiveDay(null);
        setSaved(false);

        const tl = gsap.timeline({
          onComplete: () => {
            // Restart loop after delay
            setTimeout(animLoop, 1500);
          }
        });

        // 1. Cursor enters from top right
        tl.set(cursorRef.current, { x: 300, y: 180, opacity: 0 })
          .to(cursorRef.current, { opacity: 1, x: wedX, y: wedY, duration: 1.5, ease: "power2.out" })
          // 2. Click Wednesday
          .call(() => {
            setActiveDay(3); // Wednesday index
          })
          .to(wednesdayRef.current, { scale: 0.85, duration: 0.1, yoyo: true, repeat: 1 })
          // 3. Move to Save Button
          .to(cursorRef.current, { x: saveX, y: saveY, duration: 1.2, ease: "power2.inOut", delay: 0.5 })
          // 4. Click Save Button
          .call(() => {
            setSaved(true);
          })
          .to(saveBtnRef.current, { scale: 0.95, duration: 0.1, yoyo: true, repeat: 1 })
          // 5. Fade out cursor
          .to(cursorRef.current, { opacity: 0, duration: 0.5, delay: 0.4 });
      };

      // Delay start slightly to allow layouts to paint and get rects correctly
      const initialTimeout = setTimeout(animLoop, 1000);
      return () => clearTimeout(initialTimeout);
    });

    return () => ctx.revert();
  }, []);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-[220px] bg-white border border-[#2E4036]/15 rounded-[2rem] p-5 flex flex-col justify-between select-none overflow-hidden"
    >
      {/* Title */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider font-semibold opacity-60 font-outfit">
          Adaptive Regimen
        </span>
        <span className="text-[9px] text-[#CC5833] font-bold font-mono">STEP 03: SCHEDULE</span>
      </div>

      {/* Week Grid */}
      <div>
        <div className="text-[11px] opacity-50 mb-2 font-sans-nura">Select optimization cycle:</div>
        <div className="grid grid-cols-7 gap-2">
          {DAYS.map((day, idx) => (
            <button
              key={idx}
              ref={idx === 3 ? wednesdayRef : null}
              className={`h-9 rounded-xl border flex items-center justify-center text-[12px] font-bold font-outfit transition-all duration-300 ${
                activeDay === idx 
                  ? 'bg-[#2E4036] text-[#F2F0E9] border-[#2E4036]' 
                  : 'bg-transparent text-[#2E4036] border-[#2E4036]/10 hover:border-[#2E4036]/30'
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <button
        ref={saveBtnRef}
        className={`w-full py-2.5 rounded-xl text-[12px] font-bold tracking-wide font-sans-nura transition-all duration-300 flex items-center justify-center gap-2 ${
          saved 
            ? 'bg-[#CC5833] text-white border-[#CC5833]' 
            : 'bg-black text-[#F2F0E9] border-black'
        }`}
      >
        {saved ? (
          <>
            <Check size={14} /> Regimen Locked
          </>
        ) : (
          'Lock Regimen'
        )}
      </button>

      {/* Mock Cursor */}
      <div
        ref={cursorRef}
        className="absolute pointer-events-none z-50 transition-transform duration-100 ease-out"
        style={{ width: '18px', height: '18px', left: 0, top: 0 }}
      >
        <svg viewBox="0 0 24 24" className="w-full h-full fill-[#CC5833] stroke-white stroke-2 drop-shadow-md">
          <path d="M4.5 3v15.2l4.8-4.8h6.2L4.5 3z" />
        </svg>
      </div>
    </div>
  );
}

// ----------------- MAIN COMPONENT -----------------
export default function NuraLandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Refs for ScrollTrigger Animations
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const manifestoRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);

  // Protocol Cards Refs
  const card1Ref = useRef<HTMLDivElement>(null);
  const card2Ref = useRef<HTMLDivElement>(null);
  const card3Ref = useRef<HTMLDivElement>(null);

  // Parallax Ref
  const parallaxBgRef = useRef<HTMLDivElement>(null);

  // Set up Scroll listener for Floating Island Navbar
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Staggered Fade Up for Hero & Manifesto ScrollTrigger Animations
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const ctx = gsap.context(() => {
      // 1. Hero Text Entrance Animations
      gsap.fromTo('.hero-fade-up', 
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.2, ease: 'power4.out', stagger: 0.15, delay: 0.2 }
      );

      // 2. Manifesto Split Text Reveal
      gsap.fromTo('.reveal-word', 
        { y: '100%', rotateX: -30, opacity: 0 },
        { 
          y: '0%', 
          rotateX: 0,
          opacity: 1,
          duration: 0.9, 
          ease: 'power3.out', 
          stagger: 0.05,
          scrollTrigger: {
            trigger: manifestoRef.current,
            start: 'top 80%',
            toggleActions: 'play none none none'
          }
        }
      );

      // 3. Manifesto Background Parallax Scroll Effect
      gsap.fromTo(parallaxBgRef.current,
        { y: '-10%' },
        {
          y: '10%',
          ease: 'none',
          scrollTrigger: {
            trigger: manifestoRef.current,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true
          }
        }
      );

      // 4. Protocol Sticky Cards Stack Effects
      // Card 1 Scales and Fades Out as Card 2 Scrolls in
      gsap.to(card1Ref.current, {
        scale: 0.9,
        filter: 'blur(20px)',
        opacity: 0.5,
        scrollTrigger: {
          trigger: card2Ref.current,
          start: 'top bottom',
          end: 'top top',
          scrub: true
        }
      });

      // Card 2 Scales and Fades Out as Card 3 Scrolls in
      gsap.to(card2Ref.current, {
        scale: 0.9,
        filter: 'blur(20px)',
        opacity: 0.5,
        scrollTrigger: {
          trigger: card3Ref.current,
          start: 'top bottom',
          end: 'top top',
          scrub: true
        }
      });
    }, mainContainerRef);

    return () => ctx.revert();
  }, []);

  // Split-text arrays for manifesto
  const manifestoText1 = "Modern medicine asks: What is wrong?".split(" ");
  const manifestoText2 = "We ask: What is optimal?".split(" ");

  return (
    <div ref={mainContainerRef} className="w-full relative overflow-x-hidden font-sans-nura">

      {/* A. NAVBAR (The Floating Island) */}
      <nav 
        className={`fixed top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-5xl z-[999] rounded-full px-8 py-3.5 flex items-center justify-between transition-all duration-500 border ${
          scrolled 
            ? 'bg-white/60 backdrop-blur-md text-[#2E4036] border-[#2E4036]/10 shadow-[0_8px_30px_rgba(46,64,54,0.05)]' 
            : 'bg-transparent text-white border-transparent'
        }`}
      >
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors duration-500 ${
            scrolled ? 'border-[#2E4036]/30 bg-[#2E4036]/5' : 'border-white/30 bg-white/5'
          }`}>
            <Dna size={15} className="animate-spin-slow" />
          </div>
          <span className="font-outfit font-extrabold text-[16px] tracking-[0.2em] leading-none uppercase">
            NURA <span className="opacity-50 font-light">HEALTH</span>
          </span>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8 font-sans-nura text-[12px] font-bold tracking-wider uppercase">
          <a href="#features" className="hover:opacity-75 transition-opacity">Precision Dashboard</a>
          <a href="#manifesto" className="hover:opacity-75 transition-opacity">Philosophy</a>
          <a href="#protocol" className="hover:opacity-75 transition-opacity">Protocols</a>
          <a href="#membership" className="hover:opacity-75 transition-opacity">Membership</a>
        </div>

        {/* Magnetic Get Started Button */}
        <div className="hidden md:block">
          <button 
            className={`relative overflow-hidden group px-6 py-2.5 rounded-full text-[11px] font-bold tracking-wider uppercase transition-all duration-300 hover:scale-105 active:scale-95 ${
              scrolled 
                ? 'bg-[#2E4036] text-[#F2F0E9]' 
                : 'bg-white text-[#1A1A1A]'
            }`}
          >
            {/* Sliding background layer */}
            <span className="absolute inset-0 w-full h-full bg-[#CC5833] transform scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100 -z-10" />
            <span className="relative z-10 transition-colors duration-300 group-hover:text-white">Get Started</span>
          </button>
        </div>

        {/* Mobile Hamburger Menu Toggle */}
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
          className="md:hidden p-1 transition-opacity hover:opacity-80"
          aria-label="Toggle Navigation Menu"
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="absolute top-16 left-0 right-0 mx-auto w-full bg-[#1A1A1A] text-white rounded-[2rem] border border-white/10 p-6 flex flex-col gap-4 shadow-2xl z-[999] md:hidden">
            <a 
              href="#features" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-[16px] font-medium border-b border-white/5 pb-2"
            >
              Precision Dashboard
            </a>
            <a 
              href="#manifesto" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-[16px] font-medium border-b border-white/5 pb-2"
            >
              Philosophy
            </a>
            <a 
              href="#protocol" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-[16px] font-medium border-b border-white/5 pb-2"
            >
              Protocols
            </a>
            <a 
              href="#membership" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-[16px] font-medium pb-2"
            >
              Membership
            </a>
            <button className="w-full py-3 bg-[#CC5833] text-white rounded-full font-bold text-[14px]">
              Get Started
            </button>
          </div>
        )}
      </nav>


      {/* B. HERO SECTION (Nature is the Algorithm) */}
      <section className="relative w-full h-[100dvh] flex items-end justify-start px-6 md:px-16 pb-16 md:pb-24 overflow-hidden select-none">
        
        {/* Background Image with Heavy Moss-to-Black gradient overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center z-0 scale-105"
          style={{ 
            backgroundImage: `url('https://images.unsplash.com/photo-1511497584788-876760111969?q=80&w=2000&auto=format&fit=crop')`
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] via-[#2E4036]/65 to-transparent z-10" />
        <div className="absolute inset-0 bg-black/40 z-10" />

        {/* Content pushed to bottom-left third */}
        <div className="max-w-3xl relative z-20 text-white">
          <div className="hero-fade-up inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 mb-6 backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-[#CC5833] animate-pulse" />
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase font-outfit">
              Clinical Optimization Platform
            </span>
          </div>

          <h1 className="hero-fade-up text-[48px] md:text-[84px] leading-[0.9] font-extrabold tracking-tighter uppercase font-outfit">
            Nature is the <br />
            <span className="text-[52px] md:text-[96px] font-serif-nura italic capitalize text-[#F2F0E9] font-light font-cormorant leading-tight">
              Algorithm.
            </span>
          </h1>

          <p className="hero-fade-up mt-6 text-[15px] md:text-[18px] text-[#F2F0E9]/80 font-medium max-w-xl font-sans-nura leading-relaxed">
            Nura Health bridges avant-garde biological intelligence with bespoke protocols, engineering optimal performance from the cellular level up.
          </p>

          <div className="hero-fade-up mt-8 flex flex-wrap gap-4">
            <a 
              href="#features"
              className="relative overflow-hidden group px-8 py-3.5 rounded-full bg-[#CC5833] text-white text-[12px] font-bold tracking-wider uppercase transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg shadow-[#CC5833]/20 flex items-center gap-2"
            >
              <span className="absolute inset-0 w-full h-full bg-[#2E4036] transform scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100 -z-10" />
              <span>Explore Dashboard</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </a>
            
            <a 
              href="#protocol"
              className="px-8 py-3.5 rounded-full border border-white/20 hover:border-white/50 text-[#F2F0E9] hover:bg-white/5 text-[12px] font-bold tracking-wider uppercase transition-all duration-300"
            >
              Clinical Protocols
            </a>
          </div>
        </div>
      </section>


      {/* C. FEATURES (The Precision Micro-UI Dashboard) */}
      <section id="features" className="py-24 px-6 md:px-16 max-w-7xl mx-auto">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <span className="text-[11px] font-bold tracking-[0.2em] text-[#CC5833] uppercase font-outfit">
            CELLULAR TELEMETRY
          </span>
          <h2 className="text-[36px] md:text-[48px] font-extrabold tracking-tight leading-none text-[#2E4036] mt-3 font-outfit">
            The Precision Micro-UI Dashboard
          </h2>
          <p className="text-[14px] md:text-[16px] text-[#1A1A1A]/70 mt-4 leading-relaxed">
            Monitor, calibrate, and lock your biological parameters in real time using our interactive diagnostic telemetry modules.
          </p>
        </div>

        {/* Dashboard Cards Grid - Rounded [2rem] to [3rem] */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Card 1: Diagnostic Shuffler */}
          <div className="bg-[#2E4036]/5 border border-[#2E4036]/10 rounded-[2.5rem] p-8 flex flex-col justify-between h-[420px] shadow-sm hover:shadow-md transition-shadow">
            <div>
              <div className="w-10 h-10 rounded-full bg-[#2E4036] text-[#F2F0E9] flex items-center justify-center mb-6">
                <Flame size={18} />
              </div>
              <h3 className="text-[20px] font-bold tracking-tight text-[#2E4036] font-outfit">
                Audit Intelligence
              </h3>
              <p className="text-[13px] text-[#1A1A1A]/70 mt-2 leading-relaxed">
                Dynamic, vertical shuffling of clinical diagnostics. Track fluctuating biological metrics over staggered test cycles.
              </p>
            </div>
            
            {/* Shuffler Component */}
            <div className="mt-4">
              <DiagnosticShuffler />
            </div>
          </div>

          {/* Card 2: Neural Stream */}
          <div className="bg-[#2E4036]/5 border border-[#2E4036]/10 rounded-[2.5rem] p-8 flex flex-col justify-between h-[420px] shadow-sm hover:shadow-md transition-shadow">
            <div>
              <div className="w-10 h-10 rounded-full bg-[#CC5833] text-white flex items-center justify-center mb-6">
                <Activity size={18} />
              </div>
              <h3 className="text-[20px] font-bold tracking-tight text-[#2E4036] font-outfit">
                Neural Stream
              </h3>
              <p className="text-[13px] text-[#1A1A1A]/70 mt-2 leading-relaxed">
                A live, simulated clinical feed detailing real-time physiological optimizations and micro-adjustments.
              </p>
            </div>

            {/* Typewriter Component */}
            <div className="mt-4">
              <TelemetryTypewriter />
            </div>
          </div>

          {/* Card 3: Adaptive Regimen */}
          <div className="bg-[#2E4036]/5 border border-[#2E4036]/10 rounded-[2.5rem] p-8 flex flex-col justify-between h-[420px] shadow-sm hover:shadow-md transition-shadow">
            <div>
              <div className="w-10 h-10 rounded-full bg-black text-[#F2F0E9] flex items-center justify-center mb-6">
                <TrendingUp size={18} />
              </div>
              <h3 className="text-[20px] font-bold tracking-tight text-[#2E4036] font-outfit">
                Adaptive Regimen
              </h3>
              <p className="text-[13px] text-[#1A1A1A]/70 mt-2 leading-relaxed">
                Automated curation protocol. Watch the scheduler automatically log, verify, and lock the weekly metabolic regimen.
              </p>
            </div>

            {/* Scheduler Component */}
            <div className="mt-4">
              <CursorProtocolScheduler />
            </div>
          </div>

        </div>
      </section>


      {/* D. PHILOSOPHY (The Manifesto) */}
      <section 
        id="manifesto" 
        ref={manifestoRef}
        className="relative py-32 px-6 md:px-16 bg-[#1A1A1A] text-[#F2F0E9] overflow-hidden select-none"
      >
        {/* Parallax texture layer */}
        <div 
          ref={parallaxBgRef}
          className="absolute inset-0 bg-cover bg-center opacity-10 pointer-events-none scale-110"
          style={{ 
            backgroundImage: `url('https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=2000&auto=format&fit=crop')` 
          }}
        />

        <div className="max-w-5xl mx-auto relative z-10">
          <span className="text-[11px] font-bold tracking-[0.2em] text-[#CC5833] uppercase font-outfit block mb-6">
            NURA MANIFESTO
          </span>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-start mt-8">
            {/* Standard medicine */}
            <div>
              <p className="text-[12px] uppercase tracking-widest font-bold opacity-40 font-mono mb-4">
                [ CLINICAL PARADIGM A ]
              </p>
              <h3 className="text-[32px] md:text-[48px] font-light leading-[1.1] tracking-tight font-outfit text-white/80">
                {manifestoText1.map((word, idx) => (
                  <span key={idx} className="inline-block overflow-hidden mr-3">
                    <span className="reveal-word inline-block">{word}</span>
                  </span>
                ))}
              </h3>
              <p className="mt-6 text-[14px] text-white/60 leading-relaxed font-sans-nura">
                Traditional pathology only intervenes during downstream cellular failure. It aims to restore basic baseline functions, treating symptoms without refining the underlying epigenetic substrate.
              </p>
            </div>

            {/* Optimal health */}
            <div className="md:pt-16 border-t md:border-t-0 md:border-l border-white/10 pt-10 md:pl-16">
              <p className="text-[12px] uppercase tracking-widest font-bold text-[#CC5833] font-mono mb-4">
                [ NURA PARADIGM B ]
              </p>
              <h3 className="text-[32px] md:text-[52px] font-extrabold leading-[1.1] tracking-tight font-outfit">
                {manifestoText2.map((word, idx) => {
                  const isOptimal = word.toLowerCase().includes("optimal");
                  return (
                    <span key={idx} className="inline-block overflow-hidden mr-3">
                      <span className={`reveal-word inline-block ${
                        isOptimal ? 'font-serif-nura italic text-[#CC5833] font-normal font-cormorant capitalize' : ''
                      }`}>
                        {word}
                      </span>
                    </span>
                  );
                })}
              </h3>
              <p className="mt-6 text-[14px] text-[#F2F0E9]/75 leading-relaxed font-sans-nura">
                We believe health is not the absence of disease, but the maximum amplification of human potential. Nura targets biological longevity from the epigenetic core, ensuring absolute vital efficiency.
              </p>
            </div>
          </div>
        </div>
      </section>


      {/* E. PROTOCOL (Sticky Stacking Archive) */}
      <section id="protocol" className="relative select-none">
        
        {/* Card 1: DOUBLE HELIX GEAR */}
        <div 
          ref={card1Ref} 
          className="sticky top-0 h-screen w-full bg-[#2E4036] text-[#F2F0E9] flex items-center justify-center z-10 px-6 overflow-hidden"
        >
          <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-block px-3 py-1 rounded-full bg-white/10 text-white/80 text-[10px] font-bold font-mono tracking-widest">
                PROTOCOL 01 // LONGEVITY
              </div>
              <h3 className="text-[40px] md:text-[60px] font-extrabold tracking-tight font-outfit uppercase leading-none">
                Epigenetic <br />
                <span className="font-serif-nura italic font-light text-[#F2F0E9] capitalize font-cormorant">Recalibration</span>
              </h3>
              <p className="text-[14px] md:text-[16px] text-white/70 max-w-md font-sans-nura leading-relaxed">
                By targeting DNA methylation patterns through highly customized micro-nutritional sequencing, Nura adjusts your cellular aging timeline, reversing biological decay.
              </p>
              
              <div className="pt-6 grid grid-cols-2 gap-4 border-t border-white/10 text-[12px] font-mono">
                <div>
                  <span className="opacity-40 block mb-1">STABILIZATION RATE</span>
                  <span className="font-bold text-white text-[16px]">94.2%</span>
                </div>
                <div>
                  <span className="opacity-40 block mb-1">METHYLATION OFFSET</span>
                  <span className="font-bold text-white text-[16px]">-4.8 Years</span>
                </div>
              </div>
            </div>

            {/* Rotating Double-Helix Gear Artifact */}
            <div className="flex items-center justify-center relative min-h-[300px]">
              <style dangerouslySetInnerHTML={{ __html: `
                @keyframes spinY {
                  from { transform: rotateY(0deg); }
                  to { transform: rotateY(360deg); }
                }
                .spin-container {
                  transform-style: preserve-3d;
                  perspective: 600px;
                }
              `}} />
              
              <div className="spin-container relative w-60 h-60 flex items-center justify-center">
                {Array.from({ length: 16 }).map((_, i) => {
                  const rotation = i * 22.5; // Spread rotation
                  return (
                    <div 
                      key={i} 
                      className="absolute w-48 h-[2px] bg-white/20"
                      style={{
                        transform: `rotateY(${rotation}deg) translateY(${i * 12 - 96}px)`,
                        transformStyle: 'preserve-3d',
                        animation: 'spinY 7s linear infinite',
                        animationDelay: `${i * -0.22}s`
                      }}
                    >
                      <div className="absolute left-0 -top-1.5 w-3.5 h-3.5 rounded-full bg-[#CC5833] shadow-[0_0_12px_#CC5833]" />
                      <div className="absolute right-0 -top-1.5 w-3.5 h-3.5 rounded-full bg-[#F2F0E9] shadow-[0_0_12px_#F2F0E9]" />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: SCANNING LASER GRID */}
        <div 
          ref={card2Ref} 
          className="sticky top-0 h-screen w-full bg-[#1A1A1A] text-[#F2F0E9] flex items-center justify-center z-20 px-6 overflow-hidden border-t border-white/10"
        >
          <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-block px-3 py-1 rounded-full bg-[#CC5833]/15 text-[#CC5833] text-[10px] font-bold font-mono tracking-widest border border-[#CC5833]/20">
                PROTOCOL 02 // MITOCHONDRIA
              </div>
              <h3 className="text-[40px] md:text-[60px] font-extrabold tracking-tight font-outfit uppercase leading-none">
                Cellular <br />
                <span className="font-serif-nura italic font-light text-[#F2F0E9] capitalize font-cormorant">Bioenergetics</span>
              </h3>
              <p className="text-[14px] md:text-[16px] text-white/70 max-w-md font-sans-nura leading-relaxed">
                Scan and enhance ATP production profiles. Utilizing red light telemetry diagnostics and localized thermic cycles, Nura triggers massive mitochondrial duplication.
              </p>

              <div className="pt-6 grid grid-cols-2 gap-4 border-t border-white/10 text-[12px] font-mono">
                <div>
                  <span className="opacity-40 block mb-1">ATP EFFICIENCY</span>
                  <span className="font-bold text-[#CC5833] text-[16px]">+28.4%</span>
                </div>
                <div>
                  <span className="opacity-40 block mb-1">MITO-DENSITY</span>
                  <span className="font-bold text-white text-[16px]">1.4x Growth</span>
                </div>
              </div>
            </div>

            {/* Scanning Laser Grid Artifact */}
            <div className="flex items-center justify-center relative min-h-[300px]">
              <div className="relative w-64 h-64 bg-black/40 rounded-[2rem] border border-white/15 p-6 overflow-hidden flex flex-col justify-between">
                
                {/* 5x5 Grid of Cells */}
                <div className="grid grid-cols-5 gap-4 relative z-10 w-full h-full my-auto">
                  {Array.from({ length: 25 }).map((_, idx) => {
                    const row = Math.floor(idx / 5);
                    const col = idx % 5;
                    return (
                      <div 
                        key={idx}
                        className="relative rounded-full border border-white/20 flex items-center justify-center animate-pulse"
                        style={{
                          animationDelay: `${(row + col) * 0.4}s`,
                          animationDuration: '3s'
                        }}
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-[#CC5833]" />
                      </div>
                    );
                  })}
                </div>

                {/* Laser scan overlay */}
                <style dangerouslySetInnerHTML={{ __html: `
                  @keyframes laserSweep {
                    0%, 100% { top: 0%; opacity: 0.8; }
                    50% { top: 100%; opacity: 0.8; }
                  }
                  .laser-line {
                    animation: laserSweep 4s ease-in-out infinite;
                  }
                `}} />
                <div className="laser-line absolute left-0 right-0 w-full h-[2px] bg-[#CC5833] shadow-[0_0_12px_4px_rgba(204,88,51,0.5)] z-20 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: PULSING EKG WAVEFORM */}
        <div 
          ref={card3Ref} 
          className="sticky top-0 h-screen w-full bg-[#CC5833] text-[#F2F0E9] flex items-center justify-center z-30 px-6 overflow-hidden border-t border-white/10"
        >
          <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-block px-3 py-1 rounded-full bg-white/10 text-white/80 text-[10px] font-bold font-mono tracking-widest">
                PROTOCOL 03 // VASCULAR
              </div>
              <h3 className="text-[40px] md:text-[60px] font-extrabold tracking-tight font-outfit uppercase leading-none">
                Neural <br />
                <span className="font-serif-nura italic font-light text-[#F2F0E9] capitalize font-cormorant">Vascularity</span>
              </h3>
              <p className="text-[14px] md:text-[16px] text-white/70 max-w-md font-sans-nura leading-relaxed">
                Maximize cerebral oxygen delivery. Through real-time nitric oxide calibration and pressure variance protocols, Nura elevates focus metrics and neural connectivity.
              </p>

              <div className="pt-6 grid grid-cols-2 gap-4 border-t border-white/10 text-[12px] font-mono">
                <div>
                  <span className="opacity-40 block mb-1">CEREBRAL BLOOD FLOW</span>
                  <span className="font-bold text-white text-[16px]">+32.6%</span>
                </div>
                <div>
                  <span className="opacity-40 block mb-1">FOCUS METRIC (EEG)</span>
                  <span className="font-bold text-[#2E4036] text-[16px]">Optimal (Beta-2)</span>
                </div>
              </div>
            </div>

            {/* Pulsing EKG Waveform Artifact */}
            <div className="flex items-center justify-center relative min-h-[300px]">
              <div className="relative w-72 h-44 bg-[#1A1A1A] rounded-[2rem] border border-white/10 p-6 flex items-center justify-center overflow-hidden">
                
                {/* Grid Lines in background */}
                <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />

                <svg viewBox="0 0 400 150" className="w-full h-full z-10 overflow-visible">
                  <defs>
                    <linearGradient id="ekg-glow" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#F2F0E9" stopOpacity="0" />
                      <stop offset="50%" stopColor="#F2F0E9" stopOpacity="1" />
                      <stop offset="100%" stopColor="#F2F0E9" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* EKG Path */}
                  <style dangerouslySetInnerHTML={{ __html: `
                    @keyframes ekgDash {
                      to {
                        stroke-dashoffset: -800;
                      }
                    }
                    .ekg-path {
                      stroke-dasharray: 400;
                      stroke-dashoffset: 400;
                      animation: ekgDash 3s linear infinite;
                    }
                  `}} />
                  <path
                    className="ekg-path"
                    d="M 10 75 L 120 75 L 135 60 L 145 105 L 155 15 L 165 90 L 175 75 L 260 75 L 275 60 L 285 105 L 295 15 L 305 90 L 315 75 L 390 75"
                    fill="none"
                    stroke="url(#ekg-glow)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

      </section>


      {/* F. MEMBERSHIP & FOOTER */}
      <section id="membership" className="py-24 px-6 md:px-16 max-w-7xl mx-auto select-none">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <span className="text-[11px] font-bold tracking-[0.2em] text-[#CC5833] uppercase font-outfit">
            HUMAN PROGRAMMING
          </span>
          <h2 className="text-[36px] md:text-[48px] font-extrabold tracking-tight leading-none text-[#2E4036] mt-3 font-outfit">
            Select Your Calibration Tier
          </h2>
          <p className="text-[14px] md:text-[16px] text-[#1A1A1A]/70 mt-4 leading-relaxed">
            Begin with biological auditing or enter a comprehensive clinical membership to lock in your metabolic future.
          </p>
        </div>

        {/* 3-Tier Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          
          {/* Card 1: Core Audit */}
          <div className="bg-[#2E4036]/5 border border-[#2E4036]/10 rounded-[2.5rem] p-8 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex justify-between items-center mb-6">
                <span className="text-[11px] font-bold tracking-widest font-mono text-[#2E4036]/60">01 // TIER</span>
                <span className="text-[12px] font-bold text-[#2E4036] font-outfit bg-white px-3 py-1 rounded-full">AUDIT</span>
              </div>
              <h3 className="text-[28px] font-extrabold text-[#2E4036] font-outfit">Core Audit</h3>
              <p className="text-[13px] text-[#1A1A1A]/70 mt-3 leading-relaxed">
                Initial epigenetic profiling and full microbiome sequencing to construct your foundational bio-indices.
              </p>
              
              <div className="my-8">
                <span className="text-[44px] font-extrabold text-[#2E4036] font-outfit">$450</span>
                <span className="text-[12px] opacity-60 font-medium"> / one-time</span>
              </div>

              <ul className="space-y-3.5 text-[13px] text-[#1A1A1A]/80 font-medium">
                <li className="flex items-center gap-2.5">
                  <Check size={14} className="text-[#CC5833]" /> Full Epigenetic Methylation Mapping
                </li>
                <li className="flex items-center gap-2.5">
                  <Check size={14} className="text-[#CC5833]" /> Gut Microbiome Diversity Sequence
                </li>
                <li className="flex items-center gap-2.5">
                  <Check size={14} className="text-[#CC5833]" /> Basic Diurnal Cortisol Screening
                </li>
                <li className="flex items-center gap-2.5">
                  <Check size={14} className="text-[#CC5833]" /> 1-Hour Telemetry Walkthrough
                </li>
              </ul>
            </div>

            <button className="mt-8 w-full py-3.5 rounded-full border border-[#2E4036]/20 text-[#2E4036] hover:bg-[#2E4036]/5 text-[12px] font-bold tracking-wider uppercase transition-all">
              Initialize Audit
            </button>
          </div>

          {/* Card 2: Performance (POPS!) */}
          <div className="bg-[#2E4036] text-[#F2F0E9] rounded-[2.5rem] p-8 flex flex-col justify-between shadow-xl relative overflow-hidden transform scale-105 border border-[#2E4036]/10">
            {/* Pop design element */}
            <div className="absolute top-0 right-0 bg-[#CC5833] text-white text-[10px] font-bold tracking-widest px-6 py-2 rounded-bl-2xl uppercase">
              RECOMMENDED
            </div>

            <div>
              <div className="flex justify-between items-center mb-6">
                <span className="text-[11px] font-bold tracking-widest font-mono text-white/50">02 // TIER</span>
              </div>
              <h3 className="text-[28px] font-extrabold font-outfit text-white">Performance</h3>
              <p className="text-[13px] text-white/80 mt-3 leading-relaxed">
                Comprehensive ongoing clinical guidance. Fully optimized schedules, weekly telemedicine sweeps, and peptide regimen tuning.
              </p>
              
              <div className="my-8">
                <span className="text-[44px] font-extrabold font-outfit text-white">$250</span>
                <span className="text-[12px] text-white/60 font-medium"> / monthly</span>
              </div>

              <ul className="space-y-3.5 text-[13px] text-white/95 font-medium">
                <li className="flex items-center gap-2.5">
                  <Check size={14} className="text-[#CC5833]" /> Continuous Epigenetic Auditing
                </li>
                <li className="flex items-center gap-2.5">
                  <Check size={14} className="text-[#CC5833]" /> Weekly Customized Peptide Curation
                </li>
                <li className="flex items-center gap-2.5">
                  <Check size={14} className="text-[#CC5833]" /> 24/7 Priority Lab Scientist Telemetry
                </li>
                <li className="flex items-center gap-2.5">
                  <Check size={14} className="text-[#CC5833]" /> Monthly Diagnostic Resequencing
                </li>
              </ul>
            </div>

            <button className="mt-8 w-full py-3.5 rounded-full bg-[#CC5833] text-white text-[12px] font-bold tracking-wider uppercase transition-all duration-300 hover:scale-102 hover:shadow-lg hover:shadow-[#CC5833]/30">
              Apply For Membership
            </button>
          </div>

          {/* Card 3: Elite Sentinel */}
          <div className="bg-[#2E4036]/5 border border-[#2E4036]/10 rounded-[2.5rem] p-8 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex justify-between items-center mb-6">
                <span className="text-[11px] font-bold tracking-widest font-mono text-[#2E4036]/60">03 // TIER</span>
                <span className="text-[12px] font-bold text-[#2E4036] font-outfit bg-white px-3 py-1 rounded-full">SENTINEL</span>
              </div>
              <h3 className="text-[28px] font-extrabold text-[#2E4036] font-outfit">Elite Sentinel</h3>
              <p className="text-[13px] text-[#1A1A1A]/70 mt-3 leading-relaxed">
                Absolute bespoke human optimization. Direct intervention from Nura's expert diagnostic board and customized cellular scheduling.
              </p>
              
              <div className="my-8">
                <span className="text-[44px] font-extrabold text-[#2E4036] font-outfit">$750</span>
                <span className="text-[12px] opacity-60 font-medium"> / monthly</span>
              </div>

              <ul className="space-y-3.5 text-[13px] text-[#1A1A1A]/80 font-medium">
                <li className="flex items-center gap-2.5">
                  <Check size={14} className="text-[#CC5833]" /> Custom Stem-Cell & Peptide Programs
                </li>
                <li className="flex items-center gap-2.5">
                  <Check size={14} className="text-[#CC5833]" /> In-House Hyperbaric & Laser Treatment
                </li>
                <li className="flex items-center gap-2.5">
                  <Check size={14} className="text-[#CC5833]" /> Diagnostic Sweeps & Gene Therapy Auditing
                </li>
                <li className="flex items-center gap-2.5">
                  <Check size={14} className="text-[#CC5833]" /> Dedicated Senior Creative Clinician
                </li>
              </ul>
            </div>

            <button className="mt-8 w-full py-3.5 rounded-full border border-[#2E4036]/20 text-[#2E4036] hover:bg-[#2E4036]/5 text-[12px] font-bold tracking-wider uppercase transition-all">
              Request Invitation
            </button>
          </div>

        </div>
      </section>

      {/* FOOTER: Deep Charcoal, rounded-t-[4rem] */}
      <footer className="w-full bg-[#1A1A1A] text-[#F2F0E9] rounded-t-[4rem] pt-20 pb-12 px-6 md:px-16 select-none border-t border-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 pb-16 border-b border-white/10">
          
          {/* Logo & Status Indicator */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Dna size={22} className="text-[#CC5833]" />
              <span className="font-outfit font-extrabold text-[20px] tracking-[0.2em] uppercase">
                NURA <span className="opacity-50 font-light text-white">HEALTH</span>
              </span>
            </div>
            <p className="text-[13px] text-white/60 leading-relaxed font-sans-nura">
              Engineering human potential. Architecting biological and metabolic durability from the epigenome outward.
            </p>
            
            {/* System Status Indicator with pulsing green dot */}
            <div className="inline-flex items-center gap-2.5 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-full text-[11px] font-semibold text-emerald-400 font-mono">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
              </span>
              <span>SYSTEM OPERATIONAL</span>
            </div>
          </div>

          {/* Links Col 1 */}
          <div>
            <h4 className="text-[12px] font-bold tracking-widest text-[#CC5833] uppercase font-outfit mb-6">
              RESOURCES
            </h4>
            <ul className="space-y-3.5 text-[13px] text-white/70">
              <li><a href="#features" className="hover:text-white transition-colors">Precision Dashboard</a></li>
              <li><a href="#manifesto" className="hover:text-white transition-colors">Manifesto / Philosophy</a></li>
              <li><a href="#protocol" className="hover:text-white transition-colors">Vascular Protocol</a></li>
              <li><a href="#protocol" className="hover:text-white transition-colors">Epigenetics Science</a></li>
            </ul>
          </div>

          {/* Links Col 2 */}
          <div>
            <h4 className="text-[12px] font-bold tracking-widest text-[#CC5833] uppercase font-outfit mb-6">
              MEMBERSHIP
            </h4>
            <ul className="space-y-3.5 text-[13px] text-white/70">
              <li><a href="#membership" className="hover:text-white transition-colors">Corporate Programs</a></li>
              <li><a href="#membership" className="hover:text-white transition-colors">Elite Sentinel Program</a></li>
              <li><a href="#membership" className="hover:text-white transition-colors">Pricing Structure</a></li>
              <li><a href="#membership" className="hover:text-white transition-colors">Clinic Locations</a></li>
            </ul>
          </div>

          {/* Links Col 3 */}
          <div>
            <h4 className="text-[12px] font-bold tracking-widest text-[#CC5833] uppercase font-outfit mb-6">
              LEGAL & CLINICAL
            </h4>
            <ul className="space-y-3.5 text-[13px] text-white/70">
              <li><a href="#" className="hover:text-white transition-colors">Clinical IRB Approvals</a></li>
              <li><a href="#" className="hover:text-white transition-colors">HIPAA Privacy Protocol</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Calibration</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Bioethics Statement</a></li>
            </ul>
          </div>

        </div>

        {/* Under-footer info */}
        <div className="max-w-7xl mx-auto pt-8 flex flex-col md:flex-row items-center justify-between text-[11px] text-white/40 gap-4">
          <span>&copy; {new Date().getFullYear()} Nura Health Inc. All rights calibrated.</span>
          <span className="font-mono">IP // 109.84.22.909 // SECURED BY HET-NET</span>
        </div>
      </footer>

    </div>
  );
}

// Active: 2026-07-04

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
