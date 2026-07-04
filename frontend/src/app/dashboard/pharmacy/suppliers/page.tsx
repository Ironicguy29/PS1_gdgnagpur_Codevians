'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from "@/components/layout/DashboardLayout";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Users, Plus, Truck, FileText, ShoppingBag, CheckCircle, Clock,
    DollarSign, MapPin, Phone, Mail, Search, Eye
} from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/components/providers/ToastProvider";

export default function PharmacySuppliersDashboard() {
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'pos' | 'suppliers'>('pos');
    
    // Modals
    const [showSupplierModal, setShowSupplierModal] = useState(false);
    const [showPOModal, setShowPOModal] = useState(false);
    
    // Supplier Form
    const [supplierForm, setSupplierForm] = useState({
        name: '',
        contact_person: '',
        phone: '',
        email: '',
        address: '',
        gstin: ''
    });

    // PO Form
    const [selectedSupplierId, setSelectedSupplierId] = useState('');
    const [poItems, setPoItems] = useState<any[]>([
        { name: '', generic_name: '', category: 'Tablet', manufacturer: '', mrp: 120, gst_percentage: 12, storage_requirements: 'Cool dry place', quantity: 100 }
    ]);
    const [creatingPO, setCreatingPO] = useState(false);
    const [receivingPoId, setReceivingPoId] = useState<string | null>(null);

    const { toast } = useToast();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const supRes = await api.get('/pharmacy/suppliers');
            if (supRes.data.success) {
                setSuppliers(supRes.data.data);
            }

            const poRes = await api.get('/pharmacy/purchase-orders');
            if (poRes.data.success) {
                setPurchaseOrders(poRes.data.data);
            }
        } catch (error) {
            console.error("Failed to load supplier/PO logs", error);
            toast("Failed to load logs", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSupplier = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await api.post('/pharmacy/suppliers', supplierForm);
            if (res.data.success) {
                toast("Supplier registered successfully!", "success");
                setShowSupplierModal(false);
                setSupplierForm({ name: '', contact_person: '', phone: '', email: '', address: '', gstin: '' });
                fetchData();
            }
        } catch (error) {
            toast("Failed to register supplier", "error");
        }
    };

    const handleAddPoItem = () => {
        setPoItems([...poItems, { name: '', generic_name: '', category: 'Tablet', manufacturer: '', mrp: 120, gst_percentage: 12, storage_requirements: 'Cool dry place', quantity: 100 }]);
    };

    const handleRemovePoItem = (index: number) => {
        setPoItems(poItems.filter((_, i) => i !== index));
    };

    const handlePoItemChange = (index: number, field: string, val: any) => {
        const updated = [...poItems];
        updated[index] = { ...updated[index], [field]: val };
        setPoItems(updated);
    };

    const handleCreatePO = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSupplierId) {
            toast("Please select a supplier", "error");
            return;
        }

        setCreatingPO(true);
        try {
            const totalAmount = poItems.reduce((sum, item) => sum + (item.mrp * item.quantity), 0);
            const res = await api.post('/pharmacy/purchase-orders', {
                supplier_id: selectedSupplierId,
                items: poItems,
                total_amount: totalAmount
            });

            if (res.data.success) {
                toast("Purchase Order Created Successfully", "success");
                setShowPOModal(false);
                setPoItems([{ name: '', generic_name: '', category: 'Tablet', manufacturer: '', mrp: 120, gst_percentage: 12, storage_requirements: 'Cool dry place', quantity: 100 }]);
                setSelectedSupplierId('');
                fetchData();
            }
        } catch (error) {
            toast("Failed to create PO", "error");
        } finally {
            setCreatingPO(false);
        }
    };

    const handleReceivePO = async (poId: string) => {
        setReceivingPoId(poId);
        try {
            // Mark PO as delivered. Backend automatically generates batch lots and populates inventory
            const res = await api.post(`/pharmacy/purchase-orders/${poId}/receive`, {
                batchPrefix: 'LOT-'
            });

            if (res.data.success) {
                toast("Purchase Order Received & Stock Replenished!", "success");
                fetchData();
            }
        } catch (error) {
            toast("Failed to process delivery receipt", "error");
        } finally {
            setReceivingPoId(null);
        }
    };

    return (
        <DashboardLayout role="pharmacy">
            {/* Procurement Status Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <GlassCard className="bg-gradient-to-br from-indigo-500/10 to-purple-500/5 border-indigo-500/20">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-400">Total Purchase Orders</p>
                            <h3 className="text-3xl font-extrabold text-white mt-1">{purchaseOrders.length}</h3>
                        </div>
                        <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl">
                            <FileText className="w-6 h-6" />
                        </div>
                    </div>
                </GlassCard>

                <GlassCard className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-500/20">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-400">Pending Deliveries</p>
                            <h3 className="text-3xl font-extrabold text-white mt-1">
                                {purchaseOrders.filter(po => po.status === 'Sent').length}
                            </h3>
                        </div>
                        <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl">
                            <Clock className="w-6 h-6" />
                        </div>
                    </div>
                </GlassCard>

                <GlassCard className="bg-gradient-to-br from-teal-500/10 to-emerald-500/5 border-teal-500/20">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-400">Delivered / Completed</p>
                            <h3 className="text-3xl font-extrabold text-white mt-1">
                                {purchaseOrders.filter(po => po.status === 'Delivered').length}
                            </h3>
                        </div>
                        <div className="p-3 bg-teal-500/20 text-teal-400 rounded-xl">
                            <CheckCircle className="w-6 h-6" />
                        </div>
                    </div>
                </GlassCard>
            </div>

            {/* Toggle tabs & Quick action buttons */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-4 border border-slate-800 rounded-2xl">
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('pos')}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'pos' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                    >
                        Purchase Orders
                    </button>
                    <button
                        onClick={() => setActiveTab('suppliers')}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'suppliers' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                    >
                        Supplier Directory
                    </button>
                </div>

                <div className="flex gap-3">
                    {activeTab === 'suppliers' ? (
                        <Button onClick={() => setShowSupplierModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl h-10">
                            <Plus className="w-4 h-4 mr-2" /> Register Supplier
                        </Button>
                    ) : (
                        <Button onClick={() => setShowPOModal(true)} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl h-10">
                            <Plus className="w-4 h-4 mr-2" /> Create PO
                        </Button>
                    )}
                </div>
            </div>

            {/* PURCHASE ORDERS TAB */}
            {activeTab === 'pos' && (
                <div className="grid grid-cols-1 gap-6">
                    {purchaseOrders.length === 0 ? (
                        <GlassCard className="p-12 text-center text-slate-500">
                            No purchase orders created yet.
                        </GlassCard>
                    ) : (
                        purchaseOrders.map((po) => {
                            const date = new Date(po.order_date).toLocaleDateString();
                            return (
                                <GlassCard key={po._id} className="p-5 border-slate-850 bg-slate-900/40">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs font-mono text-blue-400">PO: #{po._id.substring(po._id.length - 8).toUpperCase()}</span>
                                                <Badge className={
                                                    po.status === 'Draft' ? 'bg-slate-500/10 text-slate-400' :
                                                    po.status === 'Sent' ? 'bg-amber-500/10 text-amber-400' :
                                                    'bg-emerald-500/10 text-emerald-400'
                                                }>
                                                    {po.status}
                                                </Badge>
                                            </div>
                                            <h4 className="text-sm font-bold text-white mt-1">Supplier: {po.supplier_id?.name || 'Vardhaman Pharma'}</h4>
                                            <p className="text-[10px] text-slate-400 mt-1">Ordered on: {date}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <span className="text-[10px] text-slate-500 block">Total Value</span>
                                                <span className="text-sm font-bold text-white">₹{po.total_amount.toLocaleString()}</span>
                                            </div>
                                            {po.status === 'Sent' && (
                                                <Button
                                                    onClick={() => handleReceivePO(po._id)}
                                                    disabled={receivingPoId === po._id}
                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl h-9"
                                                >
                                                    {receivingPoId === po._id ? "Receiving..." : "Mark Delivered"}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="border-t border-slate-850 pt-3">
                                        <h5 className="text-xs font-semibold text-slate-400 mb-2">Order Items ({po.items?.length || 0})</h5>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            {po.items?.map((item: any, i: number) => (
                                                <div key={i} className="p-2.5 bg-slate-950/60 border border-slate-900 rounded-lg flex justify-between text-xs">
                                                    <div>
                                                        <span className="text-white font-bold">{item.name}</span>
                                                        <span className="text-slate-500 block text-[10px] mt-0.5">{item.category}</span>
                                                    </div>
                                                    <div className="text-right font-semibold text-slate-300">
                                                        <span>{item.quantity} units</span>
                                                        <span className="text-[10px] block text-slate-500">₹{item.mrp} MRP</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </GlassCard>
                            )
                        })
                    )}
                </div>
            )}

            {/* SUPPLIERS TAB */}
            {activeTab === 'suppliers' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {suppliers.length === 0 ? (
                        <div className="col-span-full py-12 text-center text-slate-500">
                            No suppliers registered in catalog database.
                        </div>
                    ) : (
                        suppliers.map((sup) => (
                            <GlassCard key={sup._id} className="p-5 border-slate-800 bg-slate-900/30 flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-400 flex items-center justify-center font-bold">
                                            <Truck className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-white">{sup.name}</h4>
                                            <span className="text-[10px] text-slate-500 font-mono">GSTIN: {sup.gstin}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-2 text-xs text-slate-400 pt-3 border-t border-slate-900">
                                        <div className="flex items-center gap-2">
                                            <Users className="w-3.5 h-3.5 text-slate-500" />
                                            <span>Contact: {sup.contact_person}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Phone className="w-3.5 h-3.5 text-slate-500" />
                                            <span>Phone: {sup.phone}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Mail className="w-3.5 h-3.5 text-slate-500" />
                                            <span>Email: {sup.email}</span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <MapPin className="w-3.5 h-3.5 text-slate-500 mt-0.5" />
                                            <span>Address: {sup.address}</span>
                                        </div>
                                    </div>
                                </div>
                            </GlassCard>
                        ))
                    )}
                </div>
            )}

            {/* CREATE SUPPLIER MODAL */}
            {showSupplierModal && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <GlassCard className="max-w-md w-full p-6 border-slate-800 bg-slate-900 text-slate-300">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-white">Register New Supplier</h3>
                            <button onClick={() => setShowSupplierModal(false)} className="text-slate-400 hover:text-white">✕</button>
                        </div>
                        <form onSubmit={handleCreateSupplier} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1">Supplier Company Name</label>
                                <input
                                    type="text"
                                    required
                                    value={supplierForm.name}
                                    onChange={(e) => setSupplierForm({...supplierForm, name: e.target.value})}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 mb-1">Contact Person</label>
                                    <input
                                        type="text"
                                        required
                                        value={supplierForm.contact_person}
                                        onChange={(e) => setSupplierForm({...supplierForm, contact_person: e.target.value})}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 mb-1">GSTIN Number</label>
                                    <input
                                        type="text"
                                        required
                                        value={supplierForm.gstin}
                                        onChange={(e) => setSupplierForm({...supplierForm, gstin: e.target.value})}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 mb-1">Phone</label>
                                    <input
                                        type="text"
                                        required
                                        value={supplierForm.phone}
                                        onChange={(e) => setSupplierForm({...supplierForm, phone: e.target.value})}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 mb-1">Email</label>
                                    <input
                                        type="email"
                                        required
                                        value={supplierForm.email}
                                        onChange={(e) => setSupplierForm({...supplierForm, email: e.target.value})}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1">Address</label>
                                <textarea
                                    required
                                    value={supplierForm.address}
                                    onChange={(e) => setSupplierForm({...supplierForm, address: e.target.value})}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white h-20"
                                />
                            </div>
                            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl mt-4">
                                Confirm Registration
                            </Button>
                        </form>
                    </GlassCard>
                </div>
            )}

            {/* CREATE PURCHASE ORDER MODAL */}
            {showPOModal && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <GlassCard className="max-w-2xl w-full p-6 border-slate-800 bg-slate-900 text-slate-300 overflow-y-auto max-h-[90vh]">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-white">Create Purchase Order</h3>
                            <button onClick={() => setShowPOModal(false)} className="text-slate-400 hover:text-white">✕</button>
                        </div>
                        <form onSubmit={handleCreatePO} className="space-y-6">
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Select Supplier</label>
                                <select
                                    required
                                    value={selectedSupplierId}
                                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                                >
                                    <option value="">-- Choose Supplier --</option>
                                    {suppliers.map(sup => (
                                        <option key={sup._id} value={sup._id}>{sup.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Order Items</h4>
                                    <Button type="button" onClick={handleAddPoItem} variant="outline" className="h-8 text-xs border-slate-800 text-white">
                                        + Add Drug Item
                                    </Button>
                                </div>
                                <div className="space-y-4">
                                    {poItems.map((item, idx) => (
                                        <div key={idx} className="p-4 bg-slate-950/50 border border-slate-900 rounded-xl space-y-3 relative">
                                            {poItems.length > 1 && (
                                                <button type="button" onClick={() => handleRemovePoItem(idx)} className="absolute right-3 top-3 text-red-500 text-xs">✕</button>
                                            )}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-[10px] text-slate-500 mb-1">Brand Name</label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. Paracetamol 650"
                                                        value={item.name}
                                                        onChange={(e) => handlePoItemChange(idx, 'name', e.target.value)}
                                                        className="w-full bg-slate-900 border border-slate-850 rounded p-1.5 text-xs text-white"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] text-slate-500 mb-1">Generic Chemical Name</label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. Acetaminophen"
                                                        value={item.generic_name}
                                                        onChange={(e) => handlePoItemChange(idx, 'generic_name', e.target.value)}
                                                        className="w-full bg-slate-900 border border-slate-850 rounded p-1.5 text-xs text-white"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-3 gap-4">
                                                <div>
                                                    <label className="block text-[10px] text-slate-500 mb-1">Manufacturer</label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. Cipla"
                                                        value={item.manufacturer}
                                                        onChange={(e) => handlePoItemChange(idx, 'manufacturer', e.target.value)}
                                                        className="w-full bg-slate-900 border border-slate-850 rounded p-1.5 text-xs text-white"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] text-slate-500 mb-1">MRP (₹)</label>
                                                    <input
                                                        type="number"
                                                        value={item.mrp}
                                                        onChange={(e) => handlePoItemChange(idx, 'mrp', Number(e.target.value))}
                                                        className="w-full bg-slate-900 border border-slate-850 rounded p-1.5 text-xs text-white"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] text-slate-500 mb-1">Order Qty</label>
                                                    <input
                                                        type="number"
                                                        value={item.quantity}
                                                        onChange={(e) => handlePoItemChange(idx, 'quantity', Number(e.target.value))}
                                                        className="w-full bg-slate-900 border border-slate-850 rounded p-1.5 text-xs text-white"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <Button type="submit" disabled={creatingPO} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl h-11">
                                {creatingPO ? "Generating Order..." : "Confirm & Send Purchase Order"}
                            </Button>
                        </form>
                    </GlassCard>
                </div>
            )}
        </DashboardLayout>
    );
}

// Active: 2026-07-04

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
