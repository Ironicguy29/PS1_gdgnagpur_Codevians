'use client';
import DashboardLayout from "@/components/layout/DashboardLayout";
import VoiceAssistantFloatingButton from "@/components/dashboard/patient/VoiceAssistantFloatingButton";

export default function VoiceAssistantPage() {
    const openAssistant = () => {
        const fab = document.getElementById('voice-assistant-fab');
        if (fab) fab.click();
    };

    return (
        <DashboardLayout role="patient">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Voice Assistant</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Speak in your language — AI translates and helps you</p>
            </div>
            <div className="bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border border-indigo-500/10 rounded-2xl p-8 text-center max-w-2xl mx-auto">
                <button
                    onClick={openAssistant}
                    className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mb-6 shadow-xl shadow-indigo-500/20 hover:scale-110 hover:shadow-indigo-500/40 transition-all duration-200 cursor-pointer"
                    title="Open Voice Assistant"
                >
                    <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                </button>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Multilingual AI Health Assistant</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-1 max-w-md mx-auto text-sm">Click the microphone above or the button in the bottom-right corner to start speaking.</p>
                <p className="text-slate-400 dark:text-slate-500 mb-4 max-w-md mx-auto text-xs">Supports Hindi, Marathi, Tamil, Telugu, Bengali, Gujarati, Kannada, Malayalam, Punjabi, and English.</p>
                <div className="flex flex-wrap gap-2 justify-center">
                    {['English','हिन्दी','मराठी','தமிழ்','తెలుగు','ગુજરાતી','ಕನ್ನಡ','മലയാളം','বাংলা','ਪੰਜਾਬੀ'].map(l=>(
                        <span key={l} className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-medium border border-indigo-500/20">{l}</span>
                    ))}
                </div>
            </div>
            <VoiceAssistantFloatingButton />
        </DashboardLayout>
    );
}

// Active: 2026-07-04

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
