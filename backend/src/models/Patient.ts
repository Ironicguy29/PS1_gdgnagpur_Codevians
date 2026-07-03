import mongoose, { Schema, Document } from 'mongoose';
import Counter from './Counter';

export interface IPatient extends Document {
    patient_id: string;
    name: string;
    phone: string;
    email?: string;
    dob: Date;
    age: number;
    gender: string;
    blood_group: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    abha_id?: string;
    aadhaar_number?: string;
    registration_date: Date;
    last_login: Date;
    medical_profile?: mongoose.Types.ObjectId;
    emergency_contact?: mongoose.Types.ObjectId;
    onboarding_completed?: boolean;
    onboarding_steps?: {
        abha_verified?: boolean;
        routing_understood?: boolean;
        checkin_learned?: boolean;
        prescription_viewed?: boolean;
    };
}

const PatientSchema: Schema = new Schema({
    patient_id: { type: String, unique: true },
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    email: { type: String, sparse: true },
    dob: { type: Date, required: true },
    age: { type: Number },
    gender: { type: String, required: true },
    blood_group: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    abha_id: { type: String, unique: true, sparse: true },
    aadhaar_number: { type: String, unique: true, sparse: true },
    registration_date: { type: Date, default: Date.now },
    last_login: { type: Date, default: Date.now },
    medical_profile: { type: Schema.Types.ObjectId, ref: 'MedicalProfile' },
    emergency_contact: { type: Schema.Types.ObjectId, ref: 'EmergencyContact' },
    onboarding_completed: { type: Boolean, default: false },
    onboarding_steps: {
        abha_verified: { type: Boolean, default: false },
        routing_understood: { type: Boolean, default: false },
        checkin_learned: { type: Boolean, default: false },
        prescription_viewed: { type: Boolean, default: false }
    }
}, { timestamps: true });

// Auto-calculate age hook
PatientSchema.pre('save', async function (this: any) {
    const doc = this;
    if (doc.isModified('dob') && doc.dob) {
        const today = new Date();
        const birthDate = new Date(doc.dob);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        doc.age = age;
    }
});

// Auto-generate PAT-YYYY-000000 format Patient ID hook
PatientSchema.pre('save', async function (this: any) {
    const doc = this;
    if (!doc.patient_id) {
        const currentYear = new Date().getFullYear();
        const counter = await Counter.findOneAndUpdate(
            { name: 'patient_id' },
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        );
        const seqStr = String(counter.seq).padStart(6, '0');
        doc.patient_id = `PAT-${currentYear}-${seqStr}`;
    }
});

export default mongoose.model<IPatient>('Patient', PatientSchema);
