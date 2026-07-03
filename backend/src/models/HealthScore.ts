import mongoose, { Schema, Document } from 'mongoose';

export interface IHealthScore extends Document {
    patient_id: mongoose.Types.ObjectId;
    cardiovascular_risk: number; // e.g. percentage 0 - 100
    diabetes_risk: number;       // e.g. percentage 0 - 100
    wellness_score: number;      // e.g. score out of 100
    factors: string[];           // risk factors detected (e.g. ['high bp', 'smoking'])
    recommendations: string[];   // lifestyle recommendations
    createdAt: Date;
    updatedAt: Date;
}

const HealthScoreSchema: Schema = new Schema({
    patient_id: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    cardiovascular_risk: { type: Number, required: true },
    diabetes_risk: { type: Number, required: true },
    wellness_score: { type: Number, required: true },
    factors: [{ type: String }],
    recommendations: [{ type: String }]
}, { timestamps: true });

export default mongoose.model<IHealthScore>('HealthScore', HealthScoreSchema);
