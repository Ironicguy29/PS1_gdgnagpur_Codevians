import mongoose, { Schema, Document } from 'mongoose';

export interface ILiveAsset extends Document {
    name: string;
    type: 'Ventilator' | 'Wheelchair' | 'ECG' | 'Defibrillator' | 'Ambulance' | 'Other';
    status: 'Active' | 'Maintenance' | 'Idle';
    building_id?: mongoose.Types.ObjectId;
    floor_id?: mongoose.Types.ObjectId;
    room_id?: mongoose.Types.ObjectId;
    latitude: number;
    longitude: number;
    battery_level: number; // 0-100
}

const LiveAssetSchema: Schema = new Schema({
    name: { type: String, required: true },
    type: { type: String, enum: ['Ventilator', 'Wheelchair', 'ECG', 'Defibrillator', 'Ambulance', 'Other'], required: true },
    status: { type: String, enum: ['Active', 'Maintenance', 'Idle'], default: 'Idle' },
    building_id: { type: Schema.Types.ObjectId, ref: 'Building' },
    floor_id: { type: Schema.Types.ObjectId, ref: 'Floor' },
    room_id: { type: Schema.Types.ObjectId, ref: 'Room' },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    battery_level: { type: Number, default: 100 }
}, { timestamps: true });

export default mongoose.model<ILiveAsset>('LiveAsset', LiveAssetSchema);

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
