'use client';
import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/api";

export default function DoctorDashboard() {
    const [queue, setQueue] = useState<any>(null);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            const u = JSON.parse(userData);
            setUser(u);
            fetchQueue(u._id);
        }
    }, []);

    const fetchQueue = async (id: string) => {
        try {
            const res = await api.get(`/queue/live/${id}`);
            setQueue(res.data);
        } catch (e) { }
    };

    const nextPatient = async () => {
        try {
            const res = await api.post('/queue/next', { doctorId: user._id });
            setQueue(res.data);
        } catch (e) { alert('Error updating queue'); }
    };

    return (
        <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Dr. {user?.name}'s Dashboard</h1>
                <Button variant="destructive" onClick={() => { localStorage.clear(); window.location.href = '/'; }}>Logout</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="col-span-2">
                    <CardHeader><CardTitle>Queue Controls</CardTitle></CardHeader>
                    <CardContent className="flex flex-col items-center justify-center space-y-6 py-12">
                        <div className="text-center">
                            <p className="text-slate-500 text-lg">Current Patient Token</p>
                            <p className="text-6xl font-bold text-blue-800">{queue?.current_token || 0}</p>
                        </div>
                        <Button size="lg" onClick={nextPatient} className="w-1/2 text-lg">Call Next Patient</Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Stats</CardTitle></CardHeader>
                    <CardContent>
                        <ul className="space-y-4">
                            <li className="flex justify-between">
                                <span>Waiting:</span>
                                <span className="font-bold">{queue?.total_waiting || 0}</span>
                            </li>
                            <li className="flex justify-between">
                                <span>Completed:</span>
                                <span className="font-bold">{queue?.current_token || 0}</span>
                            </li>
                            <li className="flex justify-between">
                                <span>Avg Time:</span>
                                <span className="font-bold">10 mins</span>
                            </li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
