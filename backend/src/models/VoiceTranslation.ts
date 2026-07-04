import mongoose, { Schema, Document } from 'mongoose';

export interface IVoiceTranslation extends Document {
    session_id: mongoose.Types.ObjectId;
    source_text: string;
    translated_text: string;
    source_language: string;
    target_language: string;
    translation_type: 'patient_to_doctor' | 'doctor_to_patient' | 'ai_response';
    medical_terms_preserved: string[];
    processing_time_ms: number;
    createdAt: Date;
    updatedAt: Date;
}

const VoiceTranslationSchema: Schema = new Schema({
    session_id: { type: Schema.Types.ObjectId, ref: 'VoiceSession', required: true, index: true },
    source_text: { type: String, required: true },
    translated_text: { type: String, required: true },
    source_language: { type: String, required: true },
    target_language: { type: String, required: true },
    translation_type: { type: String, enum: ['patient_to_doctor', 'doctor_to_patient', 'ai_response'], required: true },
    medical_terms_preserved: [{ type: String }],
    processing_time_ms: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.models.VoiceTranslation || mongoose.model<IVoiceTranslation>('VoiceTranslation', VoiceTranslationSchema);

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
