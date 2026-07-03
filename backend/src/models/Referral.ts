import mongoose, { Schema, Document } from 'mongoose';

export interface IReferral extends Document {
    patient_id: mongoose.Types.ObjectId;
    doctor_id: mongoose.Types.ObjectId;
    referred_to_specialist?: string;
    referred_to_department?: string;
    referred_to_hospital?: string;
    referral_letter: string;
    date: Date;
}

const ReferralSchema: Schema = new Schema({
    patient_id: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctor_id: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    referred_to_specialist: { type: String },
    referred_to_department: { type: String },
    referred_to_hospital: { type: String },
    referral_letter: { type: String, required: true },
    date: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model<IReferral>('Referral', ReferralSchema);
