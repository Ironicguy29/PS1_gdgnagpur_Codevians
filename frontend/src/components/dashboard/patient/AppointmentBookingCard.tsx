import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ChevronRight, Calendar, Clock, Stethoscope, Loader2, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AppointmentCalendar } from "./AppointmentCalendar";

interface AppointmentBookingCardProps {
    doctors: any[];
    onBook: (data: any) => Promise<void>;
    loading: boolean;
}

export function AppointmentBookingCard({ doctors, onBook, loading }: AppointmentBookingCardProps) {
    const [step, setStep] = useState(1);
    const [bookingData, setBookingData] = useState({ doctor_id: '', date: '', slot_time: '' });

    const handleNext = () => {
        if (step === 1 && bookingData.doctor_id) setStep(2);
        else if (step === 2 && bookingData.date && bookingData.slot_time) setStep(3);
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    const handleSubmit = () => {
        onBook(bookingData);
    };

    const selectedDoctor = doctors.find(d => d._id === bookingData.doctor_id);

    return (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden flex flex-col h-full">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Book Appointment</h3>
                    <p className="text-xs text-slate-500">Step {step} of 3</p>
                </div>
                <div className="flex gap-1">
                    {[1, 2, 3].map(i => (
                        <div key={i} className={`h-1.5 w-8 rounded-full transition-colors ${i <= step ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-800'}`} />
                    ))}
                </div>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                        >
                            <div className="space-y-4">
                                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Select Specialist</Label>
                                <div className="grid grid-cols-1 gap-3">
                                    {doctors.map((doc) => (
                                        <div
                                            key={doc._id}
                                            onClick={() => setBookingData({ ...bookingData, doctor_id: doc._id })}
                                            className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between group ${bookingData.doctor_id === doc._id
                                                    ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500 dark:bg-blue-900/20 dark:border-blue-500'
                                                    : 'border-slate-200 hover:border-blue-300 dark:border-slate-700 dark:hover:border-blue-700'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${bookingData.doctor_id === doc._id ? 'bg-blue-200 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                                                    <Stethoscope className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900 dark:text-white">{doc.name}</p>
                                                    <p className="text-xs text-slate-500">{doc.doctor_details?.specialization || 'General Physician'}</p>
                                                </div>
                                            </div>
                                            {bookingData.doctor_id === doc._id && <CheckCircle2 className="w-5 h-5 text-blue-600" />}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl mb-4">
                                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                                    <Stethoscope className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">Selected Doctor</p>
                                    <p className="font-semibold text-sm text-blue-900 dark:text-blue-100">{selectedDoctor?.name}</p>
                                </div>
                            </div>

                            <AppointmentCalendar
                                availableSlots={['09:00', '09:20', '09:40', '10:00', '10:20', '11:00']}
                                onSlotSelect={(date, time) => setBookingData({ ...bookingData, date, slot_time: time })}
                            />
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="text-center space-y-6 py-4"
                        >
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-teal-400 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-blue-200 dark:shadow-none animate-bounce">
                                <Calendar className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Confirm Booking</h3>
                                <p className="text-slate-500 text-sm mt-1">Review your appointment details</p>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 text-left space-y-3 border border-slate-100 dark:border-slate-700">
                                <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-700 last:border-0">
                                    <span className="text-sm text-slate-500">Doctor</span>
                                    <span className="font-medium text-slate-900 dark:text-white">{selectedDoctor?.name}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-700 last:border-0">
                                    <span className="text-sm text-slate-500">Date</span>
                                    <span className="font-medium text-slate-900 dark:text-white">{bookingData.date}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-700 last:border-0">
                                    <span className="text-sm text-slate-500">Time Slot</span>
                                    <span className="font-medium text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded text-xs">{bookingData.slot_time}</span>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                {step > 1 && (
                    <Button variant="outline" onClick={handleBack} className="flex-1 rounded-xl h-12">
                        Back
                    </Button>
                )}
                {step < 3 ? (
                    <Button
                        onClick={handleNext}
                        className="flex-1 rounded-xl h-12 bg-slate-900 dark:bg-white dark:text-slate-900 hover:opacity-90 transition-opacity"
                        disabled={(step === 1 && !bookingData.doctor_id) || (step === 2 && (!bookingData.date || !bookingData.slot_time))}
                    >
                        Next Step <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                ) : (
                    <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex-1 rounded-xl h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-200 dark:shadow-none transition-all"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Booking'}
                    </Button>
                )}
            </div>
        </div>
    );
}
