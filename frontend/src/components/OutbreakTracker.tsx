'use client';
import { useEffect, useState } from 'react';
import { AlertTriangle, TrendingUp, Activity } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';

export const OutbreakTracker = () => {
    const [summary, setSummary] = useState<any>(null);
    const [diseases, setDiseases] = useState<any[]>([]);
    const [anomalies, setAnomalies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedAnomalies, setSelectedAnomalies] = useState<string[]>([]);

    useEffect(() => {
        fetchOutbreakData();
        const interval = setInterval(fetchOutbreakData, 120000);
        return () => clearInterval(interval);
    }, []);

    const fetchOutbreakData = async () => {
        try {
            const res = await api.get('/state-admin/outbreaks/tracking');
            if (res.data.success) {
                setSummary(res.data.summary);
                setDiseases(res.data.disease_stats);
                setAnomalies(res.data.recent_anomalies);
            }
        } catch (err) {
            console.error('[v0] Outbreak tracking error:', err);
        } finally {
            setLoading(false);
        }
    };

    const initiateResponse = async () => {
        if (selectedAnomalies.length === 0) return;
        
        try {
            const res = await api.post('/state-admin/outbreaks/response', {
                anomalyIds: selectedAnomalies,
                response_type: 'investigation',
                assigned_team: 'Regional Epidemiology Team'
            });
            
            if (res.data.success) {
                setSelectedAnomalies([]);
                fetchOutbreakData();
            }
        } catch (err) {
            console.error('[v0] Response coordination error:', err);
        }
    };

    if (loading) {
        return <div className="text-center py-8 text-slate-500">Loading outbreak data...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 rounded-lg p-6 border border-slate-200 dark:border-slate-800">
                    <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">Total Cases (30 days)</div>
                    <div className="text-3xl font-bold text-slate-900 dark:text-white">
                        {summary?.total_cases?.toLocaleString()}
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-lg p-6 border border-slate-200 dark:border-slate-800">
                    <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">Diseases Monitored</div>
                    <div className="text-3xl font-bold text-slate-900 dark:text-white">
                        {summary?.diseases_monitored}
                    </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
                    <div className="text-sm text-blue-700 dark:text-blue-400 mb-2">Anomalies Detected</div>
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {summary?.total_anomalies}
                    </div>
                    <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        {summary?.anomaly_percentage}% of cases
                    </div>
                </div>

                <div className={`rounded-lg p-6 border ${summary?.critical_alerts > 0 ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'}`}>
                    <div className={`text-sm mb-2 ${summary?.critical_alerts > 0 ? 'text-red-700 dark:text-red-400' : 'text-green-700 dark:text-green-400'}`}>
                        Critical Alerts
                    </div>
                    <div className={`text-3xl font-bold ${summary?.critical_alerts > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                        {summary?.critical_alerts}
                    </div>
                </div>
            </div>

            {/* Disease Statistics */}
            <div className="bg-white dark:bg-slate-900 rounded-lg p-6 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-6">
                    <TrendingUp className="w-5 h-5 text-cyan-500" />
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Disease Trends</h3>
                </div>
                
                <div className="space-y-3">
                    {diseases.slice(0, 10).map((disease: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                            <div className="flex-1">
                                <div className="font-semibold text-slate-900 dark:text-white">{disease.disease}</div>
                                <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                    {disease.total_cases} cases · {disease.severe_cases} severe · {disease.hospitalized} hospitalized
                                </div>
                            </div>
                            {disease.anomaly_count > 0 && (
                                <div className="text-right">
                                    <div className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">
                                        {disease.anomaly_count} anomalies
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Anomaly Alerts */}
            <div className="bg-white dark:bg-slate-900 rounded-lg p-6 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Anomaly Detection</h3>
                    </div>
                    {selectedAnomalies.length > 0 && (
                        <Button 
                            onClick={initiateResponse}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            Initiate Response ({selectedAnomalies.length})
                        </Button>
                    )}
                </div>
                
                {anomalies.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">No anomalies detected</div>
                ) : (
                    <div className="space-y-3">
                        {anomalies.map((anomaly: any, idx: number) => (
                            <div 
                                key={idx}
                                className={`flex items-start gap-4 p-4 rounded-lg border-l-4 ${anomaly.response_status === 'response_initiated' ? 'bg-green-50 dark:bg-green-900/20 border-l-green-500' : 'bg-red-50 dark:bg-red-900/20 border-l-red-500'} cursor-pointer`}
                                onClick={() => {
                                    const id = anomaly._id || `${anomaly.disease_code}-${idx}`;
                                    setSelectedAnomalies(prev => 
                                        prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
                                    );
                                }}
                            >
                                <input 
                                    type="checkbox" 
                                    checked={selectedAnomalies.includes(anomaly._id || `${anomaly.disease_code}-${idx}`)}
                                    onChange={() => {}}
                                    className="w-4 h-4 mt-1"
                                />
                                <div className="flex-1">
                                    <div className="font-semibold text-slate-900 dark:text-white">{anomaly.disease_name}</div>
                                    <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                        {anomaly.patient_count} cases reported · Deviation: {anomaly.anomaly_details?.deviation_percentage || 0}%
                                    </div>
                                    <div className="text-xs text-slate-500 mt-2">
                                        Hospital: {anomaly.hospital_id} · Status: {anomaly.response_status}
                                    </div>
                                </div>
                                <Activity className={`w-5 h-5 flex-shrink-0 ${anomaly.response_status === 'response_initiated' ? 'text-green-500' : 'text-red-500'}`} />
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
