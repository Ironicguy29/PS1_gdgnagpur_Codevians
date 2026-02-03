import { Button } from "@/components/ui/button";
import { AlertTriangle, Siren, Loader2 } from "lucide-react";
import { useState } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/providers/ToastProvider";

export function EmergencyQuickAction() {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleEmergency = async () => {
        if (!confirm("Are you sure this is a medical emergency? Misuse may lead to penalties.")) return;

        setLoading(true);
        try {
            const userStr = localStorage.getItem('user');
            if (!userStr) throw new Error("Please login first");
            const user = JSON.parse(userStr);

            // Mock doctor ID for now, or fetch from context. 
            // In a real app, this would be selected or global.
            // Using a hardcoded ID or picking the first one from list would be better.
            // For hackathon, we'll try to get it from local storage active doctor or let backend find one.
            const doctorId = "65bf7a2f9c9a4c001f3e4b5d"; // Example ID, might need a real one

            await api.post('/queue/emergency', {
                patientId: user._id,
                doctorId: doctorId
            });

            toast("Emergency Priority Request Sent! A nurse will attend to you shortly.", "error"); // Red toast for urgency
        } catch (error: any) {
            toast(error.response?.data?.error || "Failed to trigger emergency", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-red-100 text-red-600 rounded-full animate-pulse">
                    <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                    <h4 className="text-red-700 dark:text-red-400 font-bold">Emergency?</h4>
                    <p className="text-xs text-red-600/80 dark:text-red-400/70">Skip the queue for critical cases.</p>
                </div>
            </div>
            <Button
                variant="destructive"
                disabled={loading}
                className="rounded-full px-6 shadow-lg shadow-red-200 dark:shadow-none hover:scale-105 transition-transform"
                onClick={handleEmergency}
            >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Siren className="w-4 h-4 mr-2" />}
                Request Priority
            </Button>
        </div>
    );
}
