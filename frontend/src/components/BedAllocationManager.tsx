'use client';
import { useEffect, useState } from 'react';
import { useSocket } from '@/context/SocketContext';
import { Home, Plus, Check } from 'lucide-react';
import api from '@/lib/api';

export function BedAllocationManager() {
    const [allocation, setAllocation] = useState<any>(null);
    const [occupancyRates, setOccupancyRates] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedBedType, setSelectedBedType] = useState<'icu' | 'ward' | 'general'>('icu');
    const { socket } = useSocket();

    useEffect(() => {
        fetchBedAllocation();
    }, []);

    const fetchBedAllocation = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/admin/beds');
            if (data.success) {
                setAllocation(data.allocation);
                setOccupancyRates(data.occupancy_rates);
            }
        } catch (err) {
            console.error('[v0] Error fetching bed allocation:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!socket) return;

        const handleBedUpdate = (data: any) => {
            console.log('[v0] Bed update received:', data);
            fetchBedAllocation();
        };

        socket.on('hospital.bed.update', handleBedUpdate);
        return () => {
            socket.off('hospital.bed.update', handleBedUpdate);
        };
    }, [socket]);

    const bedTypes: Array<'icu' | 'ward' | 'general'> = ['icu', 'ward', 'general'];

    const BedTypeCard = ({ type, label }: { type: 'icu' | 'ward' | 'general'; label: string }) => {
        const data = allocation?.[type];
        const occupancy = occupancyRates?.[type] || 0;
        const available = data?.total - data?.occupied;

        return (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 cursor-pointer hover:border-cyan-500 dark:hover:border-cyan-500 transition-colors"
                onClick={() => setSelectedBedType(type)}>
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{label}</p>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                            {data?.total || 0} Beds
                        </h3>
                    </div>
                    <Home className="w-6 h-6 text-cyan-500" />
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">Occupied</span>
                        <span className="font-semibold text-slate-900 dark:text-white">{data?.occupied || 0}</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <div
                            className="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
                            style={{ width: `${Math.min(100, occupancy)}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-xs">
                        <span className="text-slate-600 dark:text-slate-400">Available: {available}</span>
                        <span className="font-semibold text-slate-600 dark:text-slate-400">{occupancy}%</span>
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="animate-pulse text-slate-500">Loading bed allocation...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Bed Type Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <BedTypeCard type="icu" label="ICU Beds" />
                <BedTypeCard type="ward" label="Ward Beds" />
                <BedTypeCard type="general" label="General Beds" />
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Total Beds in Hospital</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">
                        {Object.values(allocation || {}).reduce((sum: number, type: any) => sum + (type?.total || 0), 0)}
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Available Beds</p>
                    <p className="text-3xl font-bold text-green-500">
                        {Object.values(allocation || {}).reduce((sum: number, type: any) => sum + ((type?.total || 0) - (type?.occupied || 0)), 0)}
                    </p>
                </div>
            </div>

            {/* Detailed Bed Status */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                    {selectedBedType.toUpperCase()} Bed Status
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Total</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">
                            {allocation?.[selectedBedType]?.total || 0}
                        </p>
                    </div>

                    <div className="border border-green-200 dark:border-green-900 rounded-lg p-4 bg-green-50 dark:bg-green-900/20">
                        <p className="text-sm text-green-600 dark:text-green-400 mb-2">Available</p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {(allocation?.[selectedBedType]?.total || 0) - (allocation?.[selectedBedType]?.occupied || 0)}
                        </p>
                    </div>

                    <div className="border border-blue-200 dark:border-blue-900 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
                        <p className="text-sm text-blue-600 dark:text-blue-400 mb-2">Occupied</p>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {allocation?.[selectedBedType]?.occupied || 0}
                        </p>
                    </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">Real-time Synchronization</p>
                    <p className="text-xs text-blue-500 dark:text-blue-400">
                        Bed allocations are instantly updated across all stations via WebSocket. Last update: {new Date().toLocaleTimeString()}
                    </p>
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
