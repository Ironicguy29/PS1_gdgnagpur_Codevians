import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Stethoscope, Clock, AlertTriangle } from "lucide-react";

interface DoctorStatus {
    id: string;
    name: string;
    department: string;
    status: "Available" | "Busy" | "On Break" | "Emergency";
    queueLength: number;
    avgWaitTime: string; // e.g., "12 mins"
}

// Mock data for 10/10 feel until API is live
const MOCK_DOCTORS: DoctorStatus[] = [
    { id: "1", name: "Dr. Anjali Sharma", department: "Cardiology", status: "Busy", queueLength: 8, avgWaitTime: "25m" },
    { id: "2", name: "Dr. Rajesh Verma", department: "Orthopedics", status: "Available", queueLength: 2, avgWaitTime: "5m" },
    { id: "3", name: "Dr. Priya Singh", department: "Dermatology", status: "On Break", queueLength: 0, avgWaitTime: "--" },
    { id: "4", name: "Dr. Vikram Malhotra", department: "General Medicine", status: "Emergency", queueLength: 15, avgWaitTime: "45m" },
    { id: "5", name: "Dr. Suresh Patil", department: "Pediatrics", status: "Busy", queueLength: 5, avgWaitTime: "10m" },
];

export function DoctorStatusBoard() {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden h-full flex flex-col">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Stethoscope className="w-5 h-5 text-blue-500" /> Doctor Availability
                </h3>
                <Badge variant="outline" className="bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300">
                    Active: {MOCK_DOCTORS.filter(d => d.status !== 'On Break').length}/{MOCK_DOCTORS.length}
                </Badge>
            </div>

            <ScrollArea className="flex-1 p-0">
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {MOCK_DOCTORS.map((doc) => (
                        <div key={doc.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <Avatar className="h-10 w-10 border border-slate-200 dark:border-slate-700">
                                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${doc.name}`} />
                                        <AvatarFallback>{doc.name[0]}</AvatarFallback>
                                    </Avatar>
                                    <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 
                                        ${doc.status === 'Available' ? 'bg-green-500' :
                                            doc.status === 'Busy' ? 'bg-yellow-500' :
                                                doc.status === 'Emergency' ? 'bg-red-500 animate-pulse' : 'bg-slate-400'}`}
                                    />
                                </div>
                                <div>
                                    <p className="font-semibold text-sm text-slate-900 dark:text-white">{doc.name}</p>
                                    <p className="text-xs text-slate-500">{doc.department}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="text-right hidden sm:block">
                                    <div className="flex items-center gap-1.5 justify-end text-xs text-slate-500 mb-0.5">
                                        <Clock className="w-3 h-3" /> Wait
                                    </div>
                                    <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">{doc.avgWaitTime}</p>
                                </div>
                                <Badge className={`w-24 justify-center ${doc.status === 'Available' ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400' :
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
            </ScrollArea>
        </div>
    );
}
