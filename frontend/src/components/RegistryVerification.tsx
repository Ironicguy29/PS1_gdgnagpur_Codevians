'use client';
import { useEffect, useState } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Clock } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';

export const RegistryVerification = () => {
    const [registries, setRegistries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState<any>(null);
    const [filter, setFilter] = useState<'all' | 'active' | 'expired' | 'flagged'>('all');

    useEffect(() => {
        fetchRegistries();
        const interval = setInterval(fetchRegistries, 30000);
        return () => clearInterval(interval);
    }, [filter]);

    const fetchRegistries = async () => {
        try {
            const params = new URLSearchParams();
            if (filter !== 'all') params.append('status', filter);
            
            const res = await api.get(`/state-admin/registries?${params}`);
            if (res.data.success) {
                setRegistries(res.data.registries);
                setSummary(res.data.summary);
            }
        } catch (err) {
            console.error('[v0] Registry fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'active':
                return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'expired':
                return <Clock className="w-5 h-5 text-yellow-500" />;
            case 'suspended':
                return <AlertTriangle className="w-5 h-5 text-orange-500" />;
            case 'cancelled':
                return <XCircle className="w-5 h-5 text-red-500" />;
            default:
                return null;
        }
    };

    if (loading) {
        return <div className="text-center py-8 text-slate-500">Loading registries...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                {summary && (
                    <>
                        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-800">
                            <div className="text-sm text-slate-600 dark:text-slate-400">Total Registered</div>
                            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{summary.total}</div>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                            <div className="text-sm text-green-700 dark:text-green-400">Active</div>
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{summary.active}</div>
                        </div>
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
                            <div className="text-sm text-yellow-700 dark:text-yellow-400">Expired</div>
                            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{summary.expired}</div>
                        </div>
                        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
                            <div className="text-sm text-red-700 dark:text-red-400">Flagged</div>
                            <div className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{summary.flagged}</div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                            <div className="text-sm text-slate-600 dark:text-slate-400">Avg Compliance</div>
                            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{summary.avg_compliance_score}%</div>
                        </div>
                    </>
                )}
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800">
                {(['all', 'active', 'expired', 'flagged'] as const).map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 font-semibold text-sm transition-colors capitalize ${
                            filter === f
                                ? 'text-cyan-500 border-b-2 border-cyan-500'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300'
                        }`}
                    >
                        {f === 'all' ? 'All Registries' : f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            {/* Registry List */}
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                        <tr>
                            <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">Entity</th>
                            <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">Type</th>
                            <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">License Status</th>
                            <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">Compliance</th>
                            <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">State</th>
                            <th className="px-6 py-3 text-center font-semibold text-slate-900 dark:text-white">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {registries.map((reg: any, idx: number) => (
                            <tr key={idx} className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                <td className="px-6 py-4 text-slate-900 dark:text-white">{reg.name}</td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 capitalize">
                                        {reg.entity_type}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        {getStatusIcon(reg.accreditation_status)}
                                        <span className="capitalize">{reg.accreditation_status}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-16 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                            <div 
                                                className={`h-2 rounded-full ${reg.compliance_score >= 80 ? 'bg-green-500' : reg.compliance_score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                style={{ width: `${reg.compliance_score}%` }}
                                            />
                                        </div>
                                        <span className="font-semibold">{reg.compliance_score}%</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{reg.state}</td>
                                <td className="px-6 py-4 text-center">
                                    {reg.flags?.flagged ? (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
                                            Flagged
                                        </span>
                                    ) : (
                                        <Button variant="outline" size="sm" className="text-xs">
                                            Verify
                                        </Button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
