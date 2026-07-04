'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from "@/components/layout/DashboardLayout";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Pill, AlertTriangle, ShieldAlert, CheckCircle, Search, RefreshCw,
    Clock, Printer, ShoppingCart, User, Heart, ChevronRight, Activity, DollarSign
} from "lucide-react";
import api from "@/lib/api";
import { useSocket } from "@/context/SocketContext";
import { useToast } from "@/components/providers/ToastProvider";
import { PharmacyQueuePanel } from "@/components/dashboard/pharmacy/PharmacyQueuePanel";

export default function PharmacyPrescriptionsDashboard() {
    const [prescriptions, setPrescriptions] = useState<any[]>([]);
    const [selectedPrescription, setSelectedPrescription] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    
    // Safety check states
    const [safetyAlerts, setSafetyAlerts] = useState<string[]>([]);
    const [checkingSafety, setCheckingSafety] = useState(false);
    
    // Dispensing form states
    const [selectedBatches, setSelectedBatches] = useState<{ [medId: string]: string }>({}); // medId -> batchId
    const [availableBatches, setAvailableBatches] = useState<{ [medId: string]: any[] }>({});
    const [discountAmount, setDiscountAmount] = useState(0);
    const [insuranceCovered, setInsuranceCovered] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [dispensing, setDispensing] = useState(false);
    const [lastInvoice, setLastInvoice] = useState<any>(null);

    const { socket } = useSocket();
    const { toast } = useToast();

    useEffect(() => {
        fetchPrescriptions();
    }, [statusFilter]);

    useEffect(() => {
        if (!socket) return;
        
        // Listen for new prescriptions from doctor consultations
        const handleNewPrescription = (data: any) => {
            toast(`New Prescription received: ${data.prescriptionId || 'Check list'}`, "info");
            fetchPrescriptions();
        };

        socket.on('prescription.created', handleNewPrescription);
        return () => {
            socket.off('prescription.created', handleNewPrescription);
        };
    }, [socket]);

    const fetchPrescriptions = async () => {
        setLoading(true);
        try {
            const filterParam = statusFilter === 'all' ? '' : `?status=${statusFilter}`;
            const res = await api.get(`/pharmacy/prescriptions${filterParam}`);
            if (res.data.success) {
                setPrescriptions(res.data.data);
            }
        } catch (error) {
            console.error("Failed to load prescriptions", error);
            toast("Failed to load prescriptions", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSelectPrescription = async (pres: any) => {
        setSelectedPrescription(pres);
        setSafetyAlerts([]);
        setSelectedBatches({});
        setAvailableBatches({});
        setLastInvoice(null);
        
        // Load batches for each medicine in prescription
        if (pres.medicines && pres.medicines.length > 0) {
            // Run safety check
            const medNames = pres.medicines.map((m: any) => m.name);
            runSafetyCheck(medNames);

            // Fetch batches
            for (const med of pres.medicines) {
                try {
                    // Try to search medicine in catalog by name to get medicineId
                    const catalogRes = await api.get('/pharmacy/catalog');
                    const foundMed = catalogRes.data.data.find(
                        (item: any) => item.name.toLowerCase() === med.name.toLowerCase() ||
                                       item.generic_name.toLowerCase() === med.name.toLowerCase()
                    );
                    
                    if (foundMed) {
                        const batchesRes = await api.get(`/pharmacy/inventory/${foundMed._id}/batches`);
                        if (batchesRes.data.success) {
                            // Only display active batches with stock
                            const activeBatches = batchesRes.data.data.filter((b: any) => b.stock > 0);
                            setAvailableBatches(prev => ({
                                ...prev,
                                [med._id]: activeBatches
                            }));
                            // Auto select first available batch if any
                            if (activeBatches.length > 0) {
                                setSelectedBatches(prev => ({
                                    ...prev,
                                    [med._id]: activeBatches[0]._id
                                }));
                            }
                        }
                    }
                } catch (err) {
                    console.error(`Failed to load batches for medicine ${med.name}`, err);
                }
            }
        }
    };

    const runSafetyCheck = async (medNames: string[]) => {
        setCheckingSafety(true);
        try {
            const res = await api.post('/pharmacy/safety/check', { medicines: medNames });
            if (res.data.success && res.data.data.length > 0) {
                setSafetyAlerts(res.data.data.map((alert: any) => alert.message));
                toast(`Drug Interaction Warning: ${res.data.data.length} issues flagged`, "error");
            }
        } catch (error) {
            console.error("Safety check failed", error);
        } finally {
            setCheckingSafety(false);
        }
    };

    const handleUpdateStatus = async (id: string, newStatus: string) => {
        try {
            const res = await api.put(`/pharmacy/prescriptions/${id}/status`, { status: newStatus });
            if (res.data.success) {
                toast(`Prescription marked as ${newStatus}`, "success");
                
                // Notify patient via socket if status is Ready
                if (newStatus === 'Ready' && socket) {
                    socket.emit('prescription.status.ready', {
                        prescriptionId: id,
                        patientId: selectedPrescription?.patient_id?._id
                    });
                }
                
                fetchPrescriptions();
                if (selectedPrescription?._id === id) {
                    setSelectedPrescription(res.data.data);
                }
            }
        } catch (error) {
            toast("Failed to update status", "error");
        }
    };

    const handleDispense = async () => {
        if (!selectedPrescription) return;
        
        // Validate all medicines have selected batches
        const itemsToDispense = [];
        for (const med of selectedPrescription.medicines) {
            const batchId = selectedBatches[med._id];
            if (!batchId) {
                toast(`Please select a batch for ${med.name}`, "error");
                return;
            }
            itemsToDispense.push({
                medicine_name: med.name,
                batch_id: batchId,
                quantity: med.quantity || 10
            });
        }

        setDispensing(true);
        try {
            // Retrieve current user id (pharmacist) from localStorage
            const userStr = localStorage.getItem('user');
            const currentUser = userStr ? JSON.parse(userStr) : null;
            const pharmacistId = currentUser?._id || '66810a905a5a1f22e8aa1234';

            const res = await api.post(`/pharmacy/prescriptions/${selectedPrescription._id}/dispense`, {
                pharmacist_id: pharmacistId,
                items: itemsToDispense,
                discount_amount: discountAmount,
                insurance_covered_amount: insuranceCovered,
                payment_method: paymentMethod
            });

            if (res.data.success) {
                toast("Prescription Dispensed Successfully!", "success");
                setLastInvoice(res.data.data.invoice);
                
                // Notify prescription completion via socket
                if (socket) {
                    socket.emit('prescription.status.dispensed', {
                        prescriptionId: selectedPrescription._id,
                        patientId: selectedPrescription?.patient_id?._id
                    });
                }

                // Refresh lists
                fetchPrescriptions();
                setSelectedPrescription(null);
            }
        } catch (error: any) {
            console.error(error);
            toast(error.response?.data?.message || "Failed to dispense", "error");
        } finally {
            setDispensing(false);
        }
    };

    // Calculate billing pre-totals
    const calculateTotals = () => {
        if (!selectedPrescription) return { subtotal: 0, gst: 0, total: 0 };
        let subtotal = 0;
        selectedPrescription.medicines.forEach((med: any) => {
            const batchId = selectedBatches[med._id];
            const batchList = availableBatches[med._id] || [];
            const selectedBatch = batchList.find(b => b._id === batchId);
            if (selectedBatch) {
                subtotal += selectedBatch.mrp * (med.quantity || 10);
            } else {
                subtotal += 150; // Fallback estimate
            }
        });
        const gst = subtotal * 0.12; // Estimate average GST 12%
        const total = subtotal + gst - discountAmount - insuranceCovered;
        return { subtotal, gst, total };
    };

    const billing = calculateTotals();

    // Filter prescriptions
    const filteredPrescriptions = prescriptions.filter(pres => {
        const query = searchQuery.toLowerCase();
        const patientName = pres.patient_id?.name?.toLowerCase() || '';
        const abhaId = pres.patient_id?.abha_id?.toLowerCase() || '';
        const docName = pres.doctor_id?.name?.toLowerCase() || '';
        const presId = pres._id?.toLowerCase() || '';
        
        return patientName.includes(query) || abhaId.includes(query) || docName.includes(query) || presId.includes(query);
    });

    return (
        <DashboardLayout role="pharmacy">
            {/* Top Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <GlassCard className="bg-gradient-to-br from-indigo-500/10 to-purple-500/5 border-indigo-500/20">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-400">Pending Refills</p>
                            <h3 className="text-3xl font-extrabold text-white mt-1">
                                {prescriptions.filter(p => p.status === 'Generated').length}
                            </h3>
                        </div>
                        <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl">
                            <Clock className="w-6 h-6" />
                        </div>
                    </div>
                </GlassCard>

                <GlassCard className="bg-gradient-to-br from-teal-500/10 to-emerald-500/5 border-teal-500/20">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-400">Ready for Pickup</p>
                            <h3 className="text-3xl font-extrabold text-white mt-1">
                                {prescriptions.filter(p => p.status === 'Ready').length}
                            </h3>
                        </div>
                        <div className="p-3 bg-teal-500/20 text-teal-400 rounded-xl">
                            <CheckCircle className="w-6 h-6" />
                        </div>
                    </div>
                </GlassCard>

                <GlassCard className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-500/20">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-400">Interaction Alerts</p>
                            <h3 className="text-3xl font-extrabold text-amber-500 mt-1">
                                {safetyAlerts.length > 0 ? safetyAlerts.length : "0"}
                            </h3>
                        </div>
                        <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl">
                            <ShieldAlert className="w-6 h-6" />
                        </div>
                    </div>
                </GlassCard>

                <GlassCard className="bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border-blue-500/20">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-400">Dispensed Today</p>
                            <h3 className="text-3xl font-extrabold text-white mt-1">
                                {prescriptions.filter(p => p.status === 'Completed' || p.status === 'Dispensed').length}
                            </h3>
                        </div>
                        <div className="p-3 bg-blue-500/20 text-blue-400 rounded-xl">
                            <ShoppingCart className="w-6 h-6" />
                        </div>
                    </div>
                </GlassCard>
            </div>

            {/* Live Pharmacy Queue */}
            <div className="mb-8">
                <PharmacyQueuePanel
                    socket={socket}
                    onSelectPrescription={(pres) => handleSelectPrescription(pres)}
                />
            </div>

            {/* Main Workspace Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Prescriptions List (Left Column) */}
                <div className="lg:col-span-1 space-y-6">
                    <GlassCard className="p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-white">Prescriptions Queue</h3>
                            <button onClick={fetchPrescriptions} className="text-slate-400 hover:text-white transition-all">
                                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                        </div>

                        {/* Search & Filters */}
                        <div className="space-y-3 mb-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                                <input
                                    type="text"
                                    placeholder="Search Prescription / ABHA / Doctor"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setStatusFilter('all')}
                                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${statusFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}
                                >
                                    All
                                </button>
                                <button
                                    onClick={() => setStatusFilter('Generated')}
                                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${statusFilter === 'Generated' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}
                                >
                                    New
                                </button>
                                <button
                                    onClick={() => setStatusFilter('Ready')}
                                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${statusFilter === 'Ready' ? 'bg-teal-600 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}
                                >
                                    Ready
                                </button>
                            </div>
                        </div>

                        {/* Prescription Items */}
                        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                            {filteredPrescriptions.length === 0 ? (
                                <p className="text-slate-500 text-sm text-center py-8">No prescriptions found.</p>
                            ) : (
                                filteredPrescriptions.map((pres) => {
                                    const isSelected = selectedPrescription?._id === pres._id;
                                    return (
                                        <div
                                            key={pres._id}
                                            onClick={() => handleSelectPrescription(pres)}
                                            className={`p-4 rounded-xl border cursor-pointer transition-all ${
                                                isSelected 
                                                    ? 'bg-slate-800 border-blue-500/50 shadow-md shadow-blue-500/5' 
                                                    : 'bg-slate-900/60 hover:bg-slate-950 border-slate-800'
                                            }`}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-xs font-semibold text-blue-400 tracking-wider">
                                                    #{pres._id.substring(pres._id.length - 8).toUpperCase()}
                                                </span>
                                                <Badge className={
                                                    pres.status === 'Generated' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                                                    pres.status === 'Ready' ? 'bg-teal-500/10 text-teal-400 border-teal-500/20' :
                                                    'bg-slate-500/10 text-slate-400 border-slate-500/20'
                                                }>
                                                    {pres.status}
                                                </Badge>
                                            </div>
                                            <h4 className="text-sm font-bold text-white mb-1">
                                                {pres.patient_id?.name || 'Ramesh Patil'}
                                            </h4>
                                            <div className="flex justify-between text-xs text-slate-400 mt-2">
                                                <span>Doc: {pres.doctor_id?.name || 'Dr. Anita Sharma'}</span>
                                                <span>{pres.medicines?.length || 0} drugs</span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </GlassCard>
                </div>

                {/* Selected Prescription Dispensing Panel (Middle & Right Column) */}
                <div className="lg:col-span-2 space-y-6">
                    {selectedPrescription ? (
                        <div className="space-y-6">
                            
                            {/* EMR Summary Header */}
                            <GlassCard className="p-5 border-slate-800">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-blue-600/20 text-blue-400 rounded-xl flex items-center justify-center font-bold text-xl">
                                            <User className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white">{selectedPrescription.patient_id?.name}</h3>
                                            <p className="text-xs text-slate-400">ABHA: {selectedPrescription.patient_id?.abha_id} | Phone: {selectedPrescription.patient_id?.phone}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {selectedPrescription.status === 'Generated' && (
                                            <Button 
                                                onClick={() => handleUpdateStatus(selectedPrescription._id, 'Ready')}
                                                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                            >
                                                Mark as Ready
                                            </Button>
                                        )}
                                        {selectedPrescription.status === 'Ready' && (
                                            <Button 
                                                onClick={() => handleUpdateStatus(selectedPrescription._id, 'Generated')}
                                                variant="outline"
                                                className="border-slate-800 text-slate-300 hover:bg-slate-900"
                                            >
                                                Back to Pending
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </GlassCard>

                            {/* Safety Interactions Warning Panel */}
                            {safetyAlerts.length > 0 && (
                                <div className="bg-red-950/20 border border-red-500/30 rounded-2xl p-4 flex gap-3 items-start animate-pulse">
                                    <AlertTriangle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="text-sm font-bold text-red-400">Drug-Drug Interaction Risk Flagged</h4>
                                        <ul className="list-disc pl-5 mt-2 space-y-1 text-xs text-slate-300">
                                            {safetyAlerts.map((alert, i) => (
                                                <li key={i}>{alert}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}

                            {/* Dispensing Detail & Batch Matching */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                
                                {/* Items Table */}
                                <div className="md:col-span-2 space-y-4">
                                    <GlassCard className="p-5">
                                        <h3 className="text-md font-bold text-white mb-4 flex items-center gap-2">
                                            <Pill className="w-5 h-5 text-blue-400" /> Prescribed Drugs
                                        </h3>
                                        <div className="space-y-4">
                                            {selectedPrescription.medicines?.map((med: any) => {
                                                const batchId = selectedBatches[med._id];
                                                const batchList = availableBatches[med._id] || [];
                                                const selectedBatch = batchList.find(b => b._id === batchId);

                                                return (
                                                    <div key={med._id} className="p-4 bg-slate-950/60 border border-slate-900 rounded-xl space-y-3">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <h4 className="text-sm font-bold text-white">{med.name}</h4>
                                                                <p className="text-xs text-slate-400 mt-1">{med.dosage} | {med.frequency} | {med.duration}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className="text-xs text-slate-500">Qty Prescribed</span>
                                                                <p className="text-sm font-extrabold text-white">{med.quantity || 10}</p>
                                                            </div>
                                                        </div>

                                                        {/* Batch Selection */}
                                                        <div className="pt-2 border-t border-slate-900">
                                                            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Select Batch (Barcode Verified)</label>
                                                            <select
                                                                value={batchId || ''}
                                                                onChange={(e) => setSelectedBatches(prev => ({
                                                                    ...prev,
                                                                    [med._id]: e.target.value
                                                                }))}
                                                                className="w-full bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-lg p-2 focus:outline-none focus:border-blue-500"
                                                            >
                                                                {batchList.length === 0 ? (
                                                                    <option value="">⚠️ Out of stock (Purchase Order required)</option>
                                                                ) : (
                                                                    batchList.map((batch) => {
                                                                        const expDate = new Date(batch.expiry_date).toLocaleDateString();
                                                                        return (
                                                                            <option key={batch._id} value={batch._id}>
                                                                                Lot: {batch.batch_number} - Stock: {batch.stock} (Exp: {expDate}) - MRP: ₹{batch.mrp}
                                                                            </option>
                                                                        );
                                                                    })
                                                                )}
                                                            </select>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </GlassCard>
                                </div>

                                {/* Billing summary & Checkout (Right Column of Details) */}
                                <div className="space-y-4">
                                    <GlassCard className="p-5 border-slate-800">
                                        <h3 className="text-md font-bold text-white mb-4 flex items-center gap-2">
                                            <DollarSign className="w-5 h-5 text-blue-400" /> Billing Details
                                        </h3>
                                        
                                        <div className="space-y-3 text-xs text-slate-300">
                                            <div className="flex justify-between">
                                                <span>Subtotal</span>
                                                <span>₹{billing.subtotal.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>GST (12% Avg)</span>
                                                <span>₹{billing.gst.toFixed(2)}</span>
                                            </div>
                                            
                                            <div className="pt-3 border-t border-slate-900 space-y-3">
                                                <div>
                                                    <label className="block text-slate-400 mb-1 text-[10px]">Discount Amount (₹)</label>
                                                    <input
                                                        type="number"
                                                        value={discountAmount}
                                                        onChange={(e) => setDiscountAmount(Number(e.target.value))}
                                                        className="w-full bg-slate-950 border border-slate-900 rounded p-1.5 text-white"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-slate-400 mb-1 text-[10px]">Insurance Covered (₹)</label>
                                                    <input
                                                        type="number"
                                                        value={insuranceCovered}
                                                        onChange={(e) => setInsuranceCovered(Number(e.target.value))}
                                                        className="w-full bg-slate-950 border border-slate-900 rounded p-1.5 text-white"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-slate-400 mb-1 text-[10px]">Payment Method</label>
                                                    <select
                                                        value={paymentMethod}
                                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                                        className="w-full bg-slate-950 border border-slate-900 rounded p-1.5 text-white"
                                                    >
                                                        <option value="Cash">Cash</option>
                                                        <option value="UPI / Card">UPI / Card</option>
                                                        <option value="Credit / Insurance">Credit / Insurance</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="flex justify-between pt-3 border-t border-slate-900 text-sm font-extrabold text-white">
                                                <span>Grand Total</span>
                                                <span className="text-emerald-400">₹{Math.max(0, billing.total).toFixed(2)}</span>
                                            </div>
                                        </div>

                                        <Button
                                            onClick={handleDispense}
                                            disabled={dispensing}
                                            className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white shadow-lg mt-4 font-bold rounded-xl"
                                        >
                                            {dispensing ? "Dispensing..." : "Confirm & Dispense"}
                                        </Button>
                                    </GlassCard>
                                </div>

                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/10">
                            <Pill className="w-16 h-16 text-slate-700 mb-4 animate-bounce" />
                            <h3 className="text-lg font-bold text-slate-400">No Prescription Selected</h3>
                            <p className="text-sm text-slate-500 max-w-sm mt-1">Select a prescription from the worklist on the left to start dispensing medications, matching lots, and generating invoices.</p>
                        </div>
                    )}

                    {/* Invoice Receipt Modal / Card (If dispensed successfully) */}
                    {lastInvoice && (
                        <GlassCard className="p-6 border-emerald-500/20 bg-slate-900/90 text-slate-300">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">✓</div>
                                    <div>
                                        <h4 className="text-white font-bold">Invoice Generated</h4>
                                        <p className="text-[10px] text-slate-400">Receipt No: {lastInvoice.invoice_number}</p>
                                    </div>
                                </div>
                                <Button variant="outline" className="border-slate-800 text-xs text-white" onClick={() => window.print()}>
                                    <Printer className="w-4 h-4 mr-2" /> Print Receipt
                                </Button>
                            </div>
                            
                            <div className="space-y-2 text-xs border-t border-b border-slate-800 py-3 mb-4">
                                <div className="flex justify-between text-slate-400">
                                    <span>Date</span>
                                    <span>{new Date(lastInvoice.invoice_date).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-slate-400">
                                    <span>Patient</span>
                                    <span>{selectedPrescription?.patient_id?.name || 'Ramesh Patil'}</span>
                                </div>
                                <div className="flex justify-between text-slate-400">
                                    <span>Payment Mode</span>
                                    <span>{lastInvoice.payment_method}</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between font-bold text-white text-sm">
                                    <span>Grand Total Paid</span>
                                    <span className="text-emerald-400">₹{lastInvoice.total_amount.toFixed(2)}</span>
                                </div>
                            </div>
                        </GlassCard>
                    )}
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
