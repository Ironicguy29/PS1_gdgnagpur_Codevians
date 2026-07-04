import mongoose, { Schema, Document } from 'mongoose';

export interface IConsultationAnalytics extends Document {
    date: Date;
    consultations_count: number;
    average_consultation_time_seconds: number;
    doctor_productivity: Array<{
        doctor_id: mongoose.Types.ObjectId;
        name: string;
        consultations_count: number;
        average_time_seconds: number;
    }>;
    department_stats: Array<{
        department: string;
        consultations_count: number;
    }>;
    medicine_usage: Array<{
        medicine_name: string;
        prescription_count: number;
    }>;
    lab_requests_count: number;
}

const ConsultationAnalyticsSchema: Schema = new Schema({
    date: { type: Date, required: true, unique: true },
    consultations_count: { type: Number, default: 0 },
    average_consultation_time_seconds: { type: Number, default: 0 },
    doctor_productivity: [{
        doctor_id: { type: Schema.Types.ObjectId, ref: 'Doctor' },
        name: { type: String },
        consultations_count: { type: Number, default: 0 },
        average_time_seconds: { type: Number, default: 0 }
    }],
    department_stats: [{
        department: { type: String },
        consultations_count: { type: Number, default: 0 }
    }],
    medicine_usage: [{
        medicine_name: { type: String },
        prescription_count: { type: Number, default: 0 }
    }],
    lab_requests_count: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model<IConsultationAnalytics>('ConsultationAnalytics', ConsultationAnalyticsSchema);

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
