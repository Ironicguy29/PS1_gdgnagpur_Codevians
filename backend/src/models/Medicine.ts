import mongoose, { Schema, Document } from 'mongoose';

export interface IMedicine extends Document {
    name: string;
    generic_name?: string;
    dosage_form: string;
    strength: string;
    category?: string;
    manufacturer?: string;
    mrp: number;
    gst: number;
    storage_instructions?: string;
    prescription_required: boolean;
    is_active: boolean;
}

const MedicineSchema: Schema = new Schema({
    name: { type: String, required: true, unique: true },
    generic_name: { type: String },
    dosage_form: { type: String, required: true },
    strength: { type: String, required: true },
    category: { type: String, default: 'General' },
    manufacturer: { type: String, default: 'Generic' },
    mrp: { type: Number, default: 0 },
    gst: { type: Number, default: 12 }, // standard GST %
    storage_instructions: { type: String, default: 'Store in cool and dry place' },
    prescription_required: { type: Boolean, default: true },
    is_active: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model<IMedicine>('Medicine', MedicineSchema);

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
