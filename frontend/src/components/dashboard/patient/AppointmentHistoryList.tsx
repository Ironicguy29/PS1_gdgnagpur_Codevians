"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, MapPin, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/components/providers/ToastProvider";

interface Appointment {
    _id: string;
    date: string;
    slot_time: string;
    consultation_type: string;
    status: string;
    token_number: string;
    doctor_id: {
        _id: string;
        specialization: string;
        department: string;
        user_id: {
            name: string;
        };
    };
}

export function AppointmentHistoryList() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const fetchAppointments = async () => {
            const userStr = localStorage.getItem("user");
            if (!userStr) {
                setLoading(false);
                return;
            }
            try {
                const user = JSON.parse(userStr);
                const res = await api.get(`/appointments/patient/${user._id}`);
                setAppointments(res.data || []);
            } catch (err: any) {
                console.error("Error fetching patient appointments:", err);
                toast("Failed to load appointments.", "error");
            } finally {
                setLoading(false);
            }
        };

        fetchAppointments();
    }, []);

    // Filter appointments into upcoming and past
    const todayStr = new Date().toISOString().split("T")[0];

    const upcoming = appointments.filter(apt => {
        return apt.status !== "Completed" && apt.status !== "Cancelled" && apt.date >= todayStr;
    });

    const past = appointments.filter(apt => {
        return apt.status === "Completed" || apt.status === "Cancelled" || apt.date < todayStr;
    });

    return (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm h-full flex flex-col">
            <div className="flex items-center justify-between mb-6 shrink-0">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">My Appointments</h3>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full">
                    {appointments.length} Total
                </span>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center flex-1 py-10">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
                    <p className="text-slate-400 text-xs font-medium">Loading appointments...</p>
                </div>
            ) : (
                <Tabs defaultValue="upcoming" className="w-full flex-1 flex flex-col overflow-hidden">
                    <TabsList className="grid w-full grid-cols-2 mb-4 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0">
                        <TabsTrigger value="upcoming" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm text-xs font-bold">
                            Upcoming ({upcoming.length})
                        </TabsTrigger>
                        <TabsTrigger value="past" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm text-xs font-bold">
                            History ({past.length})
                        </TabsTrigger>
                    </TabsList>

                    <div className="flex-1 overflow-y-auto pr-1 space-y-4 max-h-[260px]">
                        <TabsContent value="upcoming" className="space-y-3 mt-0">
                            {upcoming.length > 0 ? (
                                upcoming.map((apt) => (
                                    <div 
                                        key={apt._id} 
                                        className="group p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 hover:bg-white dark:hover:bg-slate-850 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-md transition-all"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">
                                                    {apt.doctor_id?.user_id?.name || "Dr. Assigned"}
                                                </h4>
                                                <p className="text-xs text-slate-400 font-semibold">{apt.doctor_id?.specialization || "General Physician"}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="px-2 py-0.5 text-[9px] font-black tracking-wide uppercase rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30">
                                                    {apt.status}
                                                </span>
                                                {apt.token_number && (
                                                    <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 mt-1">Token: {apt.token_number}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/50">
                                            <div className="flex items-center gap-1 font-medium">
                                                <Calendar className="w-3.5 h-3.5 text-blue-500" /> {apt.date}
                                            </div>
                                            <div className="flex items-center gap-1 font-medium">
                                                <Clock className="w-3.5 h-3.5 text-emerald-500" /> {apt.slot_time}
                                            </div>
                                            <div className="flex items-center gap-1 font-medium">
                                                <MapPin className="w-3.5 h-3.5 text-red-500" /> {apt.doctor_id?.department || "OPD Clinic"}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                                    <AlertCircle className="w-6 h-6 mx-auto mb-1.5 opacity-50" />
                                    <p className="text-xs font-semibold">No upcoming appointments</p>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="past" className="space-y-3 mt-0">
                            {past.length > 0 ? (
                                past.map((apt) => (
                                    <div 
                                        key={apt._id} 
                                        className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 opacity-75 hover:opacity-100 bg-white dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-850 transition-all"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-semibold text-slate-900 dark:text-white text-sm">
                                                    {apt.doctor_id?.user_id?.name || "Dr. Assigned"}
                                                </h4>
                                                <p className="text-xs text-slate-400">{apt.doctor_id?.specialization} • {apt.consultation_type}</p>
                                            </div>
                                            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-3">
                                            <span className="flex items-center gap-1 font-medium"><Calendar className="w-3 h-3" /> {apt.date}</span>
                                            <span className="flex items-center gap-1 font-medium"><Clock className="w-3 h-3" /> {apt.slot_time}</span>
                                            <span className="ml-auto font-bold text-[10px] text-slate-400 capitalize">{apt.status}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                                    <AlertCircle className="w-6 h-6 mx-auto mb-1.5 opacity-50" />
                                    <p className="text-xs font-semibold">No appointment history</p>
                                </div>
                            )}
                        </TabsContent>
                    </div>
                </Tabs>
            )}
        </div>
    );
}
