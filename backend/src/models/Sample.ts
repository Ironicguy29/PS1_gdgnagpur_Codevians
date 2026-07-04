import mongoose, { Schema, Document } from 'mongoose';
import Counter from './Counter';

export interface ISample extends Document {
    sample_id: string;
    barcode: string;
    patient_id: mongoose.Types.ObjectId;
    lab_order_id: mongoose.Types.ObjectId;
    test_names: string[];
    sample_type: string;
    status: 'Ordered' | 'Collected' | 'In Transit' | 'Received' | 'Processing' | 'Completed' | 'Rejected';
    collected_by: mongoose.Types.ObjectId;
    collected_by_name: string;
    collection_time?: Date;
    received_time?: Date;
    rejection_reason?: string;
}

const SampleSchema: Schema = new Schema({
    sample_id: { type: String, unique: true },
    barcode: { type: String, unique: true },
    patient_id: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    lab_order_id: { type: Schema.Types.ObjectId, ref: 'LabOrder', required: true },
    test_names: [{ type: String, required: true }],
    sample_type: { type: String, required: true },
    status: { 
        type: String, 
        enum: ['Ordered', 'Collected', 'In Transit', 'Received', 'Processing', 'Completed', 'Rejected'], 
        default: 'Ordered' 
    },
    collected_by: { type: Schema.Types.ObjectId, ref: 'User' },
    collected_by_name: { type: String },
    collection_time: { type: Date },
    received_time: { type: Date },
    rejection_reason: { type: String }
}, { timestamps: true });

// Auto-generate barcode/sample_id
SampleSchema.pre('save', async function (this: any) {
    const doc = this;
    if (!doc.sample_id) {
        const counter = await Counter.findOneAndUpdate(
            { name: 'sample_id' },
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        );
        const seqStr = String(counter.seq).padStart(6, '0');
        doc.sample_id = `SMP-${seqStr}`;
    }
    
    if (!doc.barcode) {
        // Create a structured barcode string
        doc.barcode = `BAR-${doc.patient_id}-${doc.lab_order_id}-${doc.sample_id}`;
    }
});

export default mongoose.model<ISample>('Sample', SampleSchema);

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
