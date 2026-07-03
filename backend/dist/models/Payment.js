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
const PaymentSchema = new mongoose_1.Schema({
    invoice_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Invoice', required: true },
    patient_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Patient', required: true },
    amount: { type: Number, required: true, min: 0 },
    payment_status: {
        type: String,
        enum: ['Created', 'Pending', 'Authorized', 'Captured', 'Success', 'Failed', 'Refunded', 'Partially Refunded', 'Cancelled'],
        default: 'Pending'
    },
    payment_method: {
        type: String,
        enum: ['Cash', 'Card', 'UPI', 'Insurance', 'Net Banking', 'Wallet', 'Split'],
        required: true
    },
    transaction_id: { type: String, unique: true },
    cashier_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    paymentGateway: { type: String, enum: ['Offline', 'Razorpay'], default: 'Offline' },
    gatewayResponse: { type: mongoose_1.Schema.Types.Mixed },
    capturedAt: { type: Date },
    failureReason: { type: String },
    payment_date: { type: Date, default: Date.now }
}, { timestamps: true });
// Pre-save hook to generate offline transaction ID
PaymentSchema.pre('save', function () {
    return __awaiter(this, void 0, void 0, function* () {
        if (!this.transaction_id) {
            if (this.razorpayPaymentId) {
                this.transaction_id = this.razorpayPaymentId;
            }
            else {
                const currentYear = new Date().getFullYear();
                const Counter = mongoose_1.default.model('Counter');
                let seq = 1;
                if (Counter) {
                    const counter = yield Counter.findOneAndUpdate({ name: 'transaction_id' }, { $inc: { seq: 1 } }, { new: true, upsert: true });
                    seq = counter.seq;
                }
                const seqStr = String(seq).padStart(6, '0');
                this.transaction_id = `TXN-${currentYear}-${seqStr}`;
            }
        }
    });
});
exports.default = mongoose_1.default.model('Payment', PaymentSchema);
