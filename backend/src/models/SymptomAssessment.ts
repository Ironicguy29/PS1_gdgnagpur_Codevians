import mongoose, { Schema, Document } from 'mongoose';

export interface IPotentialCondition {
    condition: string;
    probability: number; // e.g. 0.85
    details?: string;
}

export interface ISymptomAssessment extends Document {
    patient_id: mongoose.Types.ObjectId;
    symptoms: string[];
    description?: string;
    triage_level: 'Critical' | 'Urgent' | 'Non-urgent' | 'Routine';
    potential_conditions: IPotentialCondition[];
    recommended_department: string;
    suggested_next_steps: string[];
    language: string;
    createdAt: Date;
    updatedAt: Date;
}

const PotentialConditionSchema = new Schema({
    condition: { type: String, required: true },
    probability: { type: Number, required: true },
    details: { type: String }
}, { _id: false });

const SymptomAssessmentSchema: Schema = new Schema({
    patient_id: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    symptoms: [{ type: String, required: true }],
    description: { type: String },
    triage_level: { 
        type: String, 
        enum: ['Critical', 'Urgent', 'Non-urgent', 'Routine'], 
        required: true 
    },
    potential_conditions: [PotentialConditionSchema],
    recommended_department: { type: String, required: true },
    suggested_next_steps: [{ type: String }],
    language: { type: String, default: 'en' }
}, { timestamps: true });

export default mongoose.model<ISymptomAssessment>('SymptomAssessment', SymptomAssessmentSchema);
