import mongoose, { Schema, Document } from 'mongoose';

export interface IMedicineInteraction extends Document {
    medicine_a: string;
    medicine_b: string;
    severity: 'Low' | 'Medium' | 'High';
    description: string;
}

const MedicineInteractionSchema: Schema = new Schema({
    medicine_a: { type: String, required: true, trim: true },
    medicine_b: { type: String, required: true, trim: true },
    severity: { type: String, enum: ['Low', 'Medium', 'High'], required: true },
    description: { type: String, required: true }
}, { timestamps: true });

// Compound index to ensure uniqueness of pairs (both directions should be handled or searched)
MedicineInteractionSchema.index({ medicine_a: 1, medicine_b: 1 }, { unique: true });

export default mongoose.model<IMedicineInteraction>('MedicineInteraction', MedicineInteractionSchema);

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
