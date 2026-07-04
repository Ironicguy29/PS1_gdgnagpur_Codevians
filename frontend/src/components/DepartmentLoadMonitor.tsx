'use client';
import { useEffect, useState } from 'react';
import { useSocket } from '@/context/SocketContext';
import { BarChart3, Users, Clock, TrendingUp } from 'lucide-react';
import api from '@/lib/api';

interface Department {
    name: string;
    total_staff: number;
    active_doctors: number;
    queue_count: number;
    avg_wait_time: number;
    occupancy_rate: number;
}

export function DepartmentLoadMonitor() {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [summary, setSummary] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { socket } = useSocket();

    useEffect(() => {
        fetchDepartmentLoad();
    }, []);

    const fetchDepartmentLoad = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/admin/department-load');
            if (data.success) {
                setDepartments(data.departments);
                setSummary(data.summary);
            }
        } catch (err) {
            console.error('[v0] Error fetching department load:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!socket) return;

        const handleLoadUpdate = (data: any) => {
            console.log('[v0] Department load update:', data);
            setDepartments(data.departments);
        };

        socket.on('hospital.load.update', handleLoadUpdate);
        return () => {
            socket.off('hospital.load.update', handleLoadUpdate);
        };
    }, [socket]);

    const getOccupancyColor = (rate: number) => {
        if (rate > 80) return 'bg-red-500';
        if (rate > 60) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    const getWaitTimeColor = (minutes: number) => {
        if (minutes > 45) return 'text-red-500';
        if (minutes > 20) return 'text-yellow-500';
        return 'text-green-500';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="animate-pulse text-slate-500">Loading department data...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">Total Departments</p>
                                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                                    {summary.total_departments}
                                </p>
                            </div>
                            <BarChart3 className="w-8 h-8 text-cyan-500" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">Active Doctors</p>
                                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                                    {summary.active_doctors}/{summary.total_staff}
                                </p>
                            </div>
                            <Users className="w-8 h-8 text-blue-500" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">Patients Waiting</p>
                                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                                    {summary.total_patients_waiting}
                                </p>
                            </div>
                            <Clock className="w-8 h-8 text-orange-500" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">Avg Occupancy</p>
                                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                                    {summary.avg_occupancy}%
                                </p>
                            </div>
                            <TrendingUp className="w-8 h-8 text-purple-500" />
                        </div>
                    </div>
                </div>
            )}

            {/* Departments Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-800">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-white">
                                    Department
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-white">
                                    Staff
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-white">
                                    Active
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-white">
                                    Waiting
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-white">
                                    Avg Wait
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-white">
                                    Occupancy
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {departments.map((dept) => (
                                <tr key={dept.name} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                                        {dept.name}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                                        {dept.total_staff}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100">
                                            {dept.active_doctors}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                                        {dept.queue_count}
                                    </td>
                                    <td className={`px-6 py-4 font-medium ${getWaitTimeColor(dept.avg_wait_time)}`}>
                                        {dept.avg_wait_time} min
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-24 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                                <div
                                                    className={`h-2 rounded-full ${getOccupancyColor(dept.occupancy_rate)}`}
                                                    style={{ width: `${Math.min(100, dept.occupancy_rate)}%` }}
                                                />
                                            </div>
                                            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                                {dept.occupancy_rate}%
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// Active: 2026-07-04

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
