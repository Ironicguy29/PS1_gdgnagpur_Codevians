"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const InvoiceItemSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    type: { type: String, enum: ['Consultation', 'LabTest', 'Pharmacy', 'Radiology', 'Registration', 'Other'], required: true },
    quantity: { type: Number, default: 1 },
    unit_price: { type: Number, required: true },
    gst_rate: { type: Number, default: 12 },
    gst_amount: { type: Number, required: true },
    discount_amount: { type: Number, default: 0 },
    total_price: { type: Number, required: true },
    sourceId: { type: mongoose_1.Schema.Types.ObjectId },
    sourceType: { type: String }
});
const InvoiceSchema = new mongoose_1.Schema({
    patient_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Patient', required: true },
    dispensing_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Dispensing' },
    items: [InvoiceItemSchema],
    subtotal: { type: Number, required: true },
    gst_amount: { type: Number, required: true },
    discount_amount: { type: Number, default: 0 },
    insurance_covered_amount: { type: Number, default: 0 },
    final_amount: { type: Number, required: true },
    amount_paid: { type: Number, default: 0 },
    remaining_balance: { type: Number, default: 0 },
    payment_status: { type: String, enum: ['Pending', 'Unpaid', 'Paid', 'Partial', 'Failed', 'Refunded', 'Cancelled'], default: 'Pending' },
    payment_method: { type: String, enum: ['Cash', 'Card', 'UPI', 'Insurance', 'Split', 'Net Banking', 'Wallet'], default: 'Cash' },
    invoice_number: { type: String, unique: true },
    razorpay_order_id: { type: String },
    razorpay_payment_id: { type: String },
    razorpay_payment_status: { type: String },
    insurance_claim_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'InsuranceClaim' },
    qr_code: { type: String },
    digital_signature: { type: String },
    transaction_id: { type: String },
    billing_date: { type: Date, default: Date.now }
}, { timestamps: true });
// Auto-generate invoice number format: INV-YYYY-000000
InvoiceSchema.pre('save', function () {
    return __awaiter(this, void 0, void 0, function* () {
        if (!this.invoice_number) {
            const currentYear = new Date().getFullYear();
            const Counter = mongoose_1.default.model('Counter');
            let seq = 1;
            if (Counter) {
                const counter = yield Counter.findOneAndUpdate({ name: 'invoice_number' }, { $inc: { seq: 1 } }, { new: true, upsert: true });
                seq = counter.seq;
            }
            const seqStr = String(seq).padStart(6, '0');
            this.invoice_number = `INV-${currentYear}-${seqStr}`;
        }
        // Auto-compute remaining balance
        this.remaining_balance = Math.max(0, parseFloat((this.final_amount - this.amount_paid).toFixed(2)));
    });
});
exports.default = mongoose_1.default.model('Invoice', InvoiceSchema);
