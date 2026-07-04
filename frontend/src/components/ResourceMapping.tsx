'use client';
import { useEffect, useState } from 'react';
import { AlertTriangle, Droplet, Wind, Users, Activity } from 'lucide-react';
import api from '@/lib/api';

export const ResourceMapping = () => {
    const [analysis, setAnalysis] = useState<any>(null);
    const [shortages, setShortages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchResourceData();
        const interval = setInterval(fetchResourceData, 60000);
        return () => clearInterval(interval);
    }, []);

    const fetchResourceData = async () => {
        try {
            const res = await api.get('/state-admin/resources/map');
            if (res.data.success) {
                setAnalysis(res.data.analysis);
                setShortages(res.data.shortage_hospitals);
            }
        } catch (err) {
            console.error('[v0] Resource mapping error:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="text-center py-8 text-slate-500">Loading resource data...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Key Resource Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 rounded-lg p-6 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-4">
                        <div className="text-sm text-slate-600 dark:text-slate-400">Oxygen Capacity</div>
                        <Droplet className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="text-3xl font-bold text-slate-900 dark:text-white">
                        {analysis?.oxygen_capacity.toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-500 mt-2">Units across network</div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-lg p-6 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-4">
                        <div className="text-sm text-slate-600 dark:text-slate-400">Ventilators</div>
                        <Wind className="w-5 h-5 text-cyan-500" />
                    </div>
                    <div className="text-3xl font-bold text-slate-900 dark:text-white">
                        {analysis?.operational_ventilators}/{analysis?.total_ventilators}
                    </div>
                    <div className="text-xs text-slate-500 mt-2">Operational/Total</div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-lg p-6 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-4">
                        <div className="text-sm text-slate-600 dark:text-slate-400">Specialists</div>
                        <Users className="w-5 h-5 text-purple-500" />
                    </div>
                    <div className="text-3xl font-bold text-slate-900 dark:text-white">
                        {analysis?.total_specialists}
                    </div>
                    <div className="text-xs text-slate-500 mt-2">Across all hospitals</div>
                </div>

                <div className={`rounded-lg p-6 border ${analysis?.critical_alerts > 0 ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'}`}>
                    <div className="flex items-center justify-between mb-4">
                        <div className={`text-sm ${analysis?.critical_alerts > 0 ? 'text-red-700 dark:text-red-400' : 'text-green-700 dark:text-green-400'}`}>
                            Critical Alerts
                        </div>
                        <AlertTriangle className={`w-5 h-5 ${analysis?.critical_alerts > 0 ? 'text-red-500' : 'text-green-500'}`} />
                    </div>
                    <div className={`text-3xl font-bold ${analysis?.critical_alerts > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                        {analysis?.critical_alerts}
                    </div>
                    <div className={`text-xs mt-2 ${analysis?.critical_alerts > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                        Resource shortages
                    </div>
                </div>
            </div>

            {/* Specialist Distribution */}
            <div className="bg-white dark:bg-slate-900 rounded-lg p-6 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-6">
                    <Users className="w-5 h-5 text-purple-500" />
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Specialist Distribution</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { type: 'Cardiologists', count: analysis?.specialists_by_type?.cardiologists, color: 'red' },
                        { type: 'Pulmonologists', count: analysis?.specialists_by_type?.pulmonologists, color: 'blue' },
                        { type: 'Neurologists', count: analysis?.specialists_by_type?.neurologists, color: 'purple' },
                        { type: 'Intensivists', count: analysis?.specialists_by_type?.intensivists, color: 'orange' }
                    ].map((spec, idx) => (
                        <div key={idx} className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                            <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">{spec.type}</div>
                            <div className="text-2xl font-bold text-slate-900 dark:text-white">{spec.count}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Shortage Alerts */}
            <div className="bg-white dark:bg-slate-900 rounded-lg p-6 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-6">
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Hospitals with Resource Shortages</h3>
                </div>
                
                {shortages.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">No critical shortages detected</div>
                ) : (
                    <div className="space-y-3">
                        {shortages.map((hospital: any, idx: number) => (
                            <div key={idx} className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border-l-4 border-yellow-500">
                                <div className="flex-1">
                                    <div className="font-semibold text-slate-900 dark:text-white">{hospital.hospital_name}</div>
                                    <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                        {hospital.shortage_alerts?.map((alert: any, i: number) => (
                                            <div key={i}>
                                                {alert.message} - <span className={`font-semibold ${alert.alert_level === 'critical' ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                                                    {alert.alert_level.toUpperCase()}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <Activity className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-1" />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// Active: 2026-07-04

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
