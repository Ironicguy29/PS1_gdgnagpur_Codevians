import mongoose, { Schema, Document } from 'mongoose';

export interface IBatch extends Document {
    medicine_id: mongoose.Types.ObjectId;
    batch_number: string;
    expiry_date: Date;
    mrp: number;
    gst: number;
    stock_quantity: number;
    initial_quantity: number;
    storage_instructions?: string;
    barcode: string;
    supplier_id?: mongoose.Types.ObjectId;
}

const BatchSchema: Schema = new Schema({
    medicine_id: { type: Schema.Types.ObjectId, ref: 'Medicine', required: true },
    batch_number: { type: String, required: true },
    expiry_date: { type: Date, required: true },
    mrp: { type: Number, required: true },
    gst: { type: Number, default: 12 },
    stock_quantity: { type: Number, required: true, min: 0 },
    initial_quantity: { type: Number, required: true },
    storage_instructions: { type: String },
    barcode: { type: String, required: true, unique: true },
    supplier_id: { type: Schema.Types.ObjectId, ref: 'Supplier' }
}, { timestamps: true });

// Compound index to ensure batch_number is unique per medicine
BatchSchema.index({ medicine_id: 1, batch_number: 1 }, { unique: true });

export default mongoose.model<IBatch>('Batch', BatchSchema);

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
