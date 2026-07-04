import { ScrollArea } from "@/components/ui/scroll-area";
import { User, ChevronRight, Clock } from "lucide-react";

interface QueueItem {
    token: number;
    patientName: string;
    department: string;
    status: 'in-progress' | 'waiting' | 'emergency';
    waitTime: string;
}

const MOCK_QUEUE: QueueItem[] = [
    { token: 101, patientName: "Rahul Kumar", department: "Cardio", status: 'in-progress', waitTime: '0m' },
    { token: 102, patientName: "Suman Devi", department: "Cardio", status: 'emergency', waitTime: '2m' },
    { token: 103, patientName: "Amit Shah", department: "Ortho", status: 'waiting', waitTime: '15m' },
    { token: 104, patientName: "Priya Rai", department: "General", status: 'waiting', waitTime: '25m' },
    { token: 105, patientName: "Kunal Singh", department: "Cardio", status: 'waiting', waitTime: '35m' },
    { token: 106, patientName: "Zara Khan", department: "Derma", status: 'waiting', waitTime: '45m' },
];

interface QueueTimelineProps {
    tokens?: any[];
}

export function QueueTimeline({ tokens = [] }: QueueTimelineProps) {
    const activeTokens = tokens.filter(t => 
        ['Booked', 'Checked In', 'Waiting', 'Called', 'In Consultation', 'Emergency'].includes(t.status)
    );

    return (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 h-full flex flex-col justify-center">
            <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <ChevronRight className="w-5 h-5 text-blue-500" /> Live Queue Timeline ({activeTokens.length} active)
            </h3>

            <ScrollArea className="w-full whitespace-nowrap pb-4">
                <div className="flex items-center gap-4 px-2">
                    {activeTokens.length === 0 ? (
                        <p className="text-sm text-slate-400 dark:text-slate-500 py-4">No active patients in queue.</p>
                    ) : (
                        activeTokens.map((item, index) => {
                            const isEmergency = item.priority === 'Emergency' || item.status === 'Emergency';
                            const isProgress = item.status === 'Called' || item.status === 'In Consultation';
                            const statusType = isProgress ? 'in-progress' : (isEmergency ? 'emergency' : 'waiting');

                            return (
                                <div key={item._id || item.token_number} className="relative group">
                                    {/* Connector Line */}
                                    {index < activeTokens.length - 1 && (
                                        <div className="absolute top-1/2 left-full w-4 h-0.5 bg-slate-200 dark:bg-slate-700 -translate-y-1/2 z-0" />
                                    )}

                                    <div className={`relative z-10 w-48 p-4 rounded-2xl border transition-all hover:scale-105 cursor-pointer
                                        ${statusType === 'in-progress' ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-200 dark:shadow-none' :
                                            statusType === 'emergency' ? 'bg-red-50 text-red-900 border-red-200 dark:bg-red-900/20 dark:text-red-100 dark:border-red-800 animate-pulse' :
                                                'bg-white text-slate-600 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                                        }`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                                statusType === 'in-progress' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-700'
                                            }`}>
                                                {item.display_token || `#${item.token_number}`}
                                            </span>
                                            {isEmergency && (
                                                <span className="text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/50 px-1.5 py-0.5 rounded">
                                                    EMERGENCY
                                                </span>
                                            )}
                                        </div>
                                        <p className="font-bold truncate">{item.patient_id?.name || "Walk-in Patient"}</p>
                                        <div className="flex items-center justify-between mt-2 text-xs opacity-80">
                                            <span>{item.department || "OPD"}</span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" /> {item.estimated_wait_minutes || 0}m
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}

// Active: 2026-07-04

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
