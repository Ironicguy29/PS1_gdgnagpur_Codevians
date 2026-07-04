import { GlassCard } from "@/components/ui/GlassCard";
import { Stethoscope, MapPin, Building2 } from "lucide-react";

interface DoctorInfoCardProps {
    doctorName: string;
    specialization: string;
    roomNumber: string;
    floor: string;
    department: string;
}

export function DoctorInfoCard({ doctorName, specialization, roomNumber, floor, department }: DoctorInfoCardProps) {
    return (
        <GlassCard className="bg-white dark:bg-slate-900 border-l-4 border-l-emerald-500">
            <div className="flex items-start gap-4">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-xl">
                    <Stethoscope className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{department}</p>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{doctorName}</h3>
                    <p className="text-sm text-emerald-600 font-medium mb-3">{specialization}</p>

                    <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-slate-400" />
                            <span>Room {roomNumber}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Building2 className="w-4 h-4 text-slate-400" />
                            <span>{floor}</span>
                        </div>
                    </div>
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
