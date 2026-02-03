import mongoose, { Schema, Document } from 'mongoose';

export interface IDoctor extends Document {
    user_id: mongoose.Types.ObjectId;
    specialization: string;
    department: string;
    is_available: boolean;
    current_queue_length: number;
    avg_consultation_time: number;
}

const DoctorSchema: Schema = new Schema({
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    specialization: { type: String, required: true },
    department: { type: String, required: true },
    is_available: { type: Boolean, default: false },
    current_queue_length: { type: Number, default: 0 },
    avg_consultation_time: { type: Number, default: 10 } // minutes
});

export default mongoose.model<IDoctor>('Doctor', DoctorSchema);
