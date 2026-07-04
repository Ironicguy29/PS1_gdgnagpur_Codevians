'use client';
import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Stethoscope, Clock } from "lucide-react";
import api from "@/lib/api";

export function DoctorStatusBoard() {
    const [doctors, setDoctors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                const res = await api.get('/doctors');
                const doctorsWithQueue = await Promise.all(res.data.map(async (doc: any) => {
                    try {
                        const qRes = await api.get(`/queue/live/${doc._id}`);
                        const waitingCount = qRes.data.tokens?.filter((t: any) => t.status === 'Waiting').length || 0;
                        const hasActive = qRes.data.tokens?.some((t: any) => t.status === 'In Consultation' || t.status === 'Called');
                        const isPaused = qRes.data.queue?.is_paused || false;

                        let status: 'Available' | 'Busy' | 'On Break' | 'Emergency' = 'Available';
                        if (isPaused) status = 'On Break';
                        else if (qRes.data.tokens?.some((t: any) => t.priority === 'Emergency' && (t.status === 'Called' || t.status === 'In Consultation'))) {
                            status = 'Emergency';
                        } else if (hasActive) {
                            status = 'Busy';
                        }

                        return {
                            ...doc,
                            queueLength: waitingCount,
                            avgWaitTime: `${qRes.data.queue?.average_consultation_time || 15}m`,
                            status
                        };
                    } catch (err) {
                        return {
                            ...doc,
                            queueLength: 0,
                            avgWaitTime: '--',
                            status: 'Available' as const
                        };
                    }
                }));
                setDoctors(doctorsWithQueue);
            } catch (e) {
                console.error("Failed to load doctor status", e);
            } finally {
                setLoading(false);
            }
        };

        fetchDoctors();
    }, []);

    return (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden h-full flex flex-col">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Stethoscope className="w-5 h-5 text-blue-500" /> Doctor Availability
                </h3>
                <Badge variant="outline" className="bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300">
                    Active: {doctors.filter(d => d.status !== 'On Break').length}/{doctors.length}
                </Badge>
            </div>

            <ScrollArea className="flex-1 p-0">
                {loading ? (
                    <div className="p-8 text-center text-sm text-slate-400">Loading availability...</div>
                ) : doctors.length === 0 ? (
                    <div className="p-8 text-center text-sm text-slate-400">No doctors active today.</div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {doctors.map((doc) => (
                            <div key={doc._id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <Avatar className="h-10 w-10 border border-slate-200 dark:border-slate-700">
                                            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${doc.user_id?.name || doc._id}`} />
                                            <AvatarFallback>{(doc.user_id?.name || 'D')[0]}</AvatarFallback>
                                        </Avatar>
                                        <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 
                                            ${doc.status === 'Available' ? 'bg-green-500' :
                                                doc.status === 'Busy' ? 'bg-yellow-500' :
                                                    doc.status === 'Emergency' ? 'bg-red-500 animate-pulse' : 'bg-slate-400'}`}
                                        />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm text-slate-900 dark:text-white">{doc.user_id?.name || 'Dr. Unknown'}</p>
                                        <p className="text-xs text-slate-500">{doc.department} • Q: {doc.queueLength} waiting</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    <div className="text-right hidden sm:block">
                                        <div className="flex items-center gap-1.5 justify-end text-xs text-slate-500 mb-0.5">
                                            <Clock className="w-3 h-3" /> Wait
                                        </div>
                                        <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">{doc.avgWaitTime}</p>
                                    </div>
                                    <Badge className={`w-24 justify-center ${
                                        doc.status === 'Available' ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400' :
                                        doc.status === 'Busy' ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400' :
                                        doc.status === 'Emergency' ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800' :
                                        'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                                    }`}>
                                        {doc.status}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}

// Active: 2026-07-04

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
