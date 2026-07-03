import mongoose, { Schema, Document } from 'mongoose';

export interface IQueueHistory extends Document {
    token_id: mongoose.Types.ObjectId;
    queue_id: mongoose.Types.ObjectId;
    action: string;
    performed_by: string; // patient, doctor, receptionist, system
    timestamp: Date;
    details?: string;
}

const QueueHistorySchema: Schema = new Schema({
    token_id: { type: Schema.Types.ObjectId, ref: 'Token', required: true },
    queue_id: { type: Schema.Types.ObjectId, ref: 'Queue', required: true },
    action: { type: String, required: true },
    performed_by: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    details: { type: String }
}, { timestamps: true });

export default mongoose.model<IQueueHistory>('QueueHistory', QueueHistorySchema);
