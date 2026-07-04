'use client';
import { useEffect, useState, useRef } from 'react';
import DashboardLayout from "@/components/layout/DashboardLayout";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
    Users, Clock, CheckCircle, ChevronRight, Play, AlertTriangle, 
    UserPlus, RefreshCw, LogOut, Check, ArrowRightLeft, ShieldAlert,
    Plus, Trash2, Heart, Thermometer, Activity, ClipboardList, BookOpen,
    Calendar, FileText, Sparkles
} from "lucide-react";
import api from "@/lib/api";
import { QueueTimeline } from "@/components/dashboard/hospital/QueueTimeline";
import { AIWaitTimePredictor } from "@/components/dashboard/hospital/AIWaitTimePredictor";
import { useSocket } from "@/context/SocketContext";
import { useToast } from "@/components/providers/ToastProvider";
import DoctorVoiceAssistantWidget from "@/components/dashboard/doctor/DoctorVoiceAssistantWidget";
import { UpcomingPatientsPanel } from "@/components/dashboard/doctor/UpcomingPatientsPanel";

export default function DoctorDashboard() {
    const [queue, setQueue] = useState<any>(null);
    const [tokens, setTokens] = useState<any[]>([]);
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [duration, setDuration] = useState(15);

    // Emergency Walk-in Modal State
    const [showEmergencyModal, setShowEmergencyModal] = useState(false);
    const [emergencyPhone, setEmergencyPhone] = useState('');
    const [searchingPatient, setSearchingPatient] = useState(false);
    const [foundPatient, setFoundPatient] = useState<any>(null);
    const [emergencySeverity, setEmergencySeverity] = useState('High');
    const [insertingEmergency, setInsertingEmergency] = useState(false);

    // Transfer Modal State
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [allDoctors, setAllDoctors] = useState<any[]>([]);
    const [transferDoctorId, setTransferDoctorId] = useState('');
    const [transferring, setTransferring] = useState(false);

    // Active Patient Consultation Timer
    const [consultationTime, setConsultationTime] = useState(0);
    const timerRef = useRef<any>(null);

    // Clinical Form States
    const [patientProfile, setPatientProfile] = useState<any>(null);
    const [symptomsInput, setSymptomsInput] = useState('');
    const [symptoms, setSymptoms] = useState<string[]>([]);
    
    // Vitals
    const [temperature, setTemperature] = useState('');
    const [heartRate, setHeartRate] = useState('');
    const [bloodPressure, setBloodPressure] = useState('');
    const [oxygenSat, setOxygenSat] = useState('');
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');

    // Diagnosis
    const [primaryDiagnosis, setPrimaryDiagnosis] = useState('');
    const [clinicalImpression, setClinicalImpression] = useState('');
    const [treatmentPlan, setTreatmentPlan] = useState('');
    const [followUpDate, setFollowUpDate] = useState('');

    // Prescriptions
    const [medicines, setMedicines] = useState<any[]>([
        { name: '', dosage: '500mg', frequency: 'Once Daily', duration: '5 Days', before_food: false, instructions: '' }
    ]);

    // Lab orders
    const [labTests, setLabTests] = useState<string[]>([]);
    const [labInput, setLabInput] = useState('');

    const { socket } = useSocket();
    const { toast } = useToast();

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            const u = JSON.parse(userData);
            setUser(u);
            fetchQueue(u._id);
            fetchDoctorsList();
        }
    }, []);

    // Socket.io Real-time update binding
    useEffect(() => {
        if (!socket || !user) return;

        const handleQueueUpdate = (data: any) => {
            console.log("[v0] Doctor - Socket received queue update:", data);
            // Update if it's for this doctor's queue OR if it's a general queue update
            if (data.doctorId === user._id || !data.doctorId) {
                console.log("[v0] Doctor - Fetching queue due to socket update");
                fetchQueue(user._id);
            }
        };

        socket.on('queue.token.update', handleQueueUpdate);
        socket.on('queue.update', handleQueueUpdate);
        return () => {
            socket.off('queue.token.update', handleQueueUpdate);
            socket.off('queue.update', handleQueueUpdate);
        };
    }, [socket, user]);

    // Timer logic for active patient
    const activeToken = tokens.find(t => t.status === 'Called' || t.status === 'In Consultation');
    
    // Load patient EMR profile on consultation start
    useEffect(() => {
        if (activeToken && activeToken.status === 'In Consultation' && activeToken.patient_id?._id) {
            fetchPatientProfile(activeToken.patient_id._id);
        } else {
            setPatientProfile(null);
            // Reset clinical form states
            setSymptoms([]);
            setSymptomsInput('');
            setTemperature('');
            setHeartRate('');
            setBloodPressure('');
            setOxygenSat('');
            setHeight('');
            setWeight('');
            setPrimaryDiagnosis('');
            setClinicalImpression('');
            setTreatmentPlan('');
            setFollowUpDate('');
            setMedicines([{ name: '', dosage: '500mg', frequency: 'Once Daily', duration: '5 Days', before_food: false, instructions: '' }]);
            setLabTests([]);
            setLabInput('');
        }
    }, [activeToken]);

    useEffect(() => {
        if (activeToken && activeToken.status === 'In Consultation') {
            const startTime = activeToken.consultation_start_time 
                ? new Date(activeToken.consultation_start_time).getTime() 
                : Date.now();
                
            const updateTimer = () => {
                const diff = Math.max(0, Math.floor((Date.now() - startTime) / 1000));
                setConsultationTime(diff);
            };
            
            updateTimer();
            timerRef.current = setInterval(updateTimer, 1000);
        } else {
            setConsultationTime(0);
            if (timerRef.current) clearInterval(timerRef.current);
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [activeToken]);

    const fetchPatientProfile = async (patientId: string) => {
        try {
            const res = await api.get(`/emr/profile/${patientId}`);
            setPatientProfile(res.data);
            if (res.data) {
                if (res.data.height) setHeight(res.data.height.toString());
                if (res.data.weight) setWeight(res.data.weight.toString());
            }
        } catch (e) {
            console.error("Failed to load patient profile", e);
        }
    };

    const fetchQueue = async (id: string) => {
        try {
            const res = await api.get(`/queue/live/${id}`);
            if (res.data) {
                setQueue(res.data.queue || null);
                setTokens(res.data.tokens || []);
                setIsPaused(res.data.queue?.is_paused || false);
                setDuration(res.data.queue?.average_consultation_time || 15);
            }
        } catch (e: any) {
            console.error("Failed to load queue details", e);
        }
    };

    const fetchDoctorsList = async () => {
        try {
            const res = await api.get('/doctors');
            setAllDoctors(res.data || []);
        } catch (e) {
            console.error("Failed to fetch doctors list", e);
        }
    };

    const callNext = async () => {
        if (isPaused) {
            toast("Queue is currently paused. Please resume to call next patient.", "error");
            return;
        }
        setLoading(true);
        try {
            const res = await api.post('/queue/next', { doctorId: user._id });
            toast(`Called next patient: ${res.data.display_token || res.data.token_number}`, "success");
            await fetchQueue(user._id);
        } catch (e: any) {
            toast(e.response?.data?.message || 'No waiting patients in queue', "error");
        } finally {
            setLoading(false);
        }
    };

    const startConsultation = async () => {
        if (!activeToken) return;
        setLoading(true);
        try {
            await api.post('/queue/start', { tokenId: activeToken._id });
            toast("Consultation started", "success");
            await fetchQueue(user._id);
        } catch (e: any) {
            toast(e.response?.data?.message || 'Failed to start consultation', "error");
        } finally {
            setLoading(false);
        }
    };

    const completeConsultation = async () => {
        if (!activeToken) return;
        setLoading(true);
        try {
            // 1. Construct EMR Payload
            const emrPayload: any = {
                patient_id: activeToken.patient_id?._id,
                doctor_id: user._id,
                department: user.department || "General Medicine",
                symptoms: symptoms,
                vitals: {
                    temperature: temperature ? parseFloat(temperature) : undefined,
                    heart_rate: heartRate ? parseInt(heartRate) : undefined,
                    blood_pressure: bloodPressure || undefined,
                    oxygen_saturation: oxygenSat ? parseInt(oxygenSat) : undefined,
                    height: height ? parseFloat(height) : undefined,
                    weight: weight ? parseFloat(weight) : undefined,
                },
                diagnosis: {
                    primary_diagnosis: primaryDiagnosis || 'Unspecified Clinical Review',
                    clinical_impression: clinicalImpression || undefined
                },
                treatment_plan: treatmentPlan || undefined,
                prescription: {
                    medicines: medicines.filter(m => m.name.trim() !== '')
                },
                lab_orders: labTests.length > 0 ? [{
                    tests: labTests
                }] : [],
                follow_up_date: followUpDate ? new Date(followUpDate) : undefined,
                operatorId: user._id,
                operatorRole: 'Doctor'
            };

            // 2. Save Clinical EMR
            await api.post('/emr/visit', emrPayload);

            // 3. Complete the queue token
            await api.post('/queue/complete', { tokenId: activeToken._id });
            
            toast("Consultation recorded and patient token finalized!", "success");
            await fetchQueue(user._id);
        } catch (e: any) {
            toast(e.response?.data?.error || e.message || 'Failed to complete consultation', "error");
        } finally {
            setLoading(false);
        }
    };

    const skipPatient = async () => {
        if (!activeToken) return;
        if (!confirm("Are you sure you want to skip this patient?")) return;
        setLoading(true);
        try {
            await api.post('/queue/skip', { tokenId: activeToken._id });
            toast("Patient marked as skipped", "warning");
            await fetchQueue(user._id);
        } catch (e: any) {
            toast(e.response?.data?.message || 'Failed to skip patient', "error");
        } finally {
            setLoading(false);
        }
    };

    const searchPatient = async () => {
        if (!emergencyPhone) return;
        setSearchingPatient(true);
        setFoundPatient(null);
        try {
            const cleanPhone = emergencyPhone.trim();
            const queryPhone = cleanPhone.startsWith('+') ? cleanPhone : `+91${cleanPhone}`;
            const res = await api.get(`/auth/patient/phone/${encodeURIComponent(queryPhone)}`);
            setFoundPatient(res.data);
            toast("Patient profile found", "success");
        } catch (e: any) {
            toast("Patient not found. Check phone number or register patient.", "error");
        } finally {
            setSearchingPatient(false);
        }
    };

    const handleAddEmergency = async () => {
        if (!foundPatient || !user) return;
        setInsertingEmergency(true);
        try {
            const dept = user.department || "General Medicine";
            await api.post('/queue/emergency', {
                doctorId: user._id,
                patientId: foundPatient._id,
                department: dept,
                severity: emergencySeverity
            });
            toast(`Emergency patient inserted into queue successfully!`, "success");
            setShowEmergencyModal(false);
            setEmergencyPhone('');
            setFoundPatient(null);
            await fetchQueue(user._id);
        } catch (e: any) {
            toast(e.response?.data?.message || 'Failed to add emergency patient', "error");
        } finally {
            setInsertingEmergency(false);
        }
    };

    const handleTransfer = async () => {
        if (!activeToken || !transferDoctorId) return;
        setTransferring(true);
        try {
            await api.post('/queue/transfer', {
                tokenId: activeToken._id,
                newDoctorId: transferDoctorId
            });
            toast("Patient transferred successfully", "success");
            setShowTransferModal(false);
            setTransferDoctorId('');
            await fetchQueue(user._id);
        } catch (e: any) {
            toast(e.response?.data?.message || 'Failed to transfer patient', "error");
        } finally {
            setTransferring(false);
        }
    };

    const togglePause = async () => {
        if (!user) return;
        try {
            const newPausedState = !isPaused;
            await api.post('/queue/pause', {
                doctorId: user._id,
                isPaused: newPausedState
            });
            setIsPaused(newPausedState);
            toast(newPausedState ? "Queue paused" : "Queue resumed", "success");
        } catch (e: any) {
            toast("Failed to toggle queue pause", "error");
        }
    };

    const handleDurationChange = async (newDur: number) => {
        if (!user) return;
        try {
            await api.post('/queue/duration', {
                doctorId: user._id,
                duration: newDur
            });
            setDuration(newDur);
            toast(`Consultation duration updated to ${newDur} mins`, "success");
        } catch (e: any) {
            toast("Failed to update duration", "error");
        }
    };

    // Clinical functions
    const addSymptom = () => {
        if (symptomsInput.trim()) {
            setSymptoms([...symptoms, symptomsInput.trim()]);
            setSymptomsInput('');
        }
    };

    const removeSymptom = (index: number) => {
        setSymptoms(symptoms.filter((_, i) => i !== index));
    };

    const addMedicineRow = () => {
        setMedicines([...medicines, { name: '', dosage: '500mg', frequency: 'Once Daily', duration: '5 Days', before_food: false, instructions: '' }]);
    };

    const removeMedicineRow = (index: number) => {
        if (medicines.length > 1) {
            setMedicines(medicines.filter((_, i) => i !== index));
        }
    };

    const updateMedicineField = (index: number, field: string, value: any) => {
        const updated = [...medicines];
        updated[index][field] = value;
        setMedicines(updated);
    };

    const addLabTest = () => {
        if (labInput.trim()) {
            setLabTests([...labTests, labInput.trim()]);
            setLabInput('');
        }
    };

    const removeLabTest = (index: number) => {
        setLabTests(labTests.filter((_, i) => i !== index));
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const waitingCount = tokens.filter(t => t.status === 'Waiting').length;
    const completedCount = tokens.filter(t => t.status === 'Completed').length;

    return (
        <DashboardLayout role="doctor">
            {/* Header section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        OPD Control Station 🩺
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        {user?.user_id?.name || 'Doctor'} • {user?.department || 'Department'}
                    </p>
                </div>
                
                {/* Control Toggles */}
                <div className="flex flex-wrap gap-3 items-center">
                    <Button 
                        variant={isPaused ? "destructive" : "outline"}
                        onClick={togglePause}
                        className="shadow-sm"
                    >
                        {isPaused ? "▶ Resume Queue" : "⏸ Pause Queue"}
                    </Button>

                    <Button 
                        variant="destructive"
                        onClick={() => setShowEmergencyModal(true)}
                        className="bg-red-600 hover:bg-red-700 text-white font-semibold flex items-center gap-2 shadow-lg shadow-red-200 dark:shadow-none"
                    >
                        <ShieldAlert className="w-4 h-4 animate-bounce" /> Add Emergency Walk-in
                    </Button>

                    <button 
                        onClick={() => fetchQueue(user?._id)}
                        className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <GlassCard className="p-6 flex items-center gap-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Patients Waiting</p>
                        <h4 className="text-2xl font-bold text-slate-800 dark:text-white">{waitingCount}</h4>
                    </div>
                </GlassCard>

                <GlassCard className="p-6 flex items-center gap-4">
                    <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-2xl">
                        <CheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Served Today</p>
                        <h4 className="text-2xl font-bold text-slate-800 dark:text-white">{completedCount}</h4>
                    </div>
                </GlassCard>

                <GlassCard className="p-6 flex items-center gap-4">
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-2xl">
                        <Clock className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Avg Consultation</p>
                        <div className="flex items-center gap-2 mt-1">
                            <select 
                                value={duration} 
                                onChange={(e) => handleDurationChange(parseInt(e.target.value))}
                                className="bg-transparent border-0 font-bold text-lg text-slate-800 dark:text-white p-0 cursor-pointer focus:ring-0"
                            >
                                <option value={10}>10 mins</option>
                                <option value={15}>15 mins</option>
                                <option value={20}>20 mins</option>
                                <option value={30}>30 mins</option>
                            </select>
                        </div>
                    </div>
                </GlassCard>

                <GlassCard className="p-6 flex items-center gap-4">
                    <div className="p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-2xl">
                        <ShieldAlert className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Emergencies Today</p>
                        <h4 className="text-2xl font-bold text-slate-800 dark:text-white">
                            {tokens.filter(t => t.priority === 'Emergency').length}
                        </h4>
                    </div>
                </GlassCard>
            </div>

            {/* Upcoming Patients Panel */}
            <div className="mb-8">
                <UpcomingPatientsPanel
                    doctorId={user?._id}
                    socket={socket}
                    onCallNext={callNext}
                    loading={loading}
                />
            </div>

            {/* Active Consult Work Station */}
            {activeToken ? (
                <div className="space-y-8 mb-12">
                    {/* Hero Consultation Banner */}
                    <GlassCard className="bg-gradient-to-br from-slate-900 to-slate-950 text-white border border-slate-800 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Badge className="bg-blue-600 text-white font-bold text-xs px-2 py-0.5">{activeToken.status}</Badge>
                                {activeToken.priority === 'Emergency' && <Badge className="bg-red-600 text-white animate-pulse">Emergency</Badge>}
                            </div>
                            <h2 className="text-3xl font-extrabold">{activeToken.patient_id?.name}</h2>
                            <p className="text-sm text-slate-400 mt-1">
                                {activeToken.patient_id?.gender} • {activeToken.patient_id?.age} Years • Token: <span className="font-bold text-white text-base">{activeToken.display_token || `#${activeToken.token_number}`}</span>
                            </p>
                        </div>

                        {/* Consultation Controls */}
                        <div className="flex items-center gap-4 bg-slate-800/80 p-4 rounded-2xl border border-slate-700 w-full md:w-auto justify-between">
                            <div>
                                <span className="text-xs text-slate-400 block uppercase font-semibold">Consult Time</span>
                                <span className="font-mono text-xl font-bold text-white">{formatTime(consultationTime)}</span>
                            </div>
                            
                            {activeToken.status === 'Called' ? (
                                <div className="flex gap-2">
                                    <Button onClick={startConsultation} className="bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl px-6">
                                        Start Session
                                    </Button>
                                    <Button variant="outline" onClick={skipPatient} className="border-slate-700 text-slate-300 hover:bg-slate-800 rounded-xl">
                                        Skip
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <Button onClick={completeConsultation} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl px-6 flex items-center gap-2">
                                        <Check className="w-4 h-4" /> Save & Close
                                    </Button>
                                    <Button onClick={() => setShowTransferModal(true)} variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 rounded-xl">
                                        Transfer
                                    </Button>
                                </div>
                            )}
                        </div>
                    </GlassCard>

                    {activeToken.status === 'In Consultation' && (
                        <>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            
                            {/* Left Column: Quick Patient History & Vitals Entry */}
                            <div className="space-y-6">
                                {/* Allergies & Diseases */}
                                <GlassCard className="p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                                    <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2 text-xs uppercase tracking-wider">
                                        <ShieldAlert className="w-5 h-5 text-red-500" /> Patient Medical Flags
                                    </h3>
                                    <div className="space-y-3">
                                        <div>
                                            <span className="text-[10px] text-slate-400 uppercase font-semibold">Known Allergies</span>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {patientProfile?.allergies?.length > 0 ? (
                                                    patientProfile.allergies.map((a: string, i: number) => (
                                                        <Badge key={i} className="bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 py-0.5 px-2">{a}</Badge>
                                                    ))
                                                ) : (
                                                    <span className="text-xs text-emerald-600 font-semibold">No Known Allergies</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                                            <span className="text-[10px] text-slate-400 uppercase font-semibold">Chronic Conditions</span>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {patientProfile?.existing_diseases?.length > 0 ? (
                                                    patientProfile.existing_diseases.map((d: string, i: number) => (
                                                        <Badge key={i} className="bg-slate-100 text-slate-700 dark:bg-slate-850 dark:text-slate-300 py-0.5 px-2">{d}</Badge>
                                                    ))
                                                ) : (
                                                    <span className="text-xs text-slate-400 italic">No chronic diseases registered.</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </GlassCard>

                                {/* Vitals Entry */}
                                <GlassCard className="p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                                    <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2 text-xs uppercase tracking-wider">
                                        <Activity className="w-5 h-5 text-blue-500" /> Vitals Logging
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-slate-400 font-semibold">Temp (°F)</label>
                                            <input 
                                                type="text" 
                                                placeholder="98.6"
                                                value={temperature}
                                                onChange={(e) => setTemperature(e.target.value)}
                                                className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-sm text-slate-800 dark:text-white focus:outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-400 font-semibold">Pulse Rate (bpm)</label>
                                            <input 
                                                type="text" 
                                                placeholder="72"
                                                value={heartRate}
                                                onChange={(e) => setHeartRate(e.target.value)}
                                                className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-sm text-slate-800 dark:text-white focus:outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-400 font-semibold">BP (mmHg)</label>
                                            <input 
                                                type="text" 
                                                placeholder="120/80"
                                                value={bloodPressure}
                                                onChange={(e) => setBloodPressure(e.target.value)}
                                                className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-sm text-slate-800 dark:text-white focus:outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-400 font-semibold">SpO2 (%)</label>
                                            <input 
                                                type="text" 
                                                placeholder="98"
                                                value={oxygenSat}
                                                onChange={(e) => setOxygenSat(e.target.value)}
                                                className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-sm text-slate-800 dark:text-white focus:outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-400 font-semibold">Height (cm)</label>
                                            <input 
                                                type="text" 
                                                placeholder="170"
                                                value={height}
                                                onChange={(e) => setHeight(e.target.value)}
                                                className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-sm text-slate-800 dark:text-white focus:outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-400 font-semibold">Weight (kg)</label>
                                            <input 
                                                type="text" 
                                                placeholder="70"
                                                value={weight}
                                                onChange={(e) => setWeight(e.target.value)}
                                                className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-sm text-slate-800 dark:text-white focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                </GlassCard>
                            </div>

                            {/* Middle Column: Symptoms, Diagnosis & Clinical Notes */}
                            <div className="space-y-6">
                                <GlassCard className="p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                                    <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2 text-xs uppercase tracking-wider">
                                        <BookOpen className="w-5 h-5 text-indigo-500" /> Symptoms & Diagnosis
                                    </h3>
                                    <div className="space-y-4">
                                        {/* Symptoms tagger */}
                                        <div>
                                            <label className="text-xs text-slate-400 font-semibold">Presented Symptoms</label>
                                            <div className="flex gap-2 mt-1">
                                                <input 
                                                    type="text" 
                                                    placeholder="Add symptom (e.g. Fever)"
                                                    value={symptomsInput}
                                                    onChange={(e) => setSymptomsInput(e.target.value)}
                                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSymptom(); } }}
                                                    className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-sm text-slate-800 dark:text-white focus:outline-none"
                                                />
                                                <Button onClick={addSymptom} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs px-3">Add</Button>
                                            </div>
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {symptoms.map((s, i) => (
                                                    <Badge key={i} className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400 flex items-center gap-1.5 pr-1.5 py-0.5">
                                                        {s}
                                                        <Trash2 onClick={() => removeSymptom(i)} className="w-3 h-3 cursor-pointer text-indigo-400 hover:text-red-500" />
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Diagnosis input */}
                                        <div>
                                            <label className="text-xs text-slate-400 font-semibold">Primary Diagnosis / ICD</label>
                                            <input 
                                                type="text" 
                                                placeholder="e.g. Acute Pharyngitis"
                                                value={primaryDiagnosis}
                                                onChange={(e) => setPrimaryDiagnosis(e.target.value)}
                                                className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-sm text-slate-800 dark:text-white focus:outline-none"
                                            />
                                        </div>

                                        {/* Clinical impression notes */}
                                        <div>
                                            <label className="text-xs text-slate-400 font-semibold">Clinical Impression Notes</label>
                                            <textarea 
                                                rows={3}
                                                placeholder="Enter observations, chest sounds, throat congestion level, etc..."
                                                value={clinicalImpression}
                                                onChange={(e) => setClinicalImpression(e.target.value)}
                                                className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-sm text-slate-800 dark:text-white focus:outline-none"
                                            />
                                        </div>

                                        {/* Treatment notes */}
                                        <div>
                                            <label className="text-xs text-slate-400 font-semibold">Overall Treatment Plan / Advice</label>
                                            <textarea 
                                                rows={3}
                                                placeholder="General clinical advice, fluid intake, bed rest details..."
                                                value={treatmentPlan}
                                                onChange={(e) => setTreatmentPlan(e.target.value)}
                                                className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-sm text-slate-800 dark:text-white focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                </GlassCard>
                            </div>

                            {/* Right Column: Prescriptions & Follow-up */}
                            <div className="space-y-6">
                                <GlassCard className="p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 text-xs uppercase tracking-wider">
                                            <FileText className="w-5 h-5 text-emerald-500" /> Digital Prescription
                                        </h3>
                                        <Button onClick={addMedicineRow} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs py-1 px-2.5 flex items-center gap-1">
                                            <Plus className="w-3.5 h-3.5" /> Add Row
                                        </Button>
                                    </div>

                                    {/* Prescription form lists */}
                                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                                        {medicines.map((med, idx) => (
                                            <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl relative space-y-2">
                                                {medicines.length > 1 && (
                                                    <button onClick={() => removeMedicineRow(idx)} className="absolute top-2 right-2 text-red-500 hover:text-red-700">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <div>
                                                    <label className="text-[10px] text-slate-400 font-semibold block uppercase">Medicine Name</label>
                                                    <input 
                                                        type="text" 
                                                        placeholder="e.g. Paracetamol"
                                                        value={med.name}
                                                        onChange={(e) => updateMedicineField(idx, 'name', e.target.value)}
                                                        className="w-full mt-0.5 px-2 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white focus:outline-none"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <label className="text-[10px] text-slate-400 font-semibold block uppercase">Dosage</label>
                                                        <input 
                                                            type="text" 
                                                            value={med.dosage}
                                                            onChange={(e) => updateMedicineField(idx, 'dosage', e.target.value)}
                                                            className="w-full mt-0.5 px-2 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] text-slate-400 font-semibold block uppercase">Duration</label>
                                                        <input 
                                                            type="text" 
                                                            value={med.duration}
                                                            onChange={(e) => updateMedicineField(idx, 'duration', e.target.value)}
                                                            className="w-full mt-0.5 px-2 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 items-center">
                                                    <div>
                                                        <label className="text-[10px] text-slate-400 font-semibold block uppercase">Frequency</label>
                                                        <select
                                                            value={med.frequency}
                                                            onChange={(e) => updateMedicineField(idx, 'frequency', e.target.value)}
                                                            className="w-full mt-0.5 px-2 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white"
                                                        >
                                                            <option value="Once Daily">Once Daily</option>
                                                            <option value="Twice Daily">Twice Daily</option>
                                                            <option value="Thrice Daily">Thrice Daily</option>
                                                            <option value="Four Times Daily">Four Times Daily</option>
                                                            <option value="As Needed (SOS)">As Needed (SOS)</option>
                                                        </select>
                                                    </div>
                                                    <div className="flex items-center gap-2 pt-4">
                                                        <input 
                                                            type="checkbox" 
                                                            id={`food-${idx}`}
                                                            checked={med.before_food}
                                                            onChange={(e) => updateMedicineField(idx, 'before_food', e.target.checked)}
                                                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                                                        />
                                                        <label htmlFor={`food-${idx}`} className="text-xs text-slate-500 font-medium cursor-pointer">Before Food</label>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Lab orders list builder */}
                                    <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-4">
                                        <label className="text-xs text-slate-400 font-semibold">Laboratory Diagnostics Required</label>
                                        <div className="flex gap-2 mt-1">
                                            <input 
                                                type="text" 
                                                placeholder="e.g. CBC, Lipid Profile"
                                                value={labInput}
                                                onChange={(e) => setLabInput(e.target.value)}
                                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addLabTest(); } }}
                                                className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-sm text-slate-800 dark:text-white focus:outline-none"
                                            />
                                            <Button onClick={addLabTest} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs px-3">Add</Button>
                                        </div>
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {labTests.map((t, idx) => (
                                                <Badge key={idx} className="bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 flex items-center gap-1.5 pr-1.5 py-0.5">
                                                    {t}
                                                    <Trash2 onClick={() => removeLabTest(idx)} className="w-3 h-3 cursor-pointer text-amber-400 hover:text-red-500" />
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Follow up schedule */}
                                    <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-4">
                                        <label className="text-xs text-slate-400 font-semibold flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Next Follow-up Date</label>
                                        <input 
                                            type="date"
                                            value={followUpDate}
                                            onChange={(e) => setFollowUpDate(e.target.value)}
                                            className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-sm text-slate-800 dark:text-white focus:outline-none"
                                        />
                                    </div>
                                </GlassCard>
                            </div>

                        </div>

                        {/* Voice Translation Widget */}
                        <div className="mt-6">
                            <DoctorVoiceAssistantWidget />
                        </div>
                        </>
                    )}
                </div>
            ) : (
                <GlassCard className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-12 min-h-[340px] flex flex-col items-center justify-center text-center gap-6 mb-8">
                    <div className="p-5 bg-blue-50 dark:bg-blue-900/10 rounded-full text-blue-500">
                        <Users className="w-12 h-12" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-white">No Patient Active</h3>
                        <p className="text-slate-400 mt-2 max-w-sm">There is no patient currently being consulted. Call the next patient from the waiting queue.</p>
                    </div>
                    <Button 
                        size="lg"
                        onClick={callNext}
                        disabled={loading}
                        className="px-8 h-14 text-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-200 dark:shadow-none hover:shadow-xl transition-all"
                    >
                        {loading ? "Processing..." : <><Play className="w-5 h-5 mr-2 fill-current" /> Call Next Patient</>}
                    </Button>
                </GlassCard>
            )}

            {/* Bottom Timeline Section */}
            <div className="mb-12">
                <QueueTimeline tokens={tokens} />
            </div>

            {/* Emergency Walk-In Modal */}
            {showEmergencyModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
                        <h3 className="text-xl font-bold text-slate-950 dark:text-white mb-4 flex items-center gap-2">
                            <ShieldAlert className="w-5 h-5 text-red-500 animate-pulse" /> Register Emergency Walk-in
                        </h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                                    Patient Mobile Number
                                </label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text"
                                        placeholder="e.g. 9876543210"
                                        value={emergencyPhone}
                                        onChange={(e) => setEmergencyPhone(e.target.value)}
                                        className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                    <Button 
                                        onClick={searchPatient}
                                        disabled={searchingPatient}
                                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl"
                                    >
                                        {searchingPatient ? "Searching..." : "Search"}
                                    </Button>
                                </div>
                            </div>

                            {foundPatient && (
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-2xl space-y-2">
                                    <p className="text-sm font-bold text-slate-800 dark:text-white">
                                        {foundPatient.name} ({foundPatient.gender}, {foundPatient.age} yrs)
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        ID: {foundPatient.patient_id || 'PAT-NEW'} • Blood: {foundPatient.blood_group}
                                    </p>
                                </div>
                            )}

                            <div>
                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                                    Triage Severity Level
                                </label>
                                <select 
                                    value={emergencySeverity}
                                    onChange={(e) => setEmergencySeverity(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white focus:outline-none"
                                >
                                    <option value="Medium">Medium Priority</option>
                                    <option value="High">High Priority (Immediate Next)</option>
                                    <option value="Critical">Critical (Instant Bypass)</option>
                                </select>
                            </div>

                            <div className="flex gap-3 justify-end pt-4">
                                <Button 
                                    variant="outline"
                                    onClick={() => {
                                        setShowEmergencyModal(false);
                                        setEmergencyPhone('');
                                        setFoundPatient(null);
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    onClick={handleAddEmergency}
                                    disabled={!foundPatient || insertingEmergency}
                                    className="bg-red-600 hover:bg-red-700 text-white font-semibold"
                                >
                                    {insertingEmergency ? "Adding..." : "Add to Queue"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Transfer Modal */}
            {showTransferModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
                        <h3 className="text-xl font-bold text-slate-950 dark:text-white mb-4 flex items-center gap-2">
                            <ArrowRightLeft className="w-5 h-5 text-indigo-500" /> Transfer Patient
                        </h3>
                        
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-slate-500 mb-2">
                                    Transfer <strong>{activeToken?.patient_id?.name}</strong> ({activeToken?.display_token}) to another doctor or department.
                                </p>
                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                                    Select Target Consultant
                                </label>
                                <select 
                                    value={transferDoctorId}
                                    onChange={(e) => setTransferDoctorId(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white focus:outline-none"
                                >
                                    <option value="">-- Choose Doctor --</option>
                                    {allDoctors
                                        .filter(d => d._id !== user?._id)
                                        .map(d => (
                                            <option key={d._id} value={d._id}>
                                                {d.user_id?.name || 'Dr.'} ({d.department} - {d.specialization})
                                            </option>
                                        ))
                                    }
                                </select>
                            </div>

                            <div className="flex gap-3 justify-end pt-4">
                                <Button 
                                    variant="outline"
                                    onClick={() => {
                                        setShowTransferModal(false);
                                        setTransferDoctorId('');
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    onClick={handleTransfer}
                                    disabled={!transferDoctorId || transferring}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                                >
                                    {transferring ? "Transferring..." : "Confirm Transfer"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}

// Active: 2026-07-04

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
