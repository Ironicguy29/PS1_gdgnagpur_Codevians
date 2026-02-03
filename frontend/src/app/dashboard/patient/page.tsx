'use client';
import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";

export default function PatientDashboard() {
    const [user, setUser] = useState<any>(null);
    const [appointments, setAppointments] = useState([]);
    const [doctors, setDoctors] = useState([]);
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
            // Mock fetching appointments
            // const apps = await api.get('/appointments/me'); 
            // setAppointments(apps.data);
        } catch (e) { }
    };

    const handleBook = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (!user) return;
            await api.post('/appointments/book', { ...bookingData, patient_id: user._id });
            alert('Appointment booked!');
            fetchData();
        } catch (e: any) {
            alert('Booking failed');
        }
    };

    return (
        <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Welcome, {user?.name}</h1>
                <Button variant="outline" onClick={() => { localStorage.clear(); window.location.href = '/'; }}>Logout</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card>
                    <CardHeader><CardTitle>Book Appointment</CardTitle></CardHeader>
                    <CardContent>
                        <form onSubmit={handleBook} className="space-y-4">
                            <div>
                                <Label>Select Doctor</Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                                    onChange={(e) => setBookingData({ ...bookingData, doctor_id: e.target.value })}
                                >
                                    <option value="">Select a doctor</option>
                                    {doctors.map((d: any) => (
                                        <option key={d._id} value={d._id}>{d.name} ({d.doctor_details?.specialization || 'General'})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <Label>Date</Label>
                                <Input type="date" onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })} />
                            </div>
                            <Button type="submit" className="w-full">Book Now</Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Live Queue Status</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-center py-8">
                            <p className="text-4xl font-bold text-green-600">Token #12</p>
                            <p className="text-slate-500">Your Token: <span className="font-bold">#18</span></p>
                            <p className="text-sm mt-2 text-blue-600">Predicted Wait: 15 mins</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
