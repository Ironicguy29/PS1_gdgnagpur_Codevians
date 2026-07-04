import mongoose, { Schema, Document } from 'mongoose';

export interface IOccupancy extends Document {
    target_type: 'Building' | 'Floor' | 'Department' | 'Room';
    target_id: mongoose.Types.ObjectId;
    current_occupancy: number;
    max_capacity: number;
}

const OccupancySchema: Schema = new Schema({
    target_type: { type: String, enum: ['Building', 'Floor', 'Department', 'Room'], required: true },
    target_id: { type: Schema.Types.ObjectId, required: true },
    current_occupancy: { type: Number, default: 0 },
    max_capacity: { type: Number, required: true }
}, { timestamps: true });

export default mongoose.model<IOccupancy>('Occupancy', OccupancySchema);

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
