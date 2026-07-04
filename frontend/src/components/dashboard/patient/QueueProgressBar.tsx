import { motion } from "framer-motion";

interface QueueProgressBarProps {
    nextToken: string | number;
    yourToken: string | number;
    progressPercentage: number;
}

export function QueueProgressBar({ nextToken, yourToken, progressPercentage }: QueueProgressBarProps) {
    return (
        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-4 relative overflow-hidden mt-4">
            {/* Animated Progress Bar */}
            <motion.div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
            />

            {/* Markers */}
            <div className="absolute top-0 left-0 w-full h-full flex justify-between px-2 items-center text-[10px] font-bold text-slate-500 dark:text-slate-400 z-10 mix-blend-difference">
                <span>Now: {typeof nextToken === 'string' && nextToken.includes('-') ? nextToken : `#${nextToken}`}</span>
                <span>You: {typeof yourToken === 'string' && yourToken.includes('-') ? yourToken : `#${yourToken}`}</span>
            </div>
        </div>
    );
}

// Active: 2026-07-04

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
