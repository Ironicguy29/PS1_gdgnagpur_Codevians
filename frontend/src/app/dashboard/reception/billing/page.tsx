'use client';
import { useState } from 'react';
import DashboardLayout from "@/components/layout/DashboardLayout";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
    Search, User, CreditCard, Receipt, FileText, Download, Plus, 
    CheckCircle, Shield, Sparkles, Check, ShoppingCart
} from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/components/providers/ToastProvider";
import { jsPDF } from "jspdf";

export default function ReceptionBillingPage() {
    const [searchPhone, setSearchPhone] = useState('');
    const [searching, setSearching] = useState(false);
    const [patient, setPatient] = useState<any>(null);
    const [pendingCharges, setPendingCharges] = useState<any[]>([]);
    const [policies, setPolicies] = useState<any[]>([]);
    const [loadingCharges, setLoadingCharges] = useState(false);

    // Invoice generation inputs
    const [discountAmount, setDiscountAmount] = useState<number>(0);
    const [selectedPolicyId, setSelectedPolicyId] = useState<string>('');
    const [generatingInvoice, setGeneratingInvoice] = useState(false);
    const [activeInvoice, setActiveInvoice] = useState<any>(null);

    // Payment collection inputs
    const [paymentAmount, setPaymentAmount] = useState<string>('');
    const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'UPI'>('Cash');
    const [recordingPayment, setRecordingPayment] = useState(false);

    const { toast } = useToast();

    // Look up patient by phone number
    const handleSearchPatient = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchPhone) return;
        setSearching(true);
        setPatient(null);
        setPendingCharges([]);
        setPolicies([]);
        setActiveInvoice(null);
        try {
            const res = await api.get(`/auth/patient/phone/${searchPhone}`);
            setPatient(res.data);
            toast("Patient record located successfully.", "success");
            fetchPatientChargesAndPolicies(res.data._id);
        } catch (err: any) {
            console.error(err);
            toast("Patient record not found for this phone number.", "error");
        } finally {
            setSearching(false);
        }
    };

    const fetchPatientChargesAndPolicies = async (patientId: string) => {
        setLoadingCharges(true);
        try {
            // Fetch unbilled services
            const chargesRes = await api.get(`/billing/pending-charges/${patientId}`);
            setPendingCharges(chargesRes.data || []);

            // Fetch insurance policies
            const policiesRes = await api.get(`/billing/insurance/policies/${patientId}`);
            setPolicies(policiesRes.data || []);
        } catch (e) {
            console.error("Failed to load patient charges", e);
            toast("Could not retrieve patient clinical records.", "error");
        } finally {
            setLoadingCharges(false);
        }
    };

    // Calculate totals on the UI before generation
    const subtotal = pendingCharges.reduce((sum, item) => sum + item.unit_price, 0);
    const gstTotal = pendingCharges.reduce((sum, item) => sum + item.gst_amount, 0);
    const billingTotal = subtotal + gstTotal;
    const finalBillAmount = Math.max(0, billingTotal - discountAmount);

    const selectedPolicy = policies.find(p => p._id === selectedPolicyId);
    const insuranceCoverage = selectedPolicy 
        ? Math.min((finalBillAmount * selectedPolicy.coverage_percentage) / 100, selectedPolicy.balance_limit)
        : 0;
    const coPayAmount = Math.max(0, finalBillAmount - insuranceCoverage);

    // Generate unified Invoice
    const handleGenerateInvoice = async () => {
        if (!patient) return;
        setGeneratingInvoice(true);
        try {
            const res = await api.post('/billing/invoices/generate', {
                patientId: patient._id,
                discount_amount: discountAmount,
                insurance_id: selectedPolicyId || undefined
            });
            setActiveInvoice(res.data);
            setPaymentAmount(res.data.remaining_balance.toString());
            setPendingCharges([]); // cleared since invoiced
            toast("Unified invoice generated successfully!", "success");
        } catch (e: any) {
            console.error(e);
            toast(e.response?.data?.message || "Failed to generate invoice.", "error");
        } finally {
            setGeneratingInvoice(false);
        }
    };

    // Record offline counter payment
    const handleCollectPayment = async () => {
        if (!activeInvoice) return;
        const amount = parseFloat(paymentAmount);
        if (isNaN(amount) || amount <= 0) {
            toast("Please specify a valid payment amount.", "error");
            return;
        }
        setRecordingPayment(true);
        try {
            const res = await api.post(`/billing/invoices/${activeInvoice._id}/pay/offline`, {
                amount,
                payment_method: paymentMethod
            });
            setActiveInvoice(res.data.invoice);
            setPaymentAmount(res.data.invoice.remaining_balance.toString());
            toast("Payment recorded successfully at the counter!", "success");
        } catch (e: any) {
            console.error(e);
            toast(e.response?.data?.message || "Could not save payment log.", "error");
        } finally {
            setRecordingPayment(false);
        }
    };

    // Print Receipt using jsPDF
    const handleDownloadReceipt = () => {
        if (!activeInvoice || !patient) return;
        try {
            const doc = new jsPDF();
            
            // Header
            doc.setFont("helvetica", "bold");
            doc.setFontSize(22);
            doc.setTextColor(30, 41, 59); // slate-800
            doc.text("AROGYAMITRA HOSPITAL", 14, 20);
            
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.setTextColor(100, 116, 139); // slate-500
            doc.text("123 Health Care Street, Sector 4, New Delhi", 14, 26);
            doc.text("Contact: +91 98765 43210 | billing@arogyamitra.org", 14, 31);
            
            doc.setDrawColor(226, 232, 240); // slate-200
            doc.line(14, 36, 196, 36);
            
            doc.setFont("helvetica", "bold");
            doc.setFontSize(12);
            doc.setTextColor(30, 41, 59);
            doc.text("INVOICE & PAYMENT RECEIPT", 14, 45);
            
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.text(`Invoice No: ${activeInvoice.invoice_number}`, 14, 52);
            doc.text(`Date: ${new Date(activeInvoice.billing_date).toLocaleDateString('en-IN')}`, 14, 58);
            doc.text(`Status: ${activeInvoice.payment_status}`, 14, 64);
            doc.text(`Billing Desk Counter: Reception Desk 1`, 14, 70);
            
            // Patient Info
            doc.setFont("helvetica", "bold");
            doc.text("BILLED TO:", 120, 45);
            doc.setFont("helvetica", "normal");
            doc.text(`Patient Name: ${patient.name}`, 120, 52);
            doc.text(`Phone: ${patient.phone}`, 120, 58);
            doc.text(`ABHA ID: ${patient.abha_id || 'N/A'}`, 120, 64);
            
            doc.line(14, 76, 196, 76);
            
            // Items
            doc.setFont("helvetica", "bold");
            doc.text("Service Description", 14, 82);
            doc.text("Qty", 115, 82);
            doc.text("Unit Price", 130, 82);
            doc.text("GST", 155, 82);
            doc.text("Total", 196, 82, { align: "right" });
            
            doc.line(14, 86, 196, 86);
            
            doc.setFont("helvetica", "normal");
            let y = 92;
            activeInvoice.items.forEach((item: any) => {
                doc.text(item.name, 14, y);
                doc.text(String(item.quantity), 115, y);
                doc.text(`Rs. ${(item.unit_price || 0).toFixed(2)}`, 130, y);
                doc.text(`${item.gst_rate}%`, 155, y);
                doc.text(`Rs. ${(item.total_price || 0).toFixed(2)}`, 196, y, { align: "right" });
                y += 8;
            });
            
            doc.line(14, y, 196, y);
            y += 8;
            doc.setFont("helvetica", "bold");
            doc.text("Subtotal:", 135, y);
            doc.setFont("helvetica", "normal");
            doc.text(`Rs. ${(activeInvoice.subtotal || 0).toFixed(2)}`, 196, y, { align: "right" });
            
            y += 8;
            doc.setFont("helvetica", "bold");
            doc.text("GST Tax:", 135, y);
            doc.setFont("helvetica", "normal");
            doc.text(`Rs. ${(activeInvoice.gst_amount || 0).toFixed(2)}`, 196, y, { align: "right" });
            
            if (activeInvoice.discount_amount > 0) {
                y += 8;
                doc.setFont("helvetica", "bold");
                doc.text("Discount:", 135, y);
                doc.setFont("helvetica", "normal");
                doc.text(`- Rs. ${(activeInvoice.discount_amount).toFixed(2)}`, 196, y, { align: "right" });
            }
            
            if (activeInvoice.insurance_covered_amount > 0) {
                y += 8;
                doc.setFont("helvetica", "bold");
                doc.text("Insurance covered:", 135, y);
                doc.setFont("helvetica", "normal");
                doc.text(`- Rs. ${(activeInvoice.insurance_covered_amount).toFixed(2)}`, 196, y, { align: "right" });
            }
            
            y += 10;
            doc.setFont("helvetica", "bold");
            doc.text("Amount Paid:", 135, y);
            doc.text(`Rs. ${(activeInvoice.amount_paid || 0).toFixed(2)}`, 196, y, { align: "right" });
            
            if (activeInvoice.remaining_balance > 0) {
                y += 8;
                doc.setFont("helvetica", "bold");
                doc.text("Remaining co-pay:", 135, y);
                doc.text(`Rs. ${(activeInvoice.remaining_balance).toFixed(2)}`, 196, y, { align: "right" });
            }
            
            y += 20;
            doc.setFont("helvetica", "italic");
            doc.setFontSize(9);
            doc.setTextColor(148, 163, 184);
            doc.text("Thank you for choosing ArogyaMitra. Have a healthy day!", 14, y);
            
            doc.save(`ArogyaMitra_Counter_Receipt_${activeInvoice.invoice_number}.pdf`);
            toast("Counter receipt printed successfully!", "success");
        } catch (err: any) {
            console.error(err);
            toast("Failed to print invoice PDF.", "error");
        }
    };

    return (
        <DashboardLayout role="reception">
            {/* Page Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <CreditCard className="w-8 h-8 text-blue-600" />
                        Counter Billing Workspace
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">Collect outpatient charges, apply insurance claims, and process cash payments.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Panel: Search & Patient Meta */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Search Form */}
                    <GlassCard className="bg-gradient-to-br from-white to-blue-50/10 dark:from-slate-900 dark:to-blue-950/5">
                        <h3 className="font-bold text-slate-800 dark:text-white text-base mb-4 flex items-center gap-2">
                            <Search className="w-5 h-5 text-blue-600" /> Retrieve Patient Record
                        </h3>
                        <form onSubmit={handleSearchPatient} className="space-y-4">
                            <div className="space-y-1">
                                <Label htmlFor="phone">Phone Number</Label>
                                <div className="relative">
                                    <Input 
                                        id="phone" 
                                        type="tel" 
                                        placeholder="e.g. 9876543210" 
                                        value={searchPhone}
                                        onChange={(e) => setSearchPhone(e.target.value)}
                                        className="pl-10"
                                    />
                                    <span className="absolute left-3 top-3 text-slate-400">📞</span>
                                </div>
                            </div>
                            <Button 
                                type="submit" 
                                className="w-full bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                                disabled={searching}
                            >
                                {searching ? 'Searching...' : 'Locate Account'}
                            </Button>
                        </form>
                    </GlassCard>

                    {/* Patient Profile */}
                    {patient && (
                        <GlassCard>
                            <h3 className="font-bold text-slate-800 dark:text-white text-base mb-4 flex items-center gap-2">
                                <User className="w-5 h-5 text-blue-600" /> Patient Details
                            </h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                                    <span className="text-slate-400">Full Name</span>
                                    <span className="font-bold text-slate-800 dark:text-white">{patient.name}</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                                    <span className="text-slate-400">ABHA Health ID</span>
                                    <span className="font-semibold text-slate-800 dark:text-white">{patient.abha_id || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                                    <span className="text-slate-400">Age / Gender</span>
                                    <span className="font-medium text-slate-800 dark:text-white">{patient.age} Yrs / {patient.gender}</span>
                                </div>
                                <div className="flex justify-between pb-1">
                                    <span className="text-slate-400">Registered ID</span>
                                    <span className="font-mono text-slate-800 dark:text-white">{patient.patient_id}</span>
                                </div>
                            </div>
                        </GlassCard>
                    )}
                </div>

                {/* Right Panel: Charges & Invoicing */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Unbilled Charges */}
                    {patient && !activeInvoice && (
                        <GlassCard className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                            <h3 className="font-bold text-slate-800 dark:text-white text-base mb-4 flex items-center gap-2">
                                <ShoppingCart className="w-5 h-5 text-blue-600" /> Unbilled Procedures & Prescriptions
                            </h3>

                            {loadingCharges ? (
                                <div className="flex justify-center py-8">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                                </div>
                            ) : pendingCharges.length === 0 ? (
                                <div className="text-center py-10 text-slate-400">
                                    <p className="font-medium">No pending unbilled items found.</p>
                                    <p className="text-xs mt-1">Check if clinical procedures have been marked 'Completed' by the doctor/laboratory.</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Table of items */}
                                    <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
                                        <table className="w-full text-left text-xs border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
                                                    <th className="px-4 py-2 font-semibold text-slate-500">Service Line Item</th>
                                                    <th className="px-4 py-2 font-semibold text-slate-500">Type</th>
                                                    <th className="px-4 py-2 font-semibold text-slate-500">Subtotal</th>
                                                    <th className="px-4 py-2 font-semibold text-slate-500">GST</th>
                                                    <th className="px-4 py-2 font-semibold text-slate-500 text-right">Total Price</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                {pendingCharges.map((item, idx) => (
                                                    <tr key={idx}>
                                                        <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">{item.name}</td>
                                                        <td className="px-4 py-3"><Badge variant="outline" className="capitalize text-[10px]">{item.type}</Badge></td>
                                                        <td className="px-4 py-3 text-slate-600">₹{item.unit_price}</td>
                                                        <td className="px-4 py-3 text-slate-600">{item.gst_rate}%</td>
                                                        <td className="px-4 py-3 font-semibold text-slate-800 dark:text-white text-right">₹{item.total_price}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Adjustments & Calculations */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                                        <div className="space-y-4">
                                            <div className="space-y-1">
                                                <Label htmlFor="discount">Apply Counter Discount (₹)</Label>
                                                <Input 
                                                    id="discount" 
                                                    type="number" 
                                                    value={discountAmount || ''}
                                                    onChange={(e) => setDiscountAmount(Number(e.target.value))}
                                                    placeholder="Enter discount amount"
                                                />
                                            </div>

                                            <div className="space-y-1">
                                                <Label htmlFor="insurance">Select Co-pay Insurance</Label>
                                                <select 
                                                    id="insurance"
                                                    value={selectedPolicyId}
                                                    onChange={(e) => setSelectedPolicyId(e.target.value)}
                                                    className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="">No Insurance (Full Self-Pay)</option>
                                                    {policies.map(p => (
                                                        <option key={p._id} value={p._id}>
                                                            {p.provider} ({p.coverage_percentage}% up to ₹{p.balance_limit})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl space-y-3 text-sm">
                                            <div className="flex justify-between text-slate-500">
                                                <span>Charges Subtotal:</span>
                                                <span>₹{subtotal.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-slate-500">
                                                <span>GST Tax amount:</span>
                                                <span>₹{gstTotal.toFixed(2)}</span>
                                            </div>
                                            {discountAmount > 0 && (
                                                <div className="flex justify-between text-rose-500">
                                                    <span>Discount:</span>
                                                    <span>- ₹{discountAmount.toFixed(2)}</span>
                                                </div>
                                            )}
                                            {insuranceCoverage > 0 && (
                                                <div className="flex justify-between text-teal-600">
                                                    <span>Insurance Covered:</span>
                                                    <span>- ₹{insuranceCoverage.toFixed(2)}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between font-bold text-slate-800 dark:text-white text-base pt-2 border-t border-dashed border-slate-200">
                                                <span>Out-of-Pocket Co-pay:</span>
                                                <span>₹{coPayAmount.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action button */}
                                    <div className="flex justify-end pt-2">
                                        <Button 
                                            onClick={handleGenerateInvoice}
                                            className="bg-blue-600 text-white hover:bg-blue-700 shadow-md flex items-center gap-2"
                                            disabled={generatingInvoice}
                                        >
                                            {generatingInvoice ? 'Saving Invoice...' : 'Generate Unified Invoice'}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </GlassCard>
                    )}

                    {/* Active Invoice & Payment Counter */}
                    {activeInvoice && (
                        <GlassCard className="border-emerald-100 dark:border-emerald-950/20 bg-gradient-to-br from-white to-emerald-50/10 dark:from-slate-900 dark:to-emerald-950/5">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <Badge className="bg-emerald-100 text-emerald-800 border-0 mb-1">Invoice Generated</Badge>
                                    <h3 className="font-bold text-slate-900 dark:text-white text-lg">Invoice {activeInvoice.invoice_number}</h3>
                                    <p className="text-xs text-slate-400">Status: <span className="font-semibold text-slate-600 dark:text-slate-300">{activeInvoice.payment_status}</span></p>
                                </div>
                                <Button 
                                    onClick={handleDownloadReceipt}
                                    variant="outline"
                                    className="flex items-center gap-2"
                                >
                                    <Download className="w-4 h-4" /> Download PDF Receipt
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                                {/* Bill breakdown */}
                                <div className="space-y-2 text-sm bg-white dark:bg-slate-900 p-4 border border-slate-100 dark:border-slate-800 rounded-2xl">
                                    <div className="flex justify-between text-slate-400">
                                        <span>Subtotal + GST:</span>
                                        <span className="text-slate-800 dark:text-white font-medium">₹{(activeInvoice.subtotal || 0) + (activeInvoice.gst_amount || 0)}</span>
                                    </div>
                                    {activeInvoice.discount_amount > 0 && (
                                        <div className="flex justify-between text-slate-400">
                                            <span>Discounts:</span>
                                            <span className="text-rose-500 font-medium">- ₹{activeInvoice.discount_amount}</span>
                                        </div>
                                    )}
                                    {activeInvoice.insurance_covered_amount > 0 && (
                                        <div className="flex justify-between text-slate-400">
                                            <span>Insurance Cover:</span>
                                            <span className="text-teal-600 font-medium">- ₹{activeInvoice.insurance_covered_amount}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between font-bold text-slate-800 dark:text-white pt-2 border-t border-slate-100">
                                        <span>Final Billed:</span>
                                        <span>₹{activeInvoice.final_amount}</span>
                                    </div>
                                    <div className="flex justify-between text-emerald-600 font-semibold">
                                        <span>Total Paid:</span>
                                        <span>₹{activeInvoice.amount_paid}</span>
                                    </div>
                                    {activeInvoice.remaining_balance > 0 && (
                                        <div className="flex justify-between text-red-500 font-semibold">
                                            <span>Remaining Balance:</span>
                                            <span>₹{activeInvoice.remaining_balance}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Collect Payment Form */}
                                {activeInvoice.remaining_balance > 0 ? (
                                    <div className="space-y-4">
                                        <h4 className="font-bold text-slate-800 dark:text-white text-sm">Record Patient Payment</h4>
                                        
                                        <div className="space-y-1">
                                            <Label htmlFor="payAmount">Payment Amount (₹)</Label>
                                            <Input 
                                                id="payAmount" 
                                                type="number" 
                                                value={paymentAmount}
                                                onChange={(e) => setPaymentAmount(e.target.value)}
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <Label>Payment Mode</Label>
                                            <div className="grid grid-cols-3 gap-3">
                                                {['Cash', 'Card', 'UPI'].map((mode) => (
                                                    <button
                                                        key={mode}
                                                        type="button"
                                                        onClick={() => setPaymentMethod(mode as any)}
                                                        className={`h-10 text-sm font-semibold rounded-lg border transition-all ${
                                                            paymentMethod === mode 
                                                                ? 'border-blue-600 bg-blue-50 text-blue-600 dark:bg-blue-950/20' 
                                                                : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50'
                                                        }`}
                                                    >
                                                        {mode}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <Button 
                                            onClick={handleCollectPayment}
                                            className="w-full bg-emerald-600 text-white hover:bg-emerald-700 shadow-md"
                                            disabled={recordingPayment}
                                        >
                                            {recordingPayment ? 'Saving Record...' : 'Confirm Offline Cashout'}
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center p-6 bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl text-center">
                                        <CheckCircle className="w-12 h-12 text-emerald-600 mb-2 animate-bounce" />
                                        <p className="font-bold text-emerald-800 dark:text-emerald-300">Fully Paid & Reconciled</p>
                                        <p className="text-xs text-slate-400 mt-1">This billing case is settled. You can download the PDF receipt above.</p>
                                        <Button 
                                            onClick={() => {
                                                setPatient(null);
                                                setActiveInvoice(null);
                                                setSearchPhone('');
                                            }}
                                            variant="outline"
                                            className="mt-4"
                                        >
                                            Next Billed Patient
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </GlassCard>
                    )}

                    {/* Default state */}
                    {!patient && (
                        <div className="p-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-center text-slate-400 bg-white dark:bg-slate-900">
                            <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <p className="font-medium">No patient selected.</p>
                            <p className="text-xs">Enter a registered patient phone number on the left panel to retrieve outpatient invoice options.</p>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
