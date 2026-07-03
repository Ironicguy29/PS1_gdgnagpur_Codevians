'use client';
import DashboardLayout from "@/components/layout/DashboardLayout";
import DoctorVoiceAssistantWidget from "@/components/dashboard/doctor/DoctorVoiceAssistantWidget";

export default function DoctorVoicePage() {
    return (
        <DashboardLayout role="doctor">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Voice Translator</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Real-time multilingual communication with patients</p>
            </div>
            <div className="max-w-2xl">
                <DoctorVoiceAssistantWidget />
            </div>
        </DashboardLayout>
    );
}
