import mongoose, { Schema, Document } from 'mongoose';

export interface IAuthentication extends Document {
    phone?: string;
    email?: string;
    password_hash: string;
    role: 'patient' | 'doctor' | 'admin' | 'staff' | 'lab' | 'pharmacy' | 'driver';
    patient_id?: mongoose.Types.ObjectId;
    last_login: Date;
    registration_date: Date;
}

const AuthenticationSchema: Schema = new Schema({
    phone: { type: String, unique: true, sparse: true },
    email: { type: String, unique: true, sparse: true },
    password_hash: { type: String, required: true },
    role: { type: String, enum: ['patient', 'doctor', 'admin', 'staff', 'lab', 'pharmacy', 'driver'], required: true },
    patient_id: { type: Schema.Types.ObjectId, ref: 'Patient' },
    last_login: { type: Date, default: Date.now },
    registration_date: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model<IAuthentication>('Authentication', AuthenticationSchema);
