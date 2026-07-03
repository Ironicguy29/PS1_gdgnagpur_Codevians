import mongoose, { Schema, Document } from 'mongoose';

export interface IConsultation extends Document {
    patient_id: mongoose.Types.ObjectId;
    doctor_id: mongoose.Types.ObjectId;
    token_id?: mongoose.Types.ObjectId;
    visit_id?: mongoose.Types.ObjectId;
    chief_complaint: string;
    symptoms: string[];
    examination?: string;
    diagnosis?: mongoose.Types.ObjectId;
    prescription?: mongoose.Types.ObjectId;
    clinical_note?: mongoose.Types.ObjectId;
    follow_up?: mongoose.Types.ObjectId;
    referral?: mongoose.Types.ObjectId;
    doctor_instruction?: mongoose.Types.ObjectId;
    lab_orders: mongoose.Types.ObjectId[];
    duration_seconds: number;
    status: 'InProgress' | 'Completed' | 'Cancelled';
    createdAt: Date;
    updatedAt: Date;
}

const ConsultationSchema: Schema = new Schema({
    patient_id: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctor_id: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    token_id: { type: Schema.Types.ObjectId, ref: 'Token' },
    visit_id: { type: Schema.Types.ObjectId, ref: 'Visit' },
    chief_complaint: { type: String, required: true },
    symptoms: [{ type: String }],
    examination: { type: String },
    diagnosis: { type: Schema.Types.ObjectId, ref: 'Diagnosis' },
    prescription: { type: Schema.Types.ObjectId, ref: 'Prescription' },
    clinical_note: { type: Schema.Types.ObjectId, ref: 'ClinicalNote' },
    follow_up: { type: Schema.Types.ObjectId, ref: 'FollowUp' },
    referral: { type: Schema.Types.ObjectId, ref: 'Referral' },
    doctor_instruction: { type: Schema.Types.ObjectId, ref: 'DoctorInstruction' },
    lab_orders: [{ type: Schema.Types.ObjectId, ref: 'LabOrder' }],
    duration_seconds: { type: Number, default: 0 },
    status: { type: String, enum: ['InProgress', 'Completed', 'Cancelled'], default: 'InProgress' }
}, { timestamps: true });

export default mongoose.model<IConsultation>('Consultation', ConsultationSchema);
