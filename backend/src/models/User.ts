import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    abha_id: string;
    name: string;
    email?: string;
    phone: string;
    role: 'patient' | 'doctor' | 'admin' | 'staff' | 'lab' | 'pharmacy' | 'driver';
    password_hash: string;
    profile: {
        age?: number;
        gender?: string;
        address?: string;
    };
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema: Schema = new Schema({
    abha_id: { type: String, unique: true, sparse: true, required: false },
    name: { type: String, required: true },
    email: { type: String, unique: true, sparse: true, required: false },
    phone: { type: String, required: true },
    role: { type: String, enum: ['patient', 'doctor', 'admin', 'staff', 'lab', 'pharmacy', 'driver'], default: 'patient' },
    password_hash: { type: String, required: true },
    profile: {
        age: Number,
        gender: String,
        address: String
    }
}, { timestamps: true });

export default mongoose.model<IUser>('User', UserSchema);

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
