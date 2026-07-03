import mongoose, { Schema, Document } from 'mongoose';

export interface IQueueAnalytics extends Document {
    date: string; // YYYY-MM-DD
    department: string;
    doctor_id?: mongoose.Types.ObjectId;
    avg_wait_time: number; // in minutes
    max_queue_length: number;
    total_patients_served: number;
    total_patients_pending: number;
    total_patients_skipped: number;
    total_emergencies: number;
    doctor_utilization_percent: number; // calculated active minutes vs total shift minutes
}

const QueueAnalyticsSchema: Schema = new Schema({
    date: { type: String, required: true },
    department: { type: String, required: true },
    doctor_id: { type: Schema.Types.ObjectId, ref: 'Doctor' },
    avg_wait_time: { type: Number, default: 0 },
    max_queue_length: { type: Number, default: 0 },
    total_patients_served: { type: Number, default: 0 },
    total_patients_pending: { type: Number, default: 0 },
    total_patients_skipped: { type: Number, default: 0 },
    total_emergencies: { type: Number, default: 0 },
    doctor_utilization_percent: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model<IQueueAnalytics>('QueueAnalytics', QueueAnalyticsSchema);
