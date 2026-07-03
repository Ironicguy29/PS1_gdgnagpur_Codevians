import mongoose, { Schema, Document } from 'mongoose';

export interface IVoiceSettings extends Document {
    user_id: mongoose.Types.ObjectId;
    preferred_language: string;
    voice_gender: 'male' | 'female' | 'default';
    speaking_rate: number;
    volume: number;
    auto_play_tts: boolean;
    continuous_listening: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const VoiceSettingsSchema: Schema = new Schema({
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    preferred_language: { type: String, default: 'en' },
    voice_gender: { type: String, enum: ['male', 'female', 'default'], default: 'default' },
    speaking_rate: { type: Number, default: 1.0, min: 0.5, max: 2.0 },
    volume: { type: Number, default: 1.0, min: 0, max: 1.0 },
    auto_play_tts: { type: Boolean, default: true },
    continuous_listening: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.models.VoiceSettings || mongoose.model<IVoiceSettings>('VoiceSettings', VoiceSettingsSchema);
