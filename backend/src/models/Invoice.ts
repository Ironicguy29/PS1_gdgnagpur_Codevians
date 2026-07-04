import mongoose, { Schema, Document } from 'mongoose';

export interface IInvoiceItem {
    name: string;
    type: 'Consultation' | 'LabTest' | 'Pharmacy' | 'Radiology' | 'Registration' | 'Other';
    quantity: number;
    unit_price: number;
    gst_rate: number;
    gst_amount: number;
    discount_amount: number;
    total_price: number;
    sourceId?: mongoose.Types.ObjectId;
    sourceType?: string;
}

export interface IInvoice extends Document {
    patient_id: mongoose.Types.ObjectId;
    dispensing_id?: mongoose.Types.ObjectId; // For compatibility
    items: IInvoiceItem[];
    subtotal: number;
    gst_amount: number;
    discount_amount: number;
    insurance_covered_amount: number;
    final_amount: number;
    amount_paid: number;
    remaining_balance: number;
    payment_status: 'Pending' | 'Unpaid' | 'Paid' | 'Partial' | 'Failed' | 'Refunded' | 'Cancelled';
    payment_method?: 'Cash' | 'Card' | 'UPI' | 'Insurance' | 'Split' | 'Net Banking' | 'Wallet';
    invoice_number: string;
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_payment_status?: string;
    insurance_claim_id?: mongoose.Types.ObjectId;
    qr_code?: string;
    digital_signature?: string;
    transaction_id?: string;
    billing_date: Date;
}

const InvoiceItemSchema = new Schema({
    name: { type: String, required: true },
    type: { type: String, enum: ['Consultation', 'LabTest', 'Pharmacy', 'Radiology', 'Registration', 'Other'], required: true },
    quantity: { type: Number, default: 1 },
    unit_price: { type: Number, required: true },
    gst_rate: { type: Number, default: 12 },
    gst_amount: { type: Number, required: true },
    discount_amount: { type: Number, default: 0 },
    total_price: { type: Number, required: true },
    sourceId: { type: Schema.Types.ObjectId },
    sourceType: { type: String }
});

const InvoiceSchema: Schema = new Schema({
    patient_id: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    dispensing_id: { type: Schema.Types.ObjectId, ref: 'Dispensing' },
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
    insurance_claim_id: { type: Schema.Types.ObjectId, ref: 'InsuranceClaim' },
    qr_code: { type: String },
    digital_signature: { type: String },
    transaction_id: { type: String },
    billing_date: { type: Date, default: Date.now }
}, { timestamps: true });

// Auto-generate invoice number format: INV-YYYY-000000
InvoiceSchema.pre('save', async function (this: any) {
    if (!this.invoice_number) {
        const currentYear = new Date().getFullYear();
        const Counter = mongoose.model('Counter');
        let seq = 1;
        if (Counter) {
            const counter = await Counter.findOneAndUpdate(
                { name: 'invoice_number' },
                { $inc: { seq: 1 } },
                { new: true, upsert: true }
            );
            seq = counter.seq;
        }
        const seqStr = String(seq).padStart(6, '0');
        this.invoice_number = `INV-${currentYear}-${seqStr}`;
    }
    
    // Auto-compute remaining balance
    this.remaining_balance = Math.max(0, parseFloat((this.final_amount - this.amount_paid).toFixed(2)));
});

export default mongoose.model<IInvoice>('Invoice', InvoiceSchema);

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
