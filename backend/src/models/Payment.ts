import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
    invoice_id: mongoose.Types.ObjectId;
    patient_id: mongoose.Types.ObjectId;
    amount: number;
    payment_status: 'Created' | 'Pending' | 'Authorized' | 'Captured' | 'Success' | 'Failed' | 'Refunded' | 'Partially Refunded' | 'Cancelled';
    payment_method: 'Cash' | 'Card' | 'UPI' | 'Insurance' | 'Net Banking' | 'Wallet' | 'Split';
    transaction_id: string;
    cashier_id?: mongoose.Types.ObjectId;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
    paymentGateway: 'Offline' | 'Razorpay';
    gatewayResponse?: any;
    capturedAt?: Date;
    failureReason?: string;
    payment_date: Date;
}

const PaymentSchema: Schema = new Schema({
    invoice_id: { type: Schema.Types.ObjectId, ref: 'Invoice', required: true },
    patient_id: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
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
    cashier_id: { type: Schema.Types.ObjectId, ref: 'User' },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    paymentGateway: { type: String, enum: ['Offline', 'Razorpay'], default: 'Offline' },
    gatewayResponse: { type: Schema.Types.Mixed },
    capturedAt: { type: Date },
    failureReason: { type: String },
    payment_date: { type: Date, default: Date.now }
}, { timestamps: true });

// Pre-save hook to generate offline transaction ID
PaymentSchema.pre('save', async function (this: any) {
    if (!this.transaction_id) {
        if (this.razorpayPaymentId) {
            this.transaction_id = this.razorpayPaymentId;
        } else {
            const currentYear = new Date().getFullYear();
            const Counter = mongoose.model('Counter');
            let seq = 1;
            if (Counter) {
                const counter = await Counter.findOneAndUpdate(
                    { name: 'transaction_id' },
                    { $inc: { seq: 1 } },
                    { new: true, upsert: true }
                );
                seq = counter.seq;
            }
            const seqStr = String(seq).padStart(6, '0');
            this.transaction_id = `TXN-${currentYear}-${seqStr}`;
        }
    }
});

export default mongoose.model<IPayment>('Payment', PaymentSchema);

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
