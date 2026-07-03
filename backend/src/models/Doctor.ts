import mongoose, { Schema, Document } from 'mongoose';

export interface IDoctor extends Document {
    user_id: mongoose.Types.ObjectId;
    specialization: string;
    department: string;
    is_available: boolean;
    current_queue_length: number;
    avg_consultation_time: number;
    experience: number;
    rating: number;
    languages: string[];
    consultation_fee: number;
    photo_url: string;
}

const DoctorSchema: Schema = new Schema({
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    specialization: { type: String, required: true },
    department: { type: String, required: true },
    is_available: { type: Boolean, default: false },
    current_queue_length: { type: Number, default: 0 },
    avg_consultation_time: { type: Number, default: 10 }, // minutes
    experience: { type: Number, default: 5 },
    rating: { type: Number, default: 4.5 },
    languages: { type: [String], default: ['English', 'Hindi'] },
    consultation_fee: { type: Number, default: 500 },
    photo_url: { type: String, default: '' }
});

export default mongoose.model<IDoctor>('Doctor', DoctorSchema);
