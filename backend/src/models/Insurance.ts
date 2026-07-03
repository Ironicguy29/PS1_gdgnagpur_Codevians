import mongoose, { Schema, Document } from 'mongoose';

export interface IInsurance extends Document {
    patient_id: mongoose.Types.ObjectId;
    provider: string;
    policy_number: string;
    coverage_percentage: number;
    validity: Date;
    coverage_limit: number;
    balance_limit: number;
    insurance_type: 'Government' | 'Private' | 'Corporate' | 'Self Pay';
    is_active: boolean;
}

const InsuranceSchema: Schema = new Schema({
    patient_id: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    provider: { type: String, required: true },
    policy_number: { type: String, required: true, unique: true },
    coverage_percentage: { type: Number, required: true, min: 0, max: 100 },
    validity: { type: Date, required: true },
    coverage_limit: { type: Number, required: true },
    balance_limit: { type: Number, required: true },
    insurance_type: { type: String, enum: ['Government', 'Private', 'Corporate', 'Self Pay'], default: 'Self Pay' },
    is_active: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model<IInsurance>('Insurance', InsuranceSchema);
