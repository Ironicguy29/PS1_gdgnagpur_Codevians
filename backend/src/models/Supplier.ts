import mongoose, { Schema, Document } from 'mongoose';

export interface ISupplier extends Document {
    name: string;
    contact: string;
    email?: string;
    gst: string;
    address: string;
    categories: string[];
    ratings?: number;
}

const SupplierSchema: Schema = new Schema({
    name: { type: String, required: true },
    contact: { type: String, required: true },
    email: { type: String },
    gst: { type: String, required: true, unique: true },
    address: { type: String, required: true },
    categories: [{ type: String }],
    ratings: { type: Number, default: 5 }
}, { timestamps: true });

export default mongoose.model<ISupplier>('Supplier', SupplierSchema);

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
