import mongoose, { Schema, Document } from 'mongoose';

export interface IInsuranceClaim extends Document {
    claim_number: string;
    invoice_id: mongoose.Types.ObjectId;
    patient_id: mongoose.Types.ObjectId;
    insurance_id: mongoose.Types.ObjectId;
    requested_amount: number;
    approved_amount: number;
    status: 'Submitted' | 'Under Review' | 'Approved' | 'Rejected' | 'Partially Approved' | 'Settled';
    claim_date: Date;
    settled_date?: Date;
    notes?: string;
}

const InsuranceClaimSchema: Schema = new Schema({
    claim_number: { type: String, unique: true },
    invoice_id: { type: Schema.Types.ObjectId, ref: 'Invoice', required: true },
    patient_id: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    insurance_id: { type: Schema.Types.ObjectId, ref: 'Insurance', required: true },
    requested_amount: { type: Number, required: true },
    approved_amount: { type: Number, default: 0 },
    status: {
        type: String,
        enum: ['Submitted', 'Under Review', 'Approved', 'Rejected', 'Partially Approved', 'Settled'],
        default: 'Submitted'
    },
    claim_date: { type: Date, default: Date.now },
    settled_date: { type: Date },
    notes: { type: String }
}, { timestamps: true });

// Pre-save hook to generate claim number
InsuranceClaimSchema.pre('save', async function (this: any) {
    if (!this.claim_number) {
        const currentYear = new Date().getFullYear();
        const Counter = mongoose.model('Counter');
        let seq = 1;
        if (Counter) {
            const counter = await Counter.findOneAndUpdate(
                { name: 'claim_number' },
                { $inc: { seq: 1 } },
                { new: true, upsert: true }
            );
            seq = counter.seq;
        }
        const seqStr = String(seq).padStart(6, '0');
        this.claim_number = `CLM-${currentYear}-${seqStr}`;
    }
});

export default mongoose.model<IInsuranceClaim>('InsuranceClaim', InsuranceClaimSchema);
