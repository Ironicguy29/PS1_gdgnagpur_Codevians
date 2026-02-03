import mongoose, { Schema, Document } from 'mongoose';

export interface IHospital extends Document {
    name: string;
    address: string;
    contact_number: string;
    total_beds: number;
    available_oxygen: boolean;
}

const HospitalSchema: Schema = new Schema({
    name: { type: String, required: true },
    address: { type: String, required: true },
    contact_number: { type: String, required: true },
    total_beds: { type: Number, default: 0 },
    available_oxygen: { type: Boolean, default: false }
});

export default mongoose.model<IHospital>('Hospital', HospitalSchema);
