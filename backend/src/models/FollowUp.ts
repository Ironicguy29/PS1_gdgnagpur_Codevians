import mongoose, { Schema, Document } from 'mongoose';

export interface IFollowUp extends Document {
    patient_id: mongoose.Types.ObjectId;
    doctor_id: mongoose.Types.ObjectId;
    follow_up_date: Date;
    follow_up_time?: string;
    purpose: string;
    appointment_id?: mongoose.Types.ObjectId;
}

const FollowUpSchema: Schema = new Schema({
    patient_id: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctor_id: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    follow_up_date: { type: Date, required: true },
    follow_up_time: { type: String },
    purpose: { type: String, required: true },
    appointment_id: { type: Schema.Types.ObjectId, ref: 'Appointment' }
}, { timestamps: true });

export default mongoose.model<IFollowUp>('FollowUp', FollowUpSchema);
