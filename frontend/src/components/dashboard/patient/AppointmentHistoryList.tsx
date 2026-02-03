import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, MapPin, CheckCircle, AlertCircle } from "lucide-react";

const MOCK_APPOINTMENTS = {
    upcoming: [
        {
            id: 1,
            doctor: "Dr. Anjali Sharma",
            speciality: "Cardiologist",
            date: "Today, 10:30 AM",
            type: "Follow-up",
            status: "Scheduled",
            location: "Room 304, 3rd Floor"
        },
        {
            id: 2,
            doctor: "Dr. Rajesh Verma",
            speciality: "Orthopedic",
            date: "Tomorrow, 09:00 AM",
            type: "Consultation",
            status: "Confirmed",
            location: "Room 102, 1st Floor"
        }
    ],
    past: [
        {
            id: 3,
            doctor: "Dr. Priya Singh",
            speciality: "Dermatologist",
            date: "12 Jan 2024",
            type: "Check-up",
            status: "Completed",
            location: "Room 205, 2nd Floor"
        },
        {
            id: 4,
            doctor: "Dr. Anjali Sharma",
            speciality: "Cardiologist",
            date: "10 Dec 2023",
            type: "Emergency",
            status: "Completed",
            location: "ER Ward A"
        }
    ]
};

export function AppointmentHistoryList() {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm h-full">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">My Appointments</h3>
                <span className="text-xs font-medium text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full cursor-pointer hover:bg-blue-100 transition-colors">View All</span>
            </div>

            <Tabs defaultValue="upcoming" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    <TabsTrigger value="upcoming" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Upcoming</TabsTrigger>
                    <TabsTrigger value="past" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Past History</TabsTrigger>
                </TabsList>

                <TabsContent value="upcoming" className="space-y-4">
                    {MOCK_APPOINTMENTS.upcoming.map((apt) => (
                        <div key={apt.id} className="group p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 hover:bg-white hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-md transition-all">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h4 className="font-semibold text-slate-900 dark:text-white">{apt.doctor}</h4>
                                    <p className="text-xs text-slate-500">{apt.speciality}</p>
                                </div>
                                <span className="px-2 py-1 text-[10px] font-bold tracking-wide uppercase rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                    {apt.status}
                                </span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-slate-500 mt-3">
                                <div className="flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5" /> {apt.date}
                                </div>
                                <div className="flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5" /> {apt.location}
                                </div>
                            </div>
                        </div>
                    ))}
                </TabsContent>

                <TabsContent value="past" className="space-y-4">
                    {MOCK_APPOINTMENTS.past.map((apt) => (
                        <div key={apt.id} className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 opacity-75 hover:opacity-100 transition-opacity">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h4 className="font-semibold text-slate-900 dark:text-white">{apt.doctor}</h4>
                                    <p className="text-xs text-slate-500">{apt.speciality} • {apt.type}</p>
                                </div>
                                <CheckCircle className="w-4 h-4 text-slate-400" />
                            </div>
                            <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {apt.date}</span>
                            </div>
                        </div>
                    ))}
                </TabsContent>
            </Tabs>
        </div>
    );
}
