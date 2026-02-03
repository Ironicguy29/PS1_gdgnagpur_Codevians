import mongoose, { Schema, Document } from 'mongoose';

export interface IToken extends Document {
    token_number: number;
    appointment_id: mongoose.Types.ObjectId;
    queue_id: mongoose.Types.ObjectId;
    status: 'waiting' | 'called' | 'completed' | 'skipped';
    estimated_wait_minutes: number;
}

const TokenSchema: Schema = new Schema({
    token_number: { type: Number, required: true },
    appointment_id: { type: Schema.Types.ObjectId, ref: 'Appointment', required: true },
    queue_id: { type: Schema.Types.ObjectId, ref: 'Queue', required: true },
    status: { type: String, enum: ['waiting', 'called', 'completed', 'skipped'], default: 'waiting' },
    estimated_wait_minutes: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model<IToken>('Token', TokenSchema);
