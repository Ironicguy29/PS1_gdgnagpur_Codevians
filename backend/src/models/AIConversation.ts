import mongoose, { Schema, Document } from 'mongoose';

export interface IAIConversation extends Document {
    session_id: string; // group logs by conversation session
    user_id: mongoose.Types.ObjectId;
    sender: 'user' | 'ai';
    message: string;
    language: string;
    createdAt: Date;
    updatedAt: Date;
}

const AIConversationSchema: Schema = new Schema({
    session_id: { type: String, required: true, index: true },
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sender: { type: String, enum: ['user', 'ai'], required: true },
    message: { type: String, required: true },
    language: { type: String, default: 'en' }
}, { timestamps: true });

export default mongoose.model<IAIConversation>('AIConversation', AIConversationSchema);
