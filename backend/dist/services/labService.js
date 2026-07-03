"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLIMSAnalytics = exports.getPatientLabRecords = exports.approveReport = exports.submitResults = exports.updateSampleStatus = exports.scanBarcode = exports.collectSample = exports.getSamplesDashboardData = exports.getLabOrderDetails = exports.getPendingOrders = exports.initializeSamplesForOrder = exports.createLabOrder = exports.getTestCatalog = exports.seedTestCatalog = exports.logLabAudit = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const LabOrder_1 = __importDefault(require("../models/LabOrder"));
const LabTest_1 = __importDefault(require("../models/LabTest"));
const Sample_1 = __importDefault(require("../models/Sample"));
const LabReport_1 = __importDefault(require("../models/LabReport"));
const AuditLog_1 = __importDefault(require("../models/AuditLog"));
// Helper for LIMS audit logging
const logLabAudit = (userId, action, details, patientId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield AuditLog_1.default.create({
            user_id: new mongoose_1.default.Types.ObjectId(userId),
            user_type: 'Lab Technician',
            action,
            patient_id: patientId ? new mongoose_1.default.Types.ObjectId(patientId) : undefined,
            details,
            ip_address: '127.0.0.1'
        });
    }
    catch (e) {
        console.error("LIMS audit logging failed", e);
    }
});
exports.logLabAudit = logLabAudit;
// Seed default tests catalog if empty
const seedTestCatalog = () => __awaiter(void 0, void 0, void 0, function* () {
    const count = yield LabTest_1.default.countDocuments();
    if (count > 0)
        return;
    const defaultCatalog = [
        {
            test_id: 'LT-001',
            name: 'Complete Blood Count (CBC)',
            category: 'Blood Tests',
            department: 'Hematology',
            estimated_time_hours: 4,
            preparation_instructions: 'No fasting required.',
            normal_reference_range: 'WBC: 4.5-11.0 k/uL, RBC: 4.5-5.9 M/uL, Hb: 13.5-17.5 g/dL, Platelets: 150-450 k/uL',
            unit: 'Mixed',
            price: 300,
            priority: 'Routine'
        },
        {
            test_id: 'LT-002',
            name: 'Lipid Profile',
            category: 'Biochemistry',
            department: 'Biochemistry',
            estimated_time_hours: 8,
            preparation_instructions: '12 hours fasting required before sample collection.',
            normal_reference_range: 'Cholesterol: <200 mg/dL, Triglycerides: <150 mg/dL, HDL: >40 mg/dL, LDL: <100 mg/dL',
            unit: 'mg/dL',
            price: 600,
            priority: 'Routine'
        },
        {
            test_id: 'LT-003',
            name: 'Liver Function Test (LFT)',
            category: 'Biochemistry',
            department: 'Biochemistry',
            estimated_time_hours: 6,
            preparation_instructions: 'Fasting preferred but not mandatory.',
            normal_reference_range: 'Bilirubin: 0.1-1.2 mg/dL, ALT: 7-56 U/L, AST: 10-40 U/L, Alkaline Phosphatase: 44-147 U/L',
            unit: 'Mixed',
            price: 700,
            priority: 'Routine'
        },
        {
            test_id: 'LT-004',
            name: 'Kidney Function Test (KFT)',
            category: 'Biochemistry',
            department: 'Biochemistry',
            estimated_time_hours: 6,
            preparation_instructions: 'No fasting required.',
            normal_reference_range: 'Urea: 7-20 mg/dL, Creatinine: 0.6-1.2 mg/dL, Uric Acid: 3.5-7.2 mg/dL',
            unit: 'mg/dL',
            price: 650,
            priority: 'Routine'
        },
        {
            test_id: 'LT-005',
            name: 'Thyroid Profile (T3, T4, TSH)',
            category: 'Hormone Tests',
            department: 'Endocrinology',
            estimated_time_hours: 12,
            preparation_instructions: 'Morning sample is recommended.',
            normal_reference_range: 'TSH: 0.4-4.0 mIU/L, Free T4: 0.8-1.8 ng/dL, Free T3: 2.3-4.2 pg/mL',
            unit: 'Mixed',
            price: 800,
            priority: 'Routine'
        },
        {
            test_id: 'LT-006',
            name: 'Urine Routine & Microscopy',
            category: 'Urine Tests',
            department: 'Urinalysis',
            estimated_time_hours: 3,
            preparation_instructions: 'First morning midstream clean catch urine sample preferred.',
            normal_reference_range: 'Color: Pale Yellow, Clarity: Clear, pH: 5.0-8.0, Protein: Negative, Glucose: Negative',
            unit: 'Qualitative',
            price: 200,
            priority: 'Routine'
        },
        {
            test_id: 'LT-007',
            name: 'Stool Routine Examination',
            category: 'Stool Tests',
            department: 'Parasitology',
            estimated_time_hours: 4,
            preparation_instructions: 'Collect sample in a clean dry wide-mouth container.',
            normal_reference_range: 'Color: Brown, Consistency: Formed, Pus Cells: Nil, RBCs: Nil, Parasites: Not Detected',
            unit: 'Qualitative',
            price: 250,
            priority: 'Routine'
        },
        {
            test_id: 'LT-008',
            name: 'HbA1c (Glycated Hemoglobin)',
            category: 'Biochemistry',
            department: 'Biochemistry',
            estimated_time_hours: 4,
            preparation_instructions: 'No special preparation needed.',
            normal_reference_range: 'Normal: <5.7%, Prediabetic: 5.7%-6.4%, Diabetic: >=6.5%',
            unit: '%',
            price: 450,
            priority: 'Routine'
        },
        {
            test_id: 'LT-009',
            name: 'Blood Culture & Sensitivity',
            category: 'Microbiology',
            department: 'Microbiology',
            estimated_time_hours: 72,
            preparation_instructions: 'Collect before starting antibiotics if possible.',
            normal_reference_range: 'No growth of aerobic/anaerobic organisms after 48-72 hours.',
            unit: 'Observation',
            price: 1200,
            priority: 'Stat'
        },
        {
            test_id: 'LT-010',
            name: 'Electrocardiogram (ECG)',
            category: 'Cardiology',
            department: 'Cardiology',
            estimated_time_hours: 1,
            preparation_instructions: 'Avoid heavy meals or exercise immediately before the test.',
            normal_reference_range: 'Normal sinus rhythm, normal axis, no acute ST-T changes.',
            unit: 'Observation',
            price: 350,
            priority: 'Urgent'
        },
        {
            test_id: 'LT-011',
            name: 'Chest X-Ray PA View',
            category: 'Radiology',
            department: 'Radiology',
            estimated_time_hours: 2,
            preparation_instructions: 'Remove all metal jewelry, wear hospital gown.',
            normal_reference_range: 'Lungs clear. Heart size normal. Bony thorax intact.',
            unit: 'Observation',
            price: 500,
            priority: 'Urgent'
        }
    ];
    yield LabTest_1.default.insertMany(defaultCatalog);
    console.log('Seeded lab test catalog successfully.');
});
exports.seedTestCatalog = seedTestCatalog;
// Get the catalog (seeding first if needed)
const getTestCatalog = () => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, exports.seedTestCatalog)();
    return yield LabTest_1.default.find().sort({ name: 1 });
});
exports.getTestCatalog = getTestCatalog;
// Create a Lab Order manually or from Consultation flow
const createLabOrder = (patientId_1, visitId_1, ...args_1) => __awaiter(void 0, [patientId_1, visitId_1, ...args_1], void 0, function* (patientId, visitId, testNames = []) {
    yield (0, exports.seedTestCatalog)();
    const results = testNames.map(name => ({
        test_name: name,
        status: 'Pending'
    }));
    const labOrder = new LabOrder_1.default({
        patient_id: new mongoose_1.default.Types.ObjectId(patientId),
        visit_id: visitId ? new mongoose_1.default.Types.ObjectId(visitId) : undefined,
        tests: testNames,
        results,
        status: 'Ordered'
    });
    yield labOrder.save();
    yield (0, exports.initializeSamplesForOrder)(labOrder);
    return labOrder;
});
exports.createLabOrder = createLabOrder;
// Group tests by sample type and initialize Samples
const initializeSamplesForOrder = (labOrder) => __awaiter(void 0, void 0, void 0, function* () {
    const testsList = yield LabTest_1.default.find({ name: { $in: labOrder.tests } });
    // Map test names to their sample types
    const sampleGroups = {};
    testsList.forEach(test => {
        let type = 'Blood';
        if (test.category === 'Urine Tests')
            type = 'Urine';
        else if (test.category === 'Stool Tests')
            type = 'Stool';
        else if (test.category === 'Microbiology')
            type = 'Swab/Culture';
        else if (test.category === 'Radiology' || test.category === 'Cardiology') {
            type = 'Imaging/Tracing';
        }
        if (!sampleGroups[type]) {
            sampleGroups[type] = [];
        }
        sampleGroups[type].push(test.name);
    });
    // Create a Sample document for each group
    for (const [sampleType, tests] of Object.entries(sampleGroups)) {
        yield Sample_1.default.create({
            patient_id: labOrder.patient_id,
            lab_order_id: labOrder._id,
            test_names: tests,
            sample_type: sampleType,
            status: 'Ordered'
        });
    }
});
exports.initializeSamplesForOrder = initializeSamplesForOrder;
// Get pending orders list
const getPendingOrders = () => __awaiter(void 0, void 0, void 0, function* () {
    return yield LabOrder_1.default.find({ status: { $ne: 'Completed' } })
        .populate('patient_id')
        .sort({ createdAt: -1 });
});
exports.getPendingOrders = getPendingOrders;
// Get lab order details
const getLabOrderDetails = (orderId) => __awaiter(void 0, void 0, void 0, function* () {
    const order = yield LabOrder_1.default.findById(orderId).populate('patient_id');
    if (!order)
        return null;
    const samples = yield Sample_1.default.find({ lab_order_id: order._id });
    const reports = yield LabReport_1.default.find({ lab_order_id: order._id });
    return { order, samples, reports };
});
exports.getLabOrderDetails = getLabOrderDetails;
// Get Samples lists by status categories
const getSamplesDashboardData = () => __awaiter(void 0, void 0, void 0, function* () {
    const samples = yield Sample_1.default.find().populate('patient_id').sort({ updatedAt: -1 });
    const orders = yield LabOrder_1.default.find().populate('patient_id').sort({ updatedAt: -1 });
    const reports = yield LabReport_1.default.find().populate('patient_id').sort({ updatedAt: -1 });
    const pending = orders.filter(o => o.status === 'Ordered');
    const collected = samples.filter(s => s.status === 'Collected' || s.status === 'In Transit');
    const processing = samples.filter(s => s.status === 'Received' || s.status === 'Processing');
    const qc = reports.filter(r => r.status === 'Draft' || r.status === 'Pending Approval');
    const completed = reports.filter(r => r.status === 'Approved' || r.status === 'Completed');
    const rejected = samples.filter(s => s.status === 'Rejected');
    return {
        pendingOrders: pending,
        collectedSamples: collected,
        processingSamples: processing,
        qcReports: qc,
        completedReports: completed,
        rejectedSamples: rejected,
        totalSamplesCount: samples.length,
        totalOrdersCount: orders.length,
        totalReportsCount: reports.length
    };
});
exports.getSamplesDashboardData = getSamplesDashboardData;
// Collect Sample
const collectSample = (sampleId, technicianId, technicianName, sampleType) => __awaiter(void 0, void 0, void 0, function* () {
    const sample = yield Sample_1.default.findById(sampleId);
    if (!sample)
        throw new Error('Sample not found');
    sample.status = 'Collected';
    sample.collected_by = new mongoose_1.default.Types.ObjectId(technicianId);
    sample.collected_by_name = technicianName;
    sample.collection_time = new Date();
    sample.sample_type = sampleType;
    yield sample.save();
    // Update order status if in Ordered state
    const order = yield LabOrder_1.default.findById(sample.lab_order_id);
    if (order && order.status === 'Ordered') {
        order.status = 'Collected';
        yield order.save();
    }
    yield (0, exports.logLabAudit)(technicianId, 'COLLECT_SAMPLE', `Collected sample ${sample.sample_id} (${sampleType}) for patient ${sample.patient_id}.`, sample.patient_id.toString());
    return sample;
});
exports.collectSample = collectSample;
// Scan Barcode (auto changes state to Received or Processing)
const scanBarcode = (barcode, technicianId, technicianName) => __awaiter(void 0, void 0, void 0, function* () {
    const sample = yield Sample_1.default.findOne({ barcode });
    if (!sample)
        throw new Error('Invalid barcode. Sample not found.');
    if (sample.status === 'Collected' || sample.status === 'In Transit' || sample.status === 'Ordered') {
        sample.status = 'Received';
        sample.received_time = new Date();
        yield sample.save();
        const order = yield LabOrder_1.default.findById(sample.lab_order_id);
        if (order && order.status === 'Collected') {
            order.status = 'Processing';
            yield order.save();
        }
        yield (0, exports.logLabAudit)(technicianId, 'SCAN_BARCODE_RECEIVE', `Scanned barcode ${barcode}. Sample status updated to Received.`, sample.patient_id.toString());
    }
    else if (sample.status === 'Received') {
        sample.status = 'Processing';
        yield sample.save();
        yield (0, exports.logLabAudit)(technicianId, 'SCAN_BARCODE_PROCESS', `Scanned barcode ${barcode}. Sample status updated to Processing.`, sample.patient_id.toString());
    }
    return sample;
});
exports.scanBarcode = scanBarcode;
// Update Sample Status (Transit, Reject, Recollect)
const updateSampleStatus = (sampleId, status, technicianId, technicianName, rejectionReason) => __awaiter(void 0, void 0, void 0, function* () {
    const sample = yield Sample_1.default.findById(sampleId);
    if (!sample)
        throw new Error('Sample not found');
    sample.status = status;
    if (status === 'Rejected' && rejectionReason) {
        sample.rejection_reason = rejectionReason;
    }
    yield sample.save();
    yield (0, exports.logLabAudit)(technicianId, `UPDATE_SAMPLE_STATUS_${status.toUpperCase()}`, `Updated sample ${sample.sample_id} status to ${status}. Reason: ${rejectionReason || 'N/A'}`);
    return sample;
});
exports.updateSampleStatus = updateSampleStatus;
// Submit results and create Lab Report draft
const submitResults = (labOrderId, resultsPayload, remarks, technicianId, technicianName) => __awaiter(void 0, void 0, void 0, function* () {
    const order = yield LabOrder_1.default.findById(labOrderId);
    if (!order)
        throw new Error('Lab Order not found');
    // Look up patient and doctor
    const patientId = order.patient_id;
    // Attempt to retrieve doctor_id from legacy Visit if exists
    let doctorId = undefined;
    if (order.visit_id) {
        const visit = yield Visit.findById(order.visit_id);
        if (visit)
            doctorId = visit.doctor_id;
    }
    // Process abnormal and critical values based on common ranges
    const results = resultsPayload.map(r => {
        const valueNum = parseFloat(r.result_value);
        let isAbnormal = false;
        let isCritical = false;
        // Smart range analysis for common tests
        if (!isNaN(valueNum)) {
            if (r.test_name.includes('WBC')) {
                if (valueNum < 4.5 || valueNum > 11.0)
                    isAbnormal = true;
                if (valueNum < 2.0 || valueNum > 30.0)
                    isCritical = true;
            }
            else if (r.test_name.includes('Hb') || r.test_name.includes('Hemoglobin')) {
                if (valueNum < 12.0 || valueNum > 18.0)
                    isAbnormal = true;
                if (valueNum < 7.0 || valueNum > 20.0)
                    isCritical = true;
            }
            else if (r.test_name.includes('Platelets')) {
                if (valueNum < 150 || valueNum > 450)
                    isAbnormal = true;
                if (valueNum < 50 || valueNum > 1000)
                    isCritical = true;
            }
            else if (r.test_name.includes('Cholesterol')) {
                if (valueNum > 200)
                    isAbnormal = true;
                if (valueNum > 300)
                    isCritical = true;
            }
            else if (r.test_name.includes('Creatinine')) {
                if (valueNum < 0.6 || valueNum > 1.2)
                    isAbnormal = true;
                if (valueNum > 3.0)
                    isCritical = true;
            }
            else if (r.test_name.includes('TSH')) {
                if (valueNum < 0.4 || valueNum > 4.0)
                    isAbnormal = true;
            }
        }
        else {
            // Qualitative checks
            const lowerVal = r.result_value.toLowerCase();
            if (lowerVal.includes('positive') || lowerVal.includes('abnormal') || lowerVal.includes('reactive')) {
                isAbnormal = true;
            }
        }
        return {
            test_name: r.test_name,
            result_value: r.result_value,
            reference_range: r.reference_range,
            unit: r.unit,
            is_abnormal: isAbnormal,
            is_critical: isCritical
        };
    });
    const isCriticalAlert = results.some(r => r.is_critical);
    // Check if report draft already exists
    let report = yield LabReport_1.default.findOne({ lab_order_id: order._id, status: 'Draft' });
    if (!report) {
        report = new LabReport_1.default({
            lab_order_id: order._id,
            patient_id: patientId,
            doctor_id: doctorId,
            status: 'Draft',
            version: 1
        });
    }
    report.results = results;
    report.remarks = remarks;
    report.verified_by = new mongoose_1.default.Types.ObjectId(technicianId);
    report.verified_by_name = technicianName;
    report.is_critical_alert = isCriticalAlert;
    // Add audit history
    report.audit_history.push({
        action: 'SUBMIT_RESULTS',
        performed_by: technicianName,
        timestamp: new Date(),
        details: `Submitted laboratory results for QC checking. Critical Alert: ${isCriticalAlert}.`
    });
    yield report.save();
    // Mark samples as Completed
    yield Sample_1.default.updateMany({ lab_order_id: order._id }, { status: 'Completed' });
    yield (0, exports.logLabAudit)(technicianId, 'SUBMIT_RESULTS', `Submitted results for Lab Order ${order.lab_order_id}.`, patientId.toString());
    return report;
});
exports.submitResults = submitResults;
// Approve Lab Report (Quality Check verification)
const approveReport = (reportId, supervisorId, supervisorName, digitalSignature) => __awaiter(void 0, void 0, void 0, function* () {
    const report = yield LabReport_1.default.findById(reportId);
    if (!report)
        throw new Error('Report not found');
    report.status = 'Approved';
    report.approved_by = new mongoose_1.default.Types.ObjectId(supervisorId);
    report.approved_by_name = supervisorName;
    report.digital_signature = digitalSignature;
    // Generate simple QR verification token (mocked hash)
    report.qr_code_hash = `VERIFY-REP-${report.report_id}-${Date.now().toString(36).toUpperCase()}`;
    report.audit_history.push({
        action: 'APPROVE_REPORT',
        performed_by: supervisorName,
        timestamp: new Date(),
        details: `Approved lab report. Digital signature applied: ${digitalSignature.substring(0, 8)}...`
    });
    yield report.save();
    // Update Lab Order to Completed
    const order = yield LabOrder_1.default.findById(report.lab_order_id);
    if (order) {
        order.status = 'Completed';
        // Match results inside order
        order.results = report.results.map(r => ({
            test_name: r.test_name,
            result_value: r.result_value,
            reference_range: r.reference_range,
            status: 'Completed',
            completed_at: new Date()
        }));
        yield order.save();
    }
    yield (0, exports.logLabAudit)(supervisorId, 'APPROVE_LAB_REPORT', `Approved Report ID: ${report.report_id}`, report.patient_id.toString());
    return report;
});
exports.approveReport = approveReport;
// Get Patient specific lab reports/orders
const getPatientLabRecords = (patientId) => __awaiter(void 0, void 0, void 0, function* () {
    const orders = yield LabOrder_1.default.find({ patient_id: patientId }).sort({ createdAt: -1 });
    const reports = yield LabReport_1.default.find({ patient_id: patientId, status: 'Approved' }).sort({ createdAt: -1 });
    const samples = yield Sample_1.default.find({ patient_id: patientId }).sort({ createdAt: -1 });
    return { orders, reports, samples };
});
exports.getPatientLabRecords = getPatientLabRecords;
// Admin LIMS Analytics & Stats
const getLIMSAnalytics = () => __awaiter(void 0, void 0, void 0, function* () {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const testsToday = yield LabOrder_1.default.countDocuments({ createdAt: { $gte: today } });
    const pendingCount = yield LabOrder_1.default.countDocuments({ status: { $ne: 'Completed' } });
    const completedCount = yield LabOrder_1.default.countDocuments({ status: 'Completed' });
    const rejectedCount = yield Sample_1.default.countDocuments({ status: 'Rejected' });
    // Turnaround time: average time between order creation and report completion
    const completedReports = yield LabReport_1.default.find({ status: 'Approved' }).populate('lab_order_id');
    let totalTatMs = 0;
    let tatCount = 0;
    completedReports.forEach(rep => {
        const order = rep.lab_order_id;
        if (order && order.createdAt) {
            const diff = rep.updatedAt.getTime() - order.createdAt.getTime();
            totalTatMs += diff;
            tatCount++;
        }
    });
    const averageTatHours = tatCount > 0 ? parseFloat((totalTatMs / (1000 * 60 * 60) / tatCount).toFixed(2)) : 0;
    // Critical Alerts
    const criticalReports = yield LabReport_1.default.find({ is_critical_alert: true, status: 'Approved' }).populate('patient_id');
    return {
        testsToday,
        pendingReports: pendingCount,
        completedReports: completedCount,
        rejectedSamples: rejectedCount,
        averageTurnaroundTimeHours: averageTatHours,
        criticalReports
    };
});
exports.getLIMSAnalytics = getLIMSAnalytics;
// Import Visit schema for lookup in submitResults
const Visit = mongoose_1.default.model('Visit');
