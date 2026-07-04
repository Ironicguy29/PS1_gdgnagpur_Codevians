import mongoose, { Schema, Document } from 'mongoose';

export interface IHospital extends Document {
    name: string;
    address: string;
    contact_number: string;
    total_beds: number;
    available_oxygen: boolean;
    departments?: {
        name: string;
        total_staff: number;
        active_doctors: number;
        queue_count: number;
        avg_wait_time: number;
    }[];
    bed_allocation?: {
        icu_total: number;
        icu_occupied: number;
        ward_total: number;
        ward_occupied: number;
        last_updated: Date;
    };
}

const HospitalSchema: Schema = new Schema({
    name: { type: String, required: true },
    address: { type: String, required: true },
    contact_number: { type: String, required: true },
    total_beds: { type: Number, default: 0 },
    available_oxygen: { type: Boolean, default: false },
    departments: [{
        name: String,
        total_staff: Number,
        active_doctors: Number,
        queue_count: Number,
        avg_wait_time: Number
    }],
    bed_allocation: {
        icu_total: { type: Number, default: 0 },
        icu_occupied: { type: Number, default: 0 },
        ward_total: { type: Number, default: 0 },
        ward_occupied: { type: Number, default: 0 },
        last_updated: { type: Date, default: Date.now }
    }
});

export default mongoose.model<IHospital>('Hospital', HospitalSchema);

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
