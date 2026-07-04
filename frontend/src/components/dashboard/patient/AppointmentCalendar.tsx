import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Clock, Loader2 } from "lucide-react";
import api from "@/lib/api";

interface AppointmentCalendarProps {
    doctorId: string;
    onSlotSelect: (date: string, time: string) => void;
}

export function AppointmentCalendar({ doctorId, onSlotSelect }: AppointmentCalendarProps) {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);

    const dates = useMemo(() => {
        return Array.from({ length: 7 }).map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() + i);
            return d;
        });
    }, []);

    useEffect(() => {
        if (!doctorId) return;
        const fetchSlots = async () => {
            setLoadingSlots(true);
            try {
                const dateStr = selectedDate.toISOString().split('T')[0];
                const res = await api.get(`/appointments/slots?doctorId=${doctorId}&date=${dateStr}`);
                setAvailableSlots(res.data.slots || []);
                setSelectedSlot(null);
            } catch (err) {
                console.error("Error fetching slots:", err);
                setAvailableSlots([]);
            } finally {
                setLoadingSlots(false);
            }
        };
        fetchSlots();
    }, [doctorId, selectedDate]);

    const handleSlotClick = (slot: string) => {
        setSelectedSlot(slot);
        onSlotSelect(selectedDate.toISOString().split('T')[0], slot);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Select Date</h4>
            </div>

            {/* Date Strip */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {dates.map((date, i) => {
                    const isSelected = date.getDate() === selectedDate.getDate() && date.getMonth() === selectedDate.getMonth();
                    return (
                        <button
                            key={i}
                            type="button"
                            onClick={() => setSelectedDate(date)}
                            className={`flex-shrink-0 flex flex-col items-center justify-center p-3 rounded-xl min-w-[70px] transition-all border ${isSelected
                                ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200 dark:shadow-none'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-transparent hover:border-slate-300 dark:hover:border-slate-700'
                                }`}
                        >
                            <span className="text-[10px] font-bold uppercase opacity-85">{date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                            <span className="text-lg font-extrabold">{date.getDate()}</span>
                        </button>
                    );
                })}
            </div>

            <div>
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-500" /> Available Time Slots
                </h4>

                {loadingSlots ? (
                    <div className="flex items-center justify-center py-6">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                        <span className="ml-2 text-sm text-slate-500">Checking slot availability...</span>
                    </div>
                ) : availableSlots.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                        {availableSlots.map((slot) => (
                            <button
                                key={slot}
                                type="button"
                                onClick={() => handleSlotClick(slot)}
                                className={`text-sm py-2.5 px-3 rounded-xl border transition-all text-center font-medium ${selectedSlot === slot
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200 dark:shadow-none'
                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-700 text-slate-700 dark:text-slate-300'
                                    }`}
                            >
                                {slot}
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-6 text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                        No slots available for this date.
                    </div>
                )}
            </div>
        </div>
    );
}

// Active: 2026-07-04

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
