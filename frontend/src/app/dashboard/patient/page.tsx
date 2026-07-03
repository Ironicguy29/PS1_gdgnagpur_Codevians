'use client';
import { useEffect, useState } from 'react';
import { useSocket } from "@/context/SocketContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { GlassCard } from "@/components/ui/GlassCard";
import { TokenStatusCard } from "@/components/dashboard/patient/TokenStatusCard";
import { DoctorInfoCard } from "@/components/dashboard/patient/DoctorInfoCard";
import { QueueProgressBar } from "@/components/dashboard/patient/QueueProgressBar";
import { AppointmentBookingCard } from "@/components/dashboard/patient/AppointmentBookingCard";
import { EmergencyAmbulanceWidget } from "@/components/dashboard/patient/EmergencyAmbulanceWidget";
import { AppointmentHistoryList } from "@/components/dashboard/patient/AppointmentHistoryList";
import { FamilyMemberCard } from "@/components/dashboard/patient/FamilyMemberCard";
import VoiceAssistantFloatingButton from "@/components/dashboard/patient/VoiceAssistantFloatingButton";
import { PatientOnboardingModal } from "@/components/PatientOnboardingModal";
import { QueueForecast } from "@/components/QueueForecast";
import { BarcodeCheckIn } from "@/components/BarcodeCheckIn";
import { InstantPrescription } from "@/components/InstantPrescription";
import { Button } from "@/components/ui/button";
import {
    User, Sparkles, Clock, MapPin, Building
} from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/components/providers/ToastProvider";

export default function PatientDashboard() {
    const [user, setUser] = useState<any>(null);
    const [doctors, setDoctors] = useState([]);
    const [queue, setQueue] = useState<any>({ current_token: 0, estimated_wait: 0 });
    const [userToken, setUserToken] = useState<string | number | null>(null);
    const [userTokenNum, setUserTokenNum] = useState<number | null>(null);
    const [activeDoctor, setActiveDoctor] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [onboardingSteps, setOnboardingSteps] = useState<any>({});
    const [activeTab, setActiveTab] = useState<'home' | 'forecast' | 'checkin' | 'prescription'>('home');

    const { socket } = useSocket();
    const { toast } = useToast();

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
            setOnboardingSteps(parsedUser.onboarding_steps || {});
            
            // Show onboarding if not completed
            const hasNotCompleted = !parsedUser.onboarding_completed;
            if (hasNotCompleted) {
                setShowOnboarding(true);
            }
            
            fetchData(parsedUser._id);
        }
    }, []);

    useEffect(() => {
        if (!socket || !user) return;

        const handleQueueUpdate = (data: any) => {
            console.log('[v0] Patient - Queue Update received:', data);
            // Always refetch to get latest queue status
            // This ensures patient sees their token and queue position
            fetchData(user._id);
        };

        // Listen for all queue-related updates
        socket.on('queue.token.update', handleQueueUpdate);
        socket.on('queue.update', handleQueueUpdate);

        return () => {
            socket.off('queue.token.update', handleQueueUpdate);
            socket.off('queue.update', handleQueueUpdate);
        };
    }, [socket, user]);

    const fetchData = async (patientId: string) => {
        try {
            // Fetch doctors
            const docs = await api.get('/doctors');
            setDoctors(docs.data);

            // Fetch patient's live token details
            const liveTokenRes = await api.get(`/queue/patient-live/${patientId}`);
            
            if (liveTokenRes.data && liveTokenRes.data.token) {
                const tokenData = liveTokenRes.data.token;
                const displayVal = tokenData.display_token || tokenData.token_number;
                setUserToken(displayVal);
                setUserTokenNum(tokenData.token_number);
                localStorage.setItem('activeToken', displayVal.toString());
                setActiveDoctor(tokenData.doctor_id);

                // Fetch queue status for this active doctor
                const qRes = await api.get(`/queue/live/${tokenData.doctor_id._id}`);
                if (qRes.data) {
                    setQueue({
                        current_token: qRes.data.current_token || 0,
                        current_display_token: qRes.data.current_display_token || null,
                        estimated_wait: tokenData.estimated_wait_minutes,
                        status: tokenData.status
                    });
                }
            } else {
                setUserToken(null);
                setUserTokenNum(null);
                localStorage.removeItem('activeToken');
                setActiveDoctor(null);
                setQueue({ current_token: 0, estimated_wait: 0 });
            }
        } catch (e) {
            console.error("Failed to fetch initial data", e);
        }
    };

    const handleBook = async (data: any) => {
        setLoading(true);
        try {
            if (!user) return;

            const res = await api.post('/appointments/book', { 
                doctor_id: data.doctor_id, 
                date: data.date, 
                slot_time: data.slot_time, 
                patient_id: user._id,
                consultation_type: 'Physical'
            });

            const newToken = res.data.token?.display_token || res.data.token_number;
            setUserToken(newToken);
            setUserTokenNum(res.data.token?.token_number || res.data.token_number);
            localStorage.setItem('activeToken', newToken.toString());
            toast(`Appointment Booked! Your Token: ${newToken}`, "success");
            
            // Refresh data immediately
            await fetchData(user._id);
        } catch (e: any) {
            toast('Booking failed: ' + (e.response?.data?.message || e.message), "error");
        } finally {
            setLoading(false);
        }
    };

    // Helper to map department name to floor and room layout details
    const getRoomAndFloor = (dept: string) => {
        switch (dept) {
            case 'Cardiology': return { room: '304', floor: '3rd Floor' };
            case 'Orthopedics': return { room: '102', floor: '1st Floor' };
            case 'Dermatology': return { room: '205', floor: '2nd Floor' };
            case 'General Medicine': return { room: '101', floor: '1st Floor' };
            default: return { room: '105', floor: '1st Floor' };
        }
    };

    const progressPercentage = userTokenNum && queue.current_token ? Math.min(100, Math.max(0, (queue.current_token / userTokenNum) * 100)) : 0;
    const roomDetails = activeDoctor ? getRoomAndFloor(activeDoctor.department) : null;

    const handleOnboardingComplete = async () => {
        try {
            // Mark onboarding as completed
            if (user) {
                await api.put(`/patients/${user._id}`, {
                    onboarding_completed: true
                });
                setShowOnboarding(false);
                toast('Onboarding completed! You are all set.', 'success');
            }
        } catch (err) {
            console.log('[v0] Error updating onboarding:', err);
        }
    };

    return (
        <DashboardLayout role="patient">
            {/* Onboarding Modal */}
            <PatientOnboardingModal
                isOpen={showOnboarding}
                onComplete={handleOnboardingComplete}
                onboardingSteps={onboardingSteps}
            />

            {/* Tab Navigation */}
            <div className="flex gap-2 mb-6 border-b border-slate-200 dark:border-slate-800">
                <button
                    onClick={() => setActiveTab('home')}
                    className={`px-4 py-2 font-semibold text-sm transition-colors ${
                        activeTab === 'home'
                            ? 'text-cyan-500 border-b-2 border-cyan-500'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300'
                    }`}
                >
                    Home
                </button>
                <button
                    onClick={() => setActiveTab('forecast')}
                    className={`px-4 py-2 font-semibold text-sm transition-colors ${
                        activeTab === 'forecast'
                            ? 'text-cyan-500 border-b-2 border-cyan-500'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300'
                    }`}
                >
                    Queue Forecast
                </button>
                <button
                    onClick={() => setActiveTab('checkin')}
                    className={`px-4 py-2 font-semibold text-sm transition-colors ${
                        activeTab === 'checkin'
                            ? 'text-cyan-500 border-b-2 border-cyan-500'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300'
                    }`}
                >
                    Digital Check-in
                </button>
                <button
                    onClick={() => setActiveTab('prescription')}
                    className={`px-4 py-2 font-semibold text-sm transition-colors ${
                        activeTab === 'prescription'
                            ? 'text-cyan-500 border-b-2 border-cyan-500'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300'
                    }`}
                >
                    Prescriptions
                </button>
            </div>

            {/* Home Tab */}
            {activeTab === 'home' && (
            <>
            {/* Welcome Section */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                        Good Morning, {user?.name?.split(' ')[0]} 👋
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">Here is your health overview for today.</p>
                </div>
                <Button className="bg-gradient-to-r from-blue-600 to-teal-500 text-white shadow-lg shadow-blue-200 dark:shadow-none hover:shadow-xl transition-all">
                    <Sparkles className="w-4 h-4 mr-2" /> AI Health Assistant
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    {userToken ? (
                        <>
                            <TokenStatusCard
                                tokenNumber={userToken}
                                patientsAhead={userTokenNum && queue.current_token ? Math.max(0, userTokenNum - queue.current_token) : 0}
                                estimatedWait={`${queue.estimated_wait || 0} mins`}
                                queueStatus={queue.status || "Waiting"}
                            />
                            <QueueProgressBar
                                nextToken={queue.current_display_token || queue.current_token}
                                yourToken={userToken}
                                progressPercentage={progressPercentage}
                            />
                        </>
                    ) : (
                        <div className="p-8 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center text-slate-500 min-h-[200px]">
                            <Clock className="w-8 h-8 mb-2 opacity-50" />
                            <p className="font-medium text-slate-800 dark:text-slate-200">No Active Token</p>
                            <p className="text-sm">Book an appointment to join the queue.</p>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    {activeDoctor ? (
                        <DoctorInfoCard
                            doctorName={activeDoctor.user_id?.name || "Dr. Assigned"}
                            specialization={activeDoctor.specialization}
                            roomNumber={roomDetails?.room || "101"}
                            floor={roomDetails?.floor || "1st Floor"}
                            department={activeDoctor.department}
                        />
                    ) : (
                        <div className="p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col justify-center text-slate-500 h-[190px]">
                            <Building className="w-8 h-8 text-blue-500 mb-2 opacity-60" />
                            <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">No Active Consultant</p>
                            <p className="text-xs text-slate-400 mt-1">Book an appointment below to view room and floor directions.</p>
                        </div>
                    )}

                    <GlassCard className="bg-white dark:bg-slate-900">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-purple-100 text-purple-600 rounded-lg dark:bg-purple-900/30"><User className="w-6 h-6" /></div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm text-slate-500">Linked Profile</p>
                            <p className="text-2xl font-bold text-slate-800 dark:text-white leading-tight">{user?.name || 'Guest'}</p>
                            <p className="text-xs text-slate-400 mt-1">Patient ID: <span className="font-semibold">{user?.patient_id || 'PAT-DEMO'}</span></p>
                        </div>
                    </GlassCard>
                </div>
            </div>

            {/* Main Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
                {/* Booking Form */}
                <div className="lg:col-span-2 space-y-6">
                    <EmergencyAmbulanceWidget />

                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                        <AppointmentBookingCard
                            doctors={doctors}
                            onBook={handleBook}
                            loading={loading}
                        />
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Recent Notifications</h3>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                            <div>
                                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">System Connected</p>
                                <p className="text-xs text-slate-500">Real-time updates active</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Health History & Family Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8 pb-10">
                <div className="lg:col-span-2 h-[400px]">
                    <AppointmentHistoryList />
                </div>
                <div className="h-[400px]">
                    <FamilyMemberCard />
                </div>
            </div>
            {/* Voice Assistant Floating Button */}
            <VoiceAssistantFloatingButton />
            </>
            )}

            {/* Queue Forecast Tab */}
            {activeTab === 'forecast' && (
            <div className="space-y-6 pb-10">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Smart Queue Routing</h2>
                    <p className="text-slate-600 dark:text-slate-400">AI-powered queue forecasting with real-time delay alerts</p>
                </div>
                <QueueForecast patientLocation={{ lat: 19.0760, lng: 72.8777 }} />
            </div>
            )}

            {/* Digital Check-in Tab */}
            {activeTab === 'checkin' && (
            <div className="space-y-6 pb-10">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Digital Check-in</h2>
                    <p className="text-slate-600 dark:text-slate-400">Scan the facility barcode to instantly register with the triage nurse</p>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
                    {user && <BarcodeCheckIn patientId={user._id} />}
                </div>
            </div>
            )}

            {/* Prescriptions Tab */}
            {activeTab === 'prescription' && (
            <div className="space-y-6 pb-10">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Instant Prescriptions</h2>
                    <p className="text-slate-600 dark:text-slate-400">View your prescriptions and pharmacy pickup status</p>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
                    {user && <InstantPrescription patientId={user._id} />}
                </div>
            </div>
            )}
        </DashboardLayout>
    );
}
