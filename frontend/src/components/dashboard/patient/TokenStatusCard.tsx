import { GlassCard } from "@/components/ui/GlassCard";
import { Clock, User } from "lucide-react";

interface TokenStatusCardProps {
    tokenNumber: string | number;
    patientsAhead: number;
    estimatedWait: string;
    queueStatus: string;
}

export function TokenStatusCard({ tokenNumber, patientsAhead, estimatedWait, queueStatus }: TokenStatusCardProps) {
    return (
        <GlassCard className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white relative overflow-hidden shadow-2xl shadow-blue-300/50 dark:shadow-none border-0">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 right-0 p-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
            <div className="absolute bottom-0 left-0 p-20 bg-blue-500/20 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row justify-between gap-6">

                {/* Left Side: Token Info */}
                <div className="flex-1 space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-2 border border-white/10">
                            <Clock className="w-3.5 h-3.5" />
                            <span className="text-xs font-bold uppercase tracking-wider">{queueStatus}</span>
                        </div>
                    </div>

                    <div>
                        <p className="text-blue-100 text-sm font-medium mb-1">Your Token Number</p>
                        <h2 className="text-6xl font-bold tracking-tighter text-white drop-shadow-sm">
                            {typeof tokenNumber === 'string' && tokenNumber.includes('-') ? tokenNumber : `#${tokenNumber}`}
                        </h2>
                    </div>

                    <div className="flex items-center gap-6">
                        <div>
                            <p className="text-blue-200 text-xs font-semibold uppercase mb-1">Patients Ahead</p>
                            <p className="text-2xl font-bold">{patientsAhead}</p>
                        </div>
                        <div className="w-px h-10 bg-white/20" />
                        <div>
                            <p className="text-blue-200 text-xs font-semibold uppercase mb-1">Est. Wait Time</p>
                            <p className="text-2xl font-bold">{estimatedWait}</p>
                        </div>
                    </div>
                </div>

                {/* Right Side: QR Code Area */}
                <div className="bg-white p-4 rounded-2xl flex flex-col items-center justify-center gap-3 shadow-lg max-w-[140px] md:max-w-[160px]">
                    <div className="w-full aspect-square bg-slate-900 rounded-lg flex items-center justify-center relative overflow-hidden">
                        {/* Mock QR Code Pattern */}
                        <div className="absolute inset-0 p-2 opacity-90">
                            <div className="w-full h-full border-4 border-white flex flex-wrap content-center justify-center gap-1">
                                <div className="w-1/2 h-1/2 bg-white" />
                                <div className="w-1/4 h-1/4 bg-white absolute top-2 right-2" />
                            </div>
                        </div>
                        <span className="font-mono text-xs text-white z-10">QR CODE</span>
                    </div>
                    <p className="text-[10px] text-center text-slate-500 font-medium leading-tight">
                        Scan at hospital kiosk for instant check-in
                    </p>
                </div>

            </div>
        </GlassCard>
    );
}

// Active: 2026-07-04

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
