import mongoose, { Schema, Document } from 'mongoose';

export interface IPrescriptionMedicine {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
    before_food: boolean;
    substitution_allowed: boolean;
    quantity: number; // added for pharmacy dispensing mapping
}

export interface IPrescription extends Document {
    patient_id: mongoose.Types.ObjectId;
    doctor_id?: mongoose.Types.ObjectId;
    visit_id?: mongoose.Types.ObjectId;
    medicines: IPrescriptionMedicine[];
    instructions?: string;
    status: 'Generated' | 'Received' | 'Preparing' | 'Ready' | 'Dispensed' | 'Partially Dispensed' | 'Cancelled' | 'Completed';
    dispensed_at?: Date;
}

const PrescriptionSchema: Schema = new Schema({
    patient_id: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctor_id: { type: Schema.Types.ObjectId, ref: 'Doctor' },
    visit_id: { type: Schema.Types.ObjectId, ref: 'Visit' },
    medicines: [{
        name: { type: String, required: true },
        dosage: { type: String, required: true },
        frequency: { type: String, required: true },
        duration: { type: String, required: true },
        instructions: { type: String },
        before_food: { type: Boolean, default: false },
        substitution_allowed: { type: Boolean, default: true },
        quantity: { type: Number, default: 10 } // default quantity to dispense
    }],
    instructions: { type: String },
    status: {
        type: String,
        enum: ['Generated', 'Received', 'Preparing', 'Ready', 'Dispensed', 'Partially Dispensed', 'Cancelled', 'Completed'],
        default: 'Generated'
    },
    dispensed_at: { type: Date }
}, { timestamps: true });

export default mongoose.model<IPrescription>('Prescription', PrescriptionSchema);

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
