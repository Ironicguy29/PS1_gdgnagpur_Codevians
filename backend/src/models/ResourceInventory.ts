import mongoose, { Schema, Document } from 'mongoose';

export interface IResourceInventory extends Document {
    hospital_id: string;
    hospital_name: string;
    state: string;
    district: string;
    resources: {
        oxygen_plants: {
            count: number;
            capacity_per_unit: number;
            total_capacity: number;
            utilization_rate: number;
        };
        ventilators: {
            count: number;
            operational: number;
            maintenance: number;
            utilization_rate: number;
        };
        beds: {
            total: number;
            icu: number;
            general: number;
            occupied: number;
        };
        specialist_staff: {
            cardiologists: number;
            pulmonologists: number;
            neurologists: number;
            intensivists: number;
            other_specialists: number;
        };
    };
    shortage_alerts: {
        resource_type: string;
        current_availability: number;
        critical_threshold: number;
        alert_level: 'low' | 'medium' | 'high' | 'critical';
        message: string;
        flagged_at: Date;
    }[];
    redistribution_eligible: boolean;
    last_updated: Date;
    created_at: Date;
}

const ResourceInventorySchema: Schema = new Schema({
    hospital_id: { type: String, required: true, unique: true },
    hospital_name: { type: String, required: true },
    state: { type: String, required: true },
    district: { type: String, required: true },
    resources: {
        oxygen_plants: {
            count: { type: Number, default: 0 },
            capacity_per_unit: { type: Number, default: 0 },
            total_capacity: { type: Number, default: 0 },
            utilization_rate: { type: Number, default: 0 }
        },
        ventilators: {
            count: { type: Number, default: 0 },
            operational: { type: Number, default: 0 },
            maintenance: { type: Number, default: 0 },
            utilization_rate: { type: Number, default: 0 }
        },
        beds: {
            total: { type: Number, default: 0 },
            icu: { type: Number, default: 0 },
            general: { type: Number, default: 0 },
            occupied: { type: Number, default: 0 }
        },
        specialist_staff: {
            cardiologists: { type: Number, default: 0 },
            pulmonologists: { type: Number, default: 0 },
            neurologists: { type: Number, default: 0 },
            intensivists: { type: Number, default: 0 },
            other_specialists: { type: Number, default: 0 }
        }
    },
    shortage_alerts: [{
        resource_type: String,
        current_availability: Number,
        critical_threshold: Number,
        alert_level: { type: String, enum: ['low', 'medium', 'high', 'critical'] },
        message: String,
        flagged_at: Date
    }],
    redistribution_eligible: { type: Boolean, default: false },
    last_updated: { type: Date, default: Date.now },
    created_at: { type: Date, default: Date.now }
}, { timestamps: true });

ResourceInventorySchema.index({ state: 1, district: 1 });
ResourceInventorySchema.index({ 'shortage_alerts.alert_level': 1 });

export default mongoose.model<IResourceInventory>('ResourceInventory', ResourceInventorySchema);

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
