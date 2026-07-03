import mongoose, { Schema, Document } from 'mongoose';

export interface IBed extends Document {
    hospital_id: mongoose.Types.ObjectId;
    bed_number: string;
    ward_type: 'ICU' | 'Ward' | 'General';
    status: 'available' | 'occupied' | 'maintenance';
    patient_id?: mongoose.Types.ObjectId;
    admitted_date?: Date;
    discharge_date?: Date;
    room_number: string;
    oxygen_available: boolean;
    equipment: string[];
    last_updated: Date;
}

const BedSchema: Schema = new Schema({
    hospital_id: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true },
    bed_number: { type: String, required: true },
    ward_type: { type: String, enum: ['ICU', 'Ward', 'General'], required: true },
    status: { type: String, enum: ['available', 'occupied', 'maintenance'], default: 'available' },
    patient_id: { type: Schema.Types.ObjectId, ref: 'Patient', sparse: true },
    admitted_date: Date,
    discharge_date: Date,
    room_number: { type: String, required: true },
    oxygen_available: { type: Boolean, default: false },
    equipment: [String],
    last_updated: { type: Date, default: Date.now }
}, { timestamps: true });

// Index for fast queries
BedSchema.index({ hospital_id: 1, ward_type: 1, status: 1 });
BedSchema.index({ hospital_id: 1, room_number: 1 });

export default mongoose.model<IBed>('Bed', BedSchema);
