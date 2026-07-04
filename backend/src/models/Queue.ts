import mongoose, { Schema, Document } from 'mongoose';

export interface IQueue extends Document {
    department: string;
    doctor_id: mongoose.Types.ObjectId;
    date: string; // YYYY-MM-DD
    current_token: number;
    total_waiting: number;
    estimated_wait_time_per_patient: number;
    status: 'active' | 'paused' | 'closed';
}

const QueueSchema: Schema = new Schema({
    department: { type: String, required: true },
    doctor_id: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    date: { type: String, required: true }, // Store as string for easy daily query
    current_token: { type: Number, default: 0 },
    total_waiting: { type: Number, default: 0 },
    estimated_wait_time_per_patient: { type: Number, default: 15 },
    status: { type: String, enum: ['active', 'paused', 'closed'], default: 'active' }
});

export default mongoose.model<IQueue>('Queue', QueueSchema);

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
