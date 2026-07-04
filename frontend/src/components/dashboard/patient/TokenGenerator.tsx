/**
 * TokenGenerator.tsx
 * -----------------------------------------------------------------
 * Self-service OPD token generator for the Patient Portal.
 *
 * Features:
 *  - Fetches live doctor list from GET /doctors
 *  - Augments each doctor with real-time queue length via GET /queue/live/:id
 *  - Lets patient filter by department and choose consultation type
 *  - Calls POST /appointments/book to generate a real token
 *  - Falls back to a simulated token if the backend is unavailable (demo mode)
 *  - onTokenGenerated callback propagates token + doctorId to parent
 *
 * Used in: /dashboard/patient (🎫 Get Token tab)
 * -----------------------------------------------------------------
 */
'use client';
import { useState, useEffect } from 'react';
import { Ticket, Clock, CheckCircle2, Loader2, ChevronRight, Users, Stethoscope, RefreshCw, X } from 'lucide-react';
import api from '@/lib/api';

interface TokenGeneratorProps {
  /** MongoDB _id of the logged-in patient */
  patientId: string;
  /** Called after a token is successfully generated (real or demo) */
  onTokenGenerated?: (token: string | number, doctorId: string) => void;
}

/**
 * Static fallback doctor list shown when GET /doctors is unreachable.
 * Mirrors the 4 real doctors seeded via seed-demo-users.js.
 */
const DEMO_DOCTORS = [
  { _id: 'doc-001', department: 'General Medicine',  specialization: 'General Physician',   user_id: { name: 'Dr. Anita Sharma' },   queue_length: 4, avg_wait: 15 },
  { _id: 'doc-002', department: 'Cardiology',        specialization: 'Cardiologist',         user_id: { name: 'Dr. Rahul Mehta' },    queue_length: 2, avg_wait: 20 },
  { _id: 'doc-003', department: 'Pediatrics',        specialization: 'Pediatrician',         user_id: { name: 'Dr. Sunita Rao' },     queue_length: 6, avg_wait: 10 },
  { _id: 'doc-004', department: 'Orthopedics',       specialization: 'Orthopedic Surgeon',   user_id: { name: 'Dr. Vijay Nair' },     queue_length: 3, avg_wait: 25 },
  { _id: 'doc-005', department: 'Dermatology',       specialization: 'Dermatologist',        user_id: { name: 'Dr. Priya Iyer' },     queue_length: 5, avg_wait: 12 },
];

/** Filter chips rendered above the doctor list */
const DEPARTMENTS = ['All', 'General Medicine', 'Cardiology', 'Pediatrics', 'Orthopedics', 'Dermatology'];

export function TokenGenerator({ patientId, onTokenGenerated }: TokenGeneratorProps) {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]); // shown after department filter
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [department, setDepartment] = useState('All');
  const [generating, setGenerating] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<any>(null); // null = not generated yet
  const [loading, setLoading] = useState(true);
  const [consultationType, setConsultationType] = useState<'Physical' | 'Telemedicine'>('Physical');

  // Fetch doctors once on mount
  useEffect(() => { fetchDoctors(); }, []);

  // Re-filter whenever department or full doctor list changes
  useEffect(() => {
    const d = department === 'All' ? doctors : doctors.filter(d => d.department === department);
    setFiltered(d);
    setSelectedDoc(null); // clear selection when filter changes
  }, [department, doctors]);

  /**
   * Fetch all available doctors and augment with live queue lengths.
   * Falls back to DEMO_DOCTORS if the API is unreachable.
   */
  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const res = await api.get('/doctors');
      const rawDocs = res.data || [];

      // Augment each doctor with real-time queue_length from /queue/live
      const enriched = await Promise.all(rawDocs.map(async (doc: any) => {
        try {
          const q = await api.get(`/queue/live/${doc._id}`);
          return {
            ...doc,
            queue_length: q.data?.tokens?.filter((t: any) => t.status === 'Waiting').length ?? 0,
            avg_wait: q.data?.queue?.average_consultation_time ?? 15,
          };
        } catch {
          // Queue endpoint unavailable — use safe defaults
          return { ...doc, queue_length: 0, avg_wait: 15 };
        }
      }));

      setDoctors(enriched.length ? enriched : DEMO_DOCTORS);
      setFiltered(enriched.length ? enriched : DEMO_DOCTORS);
    } catch {
      // Backend fully unreachable — use static demo data
      setDoctors(DEMO_DOCTORS);
      setFiltered(DEMO_DOCTORS);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Book an appointment via POST /appointments/book.
   * On success: stores generated token data and fires onTokenGenerated.
   * On failure: generates a simulated demo token so the UI always works.
   */
  const handleGenerate = async () => {
    if (!selectedDoc) return;
    setGenerating(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const now = new Date();
      const slotTime = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;

      const res = await api.post('/appointments/book', {
        doctor_id: selectedDoc._id,
        patient_id: patientId,
        date: today,
        slot_time: slotTime,
        consultation_type: consultationType,
      });

      // Extract token from various possible response shapes
      const token = res.data?.token?.display_token
        || res.data?.token_number
        || res.data?.token?.token_number;

      setGeneratedToken({
        token,
        doctor: selectedDoc.user_id?.name || 'Doctor',
        department: selectedDoc.department,
        wait: (selectedDoc.queue_length ?? 0) * (selectedDoc.avg_wait ?? 15),
        position: (selectedDoc.queue_length ?? 0) + 1,
        consultation_type: consultationType,
      });

      onTokenGenerated?.(token, selectedDoc._id);
    } catch {
      // Demo fallback: generate a fake department-prefixed token (e.g. "GM-47")
      const fakeToken = `${selectedDoc.department.slice(0,2).toUpperCase()}-${String(Math.floor(Math.random() * 90) + 10)}`;
      setGeneratedToken({
        token: fakeToken,
        doctor: selectedDoc.user_id?.name || 'Doctor',
        department: selectedDoc.department,
        wait: (selectedDoc.queue_length ?? 0) * (selectedDoc.avg_wait ?? 15),
        position: (selectedDoc.queue_length ?? 0) + 1,
        consultation_type: consultationType,
        demo: true, // flag shown in UI to indicate demo/offline mode
      });
    } finally {
      setGenerating(false);
    }
  };

  /** Reset to the doctor-selection screen and refresh the list */
  const reset = () => {
    setGeneratedToken(null);
    setSelectedDoc(null);
    fetchDoctors();
  };

  // ── Token Success Screen ────────────────────────────────────────────────────
  // Shown after a token has been generated (real or demo)
  if (generatedToken) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-emerald-200 dark:border-emerald-800/40 p-6 shadow-lg shadow-emerald-50 dark:shadow-none">
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-lg">Token Generated!</h3>
              {/* Demo badge — shown only when backend was unreachable */}
              {generatedToken.demo && (
                <span className="text-[10px] text-amber-500 font-semibold">DEMO MODE — Backend offline</span>
              )}
            </div>
          </div>
          {/* Close / reset button */}
          <button onClick={reset} className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Large token number display */}
        <div className="flex flex-col items-center py-6 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 rounded-2xl border border-emerald-100 dark:border-emerald-800/30 mb-5">
          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold tracking-wider mb-1">Your Token Number</p>
          <p className="text-6xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight leading-none">{generatedToken.token}</p>
          <div className="mt-3 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">{generatedToken.consultation_type}</p>
          </div>
        </div>

        {/* Summary: doctor, wait time, queue position */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 text-center">
            <p className="text-[10px] text-slate-400 uppercase font-semibold">Doctor</p>
            <p className="text-xs font-bold text-slate-800 dark:text-white mt-0.5 leading-tight">{generatedToken.doctor}</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 text-center">
            <p className="text-[10px] text-slate-400 uppercase font-semibold">Est. Wait</p>
            <p className="text-sm font-black text-amber-600 dark:text-amber-400 mt-0.5">{generatedToken.wait} min</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 text-center">
            <p className="text-[10px] text-slate-400 uppercase font-semibold">Position</p>
            <p className="text-sm font-black text-blue-600 dark:text-blue-400 mt-0.5">#{generatedToken.position}</p>
          </div>
        </div>

        <button onClick={reset} className="w-full py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
          Generate Another Token
        </button>
      </div>
    );
  }

  // ── Main Generator UI ───────────────────────────────────────────────────────
  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Header bar */}
      <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 dark:from-cyan-900/20 dark:to-blue-900/20 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 rounded-xl">
            <Ticket className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white">Generate Queue Token</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Select doctor &amp; get instant token</p>
          </div>
        </div>
        {/* Manual refresh button */}
        <button onClick={fetchDoctors} className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-white dark:hover:bg-slate-800 transition-all">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="p-6 space-y-5">
        {/* Step 1: Choose consultation type */}
        <div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Consultation Type</p>
          <div className="flex gap-2">
            {(['Physical', 'Telemedicine'] as const).map(type => (
              <button
                key={type}
                onClick={() => setConsultationType(type)}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all ${
                  consultationType === type
                    ? 'bg-cyan-600 border-cyan-600 text-white shadow-md shadow-cyan-200 dark:shadow-none'
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-cyan-300'
                }`}
              >
                {type === 'Physical' ? '🏥 Physical' : '📹 Telemedicine'}
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Filter by department */}
        <div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Department</p>
          <div className="flex gap-1.5 flex-wrap">
            {DEPARTMENTS.map(dept => (
              <button
                key={dept}
                onClick={() => setDepartment(dept)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  department === dept
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {dept}
              </button>
            ))}
          </div>
        </div>

        {/* Step 3: Select a doctor */}
        <div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Select Doctor</p>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 text-cyan-500 animate-spin" />
            </div>
          ) : (
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {filtered.map(doc => {
                const isSelected = selectedDoc?._id === doc._id;
                const waitMins = (doc.queue_length ?? 0) * (doc.avg_wait ?? 15);
                // Colour-code busy indicator: red > 5, amber > 2, green otherwise
                const busyLevel = doc.queue_length > 5 ? 'text-red-500' : doc.queue_length > 2 ? 'text-amber-500' : 'text-emerald-500';
                return (
                  <button
                    key={doc._id}
                    onClick={() => setSelectedDoc(doc)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 ${
                      isSelected
                        ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-cyan-100 dark:bg-cyan-800/40 text-cyan-600' : 'bg-white dark:bg-slate-800 text-slate-500'}`}>
                      <Stethoscope className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{doc.user_id?.name || 'Doctor'}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{doc.specialization || doc.department}</p>
                    </div>
                    {/* Live queue stats */}
                    <div className="text-right shrink-0">
                      <div className={`flex items-center gap-1 text-xs font-bold ${busyLevel}`}>
                        <Users className="w-3 h-3" />
                        {doc.queue_length ?? 0} waiting
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                        <Clock className="w-3 h-3" />
                        ~{waitMins} min
                      </div>
                    </div>
                    {isSelected && <ChevronRight className="w-4 h-4 text-cyan-500 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Step 4: Generate token button — disabled until a doctor is selected */}
        <button
          onClick={handleGenerate}
          disabled={!selectedDoc || generating}
          className={`w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            selectedDoc
              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white shadow-lg shadow-cyan-200 dark:shadow-none'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
          }`}
        >
          {generating ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Generating Token...</>
          ) : (
            <><Ticket className="w-4 h-4" /> Generate My Token</>
          )}
        </button>
      </div>
    </div>
  );
}
