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
const mongoose_1 = __importDefault(require("mongoose"));
const Invoice_1 = __importDefault(require("../models/Invoice"));
const Payment_1 = __importDefault(require("../models/Payment"));
const Refund_1 = __importDefault(require("../models/Refund"));
const Insurance_1 = __importDefault(require("../models/Insurance"));
const InsuranceClaim_1 = __importDefault(require("../models/InsuranceClaim"));
const Consultation_1 = __importDefault(require("../models/Consultation"));
const LabOrder_1 = __importDefault(require("../models/LabOrder"));
const Dispensing_1 = __importDefault(require("../models/Dispensing"));
const Patient_1 = __importDefault(require("../models/Patient"));
const razorpayService_1 = __importDefault(require("./razorpayService"));
class BillingService {
    // Collect all uninvoiced charges for a patient
    collectPendingCharges(patientId) {
        return __awaiter(this, void 0, void 0, function* () {
            const patientObjectId = new mongoose_1.default.Types.ObjectId(patientId);
            // Fetch all invoices for this patient to identify already billed items
            const existingInvoices = yield Invoice_1.default.find({ patient_id: patientObjectId });
            const billedSourceIds = new Set();
            existingInvoices.forEach(inv => {
                inv.items.forEach(item => {
                    if (item.sourceId) {
                        billedSourceIds.add(item.sourceId.toString());
                    }
                });
            });
            const pendingItems = [];
            // 1. Check Registration Fee: If patient has no invoices at all, add a registration fee
            if (existingInvoices.length === 0) {
                pendingItems.push({
                    name: 'Hospital Registration Fee',
                    type: 'Registration',
                    quantity: 1,
                    unit_price: 150,
                    gst_rate: 18,
                    gst_amount: 27,
                    discount_amount: 0,
                    total_price: 177,
                    sourceType: 'Registration'
                });
            }
            // 2. Fetch completed Consultations
            const consultations = yield Consultation_1.default.find({
                patient_id: patientObjectId,
                status: 'Completed'
            }).populate({
                path: 'doctor_id',
                populate: { path: 'user_id', select: 'name' }
            });
            for (const cons of consultations) {
                if (!billedSourceIds.has(cons._id.toString())) {
                    const doctor = cons.doctor_id;
                    const docName = doctor && doctor.user_id ? doctor.user_id.name : 'Medical Officer';
                    const docFee = doctor ? (doctor.consultation_fee || 500) : 500;
                    const gstRate = 0; // Medical consultations are GST exempt or 0% usually
                    const gstAmount = 0;
                    pendingItems.push({
                        name: `Doctor Consultation - ${docName}`,
                        type: 'Consultation',
                        quantity: 1,
                        unit_price: docFee,
                        gst_rate: gstRate,
                        gst_amount: gstAmount,
                        discount_amount: 0,
                        total_price: docFee,
                        sourceId: cons._id,
                        sourceType: 'Consultation'
                    });
                }
            }
            // 3. Fetch completed Lab Orders
            const labOrders = yield LabOrder_1.default.find({
                patient_id: patientObjectId,
                status: 'Completed'
            });
            for (const order of labOrders) {
                if (!billedSourceIds.has(order._id.toString())) {
                    // Estimate price per test if test catalog isn't fully linked
                    // We'll charge a default flat rate of 350 per test
                    const testCount = order.tests.length;
                    const pricePerTest = 350;
                    const sub = testCount * pricePerTest;
                    const gstRate = 12;
                    const gst = parseFloat(((sub * gstRate) / 100).toFixed(2));
                    pendingItems.push({
                        name: `Lab Investigation: ${order.lab_order_id} (${order.tests.join(', ')})`,
                        type: 'LabTest',
                        quantity: 1,
                        unit_price: sub,
                        gst_rate: gstRate,
                        gst_amount: gst,
                        discount_amount: 0,
                        total_price: sub + gst,
                        sourceId: order._id,
                        sourceType: 'LabOrder'
                    });
                }
            }
            // 4. Fetch Dispensing records
            const dispensingLogs = yield Dispensing_1.default.find({
                patient_id: patientObjectId,
                status: 'Completed',
                $or: [
                    { invoice_id: { $exists: false } },
                    { invoice_id: null }
                ]
            });
            for (const disp of dispensingLogs) {
                if (!billedSourceIds.has(disp._id.toString())) {
                    let dispSubtotal = 0;
                    let dispGst = 0;
                    disp.dispensed_items.forEach((item) => {
                        const itemCost = item.unit_price * item.quantity_dispensed;
                        dispSubtotal += itemCost;
                        dispGst += (itemCost * (item.gst_rate || 12)) / 100;
                    });
                    dispSubtotal = parseFloat(dispSubtotal.toFixed(2));
                    dispGst = parseFloat(dispGst.toFixed(2));
                    pendingItems.push({
                        name: `Pharmacy Dispensing Ref: ${disp._id.toString().substring(18).toUpperCase()}`,
                        type: 'Pharmacy',
                        quantity: 1,
                        unit_price: dispSubtotal,
                        gst_rate: 12,
                        gst_amount: dispGst,
                        discount_amount: 0,
                        total_price: dispSubtotal + dispGst,
                        sourceId: disp._id,
                        sourceType: 'Dispensing'
                    });
                }
            }
            return pendingItems;
        });
    }
    // Generate unified Invoice for patient
    generateUnifiedInvoice(patientId, payload) {
        return __awaiter(this, void 0, void 0, function* () {
            const patientObjectId = new mongoose_1.default.Types.ObjectId(patientId);
            const pending = yield this.collectPendingCharges(patientId);
            if (pending.length === 0) {
                return null;
            }
            let subtotal = 0;
            let gst_amount = 0;
            pending.forEach(item => {
                subtotal += item.unit_price;
                gst_amount += item.gst_amount;
            });
            subtotal = parseFloat(subtotal.toFixed(2));
            gst_amount = parseFloat(gst_amount.toFixed(2));
            const discount_amount = payload.discount_amount || 0;
            let insurance_covered_amount = 0;
            let claimId;
            // Apply insurance if active
            if (payload.insurance_id) {
                const insurance = yield Insurance_1.default.findById(payload.insurance_id);
                if (insurance && insurance.is_active && new Date(insurance.validity) > new Date()) {
                    const totalBill = subtotal + gst_amount - discount_amount;
                    const coverage = (totalBill * insurance.coverage_percentage) / 100;
                    insurance_covered_amount = Math.min(coverage, insurance.balance_limit);
                }
            }
            const final_amount = Math.max(0, parseFloat((subtotal + gst_amount - discount_amount - insurance_covered_amount).toFixed(2)));
            const invoice = new Invoice_1.default({
                patient_id: patientObjectId,
                items: pending,
                subtotal,
                gst_amount,
                discount_amount,
                insurance_covered_amount,
                final_amount,
                amount_paid: 0,
                remaining_balance: final_amount,
                payment_status: final_amount === 0 ? 'Paid' : 'Pending',
                payment_method: insurance_covered_amount > 0 ? 'Insurance' : 'Cash',
                billing_date: new Date()
            });
            yield invoice.save();
            // If insurance is used, submit a claim
            if (payload.insurance_id && insurance_covered_amount > 0) {
                const claim = new InsuranceClaim_1.default({
                    invoice_id: invoice._id,
                    patient_id: patientObjectId,
                    insurance_id: new mongoose_1.default.Types.ObjectId(payload.insurance_id),
                    requested_amount: insurance_covered_amount,
                    status: 'Submitted',
                    notes: 'Automated claim submission during billing creation.'
                });
                yield claim.save();
                invoice.insurance_claim_id = claim._id;
                yield invoice.save();
            }
            // Link pharmacy invoices for backwards compatibility if a single dispensing record was invoiced
            const dispensingItem = pending.find(p => p.sourceType === 'Dispensing');
            if (dispensingItem && dispensingItem.sourceId) {
                yield Dispensing_1.default.findByIdAndUpdate(dispensingItem.sourceId, {
                    invoice_id: invoice._id
                });
            }
            return invoice;
        });
    }
    // Initialize online Razorpay order
    initiateOnlinePayment(invoiceId) {
        return __awaiter(this, void 0, void 0, function* () {
            const invoice = yield Invoice_1.default.findById(invoiceId).populate('patient_id');
            if (!invoice) {
                throw new Error('Invoice not found');
            }
            if (invoice.remaining_balance <= 0) {
                throw new Error('This invoice is already fully paid.');
            }
            // Create Razorpay Order
            const order = yield razorpayService_1.default.createOrder(invoice.remaining_balance, invoice.invoice_number);
            // Save order details to invoice
            invoice.razorpay_order_id = order.id;
            invoice.razorpay_payment_status = 'Created';
            yield invoice.save();
            return {
                orderId: order.id,
                amount: order.amount, // in paise
                currency: order.currency,
                keyId: process.env.RAZORPAY_KEY_ID,
                invoice_number: invoice.invoice_number
            };
        });
    }
    // Verify online payment
    verifyOnlinePayment(invoiceId, razorpayOrderId, razorpayPaymentId, razorpaySignature) {
        return __awaiter(this, void 0, void 0, function* () {
            const invoice = yield Invoice_1.default.findById(invoiceId);
            if (!invoice) {
                throw new Error('Invoice not found');
            }
            const isSignatureValid = razorpayService_1.default.verifySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
            if (!isSignatureValid) {
                // Log failed payment
                yield Payment_1.default.create({
                    invoice_id: invoice._id,
                    patient_id: invoice.patient_id,
                    amount: invoice.remaining_balance,
                    payment_status: 'Failed',
                    payment_method: 'UPI',
                    razorpayOrderId,
                    razorpayPaymentId,
                    razorpaySignature,
                    paymentGateway: 'Razorpay',
                    failureReason: 'Invalid payment signature. Verification failed.',
                    payment_date: new Date()
                });
                invoice.razorpay_payment_status = 'Failed';
                yield invoice.save();
                throw new Error('Payment signature verification failed.');
            }
            // Check if transaction was already processed to prevent duplicates
            const existingTxn = yield Payment_1.default.findOne({ razorpayPaymentId });
            if (existingTxn && existingTxn.payment_status === 'Success') {
                return { success: true, invoice, payment: existingTxn };
            }
            const paidAmount = invoice.remaining_balance;
            // Create Payment log
            const payment = new Payment_1.default({
                invoice_id: invoice._id,
                patient_id: invoice.patient_id,
                amount: paidAmount,
                payment_status: 'Success',
                payment_method: 'UPI', // Defaulting gateway type to UPI/Card (Gateway UI handles specific types)
                razorpayOrderId,
                razorpayPaymentId,
                razorpaySignature,
                paymentGateway: 'Razorpay',
                capturedAt: new Date(),
                payment_date: new Date()
            });
            yield payment.save();
            // Update Invoice
            invoice.amount_paid = parseFloat((invoice.amount_paid + paidAmount).toFixed(2));
            invoice.remaining_balance = 0;
            invoice.payment_status = 'Paid';
            invoice.payment_method = 'UPI';
            invoice.razorpay_payment_id = razorpayPaymentId;
            invoice.razorpay_payment_status = 'Captured';
            invoice.transaction_id = razorpayPaymentId;
            yield invoice.save();
            return { success: true, invoice, payment };
        });
    }
    // Process Cash/Card Offline Payment
    recordOfflinePayment(invoiceId, payload) {
        return __awaiter(this, void 0, void 0, function* () {
            const invoice = yield Invoice_1.default.findById(invoiceId);
            if (!invoice) {
                throw new Error('Invoice not found');
            }
            if (payload.amount > invoice.remaining_balance) {
                throw new Error(`Payment amount exceeds remaining balance. Max payable: ${invoice.remaining_balance}`);
            }
            const payment = new Payment_1.default({
                invoice_id: invoice._id,
                patient_id: invoice.patient_id,
                amount: payload.amount,
                payment_status: 'Success',
                payment_method: payload.payment_method,
                paymentGateway: 'Offline',
                cashier_id: payload.cashier_id ? new mongoose_1.default.Types.ObjectId(payload.cashier_id) : undefined,
                capturedAt: new Date(),
                payment_date: new Date()
            });
            yield payment.save();
            invoice.amount_paid = parseFloat((invoice.amount_paid + payload.amount).toFixed(2));
            invoice.remaining_balance = Math.max(0, parseFloat((invoice.remaining_balance - payload.amount).toFixed(2)));
            if (invoice.remaining_balance === 0) {
                invoice.payment_status = 'Paid';
            }
            else {
                invoice.payment_status = 'Partial';
            }
            invoice.payment_method = payload.payment_method;
            invoice.transaction_id = payment.transaction_id;
            yield invoice.save();
            return { success: true, invoice, payment };
        });
    }
    // Refund workflow (requires Admin/Superintendent approval)
    requestRefund(invoiceId, amount, reason, approvedByUserId) {
        return __awaiter(this, void 0, void 0, function* () {
            const invoice = yield Invoice_1.default.findById(invoiceId);
            if (!invoice) {
                throw new Error('Invoice not found');
            }
            if (amount > invoice.amount_paid) {
                throw new Error(`Refund amount exceeds amount paid. Max refund: ${invoice.amount_paid}`);
            }
            // Fetch successful payment associated with this invoice to check gateway
            const successfulPayment = yield Payment_1.default.findOne({
                invoice_id: invoice._id,
                payment_status: 'Success'
            }).sort({ createdAt: -1 });
            const refund = new Refund_1.default({
                invoice_id: invoice._id,
                patient_id: invoice.patient_id,
                amount,
                reason,
                status: 'Initiated',
                approved_by: new mongoose_1.default.Types.ObjectId(approvedByUserId),
                payment_id: successfulPayment ? successfulPayment._id : undefined
            });
            yield refund.save();
            // Process actual Razorpay refund if online
            if (successfulPayment && successfulPayment.paymentGateway === 'Razorpay' && successfulPayment.razorpayPaymentId) {
                try {
                    refund.status = 'Processing';
                    yield refund.save();
                    const rzpRefund = yield razorpayService_1.default.processRefund(successfulPayment.razorpayPaymentId, amount);
                    refund.status = 'Completed';
                    refund.razorpay_refund_id = rzpRefund.id;
                    yield refund.save();
                }
                catch (err) {
                    refund.status = 'Failed';
                    yield refund.save();
                    throw new Error(`Razorpay refund failed: ${err.message}`);
                }
            }
            else {
                // Offline refund completes instantly upon cash out approval
                refund.status = 'Completed';
                yield refund.save();
            }
            // Update Invoice status
            invoice.amount_paid = parseFloat((invoice.amount_paid - amount).toFixed(2));
            invoice.remaining_balance = parseFloat((invoice.remaining_balance + amount).toFixed(2));
            if (invoice.amount_paid === 0) {
                invoice.payment_status = 'Refunded';
            }
            else {
                invoice.payment_status = 'Partial';
            }
            yield invoice.save();
            return { success: true, refund, invoice };
        });
    }
    // Fetch Admin HQ Financial Analytics
    getFinancialAnalytics() {
        return __awaiter(this, void 0, void 0, function* () {
            const today = new Date();
            const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            // 1. Revenue Calculations
            const successfulPayments = yield Payment_1.default.find({ payment_status: 'Success' });
            let revenueToday = 0;
            let revenueThisMonth = 0;
            let totalRevenue = 0;
            let onlineRevenue = 0;
            let offlineRevenue = 0;
            successfulPayments.forEach(p => {
                totalRevenue += p.amount;
                if (p.paymentGateway === 'Razorpay') {
                    onlineRevenue += p.amount;
                }
                else {
                    offlineRevenue += p.amount;
                }
                if (p.payment_date >= startOfToday) {
                    revenueToday += p.amount;
                }
                if (p.payment_date >= startOfMonth) {
                    revenueThisMonth += p.amount;
                }
            });
            // 2. Outstanding Invoices
            const outstandingInvoices = yield Invoice_1.default.find({
                payment_status: { $in: ['Pending', 'Unpaid', 'Partial'] }
            });
            const outstandingAmount = outstandingInvoices.reduce((sum, inv) => sum + inv.remaining_balance, 0);
            // 3. Claims statistics
            const totalClaims = yield InsuranceClaim_1.default.countDocuments();
            const claimsApproved = yield InsuranceClaim_1.default.countDocuments({ status: 'Approved' });
            const claimRevenues = yield InsuranceClaim_1.default.find({ status: 'Approved' });
            const claimsValue = claimRevenues.reduce((sum, c) => sum + c.approved_amount, 0);
            // 4. Refund statistics
            const completedRefunds = yield Refund_1.default.find({ status: 'Completed' });
            const totalRefundsValue = completedRefunds.reduce((sum, r) => sum + r.amount, 0);
            // 5. Avg Revenue per patient
            const patientCount = yield Patient_1.default.countDocuments();
            const avgRevenue = patientCount > 0 ? parseFloat((totalRevenue / patientCount).toFixed(2)) : 0;
            // 6. Department revenue splits (from invoice items)
            const allInvoices = yield Invoice_1.default.find();
            const deptRevenue = {};
            allInvoices.forEach(inv => {
                inv.items.forEach(item => {
                    const type = item.type || 'Other';
                    deptRevenue[type] = (deptRevenue[type] || 0) + item.total_price;
                });
            });
            // 7. Transaction history (Top 10)
            const recentPayments = yield Payment_1.default.find({ payment_status: 'Success' })
                .populate('patient_id', 'name patient_id')
                .sort({ payment_date: -1 })
                .limit(10);
            // 8. Payment Method distribution
            const methodCounts = {};
            successfulPayments.forEach(p => {
                methodCounts[p.payment_method] = (methodCounts[p.payment_method] || 0) + 1;
            });
            return {
                revenueToday: parseFloat(revenueToday.toFixed(2)),
                revenueThisMonth: parseFloat(revenueThisMonth.toFixed(2)),
                totalRevenue: parseFloat(totalRevenue.toFixed(2)),
                onlineRevenue: parseFloat(onlineRevenue.toFixed(2)),
                offlineRevenue: parseFloat(offlineRevenue.toFixed(2)),
                outstandingAmount: parseFloat(outstandingAmount.toFixed(2)),
                totalClaims,
                claimsApproved,
                claimsValue: parseFloat(claimsValue.toFixed(2)),
                refundStatistics: {
                    count: completedRefunds.length,
                    value: parseFloat(totalRefundsValue.toFixed(2))
                },
                averageRevenuePerPatient: avgRevenue,
                departmentRevenue: deptRevenue,
                recentPayments,
                paymentMethodDistribution: methodCounts
            };
        });
    }
}
exports.default = new BillingService();
