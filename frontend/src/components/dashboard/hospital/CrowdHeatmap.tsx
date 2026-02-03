export function CrowdHeatmap() {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 h-full relative overflow-hidden">
            <h3 className="font-bold text-slate-800 dark:text-white mb-4 relative z-10">Real-time Crowd Density</h3>

            {/* Mock Heatmap Grid */}
            <div className="grid grid-cols-4 grid-rows-3 gap-2 h-48 relative z-10">
                {/* Generates a grid of colored blocks representing crowd density */}
                {[...Array(12)].map((_, i) => {
                    // Simulate some hotspots
                    const isHotspot = [4, 5, 9].includes(i);
                    const isMedium = [0, 1, 6].includes(i);
                    return (
                        <div key={i} className={`rounded-xl transition-all duration-1000 ${isHotspot ? 'bg-red-500/80 animate-pulse' :
                                isMedium ? 'bg-amber-400/60' :
                                    'bg-emerald-400/30'
                            } flex items-center justify-center text-xs font-bold text-white/80`}>
                            {isHotspot ? 'High' : isMedium ? 'Med' : 'Low'}
                        </div>
                    )
                })}
            </div>

            <div className="mt-4 flex gap-4 text-xs font-medium text-slate-500 relative z-10">
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-400" /> Low Traffic</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-400" /> Moderate</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500" /> High Traffic</div>
            </div>
        </div>
    );
}
