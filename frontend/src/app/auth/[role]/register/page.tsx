"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
    Loader2, ArrowRight, ArrowLeft, Check, 
    Smartphone, User, Activity, Shield, MapPin 
} from "lucide-react";
import api, { setAuthToken } from "@/lib/api";
import { useToast } from "@/components/providers/ToastProvider";

export default function RegisterPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const role = params.role as "patient" | "doctor" | "admin" | "lab";

    // Standard Form Data (for Doctors, Admins & Lab Techs)
    const [formData, setFormData] = useState({ 
        name: '', 
        phone: '', 
        identifier: '', 
        password: '', 
        secret_code: '' 
    });

    // Patient Rich Form Data
    const [patientData, setPatientData] = useState({
        name: '',
        phone: '',
        email: '',
        dob: '',
        age: 0,
        gender: '',
        blood_group: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        height: '',
        weight: '',
        allergies: '',
        existing_diseases: '',
        current_medications: '',
        disability: '',
        emergency_name: '',
        emergency_relationship: '',
        emergency_phone: '',
        abha_id: '',
        aadhaar_number: '',
        password: '',
        confirmPassword: ''
    });

    // Patient Registration Wizard Steps
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [otpVerified, setOtpVerified] = useState(false);
    const [sendingOtp, setSendingOtp] = useState(false);
    const [verifyingOtp, setVerifyingOtp] = useState(false);

    // Live Age Calculation
    const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setPatientData(prev => {
            const updated = { ...prev, dob: val };
            if (val) {
                const today = new Date();
                const birthDate = new Date(val);
                let age = today.getFullYear() - birthDate.getFullYear();
                const m = today.getMonth() - birthDate.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                    age--;
                }
                updated.age = isNaN(age) ? 0 : Math.max(0, age);
            } else {
                updated.age = 0;
            }
            return updated;
        });
    };

    // OTP Flow
    const handleSendOtp = async () => {
        if (!patientData.phone) {
            toast('Please enter a phone number first', 'error');
            return;
        }
        setSendingOtp(true);
        try {
            const { data } = await api.post('/auth/send-otp', { phone: patientData.phone });
            setOtpSent(true);
            toast(`Mock OTP sent: ${data.otp} (For demo/pitching)`, 'success');
            setOtpCode(data.otp); // prefill or guide
        } catch (err: any) {
            toast(err.response?.data?.message || 'Failed to send OTP', 'error');
        } finally {
            setSendingOtp(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otpCode) {
            toast('Please enter the OTP code', 'error');
            return;
        }
        setVerifyingOtp(true);
        try {
            const { data } = await api.post('/auth/verify-otp', { 
                phone: patientData.phone, 
                otp: otpCode 
            });
            if (data.verified) {
                setOtpVerified(true);
                toast('Phone verified successfully!', 'success');
            }
        } catch (err: any) {
            toast(err.response?.data?.message || 'Invalid OTP code', 'error');
        } finally {
            setVerifyingOtp(false);
        }
    };

    // Register Handlers
    const handleRegisterStaff = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                role,
                name: formData.name,
                phone: formData.phone,
                email: formData.identifier,
                password: formData.password,
                secret_code: formData.secret_code
            };

            const { data } = await api.post('/auth/register', payload);

            if (data.token) {
                setAuthToken(data.token);
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                toast(`Welcome to ArogyaMitra, ${formData.name}`, 'success');
                router.push(`/dashboard/${role}`);
            }
        } catch (err: any) {
            toast(err.response?.data?.message || 'Registration failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterPatient = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Final Validation Checks
        if (patientData.password !== patientData.confirmPassword) {
            toast('Passwords do not match', 'error');
            return;
        }
        if (!otpVerified) {
            toast('Please verify your phone number via OTP first', 'error');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                role: 'patient',
                name: patientData.name,
                phone: patientData.phone,
                email: patientData.email || undefined,
                dob: patientData.dob,
                gender: patientData.gender,
                blood_group: patientData.blood_group,
                address: patientData.address,
                city: patientData.city,
                state: patientData.state,
                pincode: patientData.pincode,
                height: patientData.height ? Number(patientData.height) : undefined,
                weight: patientData.weight ? Number(patientData.weight) : undefined,
                allergies: patientData.allergies || undefined,
                existing_diseases: patientData.existing_diseases || undefined,
                current_medications: patientData.current_medications || undefined,
                disability: patientData.disability || undefined,
                emergency_name: patientData.emergency_name,
                emergency_relationship: patientData.emergency_relationship,
                emergency_phone: patientData.emergency_phone,
                abha_id: patientData.abha_id || undefined,
                aadhaar_number: patientData.aadhaar_number || undefined,
                password: patientData.password
            };

            const { data } = await api.post('/auth/register', payload);

            if (data.token) {
                setAuthToken(data.token);
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                toast(`Welcome, ${patientData.name}! Registration complete.`, 'success');
                router.push('/dashboard/patient');
            }
        } catch (err: any) {
            toast(err.response?.data?.message || 'Registration failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Validation for wizard steps
    const validateStep = (currentStep: number) => {
        if (currentStep === 1) {
            if (!patientData.name || !patientData.phone || !patientData.dob || !patientData.gender || !patientData.blood_group) {
                toast('Please fill all required personal details', 'error');
                return false;
            }
        } else if (currentStep === 2) {
            if (!patientData.address || !patientData.city || !patientData.state || !patientData.pincode) {
                toast('Please fill all address fields', 'error');
                return false;
            }
        } else if (currentStep === 3) {
            if (!patientData.height || !patientData.weight) {
                toast('Please specify height and weight', 'error');
                return false;
            }
        } else if (currentStep === 4) {
            if (!patientData.emergency_name || !patientData.emergency_relationship || !patientData.emergency_phone) {
                toast('Please fill all emergency contact fields', 'error');
                return false;
            }
        }
        return true;
    };

    const nextStep = () => {
        if (validateStep(step)) {
            setStep(prev => prev + 1);
        }
    };

    const prevStep = () => {
        setStep(prev => prev - 1);
    };

    // --- RENDER PATIENT WIZARD ---
    if (role === 'patient') {
        return (
            <div className="space-y-6 w-full max-w-xl mx-auto text-slate-850 dark:text-slate-100">
                {/* Progress Indicators */}
                <div className="flex items-center justify-between px-2 mb-4">
                    {[1, 2, 3, 4, 5].map((num) => (
                        <div key={num} className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border transition-all ${
                                step === num 
                                    ? 'bg-emerald-600 border-emerald-500 text-white scale-110 shadow-lg shadow-emerald-900/30' 
                                    : step > num 
                                        ? 'bg-emerald-100 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300' 
                                        : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500'
                            }`}>
                                {step > num ? <Check className="w-4 h-4" /> : num}
                            </div>
                            {num < 5 && (
                                <div className={`h-[2px] w-8 sm:w-12 mx-1 rounded ${
                                    step > num ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'
                                }`} />
                            )}
                        </div>
                    ))}
                </div>

                <div className="p-1 text-xs text-slate-400 text-center uppercase tracking-widest font-bold">
                    {step === 1 && "Step 1: Personal Details"}
                    {step === 2 && "Step 2: Address Information"}
                    {step === 3 && "Step 3: Medical Vitals"}
                    {step === 4 && "Step 4: Emergency & Govt IDs"}
                    {step === 5 && "Step 5: Account Security"}
                </div>

                <form onSubmit={handleRegisterPatient} className="space-y-4">
                    {/* STEP 1: Personal Details */}
                    {step === 1 && (
                        <div className="space-y-4 animate-in fade-in-50 duration-300">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="p-name">Full Name *</Label>
                                    <Input
                                        id="p-name"
                                        placeholder="Ramesh Patil"
                                        value={patientData.name}
                                        onChange={(e) => setPatientData({ ...patientData, name: e.target.value })}
                                        required
                                        className="h-12 bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="p-phone">Mobile Number *</Label>
                                    <Input
                                        id="p-phone"
                                        placeholder="+919876543210"
                                        value={patientData.phone}
                                        onChange={(e) => setPatientData({ ...patientData, phone: e.target.value })}
                                        required
                                        className="h-12 bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="p-email">Email (Optional)</Label>
                                <Input
                                    id="p-email"
                                    placeholder="ramesh@gmail.com"
                                    value={patientData.email}
                                    onChange={(e) => setPatientData({ ...patientData, email: e.target.value })}
                                    className="h-12 bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="p-dob">Date of Birth *</Label>
                                    <Input
                                        id="p-dob"
                                        type="date"
                                        value={patientData.dob}
                                        onChange={handleDobChange}
                                        required
                                        className="h-12 bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="p-age">Age (Calculated)</Label>
                                    <Input
                                        id="p-age"
                                        type="number"
                                        value={patientData.age || ''}
                                        disabled
                                        className="h-12 bg-slate-100 dark:bg-slate-900 border-slate-250 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-400"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="p-gender">Gender *</Label>
                                    <select
                                        id="p-gender"
                                        value={patientData.gender}
                                        onChange={(e) => setPatientData({ ...patientData, gender: e.target.value })}
                                        required
                                        className="h-12 w-full px-3 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="p-blood">Blood Group *</Label>
                                <select
                                    id="p-blood"
                                    value={patientData.blood_group}
                                    onChange={(e) => setPatientData({ ...patientData, blood_group: e.target.value })}
                                    required
                                    className="h-12 w-full px-3 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="">Select Blood Group</option>
                                    <option value="A+">A+</option>
                                    <option value="A-">A-</option>
                                    <option value="B+">B+</option>
                                    <option value="B-">B-</option>
                                    <option value="O+">O+</option>
                                    <option value="O-">O-</option>
                                    <option value="AB+">AB+</option>
                                    <option value="AB-">AB-</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: Address Information */}
                    {step === 2 && (
                        <div className="space-y-4 animate-in fade-in-50 duration-300">
                            <div className="space-y-2">
                                <Label htmlFor="p-address">Residential Address *</Label>
                                <Input
                                    id="p-address"
                                    placeholder="Plot 12, Civil Lines"
                                    value={patientData.address}
                                    onChange={(e) => setPatientData({ ...patientData, address: e.target.value })}
                                    required
                                    className="h-12 bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="p-city">City *</Label>
                                    <Input
                                        id="p-city"
                                        placeholder="Nagpur"
                                        value={patientData.city}
                                        onChange={(e) => setPatientData({ ...patientData, city: e.target.value })}
                                        required
                                        className="h-12 bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="p-state">State *</Label>
                                    <Input
                                        id="p-state"
                                        placeholder="Maharashtra"
                                        value={patientData.state}
                                        onChange={(e) => setPatientData({ ...patientData, state: e.target.value })}
                                        required
                                        className="h-12 bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="p-pincode">Pincode *</Label>
                                    <Input
                                        id="p-pincode"
                                        placeholder="440001"
                                        value={patientData.pincode}
                                        onChange={(e) => setPatientData({ ...patientData, pincode: e.target.value })}
                                        required
                                        className="h-12 bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: Medical Vitals */}
                    {step === 3 && (
                        <div className="space-y-4 animate-in fade-in-50 duration-300">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="p-height">Height (cm) *</Label>
                                    <Input
                                        id="p-height"
                                        type="number"
                                        placeholder="175"
                                        value={patientData.height}
                                        onChange={(e) => setPatientData({ ...patientData, height: e.target.value })}
                                        required
                                        className="h-12 bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="p-weight">Weight (kg) *</Label>
                                    <Input
                                        id="p-weight"
                                        type="number"
                                        placeholder="70"
                                        value={patientData.weight}
                                        onChange={(e) => setPatientData({ ...patientData, weight: e.target.value })}
                                        required
                                        className="h-12 bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="p-allergies">Allergies (Comma separated, optional)</Label>
                                <Input
                                    id="p-allergies"
                                    placeholder="Dust, Pollen, Peanuts"
                                    value={patientData.allergies}
                                    onChange={(e) => setPatientData({ ...patientData, allergies: e.target.value })}
                                    className="h-12 bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="p-diseases">Existing Diseases (Comma separated, optional)</Label>
                                <Input
                                    id="p-diseases"
                                    placeholder="Hypertension, Diabetes"
                                    value={patientData.existing_diseases}
                                    onChange={(e) => setPatientData({ ...patientData, existing_diseases: e.target.value })}
                                    className="h-12 bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="p-meds">Current Medications (Comma separated, optional)</Label>
                                <Input
                                    id="p-meds"
                                    placeholder="Amlodipine 5mg, Metformin 500mg"
                                    value={patientData.current_medications}
                                    onChange={(e) => setPatientData({ ...patientData, current_medications: e.target.value })}
                                    className="h-12 bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="p-disability">Disability Details (Optional)</Label>
                                <Input
                                    id="p-disability"
                                    placeholder="None or Visual impairment details"
                                    value={patientData.disability}
                                    onChange={(e) => setPatientData({ ...patientData, disability: e.target.value })}
                                    className="h-12 bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    )}

                    {/* STEP 4: Emergency & Govt IDs */}
                    {step === 4 && (
                        <div className="space-y-4 animate-in fade-in-50 duration-300">
                            <div className="border-b border-slate-200 dark:border-slate-800 pb-2 mb-2">
                                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Government Identifiers</h4>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="p-abha">ABHA ID (Optional)</Label>
                                    <Input
                                        id="p-abha"
                                        placeholder="ramesh@abha"
                                        value={patientData.abha_id}
                                        onChange={(e) => setPatientData({ ...patientData, abha_id: e.target.value })}
                                        className="h-12 bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="p-aadhaar">Aadhaar Number (Optional)</Label>
                                    <Input
                                        id="p-aadhaar"
                                        placeholder="123456789012"
                                        value={patientData.aadhaar_number}
                                        onChange={(e) => setPatientData({ ...patientData, aadhaar_number: e.target.value })}
                                        className="h-12 bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="border-b border-slate-200 dark:border-slate-800 pb-2 pt-2 mb-2">
                                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Emergency Contact Details</h4>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="p-e-name">Emergency Contact Name *</Label>
                                <Input
                                    id="p-e-name"
                                    placeholder="Sujata Patil"
                                    value={patientData.emergency_name}
                                    onChange={(e) => setPatientData({ ...patientData, emergency_name: e.target.value })}
                                    required
                                    className="h-12 bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="p-e-rel">Relationship *</Label>
                                    <Input
                                        id="p-e-rel"
                                        placeholder="Spouse"
                                        value={patientData.emergency_relationship}
                                        onChange={(e) => setPatientData({ ...patientData, emergency_relationship: e.target.value })}
                                        required
                                        className="h-12 bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="p-e-phone">Emergency Phone Number *</Label>
                                    <Input
                                        id="p-e-phone"
                                        placeholder="+919876543219"
                                        value={patientData.emergency_phone}
                                        onChange={(e) => setPatientData({ ...patientData, emergency_phone: e.target.value })}
                                        required
                                        className="h-12 bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 5: Account Security & OTP */}
                    {step === 5 && (
                        <div className="space-y-4 animate-in fade-in-50 duration-300">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="p-pass">Password *</Label>
                                    <Input
                                        id="p-pass"
                                        type="password"
                                        value={patientData.password}
                                        onChange={(e) => setPatientData({ ...patientData, password: e.target.value })}
                                        required
                                        className="h-12 bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="p-conf">Confirm Password *</Label>
                                    <Input
                                        id="p-conf"
                                        type="password"
                                        value={patientData.confirmPassword}
                                        onChange={(e) => setPatientData({ ...patientData, confirmPassword: e.target.value })}
                                        required
                                        className="h-12 bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="border-t border-slate-200 dark:border-slate-800 pt-4 mt-4 space-y-4">
                                <Label className="text-slate-800 dark:text-slate-300 flex items-center gap-2">
                                    <Smartphone className="w-4 h-4 text-emerald-500" /> Phone OTP Verification *
                                </Label>

                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        onClick={handleSendOtp}
                                        disabled={sendingOtp || otpVerified}
                                        className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-xl h-12 px-4 whitespace-nowrap"
                                    >
                                        {sendingOtp ? <Loader2 className="w-4 h-4 animate-spin" /> : otpSent ? "Resend OTP" : "Send OTP"}
                                    </Button>
                                    <Input
                                        placeholder="Enter 6-digit OTP"
                                        value={otpCode}
                                        onChange={(e) => setOtpCode(e.target.value)}
                                        disabled={!otpSent || otpVerified}
                                        className="h-12 bg-slate-950 border-slate-800 rounded-xl flex-1 text-center font-bold tracking-widest text-lg"
                                    />
                                    {otpSent && !otpVerified && (
                                        <Button
                                            type="button"
                                            onClick={handleVerifyOtp}
                                            disabled={verifyingOtp}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-12 px-4"
                                        >
                                            {verifyingOtp ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify"}
                                        </Button>
                                    )}
                                </div>

                                {otpVerified && (
                                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-500 font-semibold bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30 rounded-xl p-3 text-sm">
                                        <Check className="w-4 h-4" /> Phone number successfully verified!
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex gap-4 pt-4 border-t border-slate-200 dark:border-slate-800/40">
                        {step > 1 && (
                            <Button
                                type="button"
                                onClick={prevStep}
                                className="bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 h-12 px-4 rounded-xl flex items-center justify-center"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" /> Back
                            </Button>
                        )}
                        {step < 5 ? (
                            <Button
                                type="button"
                                onClick={nextStep}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white h-12 px-6 rounded-xl flex items-center justify-center flex-1 font-semibold"
                            >
                                Continue <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        ) : (
                            <Button
                                type="submit"
                                disabled={loading || !otpVerified}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white h-12 px-6 rounded-xl flex items-center justify-center flex-1 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "Complete Registration"}
                            </Button>
                        )}
                    </div>
                </form>

                <div className="text-center text-sm pt-2">
                    <span className="text-slate-600 dark:text-slate-400">Already have an account? </span>
                    <Link href={`/auth/${role}/login`} className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
                        Login
                    </Link>
                </div>
            </div>
        );
    }

    // --- RENDER DOCTOR/ADMIN STAFF FORM ---
    return (
        <form onSubmit={handleRegisterStaff} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                        id="name"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        className="h-12 bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                        id="phone"
                        placeholder="+91..."
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required
                        className="h-12 bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="identifier">Email</Label>
                <Input
                    id="identifier"
                    placeholder="staff@hospital.gov"
                    value={formData.identifier}
                    onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                    required
                    className="h-12 bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    className="h-12 bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="secret_code" className="text-red-500 font-semibold">Hospital Secret Code</Label>
                <Input
                    id="secret_code"
                    type="password"
                    placeholder="Required for Staff Access"
                    value={formData.secret_code}
                    onChange={(e) => setFormData({ ...formData, secret_code: e.target.value })}
                    required
                    className="h-12 rounded-xl bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40 text-red-900 dark:text-red-100 focus:ring-red-500"
                />
            </div>

            <Button 
                type="submit" 
                className="w-full h-12 text-base font-semibold shadow-lg rounded-xl bg-blue-600 hover:bg-blue-700" 
                disabled={loading}
            >
                {loading ? <Loader2 className="animate-spin mr-2" /> : "Create Account"}
            </Button>

            <div className="mt-4 text-center text-sm">
                <span className="text-slate-600 dark:text-slate-400">Already a member? </span>
                <Link href={`/auth/${role}/login`} className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                    Login
                </Link>
            </div>
        </form>
    );
}
