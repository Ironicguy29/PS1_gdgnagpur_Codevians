import { GlassCard } from "@/components/ui/GlassCard";
import { Brain, TrendingDown, Clock, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function AIWaitTimePredictor() {
    return (
        <GlassCard className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 h-full flex flex-col">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-purple-100 text-purple-600 rounded-lg dark:bg-purple-900/30">
                        <Brain className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 dark:text-white">AI Insights</h3>
                        <p className="text-xs text-slate-500">Real-time Analysis</p>
                    </div>
                </div>
                <Badge variant="outline" className="text-purple-600 border-purple-200 bg-purple-50">Live</Badge>
            </div>

            <div className="space-y-4 flex-1">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-500">Ideal Avg Time</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">8m 00s</span>
                    </div>
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-500">Actual Avg Time</span>
                        <span className="font-bold text-red-500">12m 30s</span>
                    </div>
                    <div className="mt-2 text-xs text-red-500 flex items-center gap-1">
                        <TrendingDown className="w-3 h-3 rotate-180" /> +4m 30s slower than expected
                    </div>
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                    <h4 className="font-semibold text-blue-700 dark:text-blue-300 text-sm mb-2 flex items-center gap-2">
                        <Clock className="w-3 h-3" /> Queue Prediction
                    </h4>
                    <p className="text-xs text-blue-600 dark:text-blue-200 leading-relaxed">
                        Based on current speed, the queue will clear by <strong>2:30 PM</strong>. Suggest enabling <strong>Fast Track</strong> mode to reduce backlog.
                    </p>
                </div>
            </div>
        </GlassCard>
    );
}
