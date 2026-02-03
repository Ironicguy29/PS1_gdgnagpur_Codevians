import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";

interface AppointmentCalendarProps {
    onSlotSelect: (date: string, time: string) => void;
    availableSlots: string[];
}

export function AppointmentCalendar({ onSlotSelect, availableSlots }: AppointmentCalendarProps) {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

    const dates = useMemo(() => {
        return Array.from({ length: 5 }).map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() + i);
            return d;
        });
    }, []);

    const handleSlotClick = (slot: string) => {
        setSelectedSlot(slot);
        onSlotSelect(selectedDate.toISOString().split('T')[0], slot);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Select Date</h4>
                <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="h-6 w-6"><ChevronLeft className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6"><ChevronRight className="w-4 h-4" /></Button>
                </div>
            </div>

            {/* Date Strip */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {dates.map((date, i) => (
                    <button
                        key={i}
                        onClick={() => setSelectedDate(date)}
                        className={`flex-shrink-0 flex flex-col items-center justify-center p-3 rounded-xl min-w-[70px] transition-all border ${date.getDate() === selectedDate.getDate()
                            ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200 dark:shadow-none'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                            }`}
                    >
                        <span className="text-xs font-medium uppercase">{date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                        <span className="text-lg font-bold">{date.getDate()}</span>
                    </button>
                ))}
            </div>

            <div>
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Available Slots
                </h4>
                <div className="grid grid-cols-3 gap-3">
                    {availableSlots.map((slot) => (
                        <button
                            key={slot}
                            onClick={() => handleSlotClick(slot)}
                            className={`text-sm py-2 px-3 rounded-lg border transition-all ${selectedSlot === slot
                                ? 'bg-emerald-100 text-emerald-700 border-emerald-500 font-medium'
                                : 'bg-slate-50 dark:bg-slate-800 border-transparent hover:border-slate-300 text-slate-600 dark:text-slate-300'
                                }`}
                        >
                            {slot}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
