import mongoose, { Schema, Document } from 'mongoose';

export interface IEmergencyContact extends Document {
    patient_id: mongoose.Types.ObjectId;
    name: string;
    relationship: string;
    phone: string;
}

const EmergencyContactSchema: Schema = new Schema({
    patient_id: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    name: { type: String, required: true },
    relationship: { type: String, required: true },
    phone: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model<IEmergencyContact>('EmergencyContact', EmergencyContactSchema);
