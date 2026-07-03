import mongoose, { Schema, Document } from 'mongoose';

export interface IClinicalNote extends Document {
    patient_id: mongoose.Types.ObjectId;
    doctor_id: mongoose.Types.ObjectId;
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
    private_notes?: string;
}

const ClinicalNoteSchema: Schema = new Schema({
    patient_id: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctor_id: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    subjective: { type: String, required: true },
    objective: { type: String, required: true },
    assessment: { type: String, required: true },
    plan: { type: String, required: true },
    private_notes: { type: String }
}, { timestamps: true });

export default mongoose.model<IClinicalNote>('ClinicalNote', ClinicalNoteSchema);
