"use client";

import { useState, useEffect } from "react";
import { 
    Search, Filter, Calendar, Clock, Stethoscope, Star, 
    Languages, Wallet, CheckCircle, Video, Users, Building, 
    ChevronRight, ArrowLeft, Loader2, Sparkles, MapPin, Check, X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";
import { useToast } from "@/components/providers/ToastProvider";
import { AppointmentCalendar } from "./AppointmentCalendar";

interface Doctor {
    _id: string;
    user_id: {
        _id: string;
        name: string;
        email: string;
        phone: string;
    };
    specialization: string;
    department: string;
    is_available: boolean;
    current_queue_length: number;
    avg_consultation_time: number;
    experience: number;
    rating: number;
    languages: string[];
    consultation_fee: number;
    photo_url: string;
}

export function BookAppointmentTab() {
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    // Search and Filter States
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedDept, setSelectedDept] = useState("All");
    const [selectedSpec, setSelectedSpec] = useState("All");
    const [selectedBranch, setSelectedBranch] = useState("All");
    const [selectedLang, setSelectedLang] = useState("All");
    const [consultationType, setConsultationType] = useState<"Physical" | "Video" | "Follow-up">("Physical");

    // Modal Booking States
    const [bookingDoctor, setBookingDoctor] = useState<Doctor | null>(null);
    const [bookingStep, setBookingStep] = useState(1);
    const [bookingData, setBookingData] = useState({ date: "", slot_time: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [bookingSuccess, setBookingSuccess] = useState<any>(null);

    const { toast } = useToast();

    // Load patient and doctor list
    useEffect(() => {
        const u = localStorage.getItem("user");
        if (u) setUser(JSON.parse(u));

        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            const dept = params.get("department");
            const spec = params.get("specialization");
            if (dept) setSelectedDept(dept);
            if (spec) setSelectedSpec(spec);
        }

        fetchDoctors();
    }, []);

    const fetchDoctors = async () => {
        setLoading(true);
        try {
            const res = await api.get("/doctors");
            setDoctors(res.data || []);
        } catch (err: any) {
            console.error("Error fetching doctors:", err);
            toast("Failed to load doctor schedules.", "error");
        } finally {
            setLoading(false);
        }
    };

    // Extract dynamic lists for dropdown filters based on fetched data
    const departments = ["All", ...Array.from(new Set(doctors.map(d => d.department))).filter(Boolean)];
    const specializations = ["All", ...Array.from(new Set(doctors.map(d => d.specialization))).filter(Boolean)];
    const branches = ["All", "Main Campus - Nagpur", "East Wing - Nagpur"];
    const languages = ["All", "English", "Hindi", "Marathi", "Punjabi", "Tamil", "Bengali"];

    // Filter Logic
    const filteredDoctors = doctors.filter(doc => {
        const nameMatch = doc.user_id?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          doc.specialization?.toLowerCase().includes(searchQuery.toLowerCase());
        const deptMatch = selectedDept === "All" || doc.department === selectedDept;
        const specMatch = selectedSpec === "All" || doc.specialization === selectedSpec;
        // Language filter: matches if "All" or if doctor's languages includes selectedLang
        const langMatch = selectedLang === "All" || doc.languages?.some(l => l.toLowerCase() === selectedLang.toLowerCase());
        
        return nameMatch && deptMatch && specMatch && langMatch;
    });

    const handleOpenBooking = (doctor: Doctor) => {
        setBookingDoctor(doctor);
        setBookingStep(1);
        setBookingData({ date: "", slot_time: "" });
        setBookingSuccess(null);
    };

    const handleCloseBooking = () => {
        setBookingDoctor(null);
        setBookingStep(1);
    };

    const handleConfirmBooking = async () => {
        if (!user || !bookingDoctor) return;
        setIsSubmitting(true);
        try {
            const payload = {
                patient_id: user._id,
                doctor_id: bookingDoctor._id,
                date: bookingData.date,
                slot_time: bookingData.slot_time,
                consultation_type: consultationType
            };
            const res = await api.post("/appointments/book", payload);
            
            // Set success info
            setBookingSuccess({
                tokenNumber: res.data.token_number,
                appointment: res.data.appointment,
                token: res.data.token
            });

            // Store active token for live tracking
            localStorage.setItem("activeToken", res.data.token_number.toString());
            toast("Appointment Confirmed!", "success");
            setBookingStep(4); // Move to Success Screen
            
            // Refresh doctors list to update queue lengths
            fetchDoctors();
        } catch (err: any) {
            toast(err.response?.data?.message || "Booking failed.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Search and Filters Header */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search Input */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by doctor name or specialization..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                        />
                    </div>
                    {/* Consultation Type Toggle */}
                    <div className="flex items-center bg-slate-50 dark:bg-slate-950 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 self-start md:self-auto">
                        {(["Physical", "Video", "Follow-up"] as const).map((type) => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => setConsultationType(type)}
                                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                                    consultationType === type
                                        ? "bg-blue-600 text-white shadow-sm"
                                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                                }`}
                            >
                                {type === "Video" && <Video className="w-3.5 h-3.5 inline mr-1" />}
                                {type}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Dropdown Filters */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 pt-2">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Department</label>
                        <select
                            value={selectedDept}
                            onChange={(e) => setSelectedDept(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {departments.map(dept => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Specialization</label>
                        <select
                            value={selectedSpec}
                            onChange={(e) => setSelectedSpec(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {specializations.map(spec => (
                                <option key={spec} value={spec}>{spec}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Hospital Branch</label>
                        <select
                            value={selectedBranch}
                            onChange={(e) => setSelectedBranch(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {branches.map(br => (
                                <option key={br} value={br}>{br}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Language spoken</label>
                        <select
                            value={selectedLang}
                            onChange={(e) => setSelectedLang(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {languages.map(lang => (
                                <option key={lang} value={lang}>{lang}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Reset Filters Chip */}
                {(selectedDept !== "All" || selectedSpec !== "All" || selectedBranch !== "All" || selectedLang !== "All" || searchQuery) && (
                    <div className="flex flex-wrap gap-2 pt-2 items-center">
                        <span className="text-xs text-slate-400">Active Filters:</span>
                        {selectedDept !== "All" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                                Dept: {selectedDept}
                                <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedDept("All")} />
                            </span>
                        )}
                        {selectedSpec !== "All" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
                                Specialty: {selectedSpec}
                                <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedSpec("All")} />
                            </span>
                        )}
                        {selectedLang !== "All" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
                                Lang: {selectedLang}
                                <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedLang("All")} />
                            </span>
                        )}
                        <button
                            type="button"
                            onClick={() => {
                                setSelectedDept("All");
                                setSelectedSpec("All");
                                setSelectedBranch("All");
                                setSelectedLang("All");
                                setSearchQuery("");
                            }}
                            className="text-xs font-bold text-red-500 hover:text-red-600 ml-auto transition-colors"
                        >
                            Clear All Filters
                        </button>
                    </div>
                )}
            </div>

            {/* Doctors Grid */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Fetching real-time doctor availability...</p>
                </div>
            ) : filteredDoctors.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredDoctors.map((doc) => {
                        // Calculate Est Wait Time based on queue progress
                        const patientsAhead = doc.current_queue_length || 0;
                        const waitTime = patientsAhead * (doc.avg_consultation_time || 10);
                        
                        return (
                            <motion.div
                                key={doc._id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col justify-between hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 group"
                            >
                                <div className="p-6 space-y-4">
                                    {/* Header: Photo and Info */}
                                    <div className="flex items-start gap-4">
                                        <div className="relative">
                                            {doc.photo_url ? (
                                                <img 
                                                    src={doc.photo_url} 
                                                    alt={doc.user_id?.name} 
                                                    className="w-16 h-16 rounded-2xl object-cover ring-2 ring-slate-100 dark:ring-slate-800"
                                                />
                                            ) : (
                                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-inner">
                                                    {doc.user_id?.name?.charAt(0) || "D"}
                                                </div>
                                            )}
                                            {doc.is_available && (
                                                <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full" />
                                            )}
                                        </div>
                                        <div className="flex-1 space-y-0.5">
                                            <div className="flex items-center gap-1.5">
                                                <h3 className="font-extrabold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors text-base truncate">
                                                    {doc.user_id?.name || "Dr. Anonymous"}
                                                </h3>
                                                <span className="inline-flex items-center justify-center w-4 h-4 bg-emerald-500 text-white rounded-full text-[9px] font-bold">✓</span>
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{doc.specialization}</p>
                                            
                                            {/* Department & Floor Badge */}
                                            <div className="flex flex-wrap gap-1.5 pt-1.5">
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30">
                                                    {doc.department}
                                                </span>
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                                                    12 Yrs Exp
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Ratings & Spoken Languages */}
                                    <div className="grid grid-cols-2 gap-4 py-3 border-y border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                                        <div className="space-y-1">
                                            <p className="text-slate-400 font-semibold">Rating</p>
                                            <div className="flex items-center gap-1">
                                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                                <span className="font-bold text-slate-800 dark:text-slate-100">{doc.rating || 4.7}</span>
                                                <span className="text-[10px] text-slate-400">(120+ reviews)</span>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-slate-400 font-semibold">Languages</p>
                                            <div className="flex items-center gap-1 font-medium truncate">
                                                <Languages className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                <span className="truncate">{doc.languages?.join(", ") || "English, Hindi"}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Live OPD Tracker Widget */}
                                    <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 space-y-2">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                                                <Users className="w-3.5 h-3.5 text-blue-500" /> OPD Live Status
                                            </span>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                                doc.is_available 
                                                    ? "bg-green-500/10 text-green-600 dark:text-green-400" 
                                                    : "bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                                            }`}>
                                                {doc.is_available ? "Active" : "Offline"}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-center pt-1">
                                            <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                                                <p className="text-lg font-black text-slate-800 dark:text-slate-100">{doc.current_queue_length || 0}</p>
                                                <p className="text-[10px] text-slate-400 font-semibold uppercase">Waiting</p>
                                            </div>
                                            <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                                                <p className="text-lg font-black text-blue-600">{waitTime}m</p>
                                                <p className="text-[10px] text-slate-400 font-semibold uppercase">Est. Wait</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Consultation Fee & Booking Action */}
                                <div className="p-6 pt-0 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 flex items-center justify-between mt-auto">
                                    <div>
                                        <p className="text-[10px] text-slate-400 uppercase font-semibold">Consultation Fee</p>
                                        <p className="text-base font-extrabold text-slate-900 dark:text-white flex items-center">
                                            <Wallet className="w-4 h-4 text-emerald-500 mr-1" /> ₹{doc.consultation_fee || 500}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleOpenBooking(doc)}
                                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-200 dark:shadow-none hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1.5"
                                    >
                                        Book Slot <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-400 text-center">
                    <Stethoscope className="w-12 h-12 text-slate-300 mb-3" />
                    <p className="font-bold text-slate-800 dark:text-slate-200">No matching doctors found</p>
                    <p className="text-sm text-slate-400 max-w-sm mt-1">Try resetting your filters or adjusting your search term.</p>
                </div>
            )}

            {/* Custom Interactive Booking Modal Dialog */}
            <AnimatePresence>
                {bookingDoctor && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            {/* Modal Header */}
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 flex justify-between items-center shrink-0">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                        {bookingStep === 4 ? "Booking Confirmed" : `Book Appointment - Step ${bookingStep}`}
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        {bookingStep === 4 ? "Your ticket has been generated" : `Doctor: ${bookingDoctor.user_id?.name}`}
                                    </p>
                                </div>
                                {bookingStep < 4 && (
                                    <button 
                                        type="button"
                                        onClick={handleCloseBooking} 
                                        className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                )}
                            </div>

                            {/* Modal Content */}
                            <div className="p-6 overflow-y-auto flex-1 space-y-6">
                                {/* Step 1: Select Date & Time Slot */}
                                {bookingStep === 1 && (
                                    <AppointmentCalendar
                                        doctorId={bookingDoctor._id}
                                        onSlotSelect={(date, time) => {
                                            setBookingData({ ...bookingData, date, slot_time: time });
                                            setBookingStep(2); // Auto-advance to step 2 once slot is picked
                                        }}
                                    />
                                )}

                                {/* Step 2: Confirmation & Consult Type */}
                                {bookingStep === 2 && (
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/20">
                                            <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl shadow-sm text-blue-600">
                                                <Stethoscope className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Confirm Consultation Type</p>
                                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{bookingDoctor.user_id?.name}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Consultation Type</label>
                                            <div className="grid grid-cols-3 gap-3">
                                                {(["Physical", "Video", "Follow-up"] as const).map(type => (
                                                    <button
                                                        key={type}
                                                        type="button"
                                                        onClick={() => setConsultationType(type)}
                                                        className={`p-3 rounded-xl border-2 text-center text-xs font-bold transition-all ${
                                                            consultationType === type
                                                                ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200 dark:shadow-none"
                                                                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300"
                                                        }`}
                                                    >
                                                        {type === "Video" ? (
                                                            <Video className="w-4 h-4 mx-auto mb-1.5 text-inherit" />
                                                        ) : (
                                                            <MapPin className="w-4 h-4 mx-auto mb-1.5 text-inherit" />
                                                        )}
                                                        {type}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 space-y-2">
                                            <div className="flex justify-between items-center py-1">
                                                <span>Selected Date</span>
                                                <span className="font-bold text-slate-800 dark:text-slate-200">{bookingData.date}</span>
                                            </div>
                                            <div className="flex justify-between items-center py-1">
                                                <span>Time Slot</span>
                                                <span className="font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded">{bookingData.slot_time}</span>
                                            </div>
                                            <div className="flex justify-between items-center py-1 border-t border-slate-100 dark:border-slate-800 pt-2 font-semibold">
                                                <span>Consultation Fee</span>
                                                <span className="text-slate-800 dark:text-white font-extrabold text-sm">₹{bookingDoctor.consultation_fee}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Step 3: Confirmation Summary */}
                                {bookingStep === 3 && (
                                    <div className="text-center space-y-5 py-4">
                                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-blue-200 dark:shadow-none animate-bounce">
                                            <Calendar className="w-8 h-8 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-slate-900 dark:text-white">Ready to Book?</h3>
                                            <p className="text-slate-400 text-xs mt-1">Please verify the details below to finalize your booking.</p>
                                        </div>

                                        <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 text-left space-y-3.5">
                                            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2 last:border-0 last:pb-0">
                                                <span className="text-xs text-slate-400 font-semibold uppercase">Doctor</span>
                                                <span className="font-bold text-sm text-slate-800 dark:text-white">{bookingDoctor.user_id?.name}</span>
                                            </div>
                                            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2 last:border-0 last:pb-0">
                                                <span className="text-xs text-slate-400 font-semibold uppercase">Department</span>
                                                <span className="font-bold text-sm text-slate-800 dark:text-white">{bookingDoctor.department}</span>
                                            </div>
                                            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2 last:border-0 last:pb-0">
                                                <span className="text-xs text-slate-400 font-semibold uppercase">Date & Time</span>
                                                <span className="font-bold text-sm text-slate-800 dark:text-white">{bookingData.date} @ {bookingData.slot_time}</span>
                                            </div>
                                            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2 last:border-0 last:pb-0">
                                                <span className="text-xs text-slate-400 font-semibold uppercase">Consultation Type</span>
                                                <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400">{consultationType}</span>
                                            </div>
                                            <div className="flex justify-between items-center pt-1 font-semibold">
                                                <span className="text-xs text-slate-400 font-semibold uppercase">Consultation Fee</span>
                                                <span className="text-slate-800 dark:text-white font-extrabold text-base">₹{bookingDoctor.consultation_fee}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Step 4: Booking Success screen */}
                                {bookingStep === 4 && bookingSuccess && (
                                    <div className="text-center space-y-6 py-6">
                                        <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-200 dark:shadow-none">
                                            <Check className="w-10 h-10 text-white stroke-[3px]" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-slate-900 dark:text-white">Booking Confirmed!</h3>
                                            <p className="text-slate-400 text-sm mt-1">You have joined the live OPD digital queue.</p>
                                        </div>

                                        <div className="max-w-xs mx-auto bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-4 opacity-10"><Sparkles className="w-24 h-24" /></div>
                                            <p className="text-xs uppercase tracking-widest font-black opacity-80">OPD Queue Token</p>
                                            <p className="text-5xl font-black mt-2 tracking-tight">{bookingSuccess.tokenNumber}</p>
                                            
                                            <div className="mt-6 pt-4 border-t border-white/20 text-xs space-y-1.5 opacity-90 text-left">
                                                <p><span className="font-bold">Clinic:</span> {bookingDoctor.department} ({bookingDoctor.specialization})</p>
                                                <p><span className="font-bold">Doctor:</span> {bookingDoctor.user_id?.name}</p>
                                                <p><span className="font-bold">Time Slot:</span> {bookingData.slot_time}</p>
                                            </div>
                                        </div>

                                        <p className="text-xs text-slate-500 px-6">
                                            Please arrive 10 minutes prior to your slot. Open the Overview tab on your Dashboard to track your live queue progress in real-time.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer Actions */}
                            <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex gap-3 shrink-0">
                                {bookingStep === 1 && (
                                    <button
                                        type="button"
                                        onClick={handleCloseBooking}
                                        className="flex-1 py-3 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all"
                                    >
                                        Cancel
                                    </button>
                                )}
                                {bookingStep > 1 && bookingStep < 4 && (
                                    <button
                                        type="button"
                                        onClick={() => setBookingStep(bookingStep - 1)}
                                        className="flex-1 py-3 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all flex items-center justify-center gap-1"
                                    >
                                        <ArrowLeft className="w-4 h-4" /> Back
                                    </button>
                                )}
                                {bookingStep === 1 && (
                                    <button
                                        type="button"
                                        disabled={!bookingData.date || !bookingData.slot_time}
                                        onClick={() => setBookingStep(2)}
                                        className="flex-1 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-semibold rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                                    >
                                        Next <ChevronRight className="w-4 h-4" />
                                    </button>
                                )}
                                {bookingStep === 2 && (
                                    <button
                                        type="button"
                                        onClick={() => setBookingStep(3)}
                                        className="flex-1 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-semibold rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-1"
                                    >
                                        Review Appointment <ChevronRight className="w-4 h-4" />
                                    </button>
                                )}
                                {bookingStep === 3 && (
                                    <button
                                        type="button"
                                        disabled={isSubmitting}
                                        onClick={handleConfirmBooking}
                                        className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-semibold rounded-xl transition-all flex items-center justify-center"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin mr-2" /> Booking slot...
                                            </>
                                        ) : (
                                            "Confirm & Pay"
                                        )}
                                    </button>
                                )}
                                {bookingStep === 4 && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            handleCloseBooking();
                                            // Trigger callback or force reload to show new token on dashboard
                                            window.location.reload();
                                        }}
                                        className="flex-1 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-semibold rounded-xl hover:opacity-90 transition-all"
                                    >
                                        Go to Dashboard
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

// Active: 2026-07-04

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
