'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from "@/components/layout/DashboardLayout";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
    TrendingUp, Shield, RefreshCw, FileText, ArrowUpRight, 
    CheckCircle, XCircle, AlertTriangle, Users, DollarSign, Wallet,
    ArrowDownLeft, Receipt
} from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/components/providers/ToastProvider";

export default function AdminBillingPage() {
    const [analytics, setAnalytics] = useState<any>(null);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [claims, setClaims] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'overview' | 'claims' | 'invoices'>('overview');
    const [loading, setLoading] = useState(true);
    
    // Modal states
    const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
    const [refundAmount, setRefundAmount] = useState<string>('');
    const [refundReason, setRefundReason] = useState<string>('');
    const [processingRefund, setProcessingRefund] = useState(false);

    const [selectedClaim, setSelectedClaim] = useState<any | null>(null);
    const [claimApproveAmount, setClaimApproveAmount] = useState<string>('');
    const [claimNotes, setClaimNotes] = useState<string>('');
    const [processingClaim, setProcessingClaim] = useState(false);

    const { toast } = useToast();

    useEffect(() => {
        fetchAdminBillingData();
    }, []);

    const fetchAdminBillingData = async () => {
        setLoading(true);
        try {
            // Fetch financial analytics
            const analyticRes = await api.get('/billing/analytics');
            setAnalytics(analyticRes.data);

            // Fetch all invoices
            const invoiceRes = await api.get('/billing/invoices');
            setInvoices(invoiceRes.data || []);

            // Fetch insurance claims
            const claimRes = await api.get('/billing/insurance/claims');
            setClaims(claimRes.data || []);
        } catch (e: any) {
            console.error("Failed to fetch billing dashboard data", e);
            toast("Failed to load financial dashboards.", "error");
        } finally {
            setLoading(false);
        }
    };

    // Update claim status (Approve or Reject)
    const handleUpdateClaimStatus = async (status: 'Approved' | 'Rejected') => {
        if (!selectedClaim) return;
        setProcessingClaim(true);
        try {
            const approvedAmount = status === 'Approved' ? parseFloat(claimApproveAmount) : 0;
            if (status === 'Approved' && (isNaN(approvedAmount) || approvedAmount <= 0)) {
                toast("Please enter a valid approved amount.", "error");
                setProcessingClaim(false);
                return;
            }

            await api.put(`/billing/insurance/claims/${selectedClaim._id}`, {
                status,
                approved_amount: approvedAmount,
                notes: claimNotes || `${status} by Admin.`
            });

            toast(`Claim status updated to ${status}!`, "success");
            setSelectedClaim(null);
            setClaimApproveAmount('');
            setClaimNotes('');
            fetchAdminBillingData();
        } catch (e: any) {
            console.error("Failed to update claim", e);
            toast(e.response?.data?.message || "Failed to update claim status.", "error");
        } finally {
            setProcessingClaim(false);
        }
    };

    // Process customer refunds
    const handleProcessRefund = async () => {
        if (!selectedInvoice) return;
        setProcessingRefund(true);
        try {
            const amount = parseFloat(refundAmount);
            if (isNaN(amount) || amount <= 0) {
                toast("Please specify a valid refund amount.", "error");
                setProcessingRefund(false);
                return;
            }
            if (amount > selectedInvoice.amount_paid) {
                toast(`Refund amount exceeds amount paid. Max refund: ₹${selectedInvoice.amount_paid}`, "error");
                setProcessingRefund(false);
                return;
            }
            if (!refundReason) {
                toast("Please provide a reason for the refund.", "error");
                setProcessingRefund(false);
                return;
            }

            await api.post(`/billing/invoices/${selectedInvoice._id}/refund`, {
                amount,
                reason: refundReason
            });

            toast("Refund authorized and processed successfully!", "success");
            setSelectedInvoice(null);
            setRefundAmount('');
            setRefundReason('');
            fetchAdminBillingData();
        } catch (e: any) {
            console.error("Refund failed", e);
            toast(e.response?.data?.message || "Refund processing failed.", "error");
        } finally {
            setProcessingRefund(false);
        }
    };

    return (
        <DashboardLayout role="admin">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <TrendingUp className="w-8 h-8 text-blue-600" />
                        Financial Analytics & Operations
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">Monitor hospital billing metrics, reconcile insurance claims, and manage refunds.</p>
                </div>
                <Button 
                    onClick={fetchAdminBillingData}
                    variant="outline"
                    className="flex items-center gap-2"
                >
                    <RefreshCw className="w-4 h-4" /> Refresh
                </Button>
            </div>

            {/* Quick Stats Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-28 bg-white dark:bg-slate-900 animate-pulse rounded-2xl" />
                    ))}
                </div>
            ) : analytics && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <GlassCard className="bg-gradient-to-br from-white to-blue-50/20 dark:from-slate-900 dark:to-blue-950/10">
                        <div className="flex justify-between items-start">
                            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg dark:bg-blue-900/30">
                                <DollarSign className="w-5 h-5" />
                            </div>
                            <Badge className="bg-blue-500/10 text-blue-600 border-0">Lifetime</Badge>
                        </div>
                        <div className="mt-4">
                            <p className="text-xs text-slate-400">Total Revenue Billed</p>
                            <h3 className="text-2xl font-bold text-slate-800 dark:text-white">₹{analytics.totalRevenue}</h3>
                            <p className="text-[10px] text-slate-400 mt-1">
                                Online: ₹{analytics.onlineRevenue} • Offline: ₹{analytics.offlineRevenue}
                            </p>
                        </div>
                    </GlassCard>

                    <GlassCard className="bg-gradient-to-br from-white to-emerald-50/20 dark:from-slate-900 dark:to-emerald-950/10">
                        <div className="flex justify-between items-start">
                            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg dark:bg-emerald-900/30">
                                <Wallet className="w-5 h-5" />
                            </div>
                            <Badge className="bg-emerald-500/10 text-emerald-600 border-0">Today</Badge>
                        </div>
                        <div className="mt-4">
                            <p className="text-xs text-slate-400">Revenue Today</p>
                            <h3 className="text-2xl font-bold text-slate-800 dark:text-white">₹{analytics.revenueToday}</h3>
                            <p className="text-[10px] text-slate-400 mt-1">Monthly: ₹{analytics.revenueThisMonth}</p>
                        </div>
                    </GlassCard>

                    <GlassCard className="bg-gradient-to-br from-white to-rose-50/20 dark:from-slate-900 dark:to-rose-950/10">
                        <div className="flex justify-between items-start">
                            <div className="p-2 bg-rose-100 text-rose-600 rounded-lg dark:bg-rose-900/30">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                            <Badge className="bg-rose-500/10 text-rose-600 border-0">Receivables</Badge>
                        </div>
                        <div className="mt-4">
                            <p className="text-xs text-slate-400">Outstanding Balances</p>
                            <h3 className="text-2xl font-bold text-slate-800 dark:text-white">₹{analytics.outstandingAmount}</h3>
                            <p className="text-[10px] text-slate-400 mt-1">Pending patient payments</p>
                        </div>
                    </GlassCard>

                    <GlassCard className="bg-gradient-to-br from-white to-teal-50/20 dark:from-slate-900 dark:to-teal-950/10">
                        <div className="flex justify-between items-start">
                            <div className="p-2 bg-teal-100 text-teal-600 rounded-lg dark:bg-teal-900/30">
                                <Shield className="w-5 h-5" />
                            </div>
                            <Badge className="bg-teal-500/10 text-teal-600 border-0">Insurance</Badge>
                        </div>
                        <div className="mt-4">
                            <p className="text-xs text-slate-400">Approved Claim Value</p>
                            <h3 className="text-2xl font-bold text-slate-800 dark:text-white">₹{analytics.claimsValue}</h3>
                            <p className="text-[10px] text-slate-400 mt-1">{analytics.claimsApproved} approved claims of {analytics.totalClaims}</p>
                        </div>
                    </GlassCard>
                </div>
            )}

            {/* Tabs Navigation */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6 gap-6">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`pb-4 text-sm font-semibold transition-all ${
                        activeTab === 'overview' 
                            ? 'border-b-2 border-blue-600 text-blue-600 dark:text-white' 
                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                    }`}
                >
                    Overview & Breakdown
                </button>
                <button
                    onClick={() => setActiveTab('claims')}
                    className={`pb-4 text-sm font-semibold transition-all ${
                        activeTab === 'claims' 
                            ? 'border-b-2 border-blue-600 text-blue-600 dark:text-white' 
                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                    }`}
                >
                    Insurance Claims ({claims.length})
                </button>
                <button
                    onClick={() => setActiveTab('invoices')}
                    className={`pb-4 text-sm font-semibold transition-all ${
                        activeTab === 'invoices' 
                            ? 'border-b-2 border-blue-600 text-blue-600 dark:text-white' 
                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                    }`}
                >
                    All Invoices ({invoices.length})
                </button>
            </div>

            {/* TAB CONTENT: OVERVIEW */}
            {activeTab === 'overview' && analytics && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Dept Splits */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 lg:col-span-1 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Revenue by Department</h3>
                        <div className="space-y-4">
                            {Object.entries(analytics.departmentRevenue || {}).map(([dept, amount]: any) => (
                                <div key={dept} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 capitalize">{dept}</span>
                                    <span className="text-sm font-bold text-slate-900 dark:text-white">₹{amount.toFixed(2)}</span>
                                </div>
                            ))}
                            {Object.keys(analytics.departmentRevenue || {}).length === 0 && (
                                <p className="text-xs text-slate-400 text-center py-6">No departmental logs yet.</p>
                            )}
                        </div>
                    </div>

                    {/* Transaction Stream */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 lg:col-span-2 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <Receipt className="w-5 h-5 text-blue-600" /> Recent Successful Payments
                        </h3>
                        <div className="space-y-3">
                            {analytics.recentPayments?.map((p: any) => (
                                <div key={p._id} className="flex items-center justify-between p-3.5 border border-slate-100 dark:border-slate-800/60 rounded-2xl hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl dark:bg-emerald-950/20">
                                            <ArrowDownLeft className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800 dark:text-white">{p.patient_id?.name || 'Walkin Patient'}</p>
                                            <p className="text-[10px] text-slate-400">{p.transaction_id} • {p.payment_method}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-slate-800 dark:text-white">₹{p.amount}</p>
                                        <p className="text-[10px] text-slate-400">{new Date(p.payment_date).toLocaleDateString('en-IN')}</p>
                                    </div>
                                </div>
                            ))}
                            {!analytics.recentPayments || analytics.recentPayments.length === 0 ? (
                                <p className="text-sm text-slate-400 text-center py-10">No payments captured today.</p>
                            ) : null}
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: INSURANCE CLAIMS */}
            {activeTab === 'claims' && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Claim Number</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Patient Name</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Provider / Policy</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Requested</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Approved</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {claims.map((claim) => (
                                    <tr key={claim._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                                        <td className="px-6 py-4 font-semibold text-slate-800 dark:text-white">{claim.claim_number}</td>
                                        <td className="px-6 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                                            {claim.patient_id?.name || 'Ramesh Patil'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-slate-800 dark:text-white">{claim.insurance_id?.provider || 'Star Health'}</p>
                                            <p className="text-[10px] text-slate-400">{claim.insurance_id?.policy_number}</p>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-slate-800 dark:text-white">₹{claim.requested_amount}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-emerald-600">
                                            {claim.approved_amount !== undefined ? `₹${claim.approved_amount}` : '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge className={`border-0 ${
                                                claim.status === 'Approved' 
                                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                                                    : claim.status === 'Rejected'
                                                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
                                                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                                            }`}>
                                                {claim.status}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {claim.status === 'Submitted' && (
                                                <Button 
                                                    onClick={() => {
                                                        setSelectedClaim(claim);
                                                        setClaimApproveAmount(claim.requested_amount.toString());
                                                    }}
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-8 border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-900/40 dark:text-blue-400"
                                                >
                                                    Process
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {claims.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="text-center py-10 text-slate-400 text-sm">No insurance claims registered.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: INVOICES */}
            {activeTab === 'invoices' && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Invoice No</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Patient Name</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Billed Date</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Bill Total</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Paid</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Remaining</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {invoices.map((inv) => (
                                    <tr key={inv._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                                        <td className="px-6 py-4 font-semibold text-slate-800 dark:text-white">{inv.invoice_number}</td>
                                        <td className="px-6 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                                            {inv.patient_id?.name || 'Walkin'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {new Date(inv.billing_date).toLocaleDateString('en-IN')}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-slate-800 dark:text-white">₹{inv.final_amount}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-emerald-600">₹{inv.amount_paid}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-rose-500">₹{inv.remaining_balance}</td>
                                        <td className="px-6 py-4">
                                            <Badge className={`border-0 ${
                                                inv.payment_status === 'Paid' 
                                                    ? 'bg-emerald-100 text-emerald-800'
                                                    : inv.payment_status === 'Refunded'
                                                    ? 'bg-purple-100 text-purple-800'
                                                    : 'bg-amber-100 text-amber-800'
                                            }`}>
                                                {inv.payment_status}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {inv.amount_paid > 0 && (
                                                <Button 
                                                    onClick={() => {
                                                        setSelectedInvoice(inv);
                                                        setRefundAmount(inv.amount_paid.toString());
                                                    }}
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 px-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 dark:hover:bg-purple-900/10"
                                                >
                                                    Refund
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* MODAL: PROCESS CLAIM */}
            {selectedClaim && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in-50">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
                        <div className="bg-slate-50 dark:bg-slate-900/80 px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white">Verify Insurance Claim</h3>
                                <p className="text-xs text-slate-400">Claim: {selectedClaim.claim_number}</p>
                            </div>
                            <button onClick={() => setSelectedClaim(null)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl text-sm">
                                <p className="text-slate-500">Patient: <span className="font-bold text-slate-800 dark:text-white">{selectedClaim.patient_id?.name || 'Ramesh Patil'}</span></p>
                                <p className="text-slate-500">Insurance Provider: <span className="font-bold text-slate-800 dark:text-white">{selectedClaim.insurance_id?.provider}</span></p>
                                <p className="text-slate-500 mt-2">Requested Amount: <span className="font-bold text-blue-600">₹{selectedClaim.requested_amount}</span></p>
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="approveAmount">Approved Amount (₹)</Label>
                                <Input 
                                    id="approveAmount" 
                                    type="number"
                                    value={claimApproveAmount}
                                    onChange={(e) => setClaimApproveAmount(e.target.value)}
                                />
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="claimNotes">Verification Notes</Label>
                                <Input 
                                    id="claimNotes" 
                                    placeholder="Enter audit/approval notes"
                                    value={claimNotes}
                                    onChange={(e) => setClaimNotes(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900/80 px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                            <Button 
                                onClick={() => handleUpdateClaimStatus('Rejected')} 
                                variant="outline"
                                className="border-rose-200 text-rose-600 hover:bg-rose-50"
                                disabled={processingClaim}
                            >
                                Reject Claim
                            </Button>
                            <Button 
                                onClick={() => handleUpdateClaimStatus('Approved')}
                                className="bg-emerald-600 text-white hover:bg-emerald-700"
                                disabled={processingClaim}
                            >
                                {processingClaim ? 'Processing...' : 'Approve & Disburse'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: PROCESS REFUND */}
            {selectedInvoice && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in-50">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
                        <div className="bg-slate-50 dark:bg-slate-900/80 px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white">Authorize Financial Refund</h3>
                                <p className="text-xs text-slate-400">Invoice: {selectedInvoice.invoice_number}</p>
                            </div>
                            <button onClick={() => setSelectedInvoice(null)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl text-sm">
                                <p className="text-slate-500">Patient: <span className="font-bold text-slate-800 dark:text-white">{selectedInvoice.patient_id?.name || 'Walkin'}</span></p>
                                <p className="text-slate-500">Amount Paid: <span className="font-bold text-slate-800 dark:text-white">₹{selectedInvoice.amount_paid}</span></p>
                                <p className="text-slate-500">Gateway: <span className="font-bold text-slate-800 dark:text-white capitalize">{selectedInvoice.payment_method || 'Cash'}</span></p>
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="refundAmount">Refund Amount (₹)</Label>
                                <Input 
                                    id="refundAmount" 
                                    type="number"
                                    max={selectedInvoice.amount_paid}
                                    value={refundAmount}
                                    onChange={(e) => setRefundAmount(e.target.value)}
                                />
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="refundReason">Reason for Refund</Label>
                                <Input 
                                    id="refundReason" 
                                    placeholder="Enter refund justification (e.g. overpayment, test cancelled)"
                                    value={refundReason}
                                    onChange={(e) => setRefundReason(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900/80 px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                            <Button onClick={() => setSelectedInvoice(null)} variant="ghost">Cancel</Button>
                            <Button 
                                onClick={handleProcessRefund}
                                className="bg-purple-600 text-white hover:bg-purple-700"
                                disabled={processingRefund}
                            >
                                {processingRefund ? 'Authorizing...' : 'Authorize Refund'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
