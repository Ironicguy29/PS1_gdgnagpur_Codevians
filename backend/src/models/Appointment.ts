import mongoose, { Schema, Document } from 'mongoose';

export interface IAppointment extends Document {
    patient_id: mongoose.Types.ObjectId;
    doctor_id: mongoose.Types.ObjectId;
    date: Date;
    slot_time: string;
    token_number: number;
    status: 'booked' | 'completed' | 'cancelled' | 'no-show';
    is_emergency: boolean;
}

const AppointmentSchema: Schema = new Schema({
    patient_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    doctor_id: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    date: { type: Date, required: true },
    slot_time: { type: String, required: true },
    token_number: { type: Number, required: true },
    status: { type: String, enum: ['booked', 'completed', 'cancelled', 'no-show'], default: 'booked' },
    is_emergency: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model<IAppointment>('Appointment', AppointmentSchema);
