import mongoose, { Schema, Document } from 'mongoose';

export interface IDiagnosis extends Document {
    patient_id: mongoose.Types.ObjectId;
    visit_id: mongoose.Types.ObjectId;
    primary_diagnosis: string;
    secondary_diagnoses: string[];
    icd_code: string;
    severity: 'Mild' | 'Moderate' | 'Severe';
    clinical_impression?: string;
}

const DiagnosisSchema: Schema = new Schema({
    patient_id: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    visit_id: { type: Schema.Types.ObjectId, ref: 'Visit', required: true },
    primary_diagnosis: { type: String, required: true },
    secondary_diagnoses: [{ type: String }],
    icd_code: { type: String, required: true },
    severity: { type: String, enum: ['Mild', 'Moderate', 'Severe'], default: 'Moderate' },
    clinical_impression: { type: String }
}, { timestamps: true });

export default mongoose.model<IDiagnosis>('Diagnosis', DiagnosisSchema);
