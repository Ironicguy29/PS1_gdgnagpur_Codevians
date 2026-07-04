'use client';
import { useEffect, useState } from 'react';
import { Pill, Clock, CheckCircle2, Loader2, RefreshCw, AlertCircle, ChevronRight } from 'lucide-react';
import api from '@/lib/api';

interface PharmacyQueuePanelProps {
  socket?: any;
  onSelectPrescription?: (pres: any) => void;
}

const STATUS_CONFIG: Record<string, { label: string; labelColor: string; dot: string; rowBg: string }> = {
  Generated: {
    label: 'Pending',
    labelColor: 'text-indigo-600 dark:text-indigo-400',
    dot: 'bg-indigo-500',
    rowBg: 'bg-indigo-50/60 dark:bg-indigo-950/10 border-indigo-200 dark:border-indigo-800/30',
  },
  Ready: {
    label: 'Ready',
    labelColor: 'text-teal-600 dark:text-teal-400',
    dot: 'bg-teal-500 animate-pulse',
    rowBg: 'bg-teal-50/60 dark:bg-teal-950/10 border-teal-200 dark:border-teal-800/30',
  },
  Dispensed: {
    label: 'Dispensed',
    labelColor: 'text-slate-400',
    dot: 'bg-emerald-500',
    rowBg: 'bg-slate-50 dark:bg-slate-800/20 border-slate-200 dark:border-slate-700',
  },
  Completed: {
    label: 'Dispensed',
    labelColor: 'text-slate-400',
    dot: 'bg-emerald-500',
    rowBg: 'bg-slate-50 dark:bg-slate-800/20 border-slate-200 dark:border-slate-700',
  },
};

async function loadDemoPrescriptions() {
  try {
    const res = await fetch('/queue.json');
    const data = await res.json();
    return (data.pharmacy_queue.prescriptions as any[]).map((p: any, i: number) => ({
      _id: `rx-demo-${i}`,
      prescription_id: p.prescription_id,
      status: p.status,
      patient_id: { name: p.patient.name, abha_id: p.patient.abha_id, age: p.patient.age },
      doctor_id: { name: p.doctor },
      queue_token: p.token,
      medicines: p.medicines || [],
      total_amount: p.total_amount,
      notes: p.notes,
    }));
  } catch {
    return [];
  }
}

export function PharmacyQueuePanel({ socket, onSelectPrescription }: PharmacyQueuePanelProps) {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);
  const [usingDemo, setUsingDemo] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'Generated' | 'Ready'>('all');

  useEffect(() => { fetchQueue(); }, []);

  useEffect(() => {
    if (!socket) return;
    const handleNew = () => fetchQueue();
    socket.on('prescription.created', handleNew);
    socket.on('prescription.status.ready', handleNew);
    return () => {
      socket.off('prescription.created', handleNew);
      socket.off('prescription.status.ready', handleNew);
    };
  }, [socket]);

  useEffect(() => {
    const iv = setInterval(fetchQueue, 30_000);
    return () => clearInterval(iv);
  }, []);

  const fetchQueue = async () => {
    setFetching(true);
    try {
      const param = activeFilter !== 'all' ? `?status=${activeFilter}` : '';
      const res = await api.get(`/pharmacy/prescriptions${param}`);
      if (res.data?.success && res.data.data?.length >= 0) {
        setPrescriptions(res.data.data);
        setUsingDemo(false);
      } else throw new Error('empty');
    } catch {
      const demo = await loadDemoPrescriptions();
      setPrescriptions(demo);
      setUsingDemo(true);
    } finally {
      setFetching(false);
    }
  };

  // Re-fetch when filter changes
  useEffect(() => { fetchQueue(); }, [activeFilter]);

  const pending = prescriptions.filter(p => p.status === 'Generated');
  const ready = prescriptions.filter(p => p.status === 'Ready');
  const dispensed = prescriptions.filter(p => p.status === 'Dispensed' || p.status === 'Completed');

  const displayed = activeFilter === 'all' ? prescriptions : prescriptions.filter(p => p.status === activeFilter);

  return (
    <div className="bg-slate-950 rounded-3xl border border-slate-800 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
            <Pill className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white">Pharmacy Queue</h3>
            <p className="text-xs text-slate-400">
              {pending.length} pending · {ready.length} ready to collect
              {usingDemo && <span className="ml-2 text-amber-500 font-semibold">[Demo Data]</span>}
            </p>
          </div>
        </div>
        <button
          onClick={fetchQueue}
          className="p-2 rounded-full text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${fetching ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 border-b border-slate-800">
        {[
          { label: 'Pending', value: pending.length, color: 'text-indigo-400' },
          { label: 'Ready', value: ready.length, color: 'text-teal-400' },
          { label: 'Dispensed', value: dispensed.length, color: 'text-slate-400' },
        ].map(s => (
          <div key={s.label} className="flex flex-col items-center py-3 border-r last:border-r-0 border-slate-800">
            <span className={`text-2xl font-black ${s.color}`}>{s.value}</span>
            <span className="text-[10px] text-slate-500 uppercase font-semibold mt-0.5">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1.5 px-4 pt-4">
        {(['all', 'Generated', 'Ready'] as const).map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeFilter === f
                ? f === 'Ready' ? 'bg-teal-600 text-white' : f === 'Generated' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-white'
                : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
            }`}
          >
            {f === 'all' ? 'All' : f === 'Generated' ? 'Pending' : 'Ready'}
          </button>
        ))}
      </div>

      {/* Prescription List */}
      <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
        {fetching && prescriptions.length === 0 ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-2" />
            <p className="text-sm font-semibold text-slate-400">No prescriptions in this category</p>
          </div>
        ) : (
          displayed.map((pres, idx) => {
            const cfg = STATUS_CONFIG[pres.status] || STATUS_CONFIG['Generated'];
            const isReady = pres.status === 'Ready';
            const isDone = pres.status === 'Dispensed' || pres.status === 'Completed';
            return (
              <button
                key={pres._id || idx}
                onClick={() => onSelectPrescription?.(pres)}
                className={`w-full text-left flex items-start gap-3 p-3 rounded-xl border transition-all group ${cfg.rowBg} ${
                  onSelectPrescription ? 'hover:shadow-md cursor-pointer' : ''
                }`}
              >
                {/* Status Dot */}
                <div className="mt-1 shrink-0">
                  <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{pres.patient_id?.name}</p>
                    {isReady && (
                      <span className="text-[10px] bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 px-1.5 py-0.5 rounded font-bold uppercase">
                        Collect Now
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    {pres.queue_token && <span className="font-semibold text-blue-500 dark:text-blue-400">{pres.queue_token} · </span>}
                    {pres.doctor_id?.name || 'Doctor'} · {pres.medicines?.length || 0} drug{pres.medicines?.length !== 1 ? 's' : ''}
                  </p>
                  {pres.notes && (
                    <p className="text-[10px] text-slate-400 italic mt-0.5 truncate">{pres.notes}</p>
                  )}
                </div>

                {/* Right side */}
                <div className="shrink-0 flex flex-col items-end gap-1">
                  <span className={`text-xs font-bold ${cfg.labelColor}`}>{cfg.label}</span>
                  {pres.total_amount && (
                    <span className="text-[10px] text-slate-400">₹{pres.total_amount.toFixed(2)}</span>
                  )}
                  {!isDone && onSelectPrescription && (
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-all mt-0.5" />
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
