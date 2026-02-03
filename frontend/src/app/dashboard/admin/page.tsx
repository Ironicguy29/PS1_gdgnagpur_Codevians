'use client';
import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/api";

export default function AdminDashboard() {
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/admin/stats');
                setStats(res.data);
            } catch (e) { }
        };
        fetchStats();
    }, []);

    return (
        <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Hospital Admin Portal</h1>
                <Button variant="outline" onClick={() => { localStorage.clear(); window.location.href = '/'; }}>Logout</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Appointments</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{stats?.totalAppointments || 0}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Active Queues</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{stats?.activeQueues || 0}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Pending</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{stats?.pendingAppointments || 0}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Occupancy</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{stats?.occupancyRate || '0%'}</div></CardContent>
                </Card>
            </div>

            {/* Additional Management UI could go here */}
        </div>
    );
}
