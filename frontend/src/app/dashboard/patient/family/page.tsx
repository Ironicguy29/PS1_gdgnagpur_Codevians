'use client';
import DashboardLayout from "@/components/layout/DashboardLayout";
import { FamilyMemberCard } from "@/components/dashboard/patient/FamilyMemberCard";

export default function FamilyRecordsPage() {
    return (
        <DashboardLayout role="patient">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Family Health Records</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="h-[400px]">
                    <FamilyMemberCard />
                </div>
                {/* Simulated additional empty card or info */}
                <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl flex items-center justify-center p-6 text-slate-400">
                    <p>Add New Member +</p>
                </div>
            </div>
        </DashboardLayout>
    );
}

// Active: 2026-07-04

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
