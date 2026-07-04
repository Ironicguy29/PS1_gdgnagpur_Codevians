'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import InfiniteLights from '../components/Hero/InfiniteLights';
import { useInView } from 'react-intersection-observer';
import dynamic from 'next/dynamic';

const CommunityAILearning = dynamic(
  () => import('@/components/landing/CommunityAILearning'),
  { ssr: false }
);
import {
  Activity,
  MapPin,
  Clock,
  Shield,
  Siren,
  Users,
  Bed,
  Pill,
  Stethoscope,
  Building2,
  FileText,
  QrCode,
  AlertTriangle,
  UserCheck,
  Calendar,
  Smartphone,
  BarChart3,
  Globe,
  Bell,
  Menu,
  X,
  ArrowRight,
  Github,
  Phone,
  ClipboardCheck
} from 'lucide-react';

// Custom Counter component using requestAnimationFrame and easeOutQuad curve
function Counter({ target, duration = 1500 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  useEffect(() => {
    if (!inView) return;
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeProgress = progress * (2 - progress); // easeOutQuad
      setCount(Math.floor(easeProgress * target));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [inView, target, duration]);

  return <span ref={ref}>{count}</span>;
}

// Custom FloatCounter component for float metrics (e.g. 2.4)
function FloatCounter({ target, duration = 1500 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  useEffect(() => {
    if (!inView) return;
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeProgress = progress * (2 - progress);
      setCount(Math.floor(easeProgress * (target * 10)));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [inView, target, duration]);

  return <span ref={ref}>{(count / 10).toFixed(1)}</span>;
}

// Custom Reveal wrapper using IntersectionObserver for translateY(16px) -> 0 scroll animations
function Reveal({ children }: { children: React.ReactNode }) {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.05,
  });

  return (
    <div
      ref={ref}
      className={`transition-all duration-[400ms] ease transform ${
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      {children}
    </div>
  );
}

// Data structures for Workflow steps
const workflowData = {
  patient: [
    {
      step: "01",
      icon: QrCode,
      title: "Verify ABHA ID",
      body: "Provide your government ABHA details to securely import your clinical history and start."
    },
    {
      step: "02",
      icon: MapPin,
      title: "Smart Routing",
      body: "Our AI engine forecasts queues and alerts you of transit/OPD delay spikes before you travel."
    },
    {
      step: "03",
      icon: Stethoscope,
      title: "Digital Check-in",
      body: "Scan the counter barcode to automatically register with the triage nurse. No queues."
    },
    {
      step: "04",
      icon: FileText,
      title: "Instant prescription",
      body: "View prescriptions on your mobile, pick up drugs, and head home comfortably."
    }
  ],
  hospitaladmin: [
    {
      step: "01",
      icon: Activity,
      title: "Monitor Live Load",
      body: "Track live department load, clinic queues, and staff allocation ratios across the hospital."
    },
    {
      step: "02",
      icon: Bed,
      title: "Allocate Beds",
      body: "Update ICU and ward bed states instantly, feeding real-time numbers back to the state directory."
    },
    {
      step: "03",
      icon: Siren,
      title: "Dispatch Fleet",
      body: "Deploy emergency ambulance fleets dynamically, coordinating coordinates and vitals in transit."
    },
    {
      step: "04",
      icon: ClipboardCheck,
      title: "Audit Compliance",
      body: "Track compliance with AB-PMJAY policies, checking hospital claims and admission protocols."
    }
  ],
  government: [
    {
      step: "01",
      icon: Shield,
      title: "Verify Registries",
      body: "Maintain central state databases checking credentials of active hospitals and licensed doctors."
    },
    {
      step: "02",
      icon: Globe,
      title: "Map Resources",
      body: "Analyze regional asset distributions like oxygen plants, ventilators, and specialist staff."
    },
    {
      step: "03",
      icon: AlertTriangle,
      title: "Outbreak Trackers",
      body: "Analyze incoming diagnostic statistics to isolate anomaly spikes and coordinate response teams."
    },
    {
      step: "04",
      icon: BarChart3,
      title: "Evaluate Policy",
      body: "Audit public healthcare indices, calculating average hospital wait times and recovery rates."
    }
  ]
};

// Data structures for Bento grid platform capabilities
const featuresData = [
  {
    icon: QrCode,
    title: "ABHA Token Registry",
    body: "Scan-and-share queue tokens instantly using verified government ABHA health records."
  },
  {
    icon: Clock,
    title: "Live Queue Predictions",
    body: "Real-time AI estimations of patient consulting times based on current doctor velocities."
  },
  {
    icon: AlertTriangle,
    title: "Vitals Pre-Triage",
    body: "Transmit real-time ECG telemetry from active ambulances directly to triage desks before arrival."
  },
  {
    icon: UserCheck,
    title: "Registry Handshake",
    body: "Validate healthcare professional licenses instantly via the National Health Registry database."
  },
  {
    icon: Calendar,
    title: "Unified OPD Engine",
    body: "Intelligent appointment scheduler to balance morning OPD peaks and prevent clinic gridlock."
  },
  {
    icon: Smartphone,
    title: "WhatsApp Alerts",
    body: "Pushes real-time wait notifications and digital prescriptions directly to patients' phones."
  },
  {
    icon: BarChart3,
    title: "Capacity Telemetry",
    body: "Visual administrative grid reporting active ICU ventilator counts, ward beds, and resources."
  },
  {
    icon: Globe,
    title: "Statewide Control",
    body: "Cross-region telemetry network linking rural dispensaries with city government hospitals."
  },
  {
    icon: Bell,
    title: "Emergency Broadcasts",
    body: "Broadcast critical alerts and coordinate emergency ambulance redirections instantly."
  }
];

// Data structures for Portals selection
const portalsData = [
  {
    id: "patient",
    name: "Patient Portal",
    accentHex: "#00D4AA",
    icon: Users,
    description: "Book OPD slots, manage ABHA ID, access health records and prescriptions.",
    colSpan: "col-span-1 md:col-span-3 lg:col-span-1",
    borderTopClass: "border-t-[#00D4AA]",
    hoverBorderClass: "hover:border-[#00D4AA]",
    textAccentClass: "text-[#00D4AA] group-hover:text-[#00B894]",
    iconBgClass: "bg-[#00D4AA]/10",
    iconColorClass: "text-[#00D4AA]"
  },
  {
    id: "doctor",
    name: "Doctor Station",
    accentHex: "#60A5FA",
    icon: Stethoscope,
    description: "View patient queue, access clinical history, issue digital prescriptions.",
    colSpan: "col-span-1 md:col-span-3 lg:col-span-1",
    borderTopClass: "border-t-[#60A5FA]",
    hoverBorderClass: "hover:border-[#60A5FA]",
    textAccentClass: "text-[#60A5FA] group-hover:text-[#3B82F6]",
    iconBgClass: "bg-[#60A5FA]/10",
    iconColorClass: "text-[#60A5FA]"
  },
  {
    id: "admin",
    name: "Hospital Admin",
    accentHex: "#A78BFA",
    icon: Building2,
    description: "Manage bed allocation, monitor department load, dispatch resources.",
    colSpan: "col-span-1 md:col-span-2 lg:col-span-1",
    borderTopClass: "border-t-[#A78BFA]",
    hoverBorderClass: "hover:border-[#A78BFA]",
    textAccentClass: "text-[#A78BFA] group-hover:text-[#8B5CF6]",
    iconBgClass: "bg-[#A78BFA]/10",
    iconColorClass: "text-[#A78BFA]"
  },
  {
    id: "ambulance",
    name: "Ambulance Fleet",
    accentHex: "#FF4757",
    icon: Siren,
    description: "Accept emergency calls, update live location, navigate critical routes.",
    colSpan: "col-span-1 md:col-span-2 lg:col-span-1",
    borderTopClass: "border-t-[#FF4757]",
    hoverBorderClass: "hover:border-[#FF4757]",
    textAccentClass: "text-[#FF4757] group-hover:text-[#E84118]",
    iconBgClass: "bg-[#FF4757]/10",
    iconColorClass: "text-[#FF4757]"
  },
  {
    id: "pharmacy",
    name: "Pharmacy / Lab",
    accentHex: "#FFA502",
    icon: Pill,
    description: "Process prescriptions, manage inventory, upload diagnostic results.",
    colSpan: "col-span-1 md:col-span-2 lg:col-span-1",
    borderTopClass: "border-t-[#FFA502]",
    hoverBorderClass: "hover:border-[#FFA502]",
    textAccentClass: "text-[#FFA502] group-hover:text-[#E1B12C]",
    iconBgClass: "bg-[#FFA502]/10",
    iconColorClass: "text-[#FFA502]"
  }
];

export default function ArogyaMitraLanding() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'patient' | 'hospitaladmin' | 'government'>('patient');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  const [liveBeds, setLiveBeds] = useState(742);
  const [liveDoctors, setLiveDoctors] = useState(183);
  const [liveAmbulances, setLiveAmbulances] = useState(42);
  const [liveEmergencies, setLiveEmergencies] = useState(29);

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveBeds(prev => Math.max(720, Math.min(760, prev + (Math.random() > 0.55 ? 1 : -1))));
      setLiveDoctors(prev => Math.max(175, Math.min(190, prev + (Math.random() > 0.5 ? 1 : -1))));
      setLiveAmbulances(prev => Math.max(38, Math.min(46, prev + (Math.random() > 0.5 ? 1 : -1))));
      setLiveEmergencies(prev => Math.max(25, Math.min(35, prev + (Math.random() > 0.55 ? 1 : -1))));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Register GSAP ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);

    // Scroll listener for sticky nav
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll);

    // Hero element entry stagger timeline
    const ctx = gsap.context(() => {
      gsap.fromTo('.hero-animate-in',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1.0, stagger: 0.15, ease: 'power4.out', delay: 0.1 }
      );
    });

    // Magnetic buttons setup
    const setupMagnetic = (buttonId: string) => {
      const button = document.getElementById(buttonId);
      if (!button) return;

      const onMouseMove = (e: MouseEvent) => {
        const rect = button.getBoundingClientRect();
        const x = e.clientX - (rect.left + rect.width / 2);
        const y = e.clientY - (rect.top + rect.height / 2);

        gsap.to(button, {
          x: x * 0.35,
          y: y * 0.35,
          duration: 0.3,
          ease: 'power2.out',
        });
      };

      const onMouseLeave = () => {
        gsap.to(button, {
          x: 0,
          y: 0,
          duration: 0.5,
          ease: 'elastic.out(1.2, 0.4)',
        });
      };

      button.addEventListener('mousemove', onMouseMove);
      button.addEventListener('mouseleave', onMouseLeave);

      return () => {
        button.removeEventListener('mousemove', onMouseMove);
        button.removeEventListener('mouseleave', onMouseLeave);
      };
    };

    const cleanupPortals = setupMagnetic('cta-portals-btn');
    const cleanupMap = setupMagnetic('cta-map-btn');

    return () => {
      window.removeEventListener('scroll', handleScroll);
      ctx.revert();
      if (cleanupPortals) cleanupPortals();
      if (cleanupMap) cleanupMap();
    };
  }, []);

  useEffect(() => {
    // Animate workflow cards on activeTab change
    gsap.fromTo('.workflow-card',
      { opacity: 0, y: 15 },
      { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: 'power2.out' }
    );
  }, [activeTab]);

  return (
    <main className="min-h-screen bg-navy text-text-primary relative overflow-x-hidden font-sans selection:bg-teal selection:text-navy">
      
      {/* 1. NAVBAR */}
      <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        scrollY > 20 
          ? 'py-2 bg-navy/90 backdrop-blur-xl border-b border-white/5 shadow-[0_4px_30px_rgba(0,0,0,0.4)]' 
          : 'py-4 bg-transparent border-b border-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo / Wordmark */}
          <Logo size="md" href="/" variant="light" />

          {/* Navigation links (Center) */}
          <div className="hidden md:flex items-center gap-8">
            {[
              { label: 'Features', href: '#features' },
              { label: 'Live Map', href: '/live-map', target: '_blank' },
              { label: 'Workflow', href: '#workflow' },
              { label: 'Portals', href: '#portals' }
            ].map((link) => (
              <a
                key={link.label}
                href={link.href}
                target={(link as any).target}
                rel={(link as any).target === '_blank' ? 'noopener noreferrer' : undefined}
                className="relative text-[14px] font-semibold text-text-secondary hover:text-text-primary transition-colors duration-200 py-1 group"
              >
                {link.label}
                <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-teal group-hover:w-full transition-all duration-300 ease-out" />
              </a>
            ))}
          </div>

          {/* Buttons (Right) */}
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={() => router.push('/auth/select')}
              className="text-[14px] font-semibold text-text-secondary border border-strong hover:border-text-primary hover:text-text-primary px-4 py-2 rounded-lg transition-all duration-200 h-10 flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-teal"
            >
              Sign In
            </button>
            <button
              onClick={() => router.push('/auth/select')}
              className="text-[14px] font-semibold bg-teal hover:bg-teal-muted text-navy px-4 py-2 rounded-lg transition-all duration-200 h-10 flex items-center justify-center hover:shadow-[0_0_15px_rgba(0,212,170,0.35)] active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-teal"
            >
              Get Started
            </button>
          </div>

          {/* Mobile hamburger icon */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-text-primary p-2 h-11 w-11 flex items-center justify-center border border-strong rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-teal"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile slide-in / toggle drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-b border-default bg-navy/95 backdrop-blur-md px-6 py-6 space-y-4">
            <div className="flex flex-col gap-4">
              {[
                { label: 'Features', href: '#features' },
                { label: 'Live Map', href: '/live-map', target: '_blank' },
                { label: 'Workflow', href: '#workflow' },
                { label: 'Portals', href: '#portals' }
              ].map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target={(link as any).target}
                  rel={(link as any).target === '_blank' ? 'noopener noreferrer' : undefined}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-[14px] font-normal text-text-secondary hover:text-text-primary transition-colors duration-150 block py-1"
                >
                  {link.label}
                </a>
              ))}
            </div>
            <div className="pt-4 border-t border-strong flex flex-col gap-3">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  router.push('/auth/select');
                }}
                className="text-[14px] text-text-secondary border border-strong hover:border-teal hover:text-teal px-4 py-2.5 rounded-lg transition-colors duration-150 w-full text-center h-11 flex items-center justify-center"
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  router.push('/auth/select');
                }}
                className="text-[14px] bg-teal hover:bg-teal-muted text-navy font-semibold px-4 py-2.5 rounded-lg transition-colors duration-150 w-full text-center h-11 flex items-center justify-center"
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* 2. HERO SECTION */}
      <section className="relative pt-32 pb-24 px-6 md:px-12 bg-navy overflow-hidden min-h-[90vh] flex items-center">
        {/* Infinite Lights WebGL Background */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
          <InfiniteLights />
        </div>
        {/* Glowing gradient overlay to mask WebGL and ensure typography contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-navy/35 via-navy/80 to-navy pointer-events-none z-0" />
        
        {/* Glowing Orb */}
        <div className="absolute w-[600px] h-[600px] bg-glow-orb -top-[100px] -right-[100px] pointer-events-none z-0" />

        <div className="max-w-7xl mx-auto relative z-10 pt-10 flex flex-col items-start text-left w-full">
          <div className="hero-animate-in inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal/10 border border-teal/20 text-teal mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse" />
            <span className="text-[11px] font-semibold tracking-[0.15em] uppercase font-sans">
              India's Healthcare Operating System
            </span>
          </div>

          <h1 className="hero-animate-in text-[44px] md:text-[64px] font-extrabold tracking-[-0.04em] leading-[1.05] text-text-primary max-w-4xl text-balance">
            Government hospitals,<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal via-emerald-400 to-cyan-400">running at full speed.</span>
          </h1>

          <p className="hero-animate-in text-[18px] md:text-[20px] font-normal leading-[1.6] text-text-secondary max-w-[600px] mt-6 text-pretty">
            Real-time AI across OPD queues, ABHA registration, emergency dispatch, and bed allocation — purpose-built for India's public health infrastructure.
          </p>

          <div className="hero-animate-in flex flex-wrap gap-4 mt-10">
            <button
              id="cta-portals-btn"
              onClick={() => {
                const el = document.getElementById('portals');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="relative group overflow-hidden px-6 py-3 rounded-lg bg-teal text-navy font-semibold hover:shadow-[0_0_25px_rgba(0,212,170,0.45)] transition-all duration-300 active:scale-[0.98] ease-out outline-none focus-visible:ring-2 focus-visible:ring-teal flex items-center gap-2"
            >
              <span className="absolute inset-0 w-full h-full bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
              <span className="relative z-10 flex items-center gap-2">
                Choose your portal
                <ArrowRight size={16} aria-hidden="true" className="group-hover:translate-x-1 transition-transform duration-300" />
              </span>
            </button>
            
            <a
              id="cta-map-btn"
              href="/live-map"
              target="_blank"
              rel="noopener noreferrer"
              className="relative px-6 py-3 rounded-lg border border-strong text-text-secondary hover:text-text-primary hover:border-text-primary hover:shadow-[0_0_15px_rgba(255,255,255,0.07)] transition-all duration-300 active:scale-[0.98] ease-out outline-none focus-visible:ring-2 focus-visible:ring-teal flex items-center gap-2"
            >
              <span className="relative z-10">Watch live map ↗</span>
            </a>
          </div>

          {/* Metrics Strip */}
          <div className="hero-animate-in grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 mt-20 pt-10 border-t border-strong w-full">
            <div className="flex flex-col items-start md:pr-8">
              <div className="text-[36px] font-bold text-text-primary tracking-tight font-mono tabular-nums">
                <Counter target={50} />
                <span className="text-[18px] font-normal text-teal ml-0.5 font-sans">+</span>
              </div>
              <span className="text-[13px] font-normal text-text-secondary mt-1">Hospitals linked</span>
            </div>

            <div className="flex flex-col items-start md:border-l md:border-strong md:px-8">
              <div className="text-[36px] font-bold text-text-primary tracking-tight font-mono tabular-nums">
                <FloatCounter target={2.4} />
                <span className="text-[18px] font-normal text-teal ml-0.5 font-sans">M+</span>
              </div>
              <span className="text-[13px] font-normal text-text-secondary mt-1">Patients served</span>
            </div>

            <div className="flex flex-col items-start md:border-l md:border-strong md:px-8">
              <div className="text-[36px] font-bold text-text-primary tracking-tight font-mono tabular-nums">
                <Counter target={98} />
                <span className="text-[18px] font-normal text-teal ml-0.5 font-sans">%</span>
              </div>
              <span className="text-[13px] font-normal text-text-secondary mt-1">Queue accuracy</span>
            </div>

            <div className="flex flex-col items-start md:border-l md:border-strong md:pl-8">
              <div className="text-[36px] font-bold text-text-primary tracking-tight font-mono tabular-nums">
                <span className="text-[18px] font-normal text-teal mr-0.5 font-sans">&lt;</span>
                <Counter target={18} />
                <span className="text-[18px] font-normal text-teal ml-0.5 font-sans">m</span>
              </div>
              <span className="text-[13px] font-normal text-text-secondary mt-1">Avg. wait time</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. LIVE STATUS BAR */}
      <section id="live-status" className="w-full bg-surface-1 border-t border-b border-default py-6 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-4">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-4 md:gap-x-12 overflow-x-auto whitespace-nowrap scrollbar-none w-full md:w-auto">
            {/* Beds counter */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-surface-2 border border-default flex items-center justify-center text-success">
                <Bed size={20} aria-hidden="true" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[18px] font-semibold text-text-primary leading-none font-mono tabular-nums">{liveBeds}</span>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                  </span>
                </div>
                <span className="text-[13px] font-normal text-text-secondary mt-0.5 block">beds available</span>
              </div>
            </div>

            {/* Doctors counter */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-surface-2 border border-default flex items-center justify-center text-teal">
                <Users size={20} aria-hidden="true" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[18px] font-semibold text-text-primary leading-none font-mono tabular-nums">{liveDoctors}</span>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-teal"></span>
                  </span>
                </div>
                <span className="text-[13px] font-normal text-text-secondary mt-0.5 block">doctors online</span>
              </div>
            </div>

            {/* Ambulances counter */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-surface-2 border border-default flex items-center justify-center text-caution">
                <Siren size={20} aria-hidden="true" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[18px] font-semibold text-text-primary leading-none font-mono tabular-nums">{liveAmbulances}</span>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-caution opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-caution"></span>
                  </span>
                </div>
                <span className="text-[13px] font-normal text-text-secondary mt-0.5 block">ambulances active</span>
              </div>
            </div>

            {/* Emergency cases counter */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-surface-2 border border-default flex items-center justify-center text-emergency">
                <AlertTriangle size={20} aria-hidden="true" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[18px] font-semibold text-text-primary leading-none font-mono tabular-nums">{liveEmergencies}</span>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emergency opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emergency"></span>
                  </span>
                </div>
                <span className="text-[13px] font-normal text-text-secondary mt-0.5 block">emergency cases</span>
              </div>
            </div>
          </div>

          {/* Far Right: LIVE badge */}
          <div className="flex items-center justify-end gap-2 bg-emergency/10 border border-emergency/20 px-3 py-1.5 rounded-md min-w-[72px] self-start md:self-center">
            <span className="text-[10px] font-semibold tracking-widest text-emergency animate-custom-pulse">LIVE</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emergency animate-custom-blink" />
          </div>
        </div>
      </section>

      {/* 4. WORKFLOW SECTION */}
      <section id="workflow" className="w-full bg-surface-1 py-24 px-6 md:px-12 border-b border-default">
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <span className="text-[11px] font-normal tracking-[0.08em] uppercase text-teal block mb-3 font-sans">HOW IT WORKS</span>
            <h2 className="text-[28px] font-semibold tracking-[-0.01em] leading-[1.2] text-text-primary">
              From arrival to discharge in minutes
            </h2>

            {/* Tab selector */}
            <div className="inline-flex p-1 bg-surface-2 border border-default rounded-xl mt-8 mb-12">
              {[
                { id: 'patient', label: 'Patient Portal' },
                { id: 'hospitaladmin', label: 'Hospital Admin' },
                { id: 'government', label: 'Government Dashboard' }
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-5 py-2 text-[13px] font-semibold transition-all duration-300 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-teal ${
                      isActive 
                        ? 'bg-teal text-navy shadow-md shadow-teal/10' 
                        : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Steps Container */}
            <div className="relative">
              {/* Desktop connector line */}
              <div className="absolute top-[48px] left-[10%] right-[10%] h-[1px] bg-gradient-to-r from-transparent via-teal/20 to-transparent z-0 hidden lg:block overflow-hidden">
                <div className="w-40 h-full bg-gradient-to-r from-transparent via-teal/60 to-transparent animate-shimmer-fast absolute top-0 left-0" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                {workflowData[activeTab].map((step, idx) => {
                  const IconComp = step.icon;
                  return (
                    <div 
                      key={idx} 
                      className="workflow-card bg-surface-2 border border-default hover:border-teal/30 hover:shadow-[0_4px_25px_rgba(0,212,170,0.04)] rounded-xl p-6 flex flex-col items-start gap-4 transition-all duration-300 hover:-translate-y-1"
                    >
                      <div className="w-full flex items-center justify-between">
                        <span className="text-[11px] font-bold tracking-[0.1em] uppercase text-teal/80 font-mono">{step.step}</span>
                        <div className="w-10 h-10 rounded-lg bg-surface-3 border border-default flex items-center justify-center text-teal shadow-inner">
                          <IconComp size={18} aria-hidden="true" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-[18px] font-semibold tracking-tight leading-[1.3] text-text-primary mb-2">
                          {step.title}
                        </h3>
                        <p className="text-[14px] font-normal leading-[1.6] text-text-secondary">
                          {step.body}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 5. PLATFORM CAPABILITIES */}
      <section id="features" className="w-full bg-surface-0 py-24 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <div className="mb-16">
              <h2 className="text-[28px] font-semibold tracking-[-0.01em] leading-[1.2] text-text-primary">
                Built for every role in the system
              </h2>
              <p className="text-[16px] font-normal leading-[1.6] text-text-secondary mt-2">
                9 modules working in unison
              </p>
            </div>

            {/* Flat Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border-strong border border-strong rounded-none">
              {featuresData.map((feature, idx) => {
                const IconComp = feature.icon;
                return (
                  <div
                    key={idx}
                    className="bg-surface-2 p-7 flex flex-col justify-between hover:bg-surface-3 transition-colors duration-150 min-h-[220px]"
                  >
                    <div className="w-10 h-10 rounded-lg bg-surface-3 border border-default flex items-center justify-center text-teal">
                      <IconComp size={20} aria-hidden="true" />
                    </div>
                    <div className="mt-8">
                      <h3 className="text-[20px] font-semibold tracking-normal leading-[1.3] text-text-primary">
                        {feature.title}
                      </h3>
                      <p className="text-[14px] font-normal leading-[1.6] text-text-secondary mt-2 line-clamp-2">
                        {feature.body}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Community AI Learning Section */}
      <CommunityAILearning />

      {/* 6. PORTAL SELECTION */}
      <section id="portals" className="w-full bg-surface-0 py-24 px-6 md:px-12 border-t border-default">
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <div className="mb-12">
              <h2 className="text-[28px] font-semibold tracking-[-0.01em] leading-[1.2] text-text-primary">
                Select your workspace
              </h2>
              <p className="text-[16px] font-normal leading-[1.6] text-text-secondary mt-2">
                Specialized interfaces for every role
              </p>
            </div>

            {/* Responsive grid for 5 cards: 1-col mobile, 2+3 grid on tablet, 5-col row on desktop */}
            <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-5 gap-6">
              {portalsData.map((portal) => {
                const IconComp = portal.icon;
                return (
                  <div
                    key={portal.id}
                    onClick={() => router.push(`/auth/${portal.id}/login`)}
                    className={`group bg-surface-2 border border-default rounded-2xl p-8 flex flex-col justify-between h-full cursor-pointer transition-all duration-300 hover:-translate-y-1.5 ${portal.colSpan}`}
                    style={{
                      borderTop: `2px solid ${portal.accentHex}`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = portal.accentHex;
                      e.currentTarget.style.boxShadow = `0 12px 30px -10px ${portal.accentHex}33`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-default)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div>
                      <div className={`w-11 h-11 rounded-xl ${portal.iconBgClass} flex items-center justify-center ${portal.iconColorClass} mb-6 shadow-sm`}>
                        <IconComp size={20} aria-hidden="true" />
                      </div>
                      <h3 className="text-[18px] font-semibold tracking-tight leading-[1.3] text-text-primary">
                        {portal.name}
                      </h3>
                      <p className="text-[14px] font-normal leading-[1.6] text-text-secondary mt-3">
                        {portal.description}
                      </p>
                    </div>
                    <div className="mt-8 flex items-center gap-1.5 text-[13px] font-semibold transition-all duration-300">
                      <span className={portal.textAccentClass}>Sign In</span>
                      <ArrowRight size={14} className={`${portal.iconColorClass} transition-transform duration-300 group-hover:translate-x-1`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Reveal>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="bg-surface-0 border-t border-default py-16 px-6 md:px-12">
        <div className="max-w-7xl mx-auto flex flex-col gap-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8">
            
            {/* Left brand block (5 columns) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="flex items-center gap-3">
                <span className="text-[20px] font-semibold tracking-tight">
                  <span className="text-teal">Arogya</span>
                  <span className="text-text-primary">Mitra</span>
                </span>
              </div>
              <p className="text-[14px] font-normal leading-[1.6] text-text-secondary max-w-sm">
                Public health infrastructure, reimagined.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                {['ABHA Integrated', 'AB-PMJAY', 'NDHM Compliant'].map((badge) => (
                  <span
                    key={badge}
                    className="bg-surface-2 border border-default px-3 py-1 rounded-full text-[12px] font-normal text-text-secondary"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </div>

            {/* Right link columns (7 columns) */}
            <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Platform */}
              <div className="space-y-4">
                <span className="text-[11px] font-normal tracking-[0.08em] uppercase text-text-secondary block font-sans">
                  Platform
                </span>
                <ul className="space-y-2">
                  {[
                    { label: 'Core Modules', href: '#features' },
                    { label: 'Live Map', href: '/live-map', target: '_blank' },
                    { label: 'Workflow', href: '#workflow' }
                  ].map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        target={(link as any).target}
                        rel={(link as any).target === '_blank' ? 'noopener noreferrer' : undefined}
                        className="text-[14px] font-normal text-text-secondary hover:text-text-primary transition-colors duration-150"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Compliance */}
              <div className="space-y-4">
                <span className="text-[11px] font-normal tracking-[0.08em] uppercase text-text-secondary block font-sans">
                  Compliance
                </span>
                <ul className="space-y-2">
                  {[
                    { label: 'Privacy Policy', href: '#' },
                    { label: 'Terms of Service', href: '#' }
                  ].map((link) => (
                    <li key={link.label}>
                      <a href={link.href} className="text-[14px] font-normal text-text-secondary hover:text-text-primary transition-colors duration-150">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Emergency */}
              <div className="space-y-4">
                <span className="text-[11px] font-normal tracking-[0.08em] uppercase text-text-secondary block font-sans">
                  Emergency
                </span>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-teal font-semibold">
                    <Phone size={18} aria-hidden="true" />
                    <span className="text-[24px] font-semibold tracking-tight font-mono text-teal">108 / 102</span>
                  </div>
                  <p className="text-[13px] font-normal leading-[1.5] text-text-muted">
                    National emergency toll-free numbers.
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Bar */}
          <div className="border-t border-default pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[12px] font-normal text-text-muted">
            <span>
              © 2026 ArogyaMitra. MIT License. Built for national hackathon platforms.
            </span>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-secondary hover:text-text-primary transition-colors duration-150 h-11 w-11 flex items-center justify-center border border-strong rounded-lg"
              aria-label="GitHub Repository"
            >
              <Github size={20} aria-hidden="true" />
            </a>
          </div>
        </div>
      </footer>

    </main>
  );
}
