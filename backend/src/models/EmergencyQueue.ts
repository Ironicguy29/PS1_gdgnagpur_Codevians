import mongoose, { Schema, Document } from 'mongoose';

export interface IEmergencyQueue extends Document {
    patient_id: mongoose.Types.ObjectId;
    doctor_id: mongoose.Types.ObjectId;
    reason: string;
    severity: 'critical' | 'moderate' | 'stable';
    admitted_at: Date;
    resolved_at?: Date;
    status: 'pending' | 'attended' | 'transferred';
}

const EmergencyQueueSchema: Schema = new Schema({
    patient_id: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctor_id: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    reason: { type: String, required: true },
    severity: { type: String, enum: ['critical', 'moderate', 'stable'], default: 'critical' },
    admitted_at: { type: Date, default: Date.now },
    resolved_at: { type: Date },
    status: { type: String, enum: ['pending', 'attended', 'transferred'], default: 'pending' }
}, { timestamps: true });

export default mongoose.model<IEmergencyQueue>('EmergencyQueue', EmergencyQueueSchema);
