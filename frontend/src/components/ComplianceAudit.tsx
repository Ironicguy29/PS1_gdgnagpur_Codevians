'use client';
import { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Clock, TrendingUp } from 'lucide-react';
import api from '@/lib/api';

interface Claim {
    _id: string;
    claim_id: string;
    claim_amount: number;
    status: 'submitted' | 'approved' | 'rejected' | 'pending';
    scheme_type: string;
    admission_date: string;
    discharge_date: string;
    treatment_type: string;
    compliance_issues?: string[];
}

export function ComplianceAudit() {
    const [summary, setSummary] = useState<any>(null);
    const [claims, setClaims] = useState<Claim[]>([]);
    const [byScheme, setByScheme] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>('all');

    useEffect(() => {
        fetchComplianceReport();
    }, [filterStatus]);

    const fetchComplianceReport = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/admin/compliance/report', {
                params: filterStatus !== 'all' ? { status: filterStatus } : {}
            });
            if (data.success) {
                setSummary(data.summary);
                setClaims(data.claims);
                setByScheme(data.by_scheme);
            }
        } catch (err) {
            console.error('[v0] Error fetching compliance report:', err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved':
                return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100';
            case 'pending':
                return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100';
            case 'rejected':
                return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100';
            case 'submitted':
                return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100';
            default:
                return 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200';
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="animate-pulse text-slate-500">Loading compliance data...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">Total Claims</p>
                            <TrendingUp className="w-5 h-5 text-slate-400" />
                        </div>
                        <p className="text-3xl font-bold text-slate-900 dark:text-white">
                            {summary.total_claims}
                        </p>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-green-200 dark:border-green-800 p-6">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-green-600 dark:text-green-400 text-sm font-medium">Approved</p>
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                        </div>
                        <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                            {summary.approved}
                        </p>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-yellow-200 dark:border-yellow-800 p-6">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-yellow-600 dark:text-yellow-400 text-sm font-medium">Pending</p>
                            <Clock className="w-5 h-5 text-yellow-500" />
                        </div>
                        <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                            {summary.pending}
                        </p>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-red-200 dark:border-red-800 p-6">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-red-600 dark:text-red-400 text-sm font-medium">Rejected</p>
                            <AlertCircle className="w-5 h-5 text-red-500" />
                        </div>
                        <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                            {summary.rejected}
                        </p>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-cyan-200 dark:border-cyan-800 p-6">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-cyan-600 dark:text-cyan-400 text-sm font-medium">Total Amount</p>
                            <TrendingUp className="w-5 h-5 text-cyan-500" />
                        </div>
                        <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
                            {formatCurrency(summary.total_amount)}
                        </p>
                    </div>
                </div>
            )}

            {/* By Scheme Breakdown */}
            {byScheme && Object.entries(byScheme).length > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Claims by Scheme</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {Object.entries(byScheme).map(([scheme, data]: [string, any]) => (
                            <div key={scheme} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                                <h4 className="font-semibold text-slate-900 dark:text-white mb-3">{scheme}</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-slate-600 dark:text-slate-400">Total</span>
                                        <span className="font-semibold text-slate-900 dark:text-white">
                                            {data.total}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-600 dark:text-slate-400">Approved</span>
                                        <span className="font-semibold text-green-600 dark:text-green-400">
                                            {data.approved}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-600 dark:text-slate-400">Amount</span>
                                        <span className="font-semibold text-slate-900 dark:text-white">
                                            {formatCurrency(data.amount)}
                                        </span>
                                    </div>
                                    {data.compliance_issues > 0 && (
                                        <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                                            <span className="text-red-600 dark:text-red-400 text-xs">Issues Found</span>
                                            <span className="font-semibold text-red-600 dark:text-red-400">
                                                {data.compliance_issues}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Filter and Claims List */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="border-b border-slate-200 dark:border-slate-800 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Claims</h3>
                        <div className="flex gap-2">
                            {['all', 'approved', 'pending', 'rejected'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setFilterStatus(status)}
                                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                        filterStatus === status
                                            ? 'bg-cyan-500 text-white'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                                    }`}
                                >
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-800">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-white">
                                    Claim ID
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-white">
                                    Amount
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-white">
                                    Scheme
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-white">
                                    Treatment
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-white">
                                    Status
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-white">
                                    Issues
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {claims.map((claim) => (
                                <tr key={claim._id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white text-sm">
                                        {claim.claim_id}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 text-sm">
                                        {formatCurrency(claim.claim_amount)}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 text-sm">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100">
                                            {claim.scheme_type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 text-sm">
                                        {claim.treatment_type}
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(claim.status)}`}>
                                            {claim.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        {claim.compliance_issues && claim.compliance_issues.length > 0 ? (
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100">
                                                {claim.compliance_issues.length} issue{claim.compliance_issues.length !== 1 ? 's' : ''}
                                            </span>
                                        ) : (
                                            <span className="text-slate-400 text-sm">None</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {claims.length === 0 && (
                    <div className="p-8 text-center">
                        <p className="text-slate-500 dark:text-slate-400">No claims found</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// Active: 2026-07-04

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
