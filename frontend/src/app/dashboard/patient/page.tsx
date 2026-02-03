'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from "@/components/layout/DashboardLayout";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Calendar, Clock, User, ArrowRight, Loader2, Sparkles
} from "lucide-react";
import api from "@/lib/api";

export default function PatientDashboard() {
    const [user, setUser] = useState<any>(null);
    const [doctors, setDoctors] = useState([]);
    const [queue, setQueue] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [bookingData, setBookingData] = useState({ doctor_id: '', date: '', slot_time: '10:00' });

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) setUser(JSON.parse(userData));
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const docs = await api.get('/doctors');
            setDoctors(docs.data);
        } catch (e) { }
    };

    const handleBook = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (!user) return;
            await api.post('/appointments/book', { ...bookingData, patient_id: user._id });
            alert('Appointment request sent!');
            // Mock confirmation for demo
        } catch (e: any) {
            alert('Booking failed');
        } finally {
            setLoading(false);
        }
    };

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
                <Button className="bg-gradient-to-r from-blue-600 to-teal-500 text-white shadow-lg">
                    <Sparkles className="w-4 h-4 mr-2" /> AI Health Assistant
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <GlassCard className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-white/20 rounded-lg"><Clock className="w-6 h-6" /></div>
                        <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded">Live</span>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm opacity-90">Current Token</p>
                        <p className="text-4xl font-bold">#12</p>
                        <p className="text-xs opacity-75">Your turn in approx 15 mins</p>
                    </div>
                </GlassCard>

                <GlassCard className="bg-white dark:bg-slate-900">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg dark:bg-emerald-900/30"><Calendar className="w-6 h-6" /></div>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm text-slate-500">Next Appointment</p>
                        <p className="text-2xl font-bold text-slate-800 dark:text-white">Oct 24, 10:00 AM</p>
                        <p className="text-xs text-slate-400">Dr. Sharma (Cardiology)</p>
                    </div>
                </GlassCard>

                <GlassCard className="bg-white dark:bg-slate-900">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-purple-100 text-purple-600 rounded-lg dark:bg-purple-900/30"><User className="w-6 h-6" /></div>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm text-slate-500">Family Members</p>
                        <p className="text-2xl font-bold text-slate-800 dark:text-white">3 Linked</p>
                        <p className="text-xs text-slate-400">View Profiles</p>
                    </div>
                </GlassCard>
            </div>

            {/* Main Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
                {/* Booking Form */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Book New Appointment</h3>
                        <form onSubmit={handleBook} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>Specialization / Doctor</Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                                    onChange={(e) => setBookingData({ ...bookingData, doctor_id: e.target.value })}
                                >
                                    <option value="">Select Specialist</option>
                                    {doctors.map((d: any) => (
                                        <option key={d._id} value={d._id}>{d.name} ({d.doctor_details?.specialization})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label>Preferred Date</Label>
                                <Input type="date" onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })} />
                            </div>
                            <div className="md:col-span-2">
                                <Button type="submit" className="w-full bg-slate-900 dark:bg-white dark:text-slate-900" disabled={loading}>
                                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Confirm Booking'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Recent Activity</h3>
                    <div className="space-y-4">
                        {[1, 2, 3].map((_, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                <div className="w-2 h-2 rounded-full bg-blue-500" />
                                <div>
                                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Prescription Updated</p>
                                    <p className="text-xs text-slate-500">2 hours ago</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
