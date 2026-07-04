'use client';
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { RegistryVerification } from '@/components/RegistryVerification';
import { ResourceMapping } from '@/components/ResourceMapping';
import { OutbreakTracker } from '@/components/OutbreakTracker';
import { PolicyEvaluation } from '@/components/PolicyEvaluation';
import { Shield, MapPin, AlertCircle, BarChart3 } from 'lucide-react';

export default function StateAdminDashboard() {
    const [activeTab, setActiveTab] = useState<'registries' | 'resources' | 'outbreaks' | 'policy'>('registries');

    return (
        <DashboardLayout role="state_admin">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                    State Health Administration Portal
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                    Comprehensive oversight of hospital registries, resource allocation, disease surveillance, and policy compliance
                </p>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 mb-8 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
                {[
                    { id: 'registries', label: 'Verify Registries', icon: Shield },
                    { id: 'resources', label: 'Map Resources', icon: MapPin },
                    { id: 'outbreaks', label: 'Outbreak Trackers', icon: AlertCircle },
                    { id: 'policy', label: 'Evaluate Policy', icon: BarChart3 }
                ].map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-6 py-3 font-semibold text-sm whitespace-nowrap flex items-center gap-2 transition-colors ${
                                activeTab === tab.id
                                    ? 'text-cyan-500 border-b-2 border-cyan-500'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300'
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            <div className="pb-12">
                {activeTab === 'registries' && (
                    <div>
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                                Registry Verification & Compliance
                            </h2>
                            <p className="text-slate-600 dark:text-slate-400">
                                Maintain central state databases checking credentials of active hospitals and licensed doctors
                            </p>
                        </div>
                        <RegistryVerification />
                    </div>
                )}

                {activeTab === 'resources' && (
                    <div>
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                                Regional Resource Distribution
                            </h2>
                            <p className="text-slate-600 dark:text-slate-400">
                                Analyze regional asset distributions like oxygen plants, ventilators, and specialist staff with shortage alerts
                            </p>
                        </div>
                        <ResourceMapping />
                    </div>
                )}

                {activeTab === 'outbreaks' && (
                    <div>
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                                Disease Outbreak Surveillance
                            </h2>
                            <p className="text-slate-600 dark:text-slate-400">
                                Analyze incoming diagnostic statistics to isolate anomaly spikes and coordinate rapid response teams
                            </p>
                        </div>
                        <OutbreakTracker />
                    </div>
                )}

                {activeTab === 'policy' && (
                    <div>
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                                Healthcare Policy Evaluation
                            </h2>
                            <p className="text-slate-600 dark:text-slate-400">
                                Audit public healthcare indices, calculating average hospital wait times, recovery rates, and policy compliance
                            </p>
                        </div>
                        <PolicyEvaluation />
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

// Active: 2026-07-04

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
