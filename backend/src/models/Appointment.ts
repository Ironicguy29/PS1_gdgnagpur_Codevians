import mongoose, { Schema, Document } from 'mongoose';

export interface IAppointment extends Document {
    patient_id: mongoose.Types.ObjectId;
    doctor_id: mongoose.Types.ObjectId;
    date: Date;
    slot_time: string;
    token_number: number;
    status: 'booked' | 'completed' | 'cancelled' | 'no-show';
    is_emergency: boolean;
    consultation_type: 'physical' | 'video' | 'audio';
}

const AppointmentSchema: Schema = new Schema({
    patient_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    doctor_id: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    date: { type: Date, required: true },
    slot_time: { type: String, required: true },
    token_number: { type: Number, required: true },
    status: { type: String, enum: ['booked', 'completed', 'cancelled', 'no-show'], default: 'booked' },
    is_emergency: { type: Boolean, default: false },
    consultation_type: { type: String, enum: ['physical', 'video', 'audio'], default: 'physical' }
}, { timestamps: true });

export default mongoose.model<IAppointment>('Appointment', AppointmentSchema);

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
