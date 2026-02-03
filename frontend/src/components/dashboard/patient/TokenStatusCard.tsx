import { GlassCard } from "@/components/ui/GlassCard";
import { Clock, User } from "lucide-react";

interface TokenStatusCardProps {
    tokenNumber: number;
    patientsAhead: number;
    estimatedWait: string;
    queueStatus: 'Waiting' | 'In Progress' | 'Completed';
}

export function TokenStatusCard({ tokenNumber, patientsAhead, estimatedWait, queueStatus }: TokenStatusCardProps) {
    return (
        <GlassCard className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 right-0 p-24 bg-white/10 rounded-full blur-2xl -mr-12 -mt-12 pointer-events-none" />

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-md">
                        <Clock className="w-4 h-4" />
                        <span className="text-xs font-semibold uppercase tracking-wide">{queueStatus}</span>
                    </div>
                    <div className="text-right">
                        <p className="text-blue-100 text-xs font-medium">Estimated Wait</p>
                        <p className="text-xl font-bold">{estimatedWait}</p>
                    </div>
                </div>

                <div className="mb-6">
                    <p className="text-blue-100 text-sm font-medium mb-1">Your Token Number</p>
                    <h2 className="text-6xl font-bold tracking-tighter">#{tokenNumber}</h2>
                </div>

                <div className="flex items-center justify-between bg-black/20 p-3 rounded-xl border border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <User className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold">Patients Ahead</p>
                            <p className="text-xs text-blue-200">Live Updates Active</p>
                        </div>
                    </div>
                    <span className="text-2xl font-bold">{patientsAhead}</span>
                </div>
            </div>
        </GlassCard>
    );
}
