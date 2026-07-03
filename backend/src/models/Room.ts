import mongoose, { Schema, Document } from 'mongoose';

export interface IRoom extends Document {
    floor_id: mongoose.Types.ObjectId;
    department_id?: mongoose.Types.ObjectId;
    name: string;
    code: string; // e.g. "ROOM-101"
    type: 'ICU' | 'OT' | 'Pharmacy' | 'Laboratory' | 'Ward' | 'OPD' | 'Reception' | 'Radiology' | 'Billing' | 'Emergency' | 'Other';
    latitude: number;
    longitude: number;
    capacity_beds: number;
    available_beds: number;
}

const RoomSchema: Schema = new Schema({
    floor_id: { type: Schema.Types.ObjectId, ref: 'Floor', required: true },
    department_id: { type: Schema.Types.ObjectId, ref: 'Department' },
    name: { type: String, required: true },
    code: { type: String, required: true },
    type: { 
        type: String, 
        enum: ['ICU', 'OT', 'Pharmacy', 'Laboratory', 'Ward', 'OPD', 'Reception', 'Radiology', 'Billing', 'Emergency', 'Other'], 
        required: true 
    },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    capacity_beds: { type: Number, default: 0 },
    available_beds: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model<IRoom>('Room', RoomSchema);
