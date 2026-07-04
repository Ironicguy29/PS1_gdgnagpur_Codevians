'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from "@/components/layout/DashboardLayout";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
    Activity, ShieldAlert, BookOpen, FileText, Calendar, Plus, Trash2, 
    Sparkles, ArrowLeft, Send, Check, Heart, Thermometer, Info, AlertOctagon,
    ArrowUpRight, Stethoscope, MessageSquare, ClipboardList, HelpCircle, Loader2
} from "lucide-react";
import api, { setAuthToken } from "@/lib/api";
import { useToast } from "@/components/providers/ToastProvider";

export default function ConsultationWorkspace() {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const visitId = params.visitId as string; // This is the consultationId

    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Consultation & Patient Context State
    const [consultation, setConsultation] = useState<any>(null);
    const [patient, setPatient] = useState<any>(null);
    const [medicalProfile, setMedicalProfile] = useState<any>(null);
    const [vitalsHistory, setVitalsHistory] = useState<any[]>([]);
    const [visits, setVisits] = useState<any[]>([]);
    const [labOrdersHistory, setLabOrdersHistory] = useState<any[]>([]);
    const [aiSuggestions, setAiSuggestions] = useState<any>(null);

    // Timer state
    const [timerSeconds, setTimerSeconds] = useState(0);
    const timerRef = useRef<any>(null);

    // Clinical Entry States (Middle Column - EMR Panel)
    const [chiefComplaint, setChiefComplaint] = useState('Routine consultation checkup');
    const [symptomsInput, setSymptomsInput] = useState('');
    const [symptoms, setSymptoms] = useState<string[]>([]);
    const [examination, setExamination] = useState('');

    // SOAP notes
    const [soapSubjective, setSoapSubjective] = useState('');
    const [soapObjective, setSoapObjective] = useState('');
    const [soapAssessment, setSoapAssessment] = useState('');
    const [soapPlan, setSoapPlan] = useState('');
    const [privateNotes, setPrivateNotes] = useState('');

    // Vitals log
    const [temperature, setTemperature] = useState('');
    const [heartRate, setHeartRate] = useState('');
    const [bloodPressure, setBloodPressure] = useState('');
    const [oxygenSat, setOxygenSat] = useState('');
    const [respiratoryRate, setRespiratoryRate] = useState('');
    const [bloodSugar, setBloodSugar] = useState('');
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');

    // Diagnosis
    const [primaryDiagnosis, setPrimaryDiagnosis] = useState('');
    const [clinicalImpression, setClinicalImpression] = useState('');
    const [diagnosisSeverity, setDiagnosisSeverity] = useState<'Mild' | 'Moderate' | 'Severe'>('Mild');
    const [icdCode, setIcdCode] = useState('');

    // Prescription Builder
    const [medicines, setMedicines] = useState<any[]>([
        { name: '', dosage: '500mg', frequency: 'Once Daily', duration: '5 Days', before_food: false, substitution_allowed: true }
    ]);
    const [prescriptionInstructions, setPrescriptionInstructions] = useState('');
    const [safetyAcknowledged, setSafetyAcknowledged] = useState(false);
    const [safetyWarnings, setSafetyWarnings] = useState<any[]>([]);
    const [checkingSafety, setCheckingSafety] = useState(false);

    // Lab Test Builder
    const [labTests, setLabTests] = useState<string[]>([]);
    const [labInput, setLabInput] = useState('');
    const [labCatalog, setLabCatalog] = useState<any[]>([]);
    const [showCatalogDropdown, setShowCatalogDropdown] = useState(false);

    // Follow-up
    const [followUpDate, setFollowUpDate] = useState('');
    const [followUpTime, setFollowUpTime] = useState('');
    const [followUpPurpose, setFollowUpPurpose] = useState('');

    // Referral
    const [referralSpecialist, setReferralSpecialist] = useState('');
    const [referralDept, setReferralDept] = useState('');
    const [referralHospital, setReferralHospital] = useState('');
    const [referralLetter, setReferralLetter] = useState('');

    // Doctor Instruction
    const [dietAdvice, setDietAdvice] = useState('');
    const [exercisePlan, setExercisePlan] = useState('');
    const [recoveryInstructions, setRecoveryInstructions] = useState('');
    const [preventiveCare, setPreventiveCare] = useState('');

    // Right Column: Interactive Gemini Chat Assistant
    const [chatQuery, setChatQuery] = useState('');
    const [chatMessages, setChatMessages] = useState<any[]>([
        { sender: 'ai', text: 'Hello, Doctor. I have reviewed this patient\'s history and vitals. You can check the clinical summary or ask me any question about drug safety, allergy checks, or differential diagnoses.' }
    ]);
    const [chatLoading, setChatLoading] = useState(false);

    // 1. Initial Load & Authentication
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            setAuthToken(token);
        }
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }

        if (visitId) {
            fetchConsultationData();
        }

        const fetchCatalog = async () => {
            try {
                const res = await api.get('/lab/catalog');
                setLabCatalog(res.data || []);
            } catch (e) {
                console.error("Failed to fetch lab catalog", e);
            }
        };
        fetchCatalog();

        // Start duration timer
        timerRef.current = setInterval(() => {
            setTimerSeconds(prev => prev + 1);
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [visitId]);

    // Reactively trigger Medication Safety Engine check
    useEffect(() => {
        const triggerSafetyCheck = async () => {
            const filledMeds = medicines.filter(m => m && m.name && m.name.trim() !== '');
            const patientId = patient?._id || consultation?.patient_id?._id || consultation?.patient_id;
            
            if (filledMeds.length === 0 || !patientId) {
                setSafetyWarnings([]);
                return;
            }
            
            try {
                setCheckingSafety(true);
                const res = await api.post('/consultations/safety-check', {
                    patientId,
                    medicines: filledMeds.map(m => ({
                        name: m.name,
                        dosage: m.dosage,
                        strength: m.strength || m.dosage,
                        quantity: m.quantity || 1
                    }))
                });
                if (res.data?.success) {
                    setSafetyWarnings(res.data.data || []);
                }
            } catch (err) {
                console.error("Prescription safety check failed:", err);
            } finally {
                setCheckingSafety(false);
            }
        };

        const timer = setTimeout(() => {
            triggerSafetyCheck();
        }, 800); // 800ms debounce

        return () => clearTimeout(timer);
    }, [medicines, patient?._id, consultation?.patient_id]);

    // 2. Fetch Consultation & EMR Context
    const fetchConsultationData = async () => {
        try {
            setLoading(true);
            // Fetch consultation object
            const consultRes = await api.get(`/consultations/${visitId}`);
            setConsultation(consultRes.data);
            
            if (consultRes.data) {
                const patientId = consultRes.data.patient_id?._id || consultRes.data.patient_id;
                if (consultRes.data.chief_complaint) {
                    setChiefComplaint(consultRes.data.chief_complaint);
                }
                if (consultRes.data.symptoms) {
                    setSymptoms(consultRes.data.symptoms);
                }

                // Fetch clinical EMR history & AI context
                const contextRes = await api.get(`/consultations/context/${patientId}`);
                const data = contextRes.data;
                
                setPatient(data.patient);
                setMedicalProfile(data.medicalProfile);
                setVisits(data.visits);
                setVitalsHistory(data.vitalsHistory);
                setLabOrdersHistory(data.labOrders);
                setAiSuggestions(data.aiSuggestions);

                // Pre-fill latest vitals if available
                if (data.vitalsHistory && data.vitalsHistory.length > 0) {
                    const latest = data.vitalsHistory[0];
                    setTemperature(latest.temperature ? latest.temperature.toString() : '');
                    setHeartRate(latest.heart_rate ? latest.heart_rate.toString() : '');
                    setBloodPressure(latest.blood_pressure || '');
                    setOxygenSat(latest.oxygen_saturation ? latest.oxygen_saturation.toString() : '');
                    setRespiratoryRate(latest.respiratory_rate ? latest.respiratory_rate.toString() : '');
                    setBloodSugar(latest.blood_sugar ? latest.blood_sugar.toString() : '');
                }

                if (data.medicalProfile) {
                    setHeight(data.medicalProfile.height ? data.medicalProfile.height.toString() : '');
                    setWeight(data.medicalProfile.weight ? data.medicalProfile.weight.toString() : '');
                }
            }
        } catch (e: any) {
            console.error(e);
            toast("Failed to load consultation context.", "error");
        } finally {
            setLoading(false);
        }
    };

    // Vitals auto-calculation / flags
    const getTempFlag = () => {
        const t = parseFloat(temperature);
        if (!t) return null;
        if (t > 100.4) return { label: 'Fever', color: 'text-red-500 bg-red-500/10' };
        if (t < 97) return { label: 'Low Temp', color: 'text-blue-500 bg-blue-500/10' };
        return { label: 'Normal', color: 'text-emerald-500 bg-emerald-500/10' };
    };

    const getBPFlag = () => {
        if (!bloodPressure) return null;
        const parts = bloodPressure.split('/');
        if (parts.length === 2) {
            const sys = parseInt(parts[0]);
            const dia = parseInt(parts[1]);
            if (sys > 140 || dia > 90) return { label: 'Hypertension', color: 'text-red-500 bg-red-500/10' };
            if (sys < 90 || dia < 60) return { label: 'Hypotension', color: 'text-blue-500 bg-blue-500/10' };
        }
        return { label: 'Normal', color: 'text-emerald-500 bg-emerald-500/10' };
    };

    const getSpO2Flag = () => {
        const s = parseInt(oxygenSat);
        if (!s) return null;
        if (s < 94) return { label: 'Hypoxia', color: 'text-red-500 bg-red-500/10' };
        return { label: 'Normal', color: 'text-emerald-500 bg-emerald-500/10' };
    };

    // Format timer
    const formatDuration = (sec: number) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    // Symptoms Builder Actions
    const addSymptom = () => {
        if (symptomsInput.trim() && !symptoms.includes(symptomsInput.trim())) {
            setSymptoms([...symptoms, symptomsInput.trim()]);
            setSymptomsInput('');
        }
    };

    const removeSymptom = (index: number) => {
        setSymptoms(symptoms.filter((_, i) => i !== index));
    };

    // Prescription Builder Actions
    const addMedicineRow = () => {
        setMedicines([...medicines, { name: '', dosage: '500mg', frequency: 'Once Daily', duration: '5 Days', before_food: false, substitution_allowed: true }]);
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

    // Lab Builder Actions
    const addLabTest = () => {
        if (labInput.trim() && !labTests.includes(labInput.trim())) {
            setLabTests([...labTests, labInput.trim()]);
            setLabInput('');
        }
    };

    const removeLabTest = (index: number) => {
        setLabTests(labTests.filter((_, i) => i !== index));
    };

    // Gemini Chatbot custom querying
    const handleSendChatQuery = async () => {
        if (!chatQuery.trim() || chatLoading) return;
        
        const userMsg = chatQuery.trim();
        setChatMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
        setChatQuery('');
        setChatLoading(true);

        try {
            // Hit the AI chatbot endpoint
            const aiUrl = process.env.NEXT_PUBLIC_AI_URL || 'http://localhost:8000';
            const res = await api.post(`${aiUrl}/chatbot`, {
                message: userMsg,
                language: 'en'
            });
            setChatMessages(prev => [...prev, { sender: 'ai', text: res.data.response }]);
        } catch (err) {
            console.error("AI service chatbot query error:", err);
            setChatMessages(prev => [...prev, { sender: 'ai', text: 'Sorry, Doctor. I encountered an error communicating with the AI model. Please verify that the AI service is running on port 8000.' }]);
        } finally {
            setChatLoading(false);
        }
    };

    // Complete Consultation (Transactional Save EMR + Finalize Queue Token)
    const handleCompleteConsultation = async () => {
        if (!primaryDiagnosis) {
            toast("Primary Diagnosis is required to complete this session.", "error");
            return;
        }

        if (medicines.some(m => m.name.trim() !== '') && !safetyAcknowledged) {
            toast("Please acknowledge the Prescription Safety Verification checkbox.", "error");
            return;
        }

        setSaving(true);
        try {
            // 1. Construct completion payload
            const payload = {
                chief_complaint: chiefComplaint,
                symptoms: symptoms,
                examination: examination || undefined,
                vitals: {
                    temperature: temperature ? parseFloat(temperature) : undefined,
                    blood_pressure: bloodPressure || undefined,
                    heart_rate: heartRate ? parseInt(heartRate) : undefined,
                    respiratory_rate: respiratoryRate ? parseInt(respiratoryRate) : undefined,
                    oxygen_saturation: oxygenSat ? parseInt(oxygenSat) : undefined,
                    height: height ? parseFloat(height) : undefined,
                    weight: weight ? parseFloat(weight) : undefined,
                    blood_sugar: bloodSugar ? parseInt(bloodSugar) : undefined
                },
                diagnosis: {
                    primary_diagnosis: primaryDiagnosis,
                    severity: diagnosisSeverity,
                    icd_code: icdCode || undefined,
                    clinical_impression: clinicalImpression || undefined
                },
                prescription: medicines.some(m => m.name.trim() !== '') ? {
                    medicines: medicines.filter(m => m.name.trim() !== ''),
                    instructions: prescriptionInstructions || undefined,
                    confirmation_acknowledged: safetyAcknowledged
                } : undefined,
                clinical_note: {
                    subjective: soapSubjective || `Chief Complaint: ${chiefComplaint}. Symptoms: ${symptoms.join(', ')}`,
                    objective: soapObjective || `Vitals: Temp ${temperature}°F, HR ${heartRate}bpm, BP ${bloodPressure}, SpO2 ${oxygenSat}%. Height ${height}cm, Weight ${weight}kg`,
                    assessment: soapAssessment || `Clinical Impression: ${clinicalImpression || primaryDiagnosis}`,
                    plan: soapPlan || `Treatment plan initiated. Lab ordered: ${labTests.join(', ')}`,
                    private_notes: privateNotes || undefined
                },
                follow_up: followUpDate ? {
                    follow_up_date: followUpDate,
                    follow_up_time: followUpTime || undefined,
                    purpose: followUpPurpose || 'Progress review'
                } : undefined,
                referral: referralSpecialist || referralDept ? {
                    referred_to_specialist: referralSpecialist || undefined,
                    referred_to_department: referralDept || undefined,
                    referred_to_hospital: referralHospital || undefined,
                    referral_letter: referralLetter || undefined
                } : undefined,
                doctor_instruction: {
                    diet_advice: dietAdvice || undefined,
                    exercise_plan: exercisePlan || undefined,
                    recovery_instructions: recoveryInstructions || undefined,
                    preventive_care: preventiveCare || undefined
                },
                lab_orders: labTests,
                duration_seconds: timerSeconds
            };

            // 2. Trigger the backend Consultation save
            await api.post(`/consultations/${visitId}/complete`, payload);

            // 3. Mark the queue token completed
            if (consultation?.token_id) {
                const tokenId = consultation.token_id?._id || consultation.token_id;
                await api.post('/queue/complete', { tokenId });
            }

            toast("Consultation saved successfully and EMR updated.", "success");
            router.push('/dashboard/doctor');
        } catch (e: any) {
            console.error(e);
            toast(e.response?.data?.message || 'Failed to complete consultation', "error");
        } finally {
            setSaving(false);
        }
    };

    const filteredCatalog = labCatalog.filter(test => {
        const query = labInput.toLowerCase();
        return (
            test.name?.toLowerCase().includes(query) ||
            test.category?.toLowerCase().includes(query) ||
            test.department?.toLowerCase().includes(query)
        );
    });

    if (loading) {
        return (
            <DashboardLayout role="doctor">
                <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
                    <p className="text-slate-400 font-medium">Initializing Clinical Workstation & AI Assistant...</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout role="doctor">
            {/* Top Workspace Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => router.push('/dashboard/doctor')}
                        className="rounded-xl border border-slate-200 dark:border-slate-800"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white">Consultation Workspace</h1>
                            <Badge className="bg-emerald-600/10 text-emerald-500 border border-emerald-500/20 font-semibold px-2.5 py-0.5">Live Session</Badge>
                        </div>
                        <p className="text-sm text-slate-400 mt-0.5">Focus Workspace for Clinical Documentation & AI Guidance</p>
                    </div>
                </div>

                {/* Duration Tracker & Save Controls */}
                <div className="flex items-center gap-4 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-2xl">
                    <div className="text-right">
                        <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Session Time</span>
                        <span className="font-mono text-lg font-extrabold text-slate-800 dark:text-white">{formatDuration(timerSeconds)}</span>
                    </div>
                    <Button 
                        onClick={handleCompleteConsultation}
                        disabled={saving}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-6 py-2 h-11 rounded-xl shadow-lg shadow-emerald-500/15"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Saving EMR...
                            </>
                        ) : (
                            <>
                                <Check className="w-4 h-4 mr-2" />
                                Save & Complete EMR
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* THREE-PANEL GRID LAYOUT */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
                
                {/* PANEL 1: PATIENT PROFILE & CLINICAL HISTORIES (Left Column - Span 1) */}
                <div className="xl:col-span-1 space-y-6">
                    {/* Patient Master Card */}
                    <GlassCard className="p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                            <ClipboardList className="w-4 h-4 text-blue-500" /> Patient Master File
                        </h3>
                        {patient && (
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-xl font-extrabold text-slate-850 dark:text-white">{patient.name}</h4>
                                    <p className="text-xs text-slate-400 mt-1">
                                        ID: <span className="font-mono text-slate-300 font-semibold">{patient.patient_id || 'PAT-2026-00392'}</span>
                                    </p>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        ABHA: <span className="font-mono text-slate-300 font-semibold">{patient.abha_number || '3928-1932-8472'}</span>
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                                    <div>
                                        <span className="text-slate-400 block">Age / Gender</span>
                                        <span className="font-bold text-slate-700 dark:text-white">{patient.age} Yrs / {patient.gender}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block">Blood Group</span>
                                        <span className="font-bold text-slate-700 dark:text-white">{patient.blood_group || 'O+'}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block">Phone</span>
                                        <span className="font-bold text-slate-700 dark:text-white">{patient.user_id?.phone || patient.phone}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block">Emergency No.</span>
                                        <span className="font-bold text-slate-700 dark:text-white">{patient.emergency_contact?.phone || 'Not set'}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </GlassCard>

                    {/* Medical Profile Flags */}
                    <GlassCard className="p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                            <ShieldAlert className="w-4 h-4 text-red-500" /> Medical Flags
                        </h3>
                        <div className="space-y-4 text-xs">
                            <div>
                                <span className="text-slate-400 block font-semibold uppercase text-[10px]">Allergies</span>
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                    {medicalProfile?.allergies?.length > 0 ? (
                                        medicalProfile.allergies.map((a: string, i: number) => (
                                            <Badge key={i} className="bg-red-500/10 text-red-500 border border-red-500/20">{a}</Badge>
                                        ))
                                    ) : (
                                        <span className="text-emerald-500 font-semibold italic">No Known Drug Allergies</span>
                                    )}
                                </div>
                            </div>
                            <div>
                                <span className="text-slate-400 block font-semibold uppercase text-[10px]">Chronic Diseases</span>
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                    {medicalProfile?.existing_diseases?.length > 0 ? (
                                        medicalProfile.existing_diseases.map((d: string, i: number) => (
                                            <Badge key={i} className="bg-amber-500/10 text-amber-500 border border-amber-500/20">{d}</Badge>
                                        ))
                                    ) : (
                                        <span className="text-slate-400 italic">No chronic diseases registered.</span>
                                    )}
                                </div>
                            </div>
                            <div>
                                <span className="text-slate-400 block font-semibold uppercase text-[10px]">Current Medications</span>
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                    {medicalProfile?.current_medications?.length > 0 ? (
                                        medicalProfile.current_medications.map((m: string, i: number) => (
                                            <Badge key={i} className="bg-blue-500/10 text-blue-500 border border-blue-500/20">{m}</Badge>
                                        ))
                                    ) : (
                                        <span className="text-slate-400 italic">No current medications listed.</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </GlassCard>

                    {/* Vitals History Trend */}
                    <GlassCard className="p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                            <Activity className="w-4 h-4 text-emerald-500" /> Recent Vitals Trend
                        </h3>
                        <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                            {vitalsHistory && vitalsHistory.length > 0 ? (
                                vitalsHistory.map((v: any, index: number) => (
                                    <div key={index} className="p-2.5 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-800/40 text-xs">
                                        <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold mb-1">
                                            <span>{new Date(v.recorded_at || v.createdAt).toLocaleDateString()}</span>
                                            <span>by {v.recorded_by_role || 'Staff'}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-slate-650 dark:text-slate-350">
                                            <div>Temp: <span className="font-bold text-slate-800 dark:text-white">{v.temperature}°F</span></div>
                                            <div>HR: <span className="font-bold text-slate-800 dark:text-white">{v.heart_rate} bpm</span></div>
                                            <div>BP: <span className="font-bold text-slate-800 dark:text-white">{v.blood_pressure}</span></div>
                                            <div>SpO2: <span className="font-bold text-slate-800 dark:text-white">{v.oxygen_saturation}%</span></div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-slate-400 text-xs italic">No vitals history logs found.</p>
                            )}
                        </div>
                    </GlassCard>

                    {/* Visit History Log */}
                    <GlassCard className="p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                            <BookOpen className="w-4 h-4 text-purple-500" /> EMR Past Consultations
                        </h3>
                        <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                            {visits && visits.length > 0 ? (
                                visits.map((v: any, index: number) => (
                                    <div key={index} className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-800/40 space-y-1.5">
                                        <div className="flex justify-between items-center text-[10px] font-bold">
                                            <span className="text-indigo-500 uppercase">{v.department}</span>
                                            <span className="text-slate-400">{new Date(v.date).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-xs font-bold text-slate-800 dark:text-white">
                                            {v.diagnosis?.primary_diagnosis || 'Checkup visit'}
                                        </p>
                                        {v.symptoms?.length > 0 && (
                                            <p className="text-[10px] text-slate-450 leading-relaxed">
                                                <span className="font-semibold">Symptoms:</span> {v.symptoms.join(', ')}
                                            </p>
                                        )}
                                        {v.treatment_plan && (
                                            <p className="text-[10px] text-slate-450 leading-relaxed">
                                                <span className="font-semibold">Plan:</span> {v.treatment_plan}
                                            </p>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p className="text-slate-400 text-xs italic">No previous visits recorded.</p>
                            )}
                        </div>
                    </GlassCard>
                </div>

                {/* PANEL 2: EMR CLINICAL DOCUMENTATION (Middle Column - Span 2) */}
                <div className="xl:col-span-2 space-y-6">
                    
                    {/* Clinical Summary & Examination Card */}
                    <GlassCard className="p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <Stethoscope className="w-5 h-5 text-indigo-500" /> Chief Complaints & Vitals
                        </h2>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Chief Complaint</label>
                                <input 
                                    type="text" 
                                    value={chiefComplaint}
                                    onChange={(e) => setChiefComplaint(e.target.value)}
                                    className="w-full mt-1.5 px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>

                            {/* Symptoms tagger */}
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Symptoms Presenting</label>
                                <div className="flex gap-2 mt-1.5">
                                    <input 
                                        type="text" 
                                        placeholder="Type symptom (e.g. Fever) and click Add"
                                        value={symptomsInput}
                                        onChange={(e) => setSymptomsInput(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSymptom(); } }}
                                        className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    />
                                    <Button onClick={addSymptom} className="bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs px-4">Add</Button>
                                </div>
                                <div className="flex flex-wrap gap-1.5 mt-2.5">
                                    {symptoms.map((s, i) => (
                                        <Badge key={i} className="bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 flex items-center gap-1.5 pr-2 py-0.5">
                                            {s}
                                            <Trash2 onClick={() => removeSymptom(i)} className="w-3 h-3 cursor-pointer text-indigo-400 hover:text-red-500" />
                                        </Badge>
                                    ))}
                                    {symptoms.length === 0 && (
                                        <span className="text-xs text-slate-450 italic">No symptoms added.</span>
                                    )}
                                </div>
                            </div>

                            {/* Vitals Input Forms */}
                            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Vitals & Anthropometrics</label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <label className="text-[10px] text-slate-400 block uppercase font-bold">Temp (°F)</label>
                                        <div className="relative">
                                            <input 
                                                type="text" 
                                                placeholder="98.6"
                                                value={temperature}
                                                onChange={(e) => setTemperature(e.target.value)}
                                                className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs text-slate-800 dark:text-white"
                                            />
                                            {getTempFlag() && (
                                                <span className={`absolute right-2 top-2 text-[9px] px-1 py-0.5 rounded font-bold ${getTempFlag()?.color}`}>
                                                    {getTempFlag()?.label}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-slate-400 block uppercase font-bold">Heart Rate (bpm)</label>
                                        <input 
                                            type="text" 
                                            placeholder="72"
                                            value={heartRate}
                                            onChange={(e) => setHeartRate(e.target.value)}
                                            className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs text-slate-800 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-slate-400 block uppercase font-bold">BP (mmHg)</label>
                                        <div className="relative">
                                            <input 
                                                type="text" 
                                                placeholder="120/80"
                                                value={bloodPressure}
                                                onChange={(e) => setBloodPressure(e.target.value)}
                                                className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs text-slate-800 dark:text-white"
                                            />
                                            {getBPFlag() && (
                                                <span className={`absolute right-2 top-2 text-[9px] px-1 py-0.5 rounded font-bold ${getBPFlag()?.color}`}>
                                                    {getBPFlag()?.label}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-slate-400 block uppercase font-bold">SpO2 (%)</label>
                                        <div className="relative">
                                            <input 
                                                type="text" 
                                                placeholder="98"
                                                value={oxygenSat}
                                                onChange={(e) => setOxygenSat(e.target.value)}
                                                className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs text-slate-800 dark:text-white"
                                            />
                                            {getSpO2Flag() && (
                                                <span className={`absolute right-2 top-2 text-[9px] px-1 py-0.5 rounded font-bold ${getSpO2Flag()?.color}`}>
                                                    {getSpO2Flag()?.label}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                                    <div>
                                        <label className="text-[10px] text-slate-400 block uppercase font-bold">Resp Rate (cpm)</label>
                                        <input 
                                            type="text" 
                                            placeholder="16"
                                            value={respiratoryRate}
                                            onChange={(e) => setRespiratoryRate(e.target.value)}
                                            className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs text-slate-800 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-slate-400 block uppercase font-bold">Blood Sugar (mg/dL)</label>
                                        <input 
                                            type="text" 
                                            placeholder="90"
                                            value={bloodSugar}
                                            onChange={(e) => setBloodSugar(e.target.value)}
                                            className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs text-slate-800 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-slate-400 block uppercase font-bold">Height (cm)</label>
                                        <input 
                                            type="text" 
                                            placeholder="170"
                                            value={height}
                                            onChange={(e) => setHeight(e.target.value)}
                                            className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs text-slate-800 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-slate-400 block uppercase font-bold">Weight (kg)</label>
                                        <input 
                                            type="text" 
                                            placeholder="70"
                                            value={weight}
                                            onChange={(e) => setWeight(e.target.value)}
                                            className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs text-slate-800 dark:text-white"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </GlassCard>

                    {/* SOAP Notes Panel */}
                    <GlassCard className="p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-purple-500" /> Clinical Notes (SOAP Schema)
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Subjective (Patient symptoms, concerns, history)</label>
                                <textarea 
                                    rows={2}
                                    value={soapSubjective}
                                    onChange={(e) => setSoapSubjective(e.target.value)}
                                    placeholder="Patient reports progressive throat irritation, dry cough and mild temperature over last 3 days..."
                                    className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs text-slate-800 dark:text-white focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Objective (Physical examination observations, checks)</label>
                                <textarea 
                                    rows={2}
                                    value={soapObjective}
                                    onChange={(e) => setSoapObjective(e.target.value)}
                                    placeholder="Congested pharynx, no tonsillar exudate. Lungs clear to auscultation. Vitals reviewed..."
                                    className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs text-slate-800 dark:text-white focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Assessment (Diagnosis impression, clinical logic)</label>
                                <textarea 
                                    rows={2}
                                    value={soapAssessment}
                                    onChange={(e) => setSoapAssessment(e.target.value)}
                                    placeholder="Suspected acute upper respiratory infection. Differential includes viral pharyngitis..."
                                    className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs text-slate-800 dark:text-white focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Plan (Prescription instructions, referrals, follow-up)</label>
                                <textarea 
                                    rows={2}
                                    value={soapPlan}
                                    onChange={(e) => setSoapPlan(e.target.value)}
                                    placeholder="Advised warm saline gargles, hydration and complete bed rest. Return if dyspnea develops..."
                                    className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs text-slate-800 dark:text-white focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Private Clinical Notes (Confidential observations)</label>
                                <input 
                                    type="text"
                                    value={privateNotes}
                                    onChange={(e) => setPrivateNotes(e.target.value)}
                                    placeholder="Check psychological stressors or somatic anxiety flags in next visit..."
                                    className="w-full mt-1 px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs text-slate-800 dark:text-white"
                                />
                            </div>
                        </div>
                    </GlassCard>

                    {/* Diagnostics & Diagnosis Builder */}
                    <GlassCard className="p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-amber-500" /> Diagnosis & ICD Mapping
                        </h2>
                        
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Primary Diagnosis *</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. Acute Pharyngitis"
                                        value={primaryDiagnosis}
                                        onChange={(e) => setPrimaryDiagnosis(e.target.value)}
                                        className="w-full mt-1.5 px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs text-slate-800 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Severity</label>
                                    <select
                                        value={diagnosisSeverity}
                                        onChange={(e: any) => setDiagnosisSeverity(e.target.value)}
                                        className="w-full mt-1.5 px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs text-slate-800 dark:text-white"
                                    >
                                        <option value="Mild">Mild / Low Risk</option>
                                        <option value="Moderate">Moderate Risk</option>
                                        <option value="Severe">Severe / High Risk</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">ICD Code (e.g. ICD-10)</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. J02.9"
                                        value={icdCode}
                                        onChange={(e) => setIcdCode(e.target.value)}
                                        className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs text-slate-800 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Clinical Impression Summary</label>
                                    <input 
                                        type="text" 
                                        placeholder="Suspected viral cause, symptomatic relief advised"
                                        value={clinicalImpression}
                                        onChange={(e) => setClinicalImpression(e.target.value)}
                                        className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs text-slate-800 dark:text-white"
                                    />
                                </div>
                            </div>
                        </div>
                    </GlassCard>

                    {/* Prescription Builder */}
                    <GlassCard className="p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <FileText className="w-5 h-5 text-emerald-500" /> Digital Prescription Builder
                            </h2>
                            <Button onClick={addMedicineRow} className="bg-emerald-650 hover:bg-emerald-700 text-white rounded-xl text-xs py-1 px-3 flex items-center gap-1">
                                <Plus className="w-3.5 h-3.5" /> Add Row
                            </Button>
                        </div>

                        {/* Prescription lists */}
                        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                            {medicines.map((med, idx) => (
                                <div key={idx} className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl relative space-y-3">
                                    {medicines.length > 1 && (
                                        <button onClick={() => removeMedicineRow(idx)} className="absolute top-2 right-2 text-red-500 hover:text-red-700">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[10px] text-slate-400 font-bold uppercase block">Medicine Name</label>
                                            <input 
                                                type="text" 
                                                placeholder="e.g. Paracetamol"
                                                value={med.name}
                                                onChange={(e) => updateMedicineField(idx, 'name', e.target.value)}
                                                className="w-full mt-1 px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-slate-400 font-bold uppercase block">Dosage Strength</label>
                                            <input 
                                                type="text" 
                                                value={med.dosage}
                                                onChange={(e) => updateMedicineField(idx, 'dosage', e.target.value)}
                                                className="w-full mt-1 px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-3 gap-3">
                                        <div>
                                            <label className="text-[10px] text-slate-400 font-bold uppercase block">Frequency</label>
                                            <select
                                                value={med.frequency}
                                                onChange={(e) => updateMedicineField(idx, 'frequency', e.target.value)}
                                                className="w-full mt-1 px-2 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white"
                                            >
                                                <option value="Once Daily">Once Daily</option>
                                                <option value="Twice Daily">Twice Daily</option>
                                                <option value="Thrice Daily">Thrice Daily</option>
                                                <option value="Four Times Daily">Four Times Daily</option>
                                                <option value="As Needed (SOS)">As Needed (SOS)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-slate-400 font-bold uppercase block">Duration</label>
                                            <input 
                                                type="text" 
                                                value={med.duration}
                                                onChange={(e) => updateMedicineField(idx, 'duration', e.target.value)}
                                                className="w-full mt-1 px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white"
                                            />
                                        </div>
                                        <div className="flex flex-col justify-end gap-1 pb-1">
                                            <div className="flex items-center gap-1.5">
                                                <input 
                                                    type="checkbox" 
                                                    id={`food-${idx}`}
                                                    checked={med.before_food}
                                                    onChange={(e) => updateMedicineField(idx, 'before_food', e.target.checked)}
                                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                                                />
                                                <label htmlFor={`food-${idx}`} className="text-[10px] text-slate-500 font-bold uppercase cursor-pointer">Before Food</label>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <input 
                                                    type="checkbox" 
                                                    id={`sub-${idx}`}
                                                    checked={med.substitution_allowed}
                                                    onChange={(e) => updateMedicineField(idx, 'substitution_allowed', e.target.checked)}
                                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                                                />
                                                <label htmlFor={`sub-${idx}`} className="text-[10px] text-slate-500 font-bold uppercase cursor-pointer">Generic Sub OK</label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
                            <div>
                                <label className="text-xs text-slate-400 font-bold uppercase block">Special Prescription Instructions</label>
                                <input 
                                    type="text" 
                                    placeholder="Take with warm milk, avoid driving after dose, etc."
                                    value={prescriptionInstructions}
                                    onChange={(e) => setPrescriptionInstructions(e.target.value)}
                                    className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs text-slate-800 dark:text-white focus:outline-none"
                                />
                            </div>

                            {/* Safety Warnings List */}
                            {checkingSafety && (
                                <div className="p-3 bg-slate-500/5 border border-slate-500/20 rounded-2xl flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 animate-pulse">
                                    <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                                    <span>Running clinical safety rules, drug interactions, & OpenFDA check...</span>
                                </div>
                            )}

                            {!checkingSafety && safetyWarnings.length > 0 && (
                                <div className="p-3 bg-rose-500/5 border border-rose-500/20 rounded-2xl space-y-2">
                                    <div className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                                        <ShieldAlert className="w-4 h-4" /> Clinical Safety Alerts ({safetyWarnings.length})
                                    </div>
                                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                                        {safetyWarnings.map((warning, idx) => (
                                            <div 
                                                key={idx} 
                                                className={`p-2.5 border rounded-xl text-[11px] flex gap-2 ${
                                                    warning.severity === 'Critical' 
                                                        ? 'bg-red-500/10 border-red-500/25 text-red-800 dark:text-red-300' 
                                                        : warning.severity === 'Warning'
                                                            ? 'bg-amber-500/10 border-amber-500/25 text-amber-800 dark:text-amber-300'
                                                            : 'bg-blue-500/10 border-blue-500/25 text-blue-800 dark:text-blue-300'
                                                }`}
                                            >
                                                <div className="mt-0.5 shrink-0">
                                                    {warning.severity === 'Critical' ? (
                                                        <AlertOctagon className="w-3.5 h-3.5 text-red-600" />
                                                    ) : warning.severity === 'Warning' ? (
                                                        <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                                                    ) : (
                                                        <Info className="w-3.5 h-3.5 text-blue-600" />
                                                    )}
                                                </div>
                                                <div>
                                                    <span className="font-semibold block">{warning.message}</span>
                                                    {warning.detail && <span className="opacity-90 block mt-0.5 leading-relaxed">{warning.detail}</span>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Safety acknowledgment */}
                            <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-2xl flex items-start gap-2.5">
                                <input 
                                    type="checkbox" 
                                    id="safety-ack"
                                    checked={safetyAcknowledged}
                                    onChange={(e) => setSafetyAcknowledged(e.target.checked)}
                                    className="rounded border-red-300 text-red-600 focus:ring-red-500 h-4 w-4 mt-0.5"
                                />
                                <label htmlFor="safety-ack" className="text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                                    <span className="text-red-500 font-bold block mb-0.5 flex items-center gap-1"><AlertOctagon className="w-3.5 h-3.5" /> Prescription Safety Verification</span>
                                    I acknowledge that I have reviewed the generated prescription and verified it against patient allergies, drug interactions, and clinical guidelines.
                                </label>
                            </div>
                        </div>
                    </GlassCard>

                    {/* Labs, Follow-up, Referrals & Advice */}
                    <GlassCard className="p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <Plus className="w-5 h-5 text-indigo-500" /> Lab Orders & Disposition
                        </h2>
                        
                        <div className="space-y-4">
                            {/* Labs order builder */}
                            <div>
                                <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Order Diagnostic Investigations</label>
                                <div className="relative flex gap-2 mt-1.5">
                                    <input 
                                        type="text" 
                                        placeholder="Search diagnostic tests from catalog (e.g. Complete Blood Count)"
                                        value={labInput}
                                        onChange={(e) => {
                                            setLabInput(e.target.value);
                                            setShowCatalogDropdown(true);
                                        }}
                                        onFocus={() => setShowCatalogDropdown(true)}
                                        onBlur={() => setTimeout(() => setShowCatalogDropdown(false), 200)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addLabTest(); } }}
                                        className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs md:text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 animate-all duration-200"
                                    />
                                    <Button onClick={addLabTest} className="bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs px-4">Add</Button>

                                    {showCatalogDropdown && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto scrollbar-thin">
                                            {filteredCatalog.length > 0 ? (
                                                filteredCatalog.map((test) => (
                                                    <div 
                                                        key={test._id || test.test_id}
                                                        onMouseDown={() => {
                                                            if (!labTests.includes(test.name)) {
                                                                setLabTests([...labTests, test.name]);
                                                            }
                                                            setLabInput('');
                                                            setShowCatalogDropdown(false);
                                                        }}
                                                        className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex justify-between items-center border-b border-slate-100 dark:border-slate-800 last:border-0"
                                                    >
                                                        <div>
                                                            <div className="text-xs font-semibold text-slate-800 dark:text-white">{test.name}</div>
                                                            <div className="text-[10px] text-slate-400 font-medium">{test.category} • {test.department}</div>
                                                        </div>
                                                        <div className="text-xs text-slate-500 font-bold">₹{test.price}</div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="px-4 py-3 text-xs text-slate-500 italic">No matching tests found. Click Add to order custom test.</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-1.5 mt-2.5">
                                    {labTests.map((t, idx) => (
                                        <Badge key={idx} className="bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center gap-1.5 pr-2 py-0.5">
                                            {t}
                                            <Trash2 onClick={() => removeLabTest(idx)} className="w-3 h-3 cursor-pointer text-amber-400 hover:text-red-500" />
                                        </Badge>
                                    ))}
                                    {labTests.length === 0 && (
                                        <span className="text-xs text-slate-450 italic">No lab tests ordered.</span>
                                    )}
                                </div>
                            </div>

                            {/* Follow up scheduling */}
                            <div className="border-t border-slate-150 dark:border-slate-800 pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="md:col-span-1">
                                    <label className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-blue-500" /> Follow-up Date</label>
                                    <input 
                                        type="date"
                                        value={followUpDate}
                                        onChange={(e) => setFollowUpDate(e.target.value)}
                                        className="w-full mt-1.5 px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs text-slate-800 dark:text-white focus:outline-none"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Follow-up Purpose</label>
                                    <input 
                                        type="text"
                                        placeholder="e.g. Review CBC report & recovery progress"
                                        value={followUpPurpose}
                                        onChange={(e) => setFollowUpPurpose(e.target.value)}
                                        className="w-full mt-1.5 px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs text-slate-800 dark:text-white focus:outline-none"
                                    />
                                </div>
                            </div>

                            {/* Specialist Referral Builder */}
                            <div className="border-t border-slate-150 dark:border-slate-800 pt-4 space-y-3">
                                <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Referred specialist details</label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div>
                                        <input 
                                            type="text" 
                                            placeholder="Specialist Name (Dr. Roy)"
                                            value={referralSpecialist}
                                            onChange={(e) => setReferralSpecialist(e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs text-slate-800 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <input 
                                            type="text" 
                                            placeholder="Department (Cardiology)"
                                            value={referralDept}
                                            onChange={(e) => setReferralDept(e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs text-slate-800 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <input 
                                            type="text" 
                                            placeholder="Hospital Name (Arogya HQ)"
                                            value={referralHospital}
                                            onChange={(e) => setReferralHospital(e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs text-slate-800 dark:text-white"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <input 
                                        type="text" 
                                        placeholder="Referral letter reason (e.g. Suspected murmur, require specialist echo checkup)"
                                        value={referralLetter}
                                        onChange={(e) => setReferralLetter(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs text-slate-800 dark:text-white focus:outline-none"
                                    />
                                </div>
                            </div>

                            {/* Doctor Instruction */}
                            <div className="border-t border-slate-150 dark:border-slate-800 pt-4 space-y-3">
                                <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Diet & Recovery Advice</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] text-slate-400 font-bold uppercase">Diet Advice</label>
                                        <input 
                                            type="text" 
                                            placeholder="Avoid spicy/cold items, hot fluids advised"
                                            value={dietAdvice}
                                            onChange={(e) => setDietAdvice(e.target.value)}
                                            className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs text-slate-800 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-slate-400 font-bold uppercase">Exercise Advice</label>
                                        <input 
                                            type="text" 
                                            placeholder="Bed rest for 2 days, avoid strenuous task"
                                            value={exercisePlan}
                                            onChange={(e) => setExercisePlan(e.target.value)}
                                            className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs text-slate-800 dark:text-white"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] text-slate-400 font-bold uppercase">Recovery / Prevention Plan</label>
                                    <input 
                                        type="text" 
                                        placeholder="Keep hydration above 3L daily, isolate if sore throat develops further"
                                        value={recoveryInstructions}
                                        onChange={(e) => setRecoveryInstructions(e.target.value)}
                                        className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs text-slate-800 dark:text-white"
                                    />
                                </div>
                            </div>
                        </div>
                    </GlassCard>
                </div>

                {/* PANEL 3: CLINICAL AI DECISION ASSISTANT (Right Column - Span 1) */}
                <div className="xl:col-span-1 space-y-6">
                    {/* Gemini suggestions panel */}
                    <GlassCard className="p-5 border border-purple-250 dark:border-purple-900 bg-slate-950/20 backdrop-blur-xl relative">
                        <div className="absolute top-2 right-2 text-purple-400/30 animate-pulse">
                            <Sparkles className="w-8 h-8" />
                        </div>
                        <h3 className="font-extrabold text-xs uppercase tracking-wider text-purple-400 mb-3.5 flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-purple-400" /> Gemini EMR Copilot
                        </h3>

                        {aiSuggestions ? (
                            <div className="space-y-4 text-xs">
                                {/* Summary */}
                                <div className="p-3 bg-purple-900/10 border border-purple-500/10 rounded-2xl space-y-1">
                                    <span className="font-bold text-[10px] text-purple-400 uppercase tracking-wider block">Clinical Summary</span>
                                    <p className="text-slate-250 leading-relaxed font-medium">
                                        {aiSuggestions.summary}
                                    </p>
                                </div>

                                {/* Differential Diagnoses */}
                                <div>
                                    <span className="font-bold text-[10px] text-purple-400 uppercase tracking-wider block mb-1">Differential Diagnoses</span>
                                    <div className="space-y-1">
                                        {aiSuggestions.differential_diagnoses?.map((diag: string, i: number) => (
                                            <div key={i} className="flex items-center gap-2 text-slate-200 font-semibold p-1.5 bg-slate-900/40 rounded-lg">
                                                <Badge className="bg-indigo-500 text-white p-0.5 h-4 w-4 rounded-full flex items-center justify-center font-bold text-[9px]">{i+1}</Badge>
                                                <span>{diag}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Warnings & High-risk flags */}
                                <div>
                                    <span className="font-bold text-[10px] text-purple-400 uppercase tracking-wider block mb-1">High-Risk Alerts / Warnings</span>
                                    <div className="space-y-1">
                                        {aiSuggestions.warnings?.map((warn: string, i: number) => (
                                            <div key={i} className="p-2 bg-red-950/20 border border-red-500/20 text-red-400 rounded-xl font-medium flex gap-2">
                                                <AlertOctagon className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                                                <span>{warn}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Investigations */}
                                <div>
                                    <span className="font-bold text-[10px] text-purple-400 uppercase tracking-wider block mb-1">Suggested Investigations</span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {aiSuggestions.suggested_investigations?.map((inv: string, i: number) => (
                                            <Badge key={i} 
                                                onClick={() => {
                                                    if (!labTests.includes(inv)) {
                                                        setLabTests([...labTests, inv]);
                                                        toast(`Added ${inv} to Lab Orders`, "success");
                                                    }
                                                }}
                                                className="bg-purple-500/10 text-purple-300 border border-purple-500/20 py-0.5 px-2 cursor-pointer hover:bg-purple-500/20 flex items-center gap-1"
                                            >
                                                {inv} <ArrowUpRight className="w-3 h-3 text-purple-400" />
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                {/* Follow Up guidance */}
                                <div>
                                    <span className="font-bold text-[10px] text-purple-400 uppercase tracking-wider block mb-1">Follow-up Guidance</span>
                                    <p className="text-slate-300 bg-slate-900/20 p-2 rounded-xl border border-slate-800">
                                        {aiSuggestions.suggested_follow_up}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-6 text-center text-slate-400 gap-2">
                                <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                                <p className="text-xs">Gathering clinical evidence for Gemini...</p>
                            </div>
                        )}
                    </GlassCard>

                    {/* Dynamic EMR Chatbot Console */}
                    <GlassCard className="p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-[400px]">
                        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                            <MessageSquare className="w-4 h-4 text-blue-500" /> Interactive EMR Consult Chat
                        </h3>

                        {/* Message Feed */}
                        <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs mb-3 scrollbar-thin">
                            {chatMessages.map((msg, i) => (
                                <div key={i} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                                    <span className="text-[9px] text-slate-400 font-semibold mb-0.5 uppercase">
                                        {msg.sender === 'user' ? 'You' : 'Gemini Assistant'}
                                    </span>
                                    <div className={`p-2.5 rounded-2xl max-w-[90%] leading-relaxed ${
                                        msg.sender === 'user' 
                                            ? 'bg-blue-600 text-white rounded-tr-none' 
                                            : 'bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none'
                                    }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            {chatLoading && (
                                <div className="flex items-center gap-1.5 text-slate-400 p-1">
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-500" />
                                    <span>Gemini is thinking...</span>
                                </div>
                            )}
                        </div>

                        {/* Input bar */}
                        <div className="flex gap-2">
                            <input 
                                type="text"
                                placeholder="Ask clinical queries..."
                                value={chatQuery}
                                onChange={(e) => setChatQuery(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleSendChatQuery(); }}
                                className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs text-slate-800 dark:text-white focus:outline-none"
                            />
                            <Button 
                                onClick={handleSendChatQuery}
                                disabled={chatLoading || !chatQuery.trim()}
                                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-3 py-2"
                            >
                                <Send className="w-4 h-4" />
                            </Button>
                        </div>
                    </GlassCard>
                </div>

            </div>
        </DashboardLayout>
    );
}

// Active: 2026-07-04

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
