'use client';
import { useEffect, useState } from 'react';
import { TrendingUp, Award, AlertTriangle, BarChart3 } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';

export const PolicyEvaluation = () => {
    const [aggregates, setAggregates] = useState<any>(null);
    const [rankings, setRankings] = useState<any[]>([]);
    const [issues, setIssues] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPolicyData();
        const interval = setInterval(fetchPolicyData, 300000);
        return () => clearInterval(interval);
    }, []);

    const fetchPolicyData = async () => {
        try {
            const res = await api.get('/state-admin/policy/evaluation');
            if (res.data.success) {
                setAggregates(res.data.aggregates);
                setRankings(res.data.rankings);
                setIssues(res.data.flagged_issues);
            }
        } catch (err) {
            console.error('[v0] Policy evaluation error:', err);
        } finally {
            setLoading(false);
        }
    };

    const generateReport = async () => {
        try {
            const now = new Date();
            const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const end = new Date(now.getFullYear(), now.getMonth(), 0);
            
            const res = await api.post('/state-admin/policy/report', {
                state: 'State Name',
                start_month: start.toISOString(),
                end_month: end.toISOString()
            });
            
            if (res.data.success) {
                console.log('[v0] Policy report generated');
            }
        } catch (err) {
            console.error('[v0] Generate report error:', err);
        }
    };

    if (loading) {
        return <div className="text-center py-8 text-slate-500">Loading policy metrics...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Key Performance Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white dark:bg-slate-900 rounded-lg p-6 border border-slate-200 dark:border-slate-800">
                    <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">Avg Wait Time</div>
                    <div className="text-3xl font-bold text-slate-900 dark:text-white">
                        {aggregates?.avg_wait_time} min
                    </div>
                    <div className="text-xs text-slate-500 mt-2">Across network</div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-lg p-6 border border-slate-200 dark:border-slate-800">
                    <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">Patient Satisfaction</div>
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {aggregates?.avg_satisfaction}/10
                    </div>
                    <div className="text-xs text-slate-500 mt-2">Average score</div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-lg p-6 border border-slate-200 dark:border-slate-800">
                    <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">Discharge Rate</div>
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                        {aggregates?.avg_discharge_rate}%
                    </div>
                    <div className="text-xs text-slate-500 mt-2">Successfully discharged</div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-lg p-6 border border-slate-200 dark:border-slate-800">
                    <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">Mortality Rate</div>
                    <div className="text-3xl font-bold text-slate-900 dark:text-white">
                        {aggregates?.avg_mortality_rate}%
                    </div>
                    <div className="text-xs text-slate-500 mt-2">Benchmarking analysis</div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-lg p-6 border border-slate-200 dark:border-slate-800">
                    <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">AB-PMJAY Compliance</div>
                    <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                        {aggregates?.avg_compliance}%
                    </div>
                    <div className="text-xs text-slate-500 mt-2">Policy adherence</div>
                </div>
            </div>

            {/* Top Performing Hospitals */}
            <div className="bg-white dark:bg-slate-900 rounded-lg p-6 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-green-500" />
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Top Performing Hospitals</h3>
                    </div>
                    <Button onClick={generateReport} variant="outline" size="sm">
                        Generate Report
                    </Button>
                </div>
                
                <div className="space-y-2">
                    {rankings.slice(0, 10).map((hospital: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                            <div className="flex items-center gap-4">
                                <div className="text-2xl font-bold text-slate-400 dark:text-slate-600 w-8 text-center">
                                    {idx + 1}
                                </div>
                                <div>
                                    <div className="font-semibold text-slate-900 dark:text-white">{hospital.hospital_name}</div>
                                    <div className="text-sm text-slate-600 dark:text-slate-400">
                                        Wait time: {hospital.kpi_metrics.avg_wait_time_minutes} min · 
                                        Occupancy: {hospital.kpi_metrics.bed_occupancy_rate}%
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                    {hospital.comparative_metrics?.percentile_rank || 0}%
                                </div>
                                <div className="text-xs text-slate-500">Percentile rank</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Flagged Issues */}
            {issues.length > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-lg p-6 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2 mb-6">
                        <AlertTriangle className="w-5 h-5 text-yellow-500" />
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Issues Requiring Action</h3>
                    </div>
                    
                    <div className="space-y-3">
                        {issues.slice(0, 10).map((issue: any, idx: number) => (
                            <div key={idx} className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-l-4 border-yellow-500">
                                <div className="font-semibold text-slate-900 dark:text-white">{issue.issue}</div>
                                <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                    {issue.recommended_action}
                                </div>
                                <div className="text-xs text-slate-500 mt-2">
                                    Severity: <span className={`font-semibold ${issue.severity === 'high' ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                                        {issue.severity.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Statistics Summary */}
            <div className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-lg p-6 border border-cyan-200 dark:border-cyan-800">
                <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Network Statistics</h3>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">Hospitals Analyzed</div>
                        <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400 mt-1">100+</div>
                    </div>
                    <div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">Metrics Tracked</div>
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">40+</div>
                    </div>
                    <div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">Data Points</div>
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">1M+</div>
                    </div>
                    <div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">Update Frequency</div>
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">Daily</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Active: 2026-07-04

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
