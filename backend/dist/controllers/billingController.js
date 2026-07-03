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
exports.updateClaimStatus = exports.getClaims = exports.addInsurancePolicy = exports.getPatientPolicies = exports.getInvoiceDetails = exports.getInvoices = exports.getFinancialAnalytics = exports.processRefund = exports.recordOfflinePayment = exports.verifyOnlinePayment = exports.initiateOnlinePayment = exports.generateInvoice = exports.getPendingCharges = void 0;
const billingService_1 = __importDefault(require("../services/billingService"));
const Invoice_1 = __importDefault(require("../models/Invoice"));
const Insurance_1 = __importDefault(require("../models/Insurance"));
const InsuranceClaim_1 = __importDefault(require("../models/InsuranceClaim"));
const Payment_1 = __importDefault(require("../models/Payment"));
const Refund_1 = __importDefault(require("../models/Refund"));
const getPendingCharges = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const patientId = req.params.patientId;
        const pending = yield billingService_1.default.collectPendingCharges(patientId);
        res.json({ success: true, pending });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});
exports.getPendingCharges = getPendingCharges;
const generateInvoice = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { patientId, discount_amount, insurance_id } = req.body;
        if (!patientId) {
            res.status(400).json({ success: false, message: 'Patient ID is required.' });
            return;
        }
        const invoice = yield billingService_1.default.generateUnifiedInvoice(patientId, {
            discount_amount: discount_amount ? parseFloat(discount_amount) : 0,
            insurance_id
        });
        if (!invoice) {
            res.status(400).json({ success: false, message: 'No pending charges found for this patient.' });
            return;
        }
        res.status(201).json({ success: true, invoice });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});
exports.generateInvoice = generateInvoice;
const initiateOnlinePayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const invoiceId = req.params.invoiceId;
        const paymentData = yield billingService_1.default.initiateOnlinePayment(invoiceId);
        res.json(Object.assign({ success: true }, paymentData));
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});
exports.initiateOnlinePayment = initiateOnlinePayment;
const verifyOnlinePayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const invoiceId = req.params.invoiceId;
        const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
        if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
            res.status(400).json({ success: false, message: 'Missing Razorpay response properties.' });
            return;
        }
        const result = yield billingService_1.default.verifyOnlinePayment(invoiceId, razorpayOrderId, razorpayPaymentId, razorpaySignature);
        res.json(result);
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});
exports.verifyOnlinePayment = verifyOnlinePayment;
const recordOfflinePayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const invoiceId = req.params.invoiceId;
        const { amount, payment_method, cashier_id } = req.body;
        if (amount === undefined || !payment_method) {
            res.status(400).json({ success: false, message: 'Missing payment amount or method.' });
            return;
        }
        const result = yield billingService_1.default.recordOfflinePayment(invoiceId, {
            amount: parseFloat(amount),
            payment_method,
            cashier_id
        });
        res.json(result);
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});
exports.recordOfflinePayment = recordOfflinePayment;
const processRefund = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const invoiceId = req.params.invoiceId;
        const { amount, reason, approved_by } = req.body;
        if (amount === undefined || !reason || !approved_by) {
            res.status(400).json({ success: false, message: 'Missing amount, reason, or approver ID.' });
            return;
        }
        const result = yield billingService_1.default.requestRefund(invoiceId, parseFloat(amount), reason, approved_by);
        res.json(result);
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});
exports.processRefund = processRefund;
const getFinancialAnalytics = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const analytics = yield billingService_1.default.getFinancialAnalytics();
        res.json({ success: true, analytics });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});
exports.getFinancialAnalytics = getFinancialAnalytics;
const getInvoices = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { patient_id, payment_status } = req.query;
        const filter = {};
        if (patient_id)
            filter.patient_id = patient_id;
        if (payment_status)
            filter.payment_status = payment_status;
        const invoices = yield Invoice_1.default.find(filter)
            .populate('patient_id', 'name patient_id phone')
            .sort({ createdAt: -1 });
        res.json({ success: true, invoices });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});
exports.getInvoices = getInvoices;
const getInvoiceDetails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const invoiceId = req.params.invoiceId;
        const invoice = yield Invoice_1.default.findById(invoiceId)
            .populate('patient_id', 'name patient_id phone address city state pincode dob gender blood_group abha_id')
            .populate({
            path: 'insurance_claim_id',
            populate: { path: 'insurance_id' }
        });
        if (!invoice) {
            res.status(404).json({ success: false, message: 'Invoice not found.' });
            return;
        }
        // Fetch any payments associated with this invoice
        const payments = yield Payment_1.default.find({ invoice_id: invoice._id });
        // Fetch any refunds associated with this invoice
        const refunds = yield Refund_1.default.find({ invoice_id: invoice._id });
        res.json({ success: true, invoice, payments, refunds });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});
exports.getInvoiceDetails = getInvoiceDetails;
// Insurance policy endpoints
const getPatientPolicies = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const patientId = req.params.patientId;
        const policies = yield Insurance_1.default.find({ patient_id: patientId });
        res.json({ success: true, policies });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});
exports.getPatientPolicies = getPatientPolicies;
const addInsurancePolicy = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { patient_id, provider, policy_number, coverage_percentage, validity, coverage_limit, balance_limit, insurance_type } = req.body;
        if (!patient_id || !provider || !policy_number || !coverage_percentage || !validity || coverage_limit === undefined) {
            res.status(400).json({ success: false, message: 'Missing required insurance details.' });
            return;
        }
        const policy = new Insurance_1.default({
            patient_id,
            provider,
            policy_number,
            coverage_percentage: parseFloat(coverage_percentage),
            validity: new Date(validity),
            coverage_limit: parseFloat(coverage_limit),
            balance_limit: balance_limit !== undefined ? parseFloat(balance_limit) : parseFloat(coverage_limit),
            insurance_type: insurance_type || 'Private',
            is_active: true
        });
        yield policy.save();
        res.status(201).json({ success: true, policy });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});
exports.addInsurancePolicy = addInsurancePolicy;
// Claims list and updates
const getClaims = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const claims = yield InsuranceClaim_1.default.find()
            .populate('patient_id', 'name patient_id')
            .populate('insurance_id')
            .populate('invoice_id', 'invoice_number final_amount payment_status')
            .sort({ createdAt: -1 });
        res.json({ success: true, claims });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});
exports.getClaims = getClaims;
const updateClaimStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const claimId = req.params.claimId;
        const { status, approved_amount, notes } = req.body;
        const claim = yield InsuranceClaim_1.default.findById(claimId);
        if (!claim) {
            res.status(404).json({ success: false, message: 'Claim not found.' });
            return;
        }
        claim.status = status;
        if (approved_amount !== undefined) {
            claim.approved_amount = parseFloat(approved_amount);
        }
        if (notes) {
            claim.notes = notes;
        }
        if (status === 'Approved' || status === 'Settled' || status === 'Partially Approved') {
            claim.settled_date = new Date();
            // Deduct approved amount from insurance limit
            const insurance = yield Insurance_1.default.findById(claim.insurance_id);
            if (insurance) {
                insurance.balance_limit = Math.max(0, parseFloat((insurance.balance_limit - claim.approved_amount).toFixed(2)));
                yield insurance.save();
            }
            // Update associated invoice details
            const invoice = yield Invoice_1.default.findById(claim.invoice_id);
            if (invoice) {
                // If claim is approved/settled, deduct that from final paid amount or adjust
                invoice.insurance_covered_amount = claim.approved_amount;
                invoice.remaining_balance = Math.max(0, parseFloat((invoice.final_amount - invoice.amount_paid - invoice.insurance_covered_amount).toFixed(2)));
                if (invoice.remaining_balance === 0) {
                    invoice.payment_status = 'Paid';
                }
                yield invoice.save();
            }
        }
        yield claim.save();
        res.json({ success: true, claim });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});
exports.updateClaimStatus = updateClaimStatus;
