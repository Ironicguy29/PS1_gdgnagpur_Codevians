import { Button } from "@/components/ui/button";
import { AlertTriangle, Siren } from "lucide-react";
import { useState } from "react";

export function EmergencyQuickAction() {
    const [active, setActive] = useState(false);

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
                className="rounded-full px-6 shadow-lg shadow-red-200 dark:shadow-none hover:scale-105 transition-transform"
                onClick={() => setActive(true)}
            >
                <Siren className="w-4 h-4 mr-2" />
                Request Priority
            </Button>
        </div>
    );
}
