import mongoose, { Schema, Document } from 'mongoose';

export interface IRefund extends Document {
    refund_number: string;
    invoice_id: mongoose.Types.ObjectId;
    payment_id?: mongoose.Types.ObjectId;
    patient_id: mongoose.Types.ObjectId;
    amount: number;
    reason: string;
    status: 'Initiated' | 'Processing' | 'Completed' | 'Failed';
    razorpay_refund_id?: string;
    approved_by?: mongoose.Types.ObjectId;
    refund_date: Date;
}

const RefundSchema: Schema = new Schema({
    refund_number: { type: String, unique: true },
    invoice_id: { type: Schema.Types.ObjectId, ref: 'Invoice', required: true },
    payment_id: { type: Schema.Types.ObjectId, ref: 'Payment' },
    patient_id: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    amount: { type: Number, required: true, min: 0 },
    reason: { type: String, required: true },
    status: {
        type: String,
        enum: ['Initiated', 'Processing', 'Completed', 'Failed'],
        default: 'Initiated'
    },
    razorpay_refund_id: { type: String },
    approved_by: { type: Schema.Types.ObjectId, ref: 'User' },
    refund_date: { type: Date, default: Date.now }
}, { timestamps: true });

// Pre-save hook to generate refund number
RefundSchema.pre('save', async function (this: any) {
    if (!this.refund_number) {
        const currentYear = new Date().getFullYear();
        const Counter = mongoose.model('Counter');
        let seq = 1;
        if (Counter) {
            const counter = await Counter.findOneAndUpdate(
                { name: 'refund_number' },
                { $inc: { seq: 1 } },
                { new: true, upsert: true }
            );
            seq = counter.seq;
        }
        const seqStr = String(seq).padStart(6, '0');
        this.refund_number = `REF-${currentYear}-${seqStr}`;
    }
});

export default mongoose.model<IRefund>('Refund', RefundSchema);
