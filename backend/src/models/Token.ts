import mongoose, { Schema, Document } from 'mongoose';

export interface IToken extends Document {
    token_number: number;
    display_token: string; // e.g. CARD-001, ORTHO-013
    appointment_id?: mongoose.Types.ObjectId;
    queue_id: mongoose.Types.ObjectId;
    doctor_id: mongoose.Types.ObjectId;
    patient_id: mongoose.Types.ObjectId;
    department: string;
    estimated_wait_minutes: number;
    estimated_consultation_time: number;
    status: 'Booked' | 'Checked In' | 'Waiting' | 'Called' | 'In Consultation' | 'Completed' | 'Skipped' | 'Cancelled' | 'Emergency';
    priority: 'Normal' | 'Emergency';
    check_in_time?: Date;
    call_time?: Date;
    consultation_start_time?: Date;
    consultation_end_time?: Date;
}

const TokenSchema: Schema = new Schema({
    token_number: { type: Number, required: true },
    display_token: { type: String, required: true },
    appointment_id: { type: Schema.Types.ObjectId, ref: 'Appointment' },
    queue_id: { type: Schema.Types.ObjectId, ref: 'Queue', required: true },
    doctor_id: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    patient_id: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    department: { type: String, required: true },
    estimated_wait_minutes: { type: Number, default: 0 },
    estimated_consultation_time: { type: Number, default: 15 },
    status: { 
        type: String, 
        enum: ['Booked', 'Checked In', 'Waiting', 'Called', 'In Consultation', 'Completed', 'Skipped', 'Cancelled', 'Emergency'], 
        default: 'Booked' 
    },
    priority: { type: String, enum: ['Normal', 'Emergency'], default: 'Normal' },
    check_in_time: { type: Date },
    call_time: { type: Date },
    consultation_start_time: { type: Date },
    consultation_end_time: { type: Date }
}, { timestamps: true });

export default mongoose.model<IToken>('Token', TokenSchema);

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
