import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
    user_id: mongoose.Types.ObjectId;
    user_type: 'Doctor' | 'Patient' | 'Admin' | 'Lab';
    action: string;
    patient_id?: mongoose.Types.ObjectId;
    details: string;
    ip_address?: string;
    timestamp: Date;
}

const AuditLogSchema: Schema = new Schema({
    user_id: { type: Schema.Types.ObjectId, required: true },
    user_type: { type: String, enum: ['Doctor', 'Patient', 'Admin', 'Lab'], required: true },
    action: { type: String, required: true },
    patient_id: { type: Schema.Types.ObjectId, ref: 'Patient' },
    details: { type: String, required: true },
    ip_address: { type: String },
    timestamp: { type: Date, default: Date.now }
});

export default mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
