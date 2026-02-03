'use client';
import DashboardLayout from "@/components/layout/DashboardLayout";
import { AppointmentHistoryList } from "@/components/dashboard/patient/AppointmentHistoryList";

export default function AppointmentsPage() {
    return (
        <DashboardLayout role="patient">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">My Appointments</h1>
            <div className="h-[600px]">
                <AppointmentHistoryList />
            </div>
        </DashboardLayout>
    );
}
