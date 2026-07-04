import mongoose, { Schema, Document } from 'mongoose';

export interface INavigationRoute extends Document {
    name: string;
    start_room_id: mongoose.Types.ObjectId;
    end_room_id: mongoose.Types.ObjectId;
    coordinates: number[][]; // [lat, lng][] path
    distance_meters: number;
    estimated_time_seconds: number;
    is_emergency: boolean;
    is_blocked: boolean;
}

const NavigationRouteSchema: Schema = new Schema({
    name: { type: String, required: true },
    start_room_id: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
    end_room_id: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
    coordinates: { type: [[Number]], required: true },
    distance_meters: { type: Number, required: true },
    estimated_time_seconds: { type: Number, required: true },
    is_emergency: { type: Boolean, default: false },
    is_blocked: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model<INavigationRoute>('NavigationRoute', NavigationRouteSchema);

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
