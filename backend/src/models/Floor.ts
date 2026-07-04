import mongoose, { Schema, Document } from 'mongoose';

export interface IFloor extends Document {
    building_id: mongoose.Types.ObjectId;
    level: number; // 0=Ground, 1=1st, etc.
    name: string;
    layout_svg_url?: string;
}

const FloorSchema: Schema = new Schema({
    building_id: { type: Schema.Types.ObjectId, ref: 'Building', required: true },
    level: { type: Number, required: true },
    name: { type: String, required: true },
    layout_svg_url: { type: String }
}, { timestamps: true });

// Prevent duplicate floors in same building
FloorSchema.index({ building_id: 1, level: 1 }, { unique: true });

export default mongoose.model<IFloor>('Floor', FloorSchema);

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
