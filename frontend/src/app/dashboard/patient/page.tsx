'use client';
import { useEffect, useState } from 'react';
import { useSocket } from "@/context/SocketContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { GlassCard } from "@/components/ui/GlassCard";
import { TokenStatusCard } from "@/components/dashboard/patient/TokenStatusCard";
import { DoctorInfoCard } from "@/components/dashboard/patient/DoctorInfoCard";
import { QueueProgressBar } from "@/components/dashboard/patient/QueueProgressBar";
import { AppointmentBookingCard } from "@/components/dashboard/patient/AppointmentBookingCard";
import { EmergencyQuickAction } from "@/components/dashboard/patient/EmergencyQuickAction";
import { Button } from "@/components/ui/button";
import {
    User, Sparkles, Clock
} from "lucide-react";
import api from "@/lib/api";

export default function PatientDashboard() {
    const [user, setUser] = useState<any>(null);
    const [doctors, setDoctors] = useState([]);
    const [queue, setQueue] = useState<any>({ current_token: 0, estimated_wait: 0 });
    const [userToken, setUserToken] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);

    const { socket } = useSocket();

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) setUser(JSON.parse(userData));

        // Check for active token in local storage or fetch from API (Mock check for now)
        const storedToken = localStorage.getItem('activeToken');
        if (storedToken) setUserToken(parseInt(storedToken));

        fetchData();
    }, []);

    useEffect(() => {
        if (!socket) return;

        socket.on('queue.token.update', (data: any) => {
            console.log('Queue Update:', data);
            setQueue((prev: any) => ({ ...prev, current_token: data.currentToken }));
        });

        return () => {
            socket.off('queue.token.update');
        };
    }, [socket]);

    const fetchData = async () => {
        try {
            const docs = await api.get('/doctors');
            setDoctors(docs.data);

            // Auto-fetch queue for the first doctor or user's assigned doctor
            if (docs.data.length > 0) {
                const firstDocId = docs.data[0]._id;
                const qRes = await api.get(`/queue/live/${firstDocId}`);
                if (qRes.data) {
                    setQueue(qRes.data);
                }
            }
        } catch (e) {
            console.error("Failed to fetch initial data", e);
        }
    };

    const handleBook = async (data: any) => {
        setLoading(true);
        try {
            if (!user) return;
            const res = await api.post('/appointments/book', { ...data, patient_id: user._id });
            const newToken = res.data.token_number;
            setUserToken(newToken);
            localStorage.setItem('activeToken', newToken.toString());
            // alert(`Appointment Booked! Your Token: ${newToken}`); // Optional: show success message or just update UI
        } catch (e: any) {
            alert('Booking failed: ' + (e.response?.data?.message || e.message));
        } finally {
            setLoading(false);
        }
    };

    // Calculate progress: if no token, 0. If token, how close is current_token to userToken?
    // Formula: (current / user) * 100. But wait, token starts at 1.
    // Progress starts at 0% when current is 0. Ends at 100% when current == userToken.
    const progressPercentage = userToken ? Math.min(100, Math.max(0, (queue.current_token / userToken) * 100)) : 0;

    return (
        <DashboardLayout role="patient">
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
                                patientsAhead={Math.max(0, userToken - queue.current_token)}
                                estimatedWait={`${queue.estimated_wait || 15} mins`}
                                queueStatus={queue.current_token >= userToken ? "Completed" : "In Progress"}
                            />
                            <QueueProgressBar
                                nextToken={queue.current_token}
                                yourToken={userToken}
                                progressPercentage={progressPercentage}
                            />
                        </>
                    ) : (
                        <div className="p-8 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center text-slate-500 min-h-[200px]">
                            <Clock className="w-8 h-8 mb-2 opacity-50" />
                            <p className="font-medium">No Active Token</p>
                            <p className="text-sm">Book an appointment to join the queue.</p>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <DoctorInfoCard
                        doctorName="Dr. Sharma"
                        specialization="Cardiology"
                        roomNumber="304"
                        floor="3rd Floor"
                        department="OPD Building A"
                    />

                    <GlassCard className="bg-white dark:bg-slate-900">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-purple-100 text-purple-600 rounded-lg dark:bg-purple-900/30"><User className="w-6 h-6" /></div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm text-slate-500">Linked Profile</p>
                            <p className="text-2xl font-bold text-slate-800 dark:text-white">{user?.name || 'Guest'}</p>
                            <p className="text-xs text-slate-400">Patient ID: {user?._id?.slice(-6)}</p>
                        </div>
                    </GlassCard>
                </div>
            </div>

            {/* Main Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
                {/* Booking Form */}
                <div className="lg:col-span-2 space-y-6">
                    <EmergencyQuickAction />

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
        </DashboardLayout>
    );
}
