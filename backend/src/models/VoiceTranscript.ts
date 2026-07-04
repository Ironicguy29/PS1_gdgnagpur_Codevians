import mongoose, { Schema, Document } from 'mongoose';

export interface IVoiceTranscript extends Document {
    session_id: mongoose.Types.ObjectId;
    speaker_id: mongoose.Types.ObjectId;
    speaker_role: 'patient' | 'doctor' | 'ai';
    original_text: string;
    translated_text: string;
    original_language: string;
    target_language: string;
    confidence_score: number;
    audio_duration_ms: number;
    createdAt: Date;
    updatedAt: Date;
}

const VoiceTranscriptSchema: Schema = new Schema({
    session_id: { type: Schema.Types.ObjectId, ref: 'VoiceSession', required: true, index: true },
    speaker_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    speaker_role: { type: String, enum: ['patient', 'doctor', 'ai'], required: true },
    original_text: { type: String, required: true },
    translated_text: { type: String, default: '' },
    original_language: { type: String, required: true },
    target_language: { type: String, default: 'en' },
    confidence_score: { type: Number, default: 0 },
    audio_duration_ms: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.models.VoiceTranscript || mongoose.model<IVoiceTranscript>('VoiceTranscript', VoiceTranscriptSchema);

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
