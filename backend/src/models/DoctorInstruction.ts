import mongoose, { Schema, Document } from 'mongoose';

export interface IDoctorInstruction extends Document {
    patient_id: mongoose.Types.ObjectId;
    doctor_id: mongoose.Types.ObjectId;
    diet_advice?: string;
    exercise_plan?: string;
    recovery_instructions?: string;
    preventive_care?: string;
    educational_pdfs: string[];
}

const DoctorInstructionSchema: Schema = new Schema({
    patient_id: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctor_id: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    diet_advice: { type: String },
    exercise_plan: { type: String },
    recovery_instructions: { type: String },
    preventive_care: { type: String },
    educational_pdfs: [{ type: String }]
}, { timestamps: true });

export default mongoose.model<IDoctorInstruction>('DoctorInstruction', DoctorInstructionSchema);
