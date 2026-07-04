'use client';
import { useEffect, useState } from 'react';
import { Users, Clock, ShieldAlert, CheckCircle2, Loader2, RefreshCw, UserCheck, ChevronRight } from 'lucide-react';
import api from '@/lib/api';

interface UpcomingPatientsPanelProps {
  doctorId?: string;
  socket?: any;
  onCallNext?: () => void;
  loading?: boolean;
}

const STATUS_CONFIG: Record<string, { bg: string }> = {
  Waiting: { bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/40' },
  Called: { bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/40' },
  'In Consultation': { bg: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/40' },
  Completed: { bg: 'bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700' },
};

async function loadDemoTokens() {
  try {
    const res = await fetch('/queue.json');
    const data = await res.json();
    return (data.doctor_queue.tokens as any[]).map((t: any, i: number) => ({
      _id: `demo-${i}`,
      token_number: t.token_number,
      display_token: t.token,
      status: t.status,
      priority: t.priority || 'Normal',
      patient_id: { name: t.patient.name, age: t.patient.age, gender: t.patient.gender },
      estimated_call_at: t.estimated_call_at || null,
      notes: t.notes || t.reason || null,
    }));
  } catch {
    return [];
  }
}

export function UpcomingPatientsPanel({ doctorId, socket, onCallNext, loading }: UpcomingPatientsPanelProps) {
  const [tokens, setTokens] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);
  const [usingDemo, setUsingDemo] = useState(false);

  useEffect(() => { fetchTokens(); }, [doctorId]);

  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => fetchTokens();
    socket.on('queue.token.update', handleUpdate);
    socket.on('queue.update', handleUpdate);
    return () => {
      socket.off('queue.token.update', handleUpdate);
      socket.off('queue.update', handleUpdate);
    };
  }, [socket, doctorId]);

  useEffect(() => {
    const iv = setInterval(fetchTokens, 30_000);
    return () => clearInterval(iv);
  }, [doctorId]);

  const fetchTokens = async () => {
    setFetching(true);
    try {
      if (!doctorId) throw new Error('no-id');
      const res = await api.get(`/queue/live/${doctorId}`);
      setTokens(res.data?.tokens || []);
      setUsingDemo(false);
    } catch {
      const demo = await loadDemoTokens();
      setTokens(demo);
      setUsingDemo(true);
    } finally {
      setFetching(false);
    }
  };

  const waitingTokens = tokens.filter(t => t.status === 'Waiting');
  const activeToken = tokens.find(t => t.status === 'Called' || t.status === 'In Consultation');
  const completedCount = tokens.filter(t => t.status === 'Completed').length;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white">Upcoming Patients</h3>
            <p className="text-xs text-slate-500">
              {waitingTokens.length} waiting · {completedCount} done
              {usingDemo && <span className="ml-2 text-amber-500 font-semibold">[Demo Data]</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onCallNext && (
            <button
              onClick={onCallNext}
              disabled={loading || waitingTokens.length === 0}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ChevronRight className="w-3.5 h-3.5" />}
              Call Next
            </button>
          )}
          <button
            onClick={fetchTokens}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${fetching ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 border-b border-slate-100 dark:border-slate-800">
        {[
          { label: 'Active', value: activeToken ? 1 : 0, color: 'text-green-600 dark:text-green-400' },
          { label: 'Waiting', value: waitingTokens.length, color: 'text-amber-600 dark:text-amber-400' },
          { label: 'Completed', value: completedCount, color: 'text-slate-500' },
        ].map(stat => (
          <div key={stat.label} className="flex flex-col items-center py-3 border-r last:border-r-0 border-slate-100 dark:border-slate-800">
            <span className={`text-2xl font-black ${stat.color}`}>{stat.value}</span>
            <span className="text-[10px] text-slate-400 uppercase font-semibold mt-0.5">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Active Patient Banner */}
      {activeToken && (
        <div className="mx-4 mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800/40 rounded-2xl flex items-center gap-3">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-green-600 dark:text-green-400 uppercase font-bold tracking-wider">Now Serving</p>
            <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{activeToken.patient_id?.name}</p>
            <p className="text-xs text-slate-500">{activeToken.patient_id?.age}y · {activeToken.patient_id?.gender}</p>
          </div>
          <div className="text-right shrink-0">
            <span className="text-xs font-black text-green-600 dark:text-green-400">
              {activeToken.display_token || `#${activeToken.token_number}`}
            </span>
            <p className="text-[10px] text-slate-400">{activeToken.status}</p>
          </div>
        </div>
      )}

      {/* Queue List */}
      <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
        {fetching && tokens.length === 0 ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
          </div>
        ) : waitingTokens.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-2" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Queue is clear!</p>
            <p className="text-xs text-slate-400">No patients currently waiting</p>
          </div>
        ) : (
          [...waitingTokens]
            .sort((a, b) => (a.priority === 'Emergency' ? -1 : 1) || (a.token_number - b.token_number))
            .map((token, idx) => {
              const isEmergency = token.priority === 'Emergency';
              const cfg = STATUS_CONFIG[token.status] || STATUS_CONFIG['Waiting'];
              return (
                <div
                  key={token._id || idx}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    isEmergency ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/40' : cfg.bg
                  }`}
                >
                  {/* Position Badge */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shrink-0 ${
                    isEmergency ? 'bg-red-600 text-white' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  }`}>
                    {isEmergency ? '🚨' : idx + 1}
                  </div>

                  {/* Patient Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{token.patient_id?.name}</p>
                      {isEmergency && <ShieldAlert className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                    </div>
                    <p className="text-xs text-slate-500 truncate">
                      {[token.patient_id?.age && `${token.patient_id.age}y`, token.patient_id?.gender].filter(Boolean).join(' · ')}
                      {token.notes && <span className="text-red-500 ml-1">· {token.notes}</span>}
                    </p>
                  </div>

                  {/* Token + ETA */}
                  <div className="text-right shrink-0">
                    <p className="text-xs font-black text-slate-800 dark:text-white">
                      {token.display_token || `#${token.token_number}`}
                    </p>
                    {token.estimated_call_at && (
                      <div className="flex items-center gap-0.5 text-[10px] text-slate-400 mt-0.5 justify-end">
                        <Clock className="w-2.5 h-2.5" />~{token.estimated_call_at}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
        )}
      </div>
    </div>
  );
}
