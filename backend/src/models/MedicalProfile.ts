import mongoose, { Schema, Document } from 'mongoose';

export interface IMedicalProfile extends Document {
    patient_id: mongoose.Types.ObjectId;
    height: number;
    weight: number;
    bmi?: number;
    allergies: string[];
    existing_diseases: string[];
    current_medications: string[];
    disability?: string;
    past_surgeries?: string[];
    family_history?: string[];
    lifestyle?: {
        smoking?: string;
        alcohol?: string;
        pregnancy_status?: string;
    };
    insurance?: {
        provider?: string;
        policy_number?: string;
        expiry_date?: Date;
    };
}

const MedicalProfileSchema: Schema = new Schema({
    patient_id: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    height: { type: Number, required: true },
    weight: { type: Number, required: true },
    bmi: { type: Number },
    allergies: [{ type: String }],
    existing_diseases: [{ type: String }],
    current_medications: [{ type: String }],
    disability: { type: String },
    past_surgeries: [{ type: String }],
    family_history: [{ type: String }],
    lifestyle: {
        smoking: { type: String },
        alcohol: { type: String },
        pregnancy_status: { type: String }
    },
    insurance: {
        provider: { type: String },
        policy_number: { type: String },
        expiry_date: { type: Date }
    }
}, { timestamps: true });

// Auto calculate BMI hook
MedicalProfileSchema.pre('save', function (this: any) {
    if (this.height && this.weight) {
        // height is in cm, weight in kg
        const heightInMeters = this.height / 100;
        this.bmi = parseFloat((this.weight / (heightInMeters * heightInMeters)).toFixed(2));
    }
});

export default mongoose.model<IMedicalProfile>('MedicalProfile', MedicalProfileSchema);

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
