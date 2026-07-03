import mongoose, { Schema, Document } from 'mongoose';

export interface IVoiceSession extends Document {
    patient_id: mongoose.Types.ObjectId;
    doctor_id?: mongoose.Types.ObjectId;
    telemedicine_session_id?: mongoose.Types.ObjectId;
    status: 'active' | 'completed';
    patient_preferred_language: string;
    doctor_preferred_language: string;
    duration_seconds: number;
    createdAt: Date;
    updatedAt: Date;
}

const VoiceSessionSchema: Schema = new Schema({
    patient_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    doctor_id: { type: Schema.Types.ObjectId, ref: 'User' },
    telemedicine_session_id: { type: Schema.Types.ObjectId, ref: 'TelemedicineSession' },
    status: { type: String, enum: ['active', 'completed'], default: 'active' },
    patient_preferred_language: { type: String, default: 'en' },
    doctor_preferred_language: { type: String, default: 'en' },
    duration_seconds: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.models.VoiceSession || mongoose.model<IVoiceSession>('VoiceSession', VoiceSessionSchema);
