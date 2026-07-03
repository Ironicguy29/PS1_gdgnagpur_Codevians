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
const dotenv_1 = __importDefault(require("dotenv"));
const Patient_1 = __importDefault(require("./models/Patient"));
const Insurance_1 = __importDefault(require("./models/Insurance"));
const Invoice_1 = __importDefault(require("./models/Invoice"));
const Payment_1 = __importDefault(require("./models/Payment"));
const InsuranceClaim_1 = __importDefault(require("./models/InsuranceClaim"));
const Counter_1 = __importDefault(require("./models/Counter"));
dotenv_1.default.config();
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
    console.error('MONGO_URI is not set in backend/.env');
    process.exit(1);
}
function seed() {
    return __awaiter(this, void 0, void 0, function* () {
        yield mongoose_1.default.connect(MONGO_URI);
        console.log('Connected to MongoDB Atlas for billing seeding...');
        // Find demo patient
        const patient = yield Patient_1.default.findOne({ name: 'Ramesh Patil' });
        if (!patient) {
            console.error('Patient Ramesh Patil not found. Please run seed-demo-users.js first.');
            process.exit(1);
        }
        // Clear existing billing and insurance
        yield Insurance_1.default.deleteMany({ patient_id: patient._id });
        yield Invoice_1.default.deleteMany({ patient_id: patient._id });
        yield Payment_1.default.deleteMany({ patient_id: patient._id });
        yield InsuranceClaim_1.default.deleteMany({ patient_id: patient._id });
        console.log('Cleared existing billing, insurance, payments, and claims.');
        // 1. Create Private Insurance
        const privateIns = yield Insurance_1.default.create({
            patient_id: patient._id,
            provider: 'Star Health Insurance',
            policy_number: 'POL-778899',
            coverage_percentage: 80,
            validity: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year validity
            coverage_limit: 500000,
            balance_limit: 450000,
            insurance_type: 'Private',
            is_active: true
        });
        console.log('Seeded Star Health Insurance policy.');
        // 2. Create Government Insurance
        const govIns = yield Insurance_1.default.create({
            patient_id: patient._id,
            provider: 'Ayushman Bharat PM-JAY',
            policy_number: 'AB-554422',
            coverage_percentage: 100,
            validity: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000), // 2 year validity
            coverage_limit: 500000,
            balance_limit: 500000,
            insurance_type: 'Government',
            is_active: true
        });
        console.log('Seeded Ayushman Bharat PM-JAY policy.');
        // 3. Create Past Invoices
        // Invoice 1: Consultation & Registration (Paid via Cash)
        const invoice1 = yield Invoice_1.default.create({
            patient_id: patient._id,
            invoice_number: 'INV-2026-000001',
            items: [
                {
                    name: 'Hospital Registration Fee',
                    type: 'Registration',
                    quantity: 1,
                    unit_price: 150,
                    gst_rate: 18,
                    gst_amount: 27,
                    discount_amount: 0,
                    total_price: 177
                },
                {
                    name: 'Doctor Consultation - Dr. Rajesh Nambiar',
                    type: 'Consultation',
                    quantity: 1,
                    unit_price: 500,
                    gst_rate: 0,
                    gst_amount: 0,
                    discount_amount: 0,
                    total_price: 500
                }
            ],
            subtotal: 650,
            gst_amount: 27,
            discount_amount: 0,
            insurance_covered_amount: 0,
            final_amount: 677,
            amount_paid: 677,
            remaining_balance: 0,
            payment_status: 'Paid',
            payment_method: 'Cash',
            billing_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) // 10 days ago
        });
        yield Payment_1.default.create({
            invoice_id: invoice1._id,
            patient_id: patient._id,
            amount: 677,
            payment_status: 'Success',
            payment_method: 'Cash',
            transaction_id: 'TXN-2026-000001',
            paymentGateway: 'Offline',
            capturedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
            payment_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
        });
        // Invoice 2: Lab Orders (Paid via Razorpay/UPI)
        const invoice2 = yield Invoice_1.default.create({
            patient_id: patient._id,
            invoice_number: 'INV-2026-000002',
            items: [
                {
                    name: 'Lab Investigation: Complete Blood Count',
                    type: 'LabTest',
                    quantity: 1,
                    unit_price: 350,
                    gst_rate: 12,
                    gst_amount: 42,
                    total_price: 392,
                    discount_amount: 0
                },
                {
                    name: 'Lab Investigation: Thyroid Profile',
                    type: 'LabTest',
                    quantity: 1,
                    unit_price: 450,
                    gst_rate: 12,
                    gst_amount: 54,
                    total_price: 504,
                    discount_amount: 0
                }
            ],
            subtotal: 800,
            gst_amount: 96,
            discount_amount: 0,
            insurance_covered_amount: 0,
            final_amount: 896,
            amount_paid: 896,
            remaining_balance: 0,
            payment_status: 'Paid',
            payment_method: 'UPI',
            billing_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
        });
        yield Payment_1.default.create({
            invoice_id: invoice2._id,
            patient_id: patient._id,
            amount: 896,
            payment_status: 'Success',
            payment_method: 'UPI',
            transaction_id: 'pay_rzp_mock_112233',
            paymentGateway: 'Razorpay',
            capturedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            payment_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
        });
        // Invoice 3: Pharmacy Dispensing (Under Insurance Claim approval - Partial Insurance payment)
        const invoice3 = yield Invoice_1.default.create({
            patient_id: patient._id,
            invoice_number: 'INV-2026-000003',
            items: [
                {
                    name: 'Pharmacy Dispensing: Amlodipine 5mg',
                    type: 'Pharmacy',
                    quantity: 30,
                    unit_price: 120,
                    gst_rate: 12,
                    gst_amount: 14.4,
                    total_price: 134.4,
                    discount_amount: 0
                },
                {
                    name: 'Pharmacy Dispensing: Metformin 500mg',
                    type: 'Pharmacy',
                    quantity: 60,
                    unit_price: 180,
                    gst_rate: 12,
                    gst_amount: 21.6,
                    total_price: 201.6,
                    discount_amount: 0
                }
            ],
            subtotal: 300,
            gst_amount: 36,
            discount_amount: 0,
            insurance_covered_amount: 268.8, // 80% coverage
            final_amount: 67.2, // 20% patient co-pay
            amount_paid: 67.2, // Patient paid co-pay
            remaining_balance: 0,
            payment_status: 'Paid',
            payment_method: 'Insurance',
            billing_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
        });
        const claim = yield InsuranceClaim_1.default.create({
            claim_number: 'CLM-2026-000001',
            invoice_id: invoice3._id,
            patient_id: patient._id,
            insurance_id: privateIns._id,
            requested_amount: 268.8,
            approved_amount: 268.8,
            status: 'Approved',
            claim_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            settled_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            notes: 'Dispensary medication claims fully approved under standard benefits.'
        });
        // Deduct claim from insurance limit
        privateIns.balance_limit = privateIns.balance_limit - 268.8;
        yield privateIns.save();
        invoice3.insurance_claim_id = claim._id;
        yield invoice3.save();
        // Log patient co-pay payment
        yield Payment_1.default.create({
            invoice_id: invoice3._id,
            patient_id: patient._id,
            amount: 67.2,
            payment_status: 'Success',
            payment_method: 'Card',
            transaction_id: 'TXN-2026-000003',
            paymentGateway: 'Offline',
            capturedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            payment_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        });
        // Create one pending / unpaid Invoice to test Razorpay payment
        const invoicePending = yield Invoice_1.default.create({
            patient_id: patient._id,
            invoice_number: 'INV-2026-000004',
            items: [
                {
                    name: 'Doctor Consultation - Dr. Rajesh Nambiar',
                    type: 'Consultation',
                    quantity: 1,
                    unit_price: 500,
                    gst_rate: 0,
                    gst_amount: 0,
                    discount_amount: 0,
                    total_price: 500
                },
                {
                    name: 'Lab Investigation: Lipid Profile',
                    type: 'LabTest',
                    quantity: 1,
                    unit_price: 600,
                    gst_rate: 12,
                    gst_amount: 72,
                    discount_amount: 0,
                    total_price: 672
                }
            ],
            subtotal: 1100,
            gst_amount: 72,
            discount_amount: 0,
            insurance_covered_amount: 0,
            final_amount: 1172,
            amount_paid: 0,
            remaining_balance: 1172,
            payment_status: 'Pending',
            payment_method: 'Cash',
            billing_date: new Date()
        });
        console.log('Seeded pending invoice INV-2026-000004 for ₹1172.');
        // Create counter values for billing sequence
        yield Counter_1.default.findOneAndUpdate({ name: 'invoice_number' }, { seq: 4 }, { new: true, upsert: true });
        yield Counter_1.default.findOneAndUpdate({ name: 'transaction_id' }, { seq: 3 }, { new: true, upsert: true });
        yield Counter_1.default.findOneAndUpdate({ name: 'claim_number' }, { seq: 1 }, { new: true, upsert: true });
        console.log('Billing sequence counters updated.');
        console.log('✅ Billing seeding completed successfully!');
        yield mongoose_1.default.disconnect();
    });
}
seed().catch(err => {
    console.error('Seeding failed:', err);
    process.exit(1);
});
