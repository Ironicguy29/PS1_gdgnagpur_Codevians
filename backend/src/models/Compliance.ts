import mongoose, { Schema, Document } from 'mongoose';

export interface ICompliance extends Document {
    hospital_id: mongoose.Types.ObjectId;
    claim_id: string;
    patient_id: mongoose.Types.ObjectId;
    scheme_type: 'AB-PMJAY' | 'NDHM' | 'Other';
    claim_amount: number;
    status: 'submitted' | 'approved' | 'rejected' | 'pending';
    admission_date: Date;
    discharge_date: Date;
    treatment_type: string;
    diagnosis: string;
    documents_verified: boolean;
    compliance_issues?: string[];
    verification_notes?: string;
    submitted_date: Date;
    approved_date?: Date;
    rejection_reason?: string;
}

const ComplianceSchema: Schema = new Schema({
    hospital_id: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true },
    claim_id: { type: String, unique: true, required: true },
    patient_id: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    scheme_type: { type: String, enum: ['AB-PMJAY', 'NDHM', 'Other'], default: 'AB-PMJAY' },
    claim_amount: { type: Number, required: true },
    status: { type: String, enum: ['submitted', 'approved', 'rejected', 'pending'], default: 'pending' },
    admission_date: { type: Date, required: true },
    discharge_date: { type: Date, required: true },
    treatment_type: String,
    diagnosis: String,
    documents_verified: { type: Boolean, default: false },
    compliance_issues: [String],
    verification_notes: String,
    submitted_date: { type: Date, default: Date.now },
    approved_date: Date,
    rejection_reason: String
}, { timestamps: true });

// Index for fast queries
ComplianceSchema.index({ hospital_id: 1, status: 1 });
ComplianceSchema.index({ patient_id: 1, scheme_type: 1 });
ComplianceSchema.index({ claim_id: 1 });

export default mongoose.model<ICompliance>('Compliance', ComplianceSchema);
