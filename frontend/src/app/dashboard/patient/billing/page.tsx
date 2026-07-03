'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from "@/components/layout/DashboardLayout";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
    CreditCard, Receipt, ShieldCheck, Download, AlertCircle, 
    Calendar, CheckCircle2, DollarSign, ArrowRight, Eye, RefreshCw
} from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/components/providers/ToastProvider";
import { jsPDF } from "jspdf";

// Dynamic script loader for Razorpay Checkout
const loadRazorpayScript = () => {
    return new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

export default function PatientBillingPage() {
    const [user, setUser] = useState<any>(null);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [policies, setPolicies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
    const [payingInvoiceId, setPayingInvoiceId] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
            fetchBillingData(parsedUser._id);
        }
    }, []);

    const fetchBillingData = async (patientId: string) => {
        setLoading(true);
        try {
            // Fetch patient invoices
            const invRes = await api.get(`/billing/invoices?patientId=${patientId}`);
            setInvoices(invRes.data || []);

            // Fetch patient insurance policies
            const polRes = await api.get(`/billing/insurance/policies/${patientId}`);
            setPolicies(Array.isArray(polRes.data?.policies) ? polRes.data.policies : Array.isArray(polRes.data) ? polRes.data : []);
        } catch (e: any) {
            console.error("Failed to load billing history", e);
            toast("Could not retrieve billing and insurance history.", "error");
        } finally {
            setLoading(false);
        }
    };

    // Trigger online payment flow via Razorpay Checkout
    const handlePayOnline = async (invoice: any) => {
        setPayingInvoiceId(invoice._id);
        try {
            // 1. Load Razorpay Checkout Script
            const isLoaded = await loadRazorpayScript();
            if (!isLoaded) {
                toast("Failed to load Razorpay payment gateway SDK.", "error");
                setPayingInvoiceId(null);
                return;
            }

            // 2. Call backend to create Razorpay Order
            const orderRes = await api.post(`/billing/invoices/${invoice._id}/pay/online`);
            const { keyId, orderId, amount, currency } = orderRes.data;

            // 3. Open Razorpay Checkout modal
            const options = {
                key: keyId,
                amount: amount,
                currency: currency,
                name: "ArogyaMitra Hospital",
                description: `Payment for Invoice ${invoice.invoice_number}`,
                order_id: orderId,
                handler: async function (response: any) {
                    try {
                        toast("Payment authorized. Verifying transaction...", "info");
                        // 4. Verify signature on backend
                        const verifyRes = await api.post(`/billing/invoices/${invoice._id}/verify/online`, {
                            razorpayOrderId: response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature
                        });

                        toast("Payment processed successfully!", "success");
                        if (user) {
                            fetchBillingData(user._id);
                        }
                    } catch (err: any) {
                        toast("Verification failed: " + (err.response?.data?.message || err.message), "error");
                    }
                },
                prefill: {
                    name: user?.name || "",
                    email: user?.email || "",
                    contact: user?.phone || ""
                },
                theme: {
                    color: "#2563eb"
                }
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.on('payment.failed', function (response: any) {
                toast("Payment failed: " + response.error.description, "error");
            });
            rzp.open();
        } catch (e: any) {
            console.error("Payment initiation failed", e);
            toast(e.response?.data?.message || "Could not initiate Razorpay transaction.", "error");
        } finally {
            setPayingInvoiceId(null);
        }
    };

    // Helper: Print / Download PDF
    const handleDownloadReceipt = (invoice: any) => {
        try {
            const doc = new jsPDF();
            
            // Hospital Header
            doc.setFont("helvetica", "bold");
            doc.setFontSize(22);
            doc.setTextColor(30, 41, 59); // slate-800
            doc.text("AROGYAMITRA HOSPITAL", 14, 20);
            
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.setTextColor(100, 116, 139); // slate-500
            doc.text("123 Health Care Street, Sector 4, New Delhi", 14, 26);
            doc.text("Contact: +91 98765 43210 | billing@arogyamitra.org", 14, 31);
            
            // Divider line
            doc.setDrawColor(226, 232, 240); // slate-200
            doc.line(14, 36, 196, 36);
            
            // Invoice details
            doc.setFont("helvetica", "bold");
            doc.setFontSize(12);
            doc.setTextColor(30, 41, 59);
            doc.text("INVOICE & PAYMENT RECEIPT", 14, 45);
            
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.text(`Invoice No: ${invoice.invoice_number}`, 14, 52);
            doc.text(`Date: ${new Date(invoice.billing_date).toLocaleDateString('en-IN')}`, 14, 58);
            doc.text(`Payment Status: ${invoice.payment_status}`, 14, 64);
            doc.text(`Payment Method: ${invoice.payment_method || 'N/A'}`, 14, 70);
            
            // Patient details
            doc.setFont("helvetica", "bold");
            doc.text("BILLED TO:", 120, 45);
            doc.setFont("helvetica", "normal");
            doc.text(`Patient Name: ${user?.name || 'Patient'}`, 120, 52);
            doc.text(`Phone: ${user?.phone || 'N/A'}`, 120, 58);
            doc.text(`Email: ${user?.email || 'N/A'}`, 120, 64);
            
            // Divider
            doc.line(14, 76, 196, 76);
            
            // Table Header
            doc.setFont("helvetica", "bold");
            doc.text("Service / Item Description", 14, 82);
            doc.text("Qty", 115, 82);
            doc.text("Unit Price", 130, 82);
            doc.text("GST", 155, 82);
            doc.text("Total Amount", 196, 82, { align: "right" });
            
            doc.line(14, 86, 196, 86);
            
            // Table rows
            doc.setFont("helvetica", "normal");
            let y = 92;
            const items = invoice.items || [];
            items.forEach((item: any) => {
                doc.text(item.name || 'Hospital Service', 14, y);
                doc.text(String(item.quantity || 1), 115, y);
                doc.text(`Rs. ${(item.unit_price || 0).toFixed(2)}`, 130, y);
                doc.text(`${item.gst_rate || 0}%`, 155, y);
                doc.text(`Rs. ${(item.total_price || 0).toFixed(2)}`, 196, y, { align: "right" });
                y += 8;
            });
            
            // Subtotal calculations
            doc.line(14, y, 196, y);
            y += 8;
            doc.setFont("helvetica", "bold");
            doc.text("Subtotal:", 135, y);
            doc.setFont("helvetica", "normal");
            doc.text(`Rs. ${(invoice.subtotal || 0).toFixed(2)}`, 196, y, { align: "right" });
            
            y += 8;
            doc.setFont("helvetica", "bold");
            doc.text("GST Amount:", 135, y);
            doc.setFont("helvetica", "normal");
            doc.text(`Rs. ${(invoice.gst_amount || 0).toFixed(2)}`, 196, y, { align: "right" });
            
            if (invoice.discount_amount > 0) {
                y += 8;
                doc.setFont("helvetica", "bold");
                doc.text("Discounts:", 135, y);
                doc.setFont("helvetica", "normal");
                doc.text(`- Rs. ${(invoice.discount_amount).toFixed(2)}`, 196, y, { align: "right" });
            }
            
            if (invoice.insurance_covered_amount > 0) {
                y += 8;
                doc.setFont("helvetica", "bold");
                doc.text("Insurance Cover:", 135, y);
                doc.setFont("helvetica", "normal");
                doc.text(`- Rs. ${(invoice.insurance_covered_amount).toFixed(2)}`, 196, y, { align: "right" });
            }
            
            y += 10;
            doc.setFont("helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Total Paid Amount:", 135, y);
            doc.text(`Rs. ${(invoice.amount_paid || 0).toFixed(2)}`, 196, y, { align: "right" });
            
            if (invoice.remaining_balance > 0) {
                y += 8;
                doc.setFont("helvetica", "bold");
                doc.setTextColor(239, 68, 68); // Red
                doc.text("Remaining Balance:", 135, y);
                doc.text(`Rs. ${(invoice.remaining_balance).toFixed(2)}`, 196, y, { align: "right" });
            }
            
            // Footer
            y += 20;
            doc.setFont("helvetica", "italic");
            doc.setFontSize(9);
            doc.setTextColor(148, 163, 184); // slate-400
            doc.text("This receipt is electronically verified and does not require a physical signature.", 14, y);
            doc.text("Thank you for partnering with us for your healthcare needs.", 14, y + 4);
            
            doc.save(`ArogyaMitra_Receipt_${invoice.invoice_number}.pdf`);
            toast("PDF Receipt downloaded successfully!", "success");
        } catch (err: any) {
            console.error("PDF generation failed", err);
            toast("Could not compile PDF receipt.", "error");
        }
    };

    return (
        <DashboardLayout role="patient">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <CreditCard className="w-8 h-8 text-blue-600" />
                        Billing & Insurance
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">View insurance coverage and securely settle outstanding bills.</p>
                </div>
                <Button 
                    onClick={() => user && fetchBillingData(user._id)}
                    variant="outline"
                    className="flex items-center gap-2"
                >
                    <RefreshCw className="w-4 h-4" /> Refresh
                </Button>
            </div>

            {/* Insurance Policies Overview */}
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-teal-600" /> Linked Insurance Coverage
            </h2>
            {policies.length === 0 ? (
                <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-slate-500 mb-8">
                    <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold">No active insurance policy found.</p>
                    <p className="text-sm">Please register your insurance policy at the reception counter.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {policies.map((policy) => (
                        <GlassCard key={policy._id} className="relative overflow-hidden border-teal-100 dark:border-teal-900/20 bg-gradient-to-br from-white to-teal-50/20 dark:from-slate-900 dark:to-teal-950/10">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full -mr-8 -mt-8" />
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <Badge className="bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300 mb-1 border-0">
                                        {policy.insurance_type} Policy
                                    </Badge>
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">{policy.provider}</h3>
                                    <p className="text-xs text-slate-400">Policy No: <span className="font-semibold">{policy.policy_number}</span></p>
                                </div>
                                <ShieldCheck className="w-10 h-10 text-teal-500 opacity-60" />
                            </div>

                            <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <div>
                                    <p className="text-xs text-slate-400">Coverage</p>
                                    <p className="text-base font-bold text-teal-600 dark:text-teal-400">{policy.coverage_percentage}%</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400">Total Limit</p>
                                    <p className="text-base font-bold text-slate-800 dark:text-white">₹{policy.coverage_limit}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400">Remaining Balance</p>
                                    <p className="text-base font-bold text-slate-800 dark:text-white">₹{policy.balance_limit}</p>
                                </div>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            )}

            {/* Invoices List */}
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-blue-600" /> Invoice & Receipt History
            </h2>

            {loading ? (
                <div className="flex items-center justify-center p-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
            ) : invoices.length === 0 ? (
                <div className="p-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-center text-slate-500 bg-white dark:bg-slate-900">
                    <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="font-semibold">No invoices generated yet.</p>
                    <p className="text-sm">Unbilled procedures will appear here once finalized by clinical staff.</p>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Invoice Info</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Billed Items</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Final Amount</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Method</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {invoices.map((inv) => (
                                    <tr key={inv._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                                        <td className="px-6 py-4">
                                            <p className="font-semibold text-slate-800 dark:text-white">{inv.invoice_number}</p>
                                            <p className="text-xs text-slate-400 flex items-center gap-1">
                                                <Calendar className="w-3 h-3" /> {new Date(inv.billing_date).toLocaleDateString('en-IN')}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 max-w-xs truncate">
                                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                {inv.items?.map((it: any) => it.name).join(', ') || 'General Ward Care'}
                                            </p>
                                            <p className="text-xs text-slate-400">{inv.items?.length || 0} service line items</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-slate-800 dark:text-white">₹{inv.final_amount}</p>
                                            {inv.insurance_covered_amount > 0 && (
                                                <p className="text-xs text-teal-600 dark:text-teal-400">Ins covered: ₹{inv.insurance_covered_amount}</p>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge className={`border-0 font-medium ${
                                                inv.payment_status === 'Paid' 
                                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                                                    : inv.payment_status === 'Refunded'
                                                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300'
                                                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                                            }`}>
                                                {inv.payment_status}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 capitalize">
                                            {inv.payment_method || 'Pending'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button 
                                                    onClick={() => setSelectedInvoice(inv)}
                                                    variant="ghost" 
                                                    size="sm"
                                                    className="h-8 px-2 text-slate-500 hover:text-slate-800 dark:hover:text-white"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                                
                                                <Button 
                                                    onClick={() => handleDownloadReceipt(inv)}
                                                    variant="ghost" 
                                                    size="sm"
                                                    className="h-8 px-2 text-slate-500 hover:text-slate-800 dark:hover:text-white"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </Button>

                                                {inv.payment_status === 'Pending' && (
                                                    <Button 
                                                        onClick={() => handlePayOnline(inv)}
                                                        disabled={payingInvoiceId === inv._id}
                                                        size="sm"
                                                        className="h-8 bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                                                    >
                                                        {payingInvoiceId === inv._id ? 'Processing...' : 'Pay Online'}
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Detailed Invoice modal */}
            {selectedInvoice && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in-50 zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="bg-slate-50 dark:bg-slate-900/80 px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white text-lg">Invoice Details</h3>
                                <p className="text-xs text-slate-400">Reference: {selectedInvoice.invoice_number}</p>
                            </div>
                            <Button 
                                onClick={() => setSelectedInvoice(null)}
                                variant="ghost" 
                                className="h-8 w-8 p-0 rounded-full"
                            >
                                ✕
                            </Button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                            {/* Meta Grid */}
                            <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl">
                                <div>
                                    <p className="text-slate-400 text-xs">Billing Date</p>
                                    <p className="font-medium text-slate-700 dark:text-slate-300">
                                        {new Date(selectedInvoice.billing_date).toLocaleString('en-IN')}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-slate-400 text-xs">Payment Method</p>
                                    <p className="font-medium text-slate-700 dark:text-slate-300 capitalize">
                                        {selectedInvoice.payment_method || 'Not settled yet'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-slate-400 text-xs">Subtotal</p>
                                    <p className="font-medium text-slate-700 dark:text-slate-300">₹{selectedInvoice.subtotal}</p>
                                </div>
                                <div>
                                    <p className="text-slate-400 text-xs">GST Tax Charge</p>
                                    <p className="font-medium text-slate-700 dark:text-slate-300">₹{selectedInvoice.gst_amount}</p>
                                </div>
                            </div>

                            {/* Itemized Line Items */}
                            <div className="space-y-3">
                                <h4 className="font-bold text-slate-800 dark:text-white text-sm">Itemized Charges</h4>
                                <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
                                                <th className="px-4 py-2 font-semibold text-slate-500">Item</th>
                                                <th className="px-4 py-2 font-semibold text-slate-500">Qty</th>
                                                <th className="px-4 py-2 font-semibold text-slate-500">Unit Price</th>
                                                <th className="px-4 py-2 font-semibold text-slate-500 text-right">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {selectedInvoice.items?.map((item: any, idx: number) => (
                                                <tr key={idx}>
                                                    <td className="px-4 py-3">
                                                        <p className="font-medium text-slate-700 dark:text-slate-300">{item.name}</p>
                                                        <p className="text-[10px] text-slate-400 capitalize">{item.type} • GST {item.gst_rate}%</p>
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{item.quantity}</td>
                                                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">₹{item.unit_price}</td>
                                                    <td className="px-4 py-3 text-slate-800 dark:text-white font-semibold text-right">₹{item.total_price}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Total Settlement Details */}
                            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2">
                                <div className="flex justify-between text-sm text-slate-500">
                                    <span>Subtotal + GST:</span>
                                    <span>₹{(selectedInvoice.subtotal || 0) + (selectedInvoice.gst_amount || 0)}</span>
                                </div>
                                {selectedInvoice.discount_amount > 0 && (
                                    <div className="flex justify-between text-sm text-slate-500">
                                        <span>Discount Deductions:</span>
                                        <span className="text-red-500">- ₹{selectedInvoice.discount_amount}</span>
                                    </div>
                                )}
                                {selectedInvoice.insurance_covered_amount > 0 && (
                                    <div className="flex justify-between text-sm text-teal-600">
                                        <span>Insurance Claims Settled:</span>
                                        <span>- ₹{selectedInvoice.insurance_covered_amount}</span>
                                    </div>
                                )}
                                <div className="flex justify-between font-bold text-slate-800 dark:text-white text-base pt-2 border-t border-dashed border-slate-100 dark:border-slate-800">
                                    <span>Final Payable Amount:</span>
                                    <span>₹{selectedInvoice.final_amount}</span>
                                </div>
                                <div className="flex justify-between text-sm font-semibold text-emerald-600 pt-1">
                                    <span>Amount Paid / Settled:</span>
                                    <span>₹{selectedInvoice.amount_paid}</span>
                                </div>
                                {selectedInvoice.remaining_balance > 0 && (
                                    <div className="flex justify-between text-sm font-semibold text-red-500 pt-1">
                                        <span>Remaining Co-pay Balance:</span>
                                        <span>₹{selectedInvoice.remaining_balance}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="bg-slate-50 dark:bg-slate-900/80 px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <Button 
                                onClick={() => handleDownloadReceipt(selectedInvoice)}
                                variant="outline"
                                className="flex items-center gap-2"
                            >
                                <Download className="w-4 h-4" /> Download PDF Receipt
                            </Button>
                            
                            <div className="flex items-center gap-2">
                                <Button 
                                    onClick={() => setSelectedInvoice(null)}
                                    variant="ghost"
                                >
                                    Close
                                </Button>
                                {selectedInvoice.payment_status === 'Pending' && (
                                    <Button 
                                        onClick={() => {
                                            setSelectedInvoice(null);
                                            handlePayOnline(selectedInvoice);
                                        }}
                                        className="bg-blue-600 text-white hover:bg-blue-700"
                                    >
                                        Pay Now (Online)
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
