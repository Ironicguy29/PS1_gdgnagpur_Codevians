'use client';

import DashboardLayout from "@/components/layout/DashboardLayout";
import { AppointmentHistoryList } from "@/components/dashboard/patient/AppointmentHistoryList";
import { BookAppointmentTab } from "@/components/dashboard/patient/BookAppointmentTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, History, Sparkles } from "lucide-react";

export default function AppointmentsPage() {
    return (
        <DashboardLayout role="patient">
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        Appointments <Sparkles className="w-6 h-6 text-blue-500 animate-pulse" />
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Book consultations with specialist doctors and manage your active OPD queue slots.</p>
                </div>

                {/* Tabs Panel */}
                <Tabs defaultValue="book" className="w-full">
                    <TabsList className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl mb-6 max-w-md grid grid-cols-2">
                        <TabsTrigger 
                            value="book" 
                            className="rounded-xl py-2.5 text-xs font-bold transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm flex items-center justify-center gap-2"
                        >
                            <Calendar className="w-4 h-4 text-blue-500" /> Book Consultation
                        </TabsTrigger>
                        <TabsTrigger 
                            value="history" 
                            className="rounded-xl py-2.5 text-xs font-bold transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm flex items-center justify-center gap-2"
                        >
                            <History className="w-4 h-4 text-emerald-500" /> History & Status
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="book" className="outline-none">
                        <BookAppointmentTab />
                    </TabsContent>

                    <TabsContent value="history" className="outline-none">
                        <div className="h-[550px]">
                            <AppointmentHistoryList />
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
}
