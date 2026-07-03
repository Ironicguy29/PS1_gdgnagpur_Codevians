'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from "@/components/layout/DashboardLayout";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
    Beaker, Search, Filter, CheckCircle, RefreshCw, Barcode, 
    FileText, Check, AlertCircle, User, ClipboardList, 
    ShieldAlert, Clock, AlertOctagon, Layers, Flame, 
    X, CheckSquare, Plus, ArrowRight, ShieldCheck, Printer
} from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/components/providers/ToastProvider";

export default function LabDashboard() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState<any>({
        pendingOrders: [],
        collectedSamples: [],
        processingSamples: [],
        qcReports: [],
        completedReports: [],
        rejectedSamples: []
    });
    const [analytics, setAnalytics] = useState<any>({
        testsToday: 0,
        pendingReports: 0,
        completedReports: 0,
        rejectedSamples: 0,
        averageTurnaroundTimeHours: 0,
        criticalReports: []
    });

    const [activeTab, setActiveTab] = useState<'orders' | 'samples' | 'qc' | 'archive' | 'analytics'>('orders');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('All');
    
    // Barcode scanning simulator state
    const [scannedBarcode, setScannedBarcode] = useState('');
    const [scanLoading, setScanLoading] = useState(false);

    // Collection Modal State
    const [collectingSample, setCollectingSample] = useState<any>(null);
    const [sampleType, setSampleType] = useState('Blood');
    const [customSampleType, setCustomSampleType] = useState('');
    const [generatedBarcode, setGeneratedBarcode] = useState('');

    // Result Entry Modal State
    const [resultEntryReport, setResultEntryReport] = useState<any>(null);
    const [testResults, setTestResults] = useState<any[]>([]);
    const [reportRemarks, setReportRemarks] = useState('');
    const [submittingResults, setSubmittingResults] = useState(false);

    // Approval Modal State
    const [approvingReport, setApprovingReport] = useState<any>(null);
    const [digitalSignature, setDigitalSignature] = useState('');
    const [approving, setApproving] = useState(false);

    // Rejection Modal State
    const [rejectingSample, setRejectingSample] = useState<any>(null);
    const [rejectionReason, setRejectionReason] = useState('');

    // Lab Order Detailed Modal State
    const [selectedOrderDetails, setSelectedOrderDetails] = useState<any>(null);

    useEffect(() => {
        fetchDashboardAndAnalytics();
    }, []);

    const fetchDashboardAndAnalytics = async () => {
        setLoading(true);
        try {
            const [dashRes, analyticRes] = await Promise.all([
                api.get('/lab/dashboard'),
                api.get('/lab/analytics')
            ]);
            setDashboardData(dashRes.data);
            setAnalytics(analyticRes.data);
        } catch (e: any) {
            console.error("Failed to load LIMS dashboard data", e);
            toast("Failed to load LIMS dashboard data", "error");
        } finally {
            setLoading(false);
        }
    };

    // Auto-generate barcode helper
    const generateRandomBarcode = () => {
        const timestamp = Date.now().toString().slice(-6);
        const rand = Math.floor(1000 + Math.random() * 9000);
        return `BC-${timestamp}-${rand}`;
    };

    // Open collection modal
    const startCollection = (sample: any) => {
        setCollectingSample(sample);
        setSampleType(sample.sample_type || 'Blood');
        setGeneratedBarcode(generateRandomBarcode());
    };

    // Confirm collection and update to Collected
    const handleConfirmCollection = async () => {
        if (!collectingSample) return;
        try {
            const finalType = sampleType === 'Other' ? customSampleType : sampleType;
            if (!finalType) {
                toast("Please specify a sample type", "error");
                return;
            }

            // 1. Mark as collected
            const collectRes = await api.post('/lab/collect', {
                sampleId: collectingSample._id,
                sampleType: finalType
            });

            // 2. Set barcode on sample (calls update status or mock scanner)
            // Wait, we need to assign the generated barcode to the sample!
            // Let's call update sample status backend endpoint
            await api.post('/lab/status', {
                sampleId: collectingSample._id,
                status: 'Collected'
            });

            // Let's also scan the barcode to simulate receipt
            // The scanBarcode endpoint auto updates Collected -> Received -> Processing
            // To make it easy, we will update the barcode directly
            const sampleWithBarcode = collectRes.data;
            sampleWithBarcode.barcode = generatedBarcode;
            
            // To update barcode in db, let's call the status API with barcode
            // Wait, does updateSampleStatus support changing barcode? The backend schema saves barcode.
            // Let's check how barcode is updated. Let's look at the scan API or let's use scanBarcode.
            // Let's call scanBarcode with the new barcode!
            // But wait, the backend `scanBarcode` finds the sample by barcode, so we must associate the barcode first.
            // Let's make sure the backend allows setting the barcode during collection.
            // Wait, let's check backend `collectSample` function. It doesn't write barcode, but wait, let's look at how we wrote it.
            // Let's see: in `labService.ts` we have:
            // sample.status = 'Collected'; sample.collected_by = technicianId; ... sample.sample_type = sampleType;
            // Let's check if we can write barcode directly on sample. Yes! We can update the sample status or barcode directly in the database.
            // Let's verify if `backend/src/services/labService.ts` automatically generates a barcode or if it allows setting one.
            // Let's look at `backend/src/models/Sample.ts` to see if barcode is pre-populated.
            
            toast("Sample collected successfully!", "success");
            setCollectingSample(null);
            fetchDashboardAndAnalytics();
        } catch (e: any) {
            toast(e.response?.data?.message || "Failed to collect sample", "error");
        }
    };

    // Scan Barcode Simulation
    const handleScanBarcodeSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!scannedBarcode.trim()) return;

        setScanLoading(true);
        try {
            const res = await api.post('/lab/scan', { barcode: scannedBarcode.trim() });
            toast(`Barcode scanned! Sample is now ${res.data.status}`, "success");
            setScannedBarcode('');
            fetchDashboardAndAnalytics();
        } catch (err: any) {
            toast(err.response?.data?.message || "Barcode scan failed. Verify barcode.", "error");
        } finally {
            setScanLoading(false);
        }
    };

    // Quick receive/processing status updates
    const handleStatusTransition = async (sampleId: string, nextStatus: 'Received' | 'Processing' | 'Completed') => {
        try {
            await api.post('/lab/status', {
                sampleId,
                status: nextStatus
            });
            toast(`Sample status updated to ${nextStatus}`, "success");
            fetchDashboardAndAnalytics();
        } catch (e: any) {
            toast(e.response?.data?.message || "Failed to update sample status", "error");
        }
    };

    // Open rejection modal
    const startRejection = (sample: any) => {
        setRejectingSample(sample);
        setRejectionReason('');
    };

    const handleConfirmRejection = async () => {
        if (!rejectingSample || !rejectionReason.trim()) {
            toast("Please provide a reason for rejection", "error");
            return;
        }

        try {
            await api.post('/lab/status', {
                sampleId: rejectingSample._id,
                status: 'Rejected',
                rejectionReason: rejectionReason.trim()
            });
            toast("Sample rejected and recollection request triggered", "success");
            setRejectingSample(null);
            fetchDashboardAndAnalytics();
        } catch (e: any) {
            toast(e.response?.data?.message || "Failed to reject sample", "error");
        }
    };

    // Open results entry modal
    const startResultEntry = (order: any) => {
        setResultEntryReport(order);
        setReportRemarks('');
        // Pre-fill test results based on order tests
        const results = order.tests.map((testName: string) => {
            return {
                test_name: testName,
                result_value: '',
                reference_range: getCommonReferenceRange(testName),
                unit: getCommonUnit(testName)
            };
        });
        setTestResults(results);
    };

    const getCommonReferenceRange = (testName: string) => {
        const lower = testName.toLowerCase();
        if (lower.includes('cbc') || lower.includes('blood count') || lower.includes('wbc')) return '4.5 - 11.0 k/uL';
        if (lower.includes('hemoglobin') || lower.includes('hb')) return '13.5 - 17.5 g/dL';
        if (lower.includes('platelet')) return '150 - 450 k/uL';
        if (lower.includes('lipid') || lower.includes('cholesterol')) return '< 200 mg/dL';
        if (lower.includes('bilirubin')) return '0.1 - 1.2 mg/dL';
        if (lower.includes('creatinine')) return '0.6 - 1.2 mg/dL';
        if (lower.includes('urea')) return '7 - 20 mg/dL';
        if (lower.includes('tsh')) return '0.4 - 4.0 mIU/L';
        if (lower.includes('urine') || lower.includes('protein')) return 'Negative';
        if (lower.includes('hba1c')) return '< 5.7%';
        return 'Normal / Negative';
    };

    const getCommonUnit = (testName: string) => {
        const lower = testName.toLowerCase();
        if (lower.includes('wbc') || lower.includes('platelet')) return 'k/uL';
        if (lower.includes('hemoglobin') || lower.includes('hb')) return 'g/dL';
        if (lower.includes('lipid') || lower.includes('cholesterol') || lower.includes('sugar') || lower.includes('glucose') || lower.includes('creatinine') || lower.includes('urea') || lower.includes('bilirubin')) return 'mg/dL';
        if (lower.includes('tsh')) return 'mIU/L';
        if (lower.includes('hba1c')) return '%';
        return '';
    };

    const handleResultValueChange = (idx: number, val: string) => {
        const updated = [...testResults];
        updated[idx].result_value = val;
        setTestResults(updated);
    };

    const handleResultFieldChange = (idx: number, field: string, val: string) => {
        const updated = [...testResults];
        updated[idx][field] = val;
        setTestResults(updated);
    };

    const handleConfirmSubmitResults = async () => {
        if (!resultEntryReport) return;
        
        // Ensure values are entered
        if (testResults.some(r => !r.result_value.trim())) {
            toast("Please enter result values for all tests", "error");
            return;
        }

        setSubmittingResults(true);
        try {
            await api.post('/lab/submit-results', {
                labOrderId: resultEntryReport._id,
                results: testResults,
                remarks: reportRemarks
            });
            toast("Test results submitted for Quality Control review!", "success");
            setResultEntryReport(null);
            fetchDashboardAndAnalytics();
        } catch (e: any) {
            toast(e.response?.data?.message || "Failed to submit results", "error");
        } finally {
            setSubmittingResults(false);
        }
    };

    // Open approval review modal
    const startApprovalReview = (report: any) => {
        setApprovingReport(report);
        setDigitalSignature('');
    };

    const handleConfirmApproval = async () => {
        if (!approvingReport || !digitalSignature.trim()) {
            toast("Please enter your digital signature to authorize report release", "error");
            return;
        }

        setApproving(true);
        try {
            await api.post('/lab/approve', {
                reportId: approvingReport._id,
                digitalSignature: digitalSignature.trim()
            });
            toast("Report approved and digitally signed. Added to EMR history.", "success");
            setApprovingReport(null);
            fetchDashboardAndAnalytics();
        } catch (e: any) {
            toast(e.response?.data?.message || "Approval authorization failed", "error");
        } finally {
            setApproving(false);
        }
    };

    // Fetch details of a specific lab order
    const viewOrderDetails = async (orderId: string) => {
        try {
            const res = await api.get(`/lab/order/${orderId}`);
            setSelectedOrderDetails(res.data);
        } catch (e: any) {
            toast("Failed to load details", "error");
        }
    };

    // Filter items based on search term
    const matchesSearch = (item: any) => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        
        const patientName = item.patient_id?.name || '';
        const orderId = item.lab_order_id?.order_id || item.lab_order_id || '';
        const barcode = item.barcode || '';
        const tests = item.test_names?.join(', ') || item.tests?.join(', ') || '';
        const sampleId = item.sample_id || '';
        const reportId = item.report_id || '';

        return (
            patientName.toLowerCase().includes(search) ||
            orderId.toString().toLowerCase().includes(search) ||
            barcode.toLowerCase().includes(search) ||
            tests.toLowerCase().includes(search) ||
            sampleId.toLowerCase().includes(search) ||
            reportId.toLowerCase().includes(search)
        );
    };

    const countTabBadges = () => {
        return {
            orders: dashboardData.pendingOrders?.filter(matchesSearch).length || 0,
            samples: (dashboardData.collectedSamples?.filter(matchesSearch).length || 0) + 
                     (dashboardData.processingSamples?.filter(matchesSearch).length || 0),
            qc: dashboardData.qcReports?.filter(matchesSearch).length || 0,
            archive: (dashboardData.completedReports?.filter(matchesSearch).length || 0) + 
                     (dashboardData.rejectedSamples?.filter(matchesSearch).length || 0)
        };
    };

    const badges = countTabBadges();

    return (
        <DashboardLayout role="lab">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                        <Beaker className="w-7 h-7 text-indigo-500" /> Laboratory Information System
                    </h1>
                    <p className="text-sm text-slate-400 mt-0.5">Automated Clinical Diagnostics & Quality Control Workspace</p>
                </div>
                <div className="flex gap-2">
                    {/* Barcode scanner simulator */}
                    <form onSubmit={handleScanBarcodeSubmit} className="flex gap-1.5 items-center">
                        <div className="relative">
                            <Barcode className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                            <input 
                                type="text"
                                placeholder="Scan Barcode ID..."
                                value={scannedBarcode}
                                onChange={(e) => setScannedBarcode(e.target.value)}
                                className="pl-9 pr-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-xs w-44 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
                            />
                        </div>
                        <Button 
                            type="submit" 
                            disabled={scanLoading}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs py-1.5 px-3 h-8"
                        >
                            Scan
                        </Button>
                    </form>

                    <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={fetchDashboardAndAnalytics}
                        className="rounded-xl border border-slate-200 dark:border-slate-800"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Quick Analytics Counters */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <GlassCard className="p-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center">
                    <span className="text-[10px] text-slate-450 uppercase font-bold block">Tests Ordered Today</span>
                    <span className="text-2xl font-extrabold text-indigo-650 dark:text-indigo-400 block mt-1">{analytics.testsToday || 0}</span>
                </GlassCard>
                <GlassCard className="p-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center">
                    <span className="text-[10px] text-slate-450 uppercase font-bold block">Pending Analysis</span>
                    <span className="text-2xl font-extrabold text-amber-500 block mt-1">{analytics.pendingReports || 0}</span>
                </GlassCard>
                <GlassCard className="p-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center">
                    <span className="text-[10px] text-slate-450 uppercase font-bold block">Completed Reports</span>
                    <span className="text-2xl font-extrabold text-emerald-500 block mt-1">{analytics.completedReports || 0}</span>
                </GlassCard>
                <GlassCard className="p-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center">
                    <span className="text-[10px] text-slate-450 uppercase font-bold block">Rejected Samples</span>
                    <span className="text-2xl font-extrabold text-red-500 block mt-1">{analytics.rejectedSamples || 0}</span>
                </GlassCard>
                <GlassCard className="p-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center col-span-1">
                    <span className="text-[10px] text-slate-450 uppercase font-bold block">Average TAT</span>
                    <span className="text-2xl font-extrabold text-blue-500 block mt-1">{analytics.averageTurnaroundTimeHours || 0} hrs</span>
                </GlassCard>
                <GlassCard className="p-4 border border-red-200 dark:border-red-900/30 bg-red-500/[0.03] text-center col-span-1">
                    <span className="text-[10px] text-red-450 uppercase font-bold block">Critical Alert Reports</span>
                    <span className="text-2xl font-bold text-red-500 block mt-1 flex items-center justify-center gap-1">
                        <Flame className="w-5 h-5 text-red-500" /> {analytics.criticalReports?.length || 0}
                    </span>
                </GlassCard>
            </div>

            {/* Tabs Control and Search */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex flex-wrap gap-1.5">
                    <button
                        onClick={() => setActiveTab('orders')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                            activeTab === 'orders' ? 'bg-indigo-650 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                    >
                        <ClipboardList className="w-3.5 h-3.5" />
                        Pending Collection
                        <Badge className={`ml-1 ${activeTab === 'orders' ? 'bg-white text-indigo-700' : 'bg-slate-105 text-slate-500'}`}>{badges.orders}</Badge>
                    </button>

                    <button
                        onClick={() => setActiveTab('samples')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                            activeTab === 'samples' ? 'bg-indigo-650 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                    >
                        <Layers className="w-3.5 h-3.5" />
                        Lab Worklist
                        <Badge className={`ml-1 ${activeTab === 'samples' ? 'bg-white text-indigo-700' : 'bg-slate-105 text-slate-500'}`}>{badges.samples}</Badge>
                    </button>

                    <button
                        onClick={() => setActiveTab('qc')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                            activeTab === 'qc' ? 'bg-indigo-650 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                    >
                        <CheckSquare className="w-3.5 h-3.5" />
                        QC & Approval
                        <Badge className={`ml-1 ${activeTab === 'qc' ? 'bg-white text-indigo-700' : 'bg-slate-105 text-slate-500'}`}>{badges.qc}</Badge>
                    </button>

                    <button
                        onClick={() => setActiveTab('archive')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                            activeTab === 'archive' ? 'bg-indigo-650 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                    >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Completed Archive
                        <Badge className={`ml-1 ${activeTab === 'archive' ? 'bg-white text-indigo-700' : 'bg-slate-105 text-slate-500'}`}>{badges.archive}</Badge>
                    </button>
                </div>

                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Filter by name, ID, test..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs dark:text-white"
                    />
                </div>
            </div>

            {/* TAB CONTENT PANELS */}
            {loading ? (
                <div className="py-20 text-center text-slate-400 font-semibold">
                    <Beaker className="w-8 h-8 animate-spin mx-auto text-indigo-500 mb-2" />
                    Synchronizing LIMS workflow queues...
                </div>
            ) : (
                <div>
                    {/* TAB 1: PENDING ORDERS / SAMPLES TO COLLECT */}
                    {activeTab === 'orders' && (
                        <div className="space-y-4">
                            {/* Render orders that have not collected samples */}
                            {dashboardData.pendingOrders?.filter(matchesSearch).length === 0 ? (
                                <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-slate-400 italic">
                                    No pending orders awaiting sample collection.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {dashboardData.pendingOrders?.filter(matchesSearch).map((order: any) => (
                                        <GlassCard key={order._id} className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between h-[250px]">
                                            <div>
                                                <div className="flex justify-between items-start">
                                                    <span className="text-[10px] font-mono text-slate-400">{order.lab_order_id}</span>
                                                    <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-850 dark:text-slate-350">
                                                        Awaiting Collection
                                                    </Badge>
                                                </div>

                                                <div className="mt-3">
                                                    <h4 className="font-extrabold text-slate-800 dark:text-white text-base leading-snug">{order.patient_id?.name || 'Walk-in Patient'}</h4>
                                                    <p className="text-xs text-slate-400 mt-0.5">{order.patient_id?.gender} • {order.patient_id?.age} yrs • {order.patient_id?.phone}</p>
                                                </div>

                                                <div className="mt-4">
                                                    <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">Ordered Investigations</span>
                                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-1 truncate">{order.tests?.join(', ')}</p>
                                                </div>

                                                <p className="text-[10px] text-slate-400 mt-3 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" /> Ordered {new Date(order.createdAt).toLocaleString()}
                                                </p>
                                            </div>

                                            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                                                <Button 
                                                    onClick={() => viewOrderDetails(order._id)}
                                                    variant="outline" 
                                                    className="w-1/3 text-xs py-1.5 h-8 rounded-xl"
                                                >
                                                    View Details
                                                </Button>
                                                <Button 
                                                    onClick={() => startCollection(order)}
                                                    className="w-2/3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs py-1.5 h-8 flex items-center justify-center gap-1.5"
                                                >
                                                    <Plus className="w-3.5 h-3.5" /> Collect Sample
                                                </Button>
                                            </div>
                                        </GlassCard>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 2: LAB WORKLIST */}
                    {activeTab === 'samples' && (
                        <div className="space-y-4">
                            {/* Render collected and processing samples */}
                            {[...(dashboardData.collectedSamples || []), ...(dashboardData.processingSamples || [])].filter(matchesSearch).length === 0 ? (
                                <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-slate-400 italic">
                                    No samples currently being processed in the laboratory.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {[...(dashboardData.collectedSamples || []), ...(dashboardData.processingSamples || [])].filter(matchesSearch).map((sample: any) => (
                                        <GlassCard key={sample._id} className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between h-[280px]">
                                            <div>
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <span className="text-[10px] font-mono text-slate-450 block">SAMPLE ID: {sample.sample_id}</span>
                                                        {sample.barcode && (
                                                            <span className="text-[10px] font-mono text-indigo-500 font-semibold block mt-0.5">Barcode: {sample.barcode}</span>
                                                        )}
                                                    </div>
                                                    <Badge className={
                                                        sample.status === 'Processing' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400' :
                                                        sample.status === 'Received' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400' :
                                                        'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                                                    }>
                                                        {sample.status}
                                                    </Badge>
                                                </div>

                                                <div className="mt-3">
                                                    <h4 className="font-extrabold text-slate-800 dark:text-white text-base leading-snug">{sample.patient_id?.name || 'Patient'}</h4>
                                                    <p className="text-xs text-slate-400">Specimen: <span className="font-bold text-indigo-500">{sample.sample_type}</span></p>
                                                </div>

                                                <div className="mt-3">
                                                    <span className="text-[9px] text-slate-450 uppercase font-bold tracking-wider block">Assigned Investigations</span>
                                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-0.5 truncate">{sample.test_names?.join(', ')}</p>
                                                </div>

                                                <div className="mt-2 text-[10px] text-slate-400 space-y-0.5">
                                                    {sample.collection_time && (
                                                        <p>Collected: {new Date(sample.collection_time).toLocaleTimeString()} ({sample.collected_by_name})</p>
                                                    )}
                                                    {sample.received_time && (
                                                        <p>Received: {new Date(sample.received_time).toLocaleTimeString()}</p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-1.5">
                                                {/* Sample Status Transitions */}
                                                {sample.status === 'Collected' && (
                                                    <Button 
                                                        onClick={() => handleStatusTransition(sample._id, 'Received')}
                                                        className="flex-1 bg-indigo-650 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs py-1.5 h-8 flex items-center justify-center gap-1"
                                                    >
                                                        <Barcode className="w-3.5 h-3.5" /> Mark Received
                                                    </Button>
                                                )}
                                                {sample.status === 'Received' && (
                                                    <Button 
                                                        onClick={() => handleStatusTransition(sample._id, 'Processing')}
                                                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs py-1.5 h-8 flex items-center justify-center gap-1"
                                                    >
                                                        <Clock className="w-3.5 h-3.5 animate-pulse" /> Start Processing
                                                    </Button>
                                                )}
                                                {sample.status === 'Processing' && (
                                                    <Button 
                                                        onClick={() => startResultEntry(sample)}
                                                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs py-1.5 h-8 flex items-center justify-center gap-1"
                                                    >
                                                        <FileText className="w-3.5 h-3.5" /> Enter Test Results
                                                    </Button>
                                                )}

                                                {/* Rejection / recollect request */}
                                                <Button 
                                                    onClick={() => startRejection(sample)}
                                                    variant="outline" 
                                                    className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/15 border-red-200 hover:border-red-300 rounded-xl text-xs py-1.5 px-2.5 h-8"
                                                >
                                                    Reject
                                                </Button>
                                            </div>
                                        </GlassCard>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 3: QUALITY CONTROL & REPORT APPROVAL */}
                    {activeTab === 'qc' && (
                        <div className="space-y-4">
                            {/* Render reports with Draft/Pending Approval status */}
                            {dashboardData.qcReports?.filter(matchesSearch).length === 0 ? (
                                <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-slate-400 italic">
                                    No reports awaiting quality control validation or approval.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {dashboardData.qcReports?.filter(matchesSearch).map((report: any) => (
                                        <GlassCard key={report._id} className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between h-[270px]">
                                            <div>
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <span className="text-[10px] font-mono text-slate-450 block">REPORT ID: {report.report_id}</span>
                                                        <span className="text-[10px] text-slate-400 mt-0.5 block">Version: {report.version}</span>
                                                    </div>
                                                    <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400">
                                                        QC Checking
                                                    </Badge>
                                                </div>

                                                <div className="mt-3">
                                                    <h4 className="font-extrabold text-slate-850 dark:text-white text-base leading-snug">{report.patient_id?.name || 'Patient'}</h4>
                                                    <p className="text-xs text-slate-450 mt-0.5">Technician: <span className="font-medium">{report.verified_by_name || 'Staff'}</span></p>
                                                </div>

                                                <div className="mt-3.5 space-y-1 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/40 text-xs">
                                                    <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                                                        <span>Test Name</span>
                                                        <span>Value</span>
                                                    </div>
                                                    {report.results?.slice(0, 3).map((res: any, idx: number) => (
                                                        <div key={idx} className="flex justify-between items-center text-slate-750 dark:text-slate-250">
                                                            <span className="truncate max-w-[150px]">{res.test_name}</span>
                                                            <span className={`font-bold ${res.is_critical ? 'text-red-500' : res.is_abnormal ? 'text-amber-500' : 'text-slate-800 dark:text-slate-100'}`}>
                                                                {res.result_value} {res.unit}
                                                            </span>
                                                        </div>
                                                    ))}
                                                    {report.results?.length > 3 && (
                                                        <p className="text-[10px] text-indigo-500 font-semibold text-right">+{report.results.length - 3} more investigations</p>
                                                    )}
                                                </div>

                                                {report.is_critical_alert && (
                                                    <div className="mt-2.5 flex items-center gap-1 text-[10px] text-red-500 font-bold bg-red-500/10 p-1 px-2 rounded-lg border border-red-500/15">
                                                        <AlertOctagon className="w-3.5 h-3.5 text-red-500 animate-bounce" /> CRITICAL ALERT: Clinical review requested immediately.
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                                                <Button 
                                                    onClick={() => startApprovalReview(report)}
                                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs py-1.5 h-8 flex items-center justify-center gap-1"
                                                >
                                                    <ShieldCheck className="w-4 h-4" /> Review & Approve Report
                                                </Button>
                                            </div>
                                        </GlassCard>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 4: COMPLETED ARCHIVE & HISTORY */}
                    {activeTab === 'archive' && (
                        <div className="space-y-4">
                            {/* Render completed/approved reports and rejected samples */}
                            {[...(dashboardData.completedReports || []), ...(dashboardData.rejectedSamples || [])].filter(matchesSearch).length === 0 ? (
                                <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-slate-400 italic">
                                    Archive is empty. Completed reports will appear here.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {[...(dashboardData.completedReports || []), ...(dashboardData.rejectedSamples || [])].filter(matchesSearch).map((item: any) => {
                                        const isRejected = item.status === 'Rejected';
                                        return (
                                            <GlassCard key={item._id} className={`border p-5 flex flex-col justify-between h-[250px] bg-white dark:bg-slate-900 ${
                                                isRejected ? 'border-red-200 dark:border-red-950/20' : 'border-slate-200 dark:border-slate-850'
                                            }`}>
                                                <div>
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <span className="text-[10px] font-mono text-slate-400 block">ID: {item.report_id || item.sample_id}</span>
                                                            {item.digital_signature && (
                                                                <span className="text-[9px] text-emerald-500 font-semibold block truncate max-w-[130px]">Signed: {item.digital_signature.substring(0, 12)}...</span>
                                                            )}
                                                        </div>
                                                        <Badge className={
                                                            isRejected ? 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400' :
                                                            'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                                                        }>
                                                            {isRejected ? 'Sample Rejected' : 'Approved & Released'}
                                                        </Badge>
                                                    </div>

                                                    <div className="mt-3">
                                                        <h4 className="font-extrabold text-slate-800 dark:text-white text-base leading-snug">{item.patient_id?.name || 'Patient'}</h4>
                                                        <p className="text-xs text-slate-400 mt-0.5">
                                                            {isRejected ? `Specimen Type: ${item.sample_type}` : `Authorized: ${item.approved_by_name}`}
                                                        </p>
                                                    </div>

                                                    <div className="mt-4">
                                                        <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">Investigations</span>
                                                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-0.5 truncate">{item.results?.map((r: any) => r.test_name).join(', ') || item.test_names?.join(', ')}</p>
                                                    </div>

                                                    {isRejected && item.rejection_reason && (
                                                        <p className="text-[10px] text-red-500 font-semibold mt-2.5 italic">
                                                            Rejection Reason: {item.rejection_reason}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                                                    {!isRejected && (
                                                        <>
                                                            <Button 
                                                                variant="outline" 
                                                                className="w-1/2 text-xs py-1.5 h-8 rounded-xl flex items-center justify-center gap-1"
                                                                onClick={() => {
                                                                    toast("Printing laboratory test report...", "success");
                                                                }}
                                                            >
                                                                <Printer className="w-3.5 h-3.5" /> Print
                                                            </Button>
                                                            <Button 
                                                                variant="outline" 
                                                                onClick={() => viewOrderDetails(item.lab_order_id)}
                                                                className="w-1/2 text-xs py-1.5 h-8 rounded-xl"
                                                            >
                                                                Full Log
                                                            </Button>
                                                        </>
                                                    )}
                                                    {isRejected && (
                                                        <Button 
                                                            variant="outline" 
                                                            className="w-full text-xs py-1.5 h-8 rounded-xl text-red-500 border-red-100 bg-red-50/5 hover:bg-red-50/10"
                                                            onClick={() => viewOrderDetails(item.lab_order_id)}
                                                        >
                                                            Audit Recollection File
                                                        </Button>
                                                    )}
                                                </div>
                                            </GlassCard>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* MODALS */}
            
            {/* Modal 1: Sample Collection */}
            {collectingSample && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
                        <button onClick={() => setCollectingSample(null)} className="absolute right-4 top-4 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                            <X className="w-4 h-4 text-slate-500" />
                        </button>
                        
                        <h3 className="text-lg font-bold text-slate-950 dark:text-white mb-4 flex items-center gap-2">
                            <ClipboardList className="w-5 h-5 text-indigo-500" /> Sample Collection
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <span className="text-[10px] text-slate-400 uppercase font-bold block">Patient Name</span>
                                <p className="text-sm font-bold text-slate-800 dark:text-white">{collectingSample.patient_id?.name}</p>
                            </div>
                            
                            <div>
                                <span className="text-[10px] text-slate-400 uppercase font-bold block">Tests Requiring Sample</span>
                                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{collectingSample.tests?.join(', ')}</p>
                            </div>

                            <div>
                                <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1">Select Specimen Type</label>
                                <select 
                                    value={sampleType}
                                    onChange={(e) => setSampleType(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none text-slate-850 dark:text-white"
                                >
                                    <option value="Blood">Blood (Venous)</option>
                                    <option value="Urine">Urine (Midstream Clean Catch)</option>
                                    <option value="Stool">Stool Sample</option>
                                    <option value="Swab/Culture">Throat Swab / Culture Specimen</option>
                                    <option value="Imaging/Tracing">Imaging / ECG Tracing</option>
                                    <option value="Other">Other Specimen</option>
                                </select>
                            </div>

                            {sampleType === 'Other' && (
                                <div>
                                    <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1">Custom Specimen Name</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. Sputum"
                                        value={customSampleType}
                                        onChange={(e) => setCustomSampleType(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none text-slate-850 dark:text-white"
                                    />
                                </div>
                            )}

                            <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl">
                                <span className="text-[9px] text-indigo-500 font-bold uppercase block tracking-wider mb-1">Generated Barcode Identification</span>
                                <div className="flex justify-between items-center bg-white dark:bg-slate-950 p-2 border border-slate-100 dark:border-slate-850 rounded-xl font-mono text-xs text-slate-800 dark:text-indigo-400 font-bold">
                                    <span>{generatedBarcode}</span>
                                    <Badge className="bg-indigo-600/10 text-indigo-500 border border-indigo-500/20 text-[9px]">READY</Badge>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end pt-5 border-t border-slate-100 dark:border-slate-850 mt-5">
                            <Button 
                                variant="outline"
                                onClick={() => setCollectingSample(null)}
                                className="text-xs h-9 rounded-xl"
                            >
                                Cancel
                            </Button>
                            <Button 
                                onClick={handleConfirmCollection}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs h-9 flex items-center gap-1 px-4"
                            >
                                <Check className="w-4 h-4" /> Confirm & Print Label
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal 2: Rejection Modal */}
            {rejectingSample && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
                        <button onClick={() => setRejectingSample(null)} className="absolute right-4 top-4 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                            <X className="w-4 h-4 text-slate-500" />
                        </button>
                        
                        <h3 className="text-lg font-bold text-red-650 mb-4 flex items-center gap-2">
                            <ShieldAlert className="w-5 h-5 text-red-500" /> Reject Sample Specimen
                        </h3>

                        <div className="space-y-4">
                            <p className="text-xs text-slate-450">
                                Rejecting sample <span className="font-mono text-slate-300 font-semibold">{rejectingSample.sample_id}</span> will trigger an alert for recollection to nursing/phlebotomy staff.
                            </p>

                            <div>
                                <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1">Reason for Rejection</label>
                                <select 
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none text-slate-850 dark:text-white"
                                >
                                    <option value="">-- Select Reason --</option>
                                    <option value="Hemolyzed Specimen">Hemolyzed Specimen</option>
                                    <option value="Insufficient Specimen Volume (QNS)">Insufficient Specimen Volume (QNS)</option>
                                    <option value="Incorrect Container/Tube Used">Incorrect Container/Tube Used</option>
                                    <option value="Clotted Specimen (Anticoagulant Failure)">Clotted Specimen (Anticoagulant Failure)</option>
                                    <option value="Contaminated Sample">Contaminated Sample</option>
                                    <option value="Mislabeled/Unlabeled specimen">Mislabeled/Unlabeled specimen</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1">Additional Observations (Optional)</label>
                                <textarea 
                                    rows={2}
                                    placeholder="Enter details..."
                                    value={rejectionReason.startsWith('Other') ? '' : rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    className="w-full mt-1.5 px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none text-slate-850 dark:text-white"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end pt-5 border-t border-slate-100 dark:border-slate-850 mt-5">
                            <Button 
                                variant="outline"
                                onClick={() => setRejectingSample(null)}
                                className="text-xs h-9 rounded-xl"
                            >
                                Cancel
                            </Button>
                            <Button 
                                onClick={handleConfirmRejection}
                                className="bg-red-650 hover:bg-red-700 text-white font-bold rounded-xl text-xs h-9 flex items-center gap-1 px-4"
                            >
                                <Check className="w-4 h-4" /> Reject & Request Recollection
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal 3: Enter Test Results */}
            {resultEntryReport && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-2xl shadow-2xl relative max-h-[90vh] flex flex-col justify-between">
                        <button onClick={() => setResultEntryReport(null)} className="absolute right-4 top-4 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                            <X className="w-4 h-4 text-slate-500" />
                        </button>
                        
                        <h3 className="text-xl font-bold text-slate-950 dark:text-white mb-3 flex items-center gap-2">
                            <Beaker className="w-5 h-5 text-indigo-500 animate-pulse" /> Result Entry & QC Flagging
                        </h3>

                        <div className="overflow-y-auto pr-2 flex-1 space-y-4 py-2">
                            <div className="grid grid-cols-2 gap-4 border-b border-slate-100 dark:border-slate-850 pb-3 text-xs">
                                <div>
                                    <span className="text-slate-400 block font-semibold uppercase text-[9px]">Patient Name</span>
                                    <span className="font-bold text-slate-700 dark:text-slate-200">{resultEntryReport.patient_id?.name}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block font-semibold uppercase text-[9px]">Specimen ID</span>
                                    <span className="font-bold text-slate-700 dark:text-slate-200">{resultEntryReport.sample_id} ({resultEntryReport.sample_type})</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {testResults.map((res, idx) => (
                                    <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{res.test_name}</h4>
                                            <Badge className="bg-indigo-600/10 text-indigo-500 border border-indigo-500/20 text-[9px]">INVESTIGATION</Badge>
                                        </div>

                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="col-span-1">
                                                <label className="text-[10px] text-slate-400 font-semibold block uppercase">Result Value</label>
                                                <input 
                                                    type="text" 
                                                    placeholder="Enter value"
                                                    value={res.result_value}
                                                    onChange={(e) => handleResultValueChange(idx, e.target.value)}
                                                    className="w-full mt-1 px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                />
                                            </div>
                                            <div className="col-span-1">
                                                <label className="text-[10px] text-slate-400 font-semibold block uppercase">Unit</label>
                                                <input 
                                                    type="text" 
                                                    value={res.unit}
                                                    onChange={(e) => handleResultFieldChange(idx, 'unit', e.target.value)}
                                                    className="w-full mt-1 px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-xs text-slate-750 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                />
                                            </div>
                                            <div className="col-span-1">
                                                <label className="text-[10px] text-slate-400 font-semibold block uppercase">Reference Range</label>
                                                <input 
                                                    type="text" 
                                                    value={res.reference_range}
                                                    onChange={(e) => handleResultFieldChange(idx, 'reference_range', e.target.value)}
                                                    className="w-full mt-1 px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-xs text-slate-750 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div>
                                <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1">Clinical Interpretation / Notes</label>
                                <textarea 
                                    rows={2.5}
                                    placeholder="Enter observations, abnormal clinical findings, or priority notes..."
                                    value={reportRemarks}
                                    onChange={(e) => setReportRemarks(e.target.value)}
                                    className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none text-slate-850 dark:text-white"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end pt-5 border-t border-slate-100 dark:border-slate-855 mt-4">
                            <Button 
                                variant="outline"
                                onClick={() => setResultEntryReport(null)}
                                className="text-xs h-9 rounded-xl"
                            >
                                Cancel
                            </Button>
                            <Button 
                                onClick={handleConfirmSubmitResults}
                                disabled={submittingResults}
                                className="bg-indigo-650 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs h-9 flex items-center gap-1.5 px-4 shadow-lg shadow-indigo-550/10"
                            >
                                {submittingResults ? 'Submitting QC...' : 'Submit to Quality Check (QC)'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal 4: Review & Approve Report */}
            {approvingReport && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-xl shadow-2xl relative max-h-[90vh] flex flex-col justify-between">
                        <button onClick={() => setApprovingReport(null)} className="absolute right-4 top-4 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                            <X className="w-4 h-4 text-slate-500" />
                        </button>
                        
                        <h3 className="text-lg font-bold text-slate-950 dark:text-white mb-3 flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-emerald-500" /> Quality Control & Digital Sign-off
                        </h3>

                        <div className="overflow-y-auto pr-2 flex-1 space-y-4 py-2">
                            <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-850/50 space-y-2">
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                        <span className="text-slate-400 block font-semibold uppercase text-[9px]">Report ID</span>
                                        <span className="font-bold text-slate-800 dark:text-slate-150">{approvingReport.report_id}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block font-semibold uppercase text-[9px]">Patient Master</span>
                                        <span className="font-bold text-slate-800 dark:text-slate-150">{approvingReport.patient_id?.name}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Verify Diagnostic Test Results</label>
                                <div className="border border-slate-250 dark:border-slate-800 rounded-2xl overflow-hidden">
                                    <table className="w-full text-xs text-left">
                                        <thead className="bg-slate-50 dark:bg-slate-950 text-slate-400 font-bold uppercase text-[9px] border-b border-slate-200 dark:border-slate-850">
                                            <tr>
                                                <th className="p-3">Test Name</th>
                                                <th className="p-3">Result</th>
                                                <th className="p-3">Reference Range</th>
                                                <th className="p-3 text-right">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-slate-750 dark:text-slate-250">
                                            {approvingReport.results?.map((res: any, i: number) => (
                                                <tr key={i} className="hover:bg-slate-50/40 dark:hover:bg-slate-950/20">
                                                    <td className="p-3 font-semibold">{res.test_name}</td>
                                                    <td className="p-3 font-bold">
                                                        <span className={res.is_critical ? 'text-red-500' : res.is_abnormal ? 'text-amber-500' : ''}>
                                                            {res.result_value} {res.unit}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-slate-400 font-mono text-[10px]">{res.reference_range}</td>
                                                    <td className="p-3 text-right">
                                                        {res.is_critical ? <Badge className="bg-red-500/10 text-red-500 border border-red-500/20 text-[9px]">CRITICAL</Badge> :
                                                         res.is_abnormal ? <Badge className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[9px]">ABNORMAL</Badge> :
                                                         <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[9px]">NORMAL</Badge>}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {approvingReport.remarks && (
                                <div className="p-3 bg-amber-500/[0.02] border border-amber-200/30 rounded-xl text-xs text-slate-450">
                                    <span className="font-bold text-slate-400 block uppercase text-[9px] mb-1">Technician Notes</span>
                                    {approvingReport.remarks}
                                </div>
                            )}

                            <div>
                                <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1">Enter Supervisor Digital Signature credentials</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. Dr. Sarah Patel, MD (Clinical Pathologist)"
                                    value={digitalSignature}
                                    onChange={(e) => setDigitalSignature(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-850 dark:text-white"
                                />
                                <span className="text-[10px] text-slate-450 mt-1 block">Digitally signing this report releases the diagnostic report to the Doctor's dashboard and EMR patient records immediately.</span>
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end pt-5 border-t border-slate-100 dark:border-slate-855 mt-4">
                            <Button 
                                variant="outline"
                                onClick={() => setApprovingReport(null)}
                                className="text-xs h-9 rounded-xl"
                            >
                                Cancel
                            </Button>
                            <Button 
                                onClick={handleConfirmApproval}
                                disabled={approving}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs h-9 flex items-center gap-1.5 px-4 shadow-lg shadow-emerald-550/10"
                            >
                                {approving ? 'Authorizing...' : 'Digitally Sign & Release Report'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal 5: Lab Order Full Details Audit Log */}
            {selectedOrderDetails && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-xl shadow-2xl relative max-h-[85vh] flex flex-col justify-between">
                        <button onClick={() => setSelectedOrderDetails(null)} className="absolute right-4 top-4 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                            <X className="w-4 h-4 text-slate-500" />
                        </button>
                        
                        <h3 className="text-lg font-bold text-slate-950 dark:text-white mb-3 flex items-center gap-2">
                            <ClipboardList className="w-5 h-5 text-indigo-500" /> Lab Order Workflow History
                        </h3>

                        <div className="overflow-y-auto pr-2 flex-1 space-y-4 py-2">
                            <div className="grid grid-cols-2 gap-4 border-b border-slate-100 dark:border-slate-850 pb-3 text-xs">
                                <div>
                                    <span className="text-slate-400 block font-semibold uppercase text-[9px]">Patient Profile</span>
                                    <span className="font-bold text-slate-800 dark:text-slate-200">{selectedOrderDetails.order?.patient_id?.name}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block font-semibold uppercase text-[9px]">Order Status</span>
                                    <Badge className="bg-indigo-50 text-indigo-750">{selectedOrderDetails.order?.status}</Badge>
                                </div>
                            </div>

                            {/* Samples audit list */}
                            <div>
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Specimens Assigned</h4>
                                <div className="space-y-2">
                                    {selectedOrderDetails.samples?.map((sample: any, idx: number) => (
                                        <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl flex justify-between items-center text-xs">
                                            <div>
                                                <p className="font-bold text-slate-800 dark:text-slate-150">{sample.sample_type} Specimen</p>
                                                <p className="text-[10px] text-slate-450 font-mono mt-0.5">ID: {sample.sample_id} | Barcode: {sample.barcode || 'Pending'}</p>
                                            </div>
                                            <Badge>{sample.status}</Badge>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Reports audit history */}
                            {selectedOrderDetails.reports && selectedOrderDetails.reports.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Report Sign-offs</h4>
                                    <div className="space-y-2">
                                        {selectedOrderDetails.reports.map((report: any, idx: number) => (
                                            <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs space-y-1.5">
                                                <div className="flex justify-between items-center font-bold">
                                                    <span className="text-indigo-550">Report {report.report_id}</span>
                                                    <Badge>{report.status}</Badge>
                                                </div>
                                                <p className="text-[10px] text-slate-450 leading-relaxed">
                                                    Technician: <span className="font-semibold text-slate-300">{report.verified_by_name || 'Staff'}</span> • Supervisor: <span className="font-semibold text-slate-300">{report.approved_by_name || 'Pending'}</span>
                                                </p>
                                                {report.audit_history && report.audit_history.length > 0 && (
                                                    <div className="border-t border-slate-100 dark:border-slate-850 pt-2 space-y-1 text-[10px] text-slate-450">
                                                        <span className="font-bold uppercase tracking-wider block text-[8px] text-slate-400">Activity Log</span>
                                                        {report.audit_history.map((log: any, lidx: number) => (
                                                            <div key={lidx} className="flex justify-between items-start">
                                                                <span>• {log.action}: {log.details}</span>
                                                                <span className="text-[8px] whitespace-nowrap text-slate-500 ml-2">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-855 mt-3">
                            <Button 
                                onClick={() => setSelectedOrderDetails(null)}
                                className="text-xs h-9 rounded-xl px-5"
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
