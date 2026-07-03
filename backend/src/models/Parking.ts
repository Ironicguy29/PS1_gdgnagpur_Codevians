import mongoose, { Schema, Document } from 'mongoose';

export interface IParking extends Document {
    slot_number: string;
    type: 'Ambulance' | 'Staff' | 'Visitor';
    status: 'Available' | 'Occupied';
    latitude: number;
    longitude: number;
    assigned_vehicle_id?: string;
}

const ParkingSchema: Schema = new Schema({
    slot_number: { type: String, required: true, unique: true },
    type: { type: String, enum: ['Ambulance', 'Staff', 'Visitor'], required: true },
    status: { type: String, enum: ['Available', 'Occupied'], default: 'Available' },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    assigned_vehicle_id: { type: String }
}, { timestamps: true });

export default mongoose.model<IParking>('Parking', ParkingSchema);
