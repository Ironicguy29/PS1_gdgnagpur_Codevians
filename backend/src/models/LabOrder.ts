import mongoose, { Schema, Document } from 'mongoose';
import Counter from './Counter';

export interface ILabResult {
    test_name: string;
    result_value?: string;
    reference_range?: string;
    status: 'Pending' | 'Completed';
    completed_at?: Date;
}

export interface ILabOrder extends Document {
    lab_order_id: string;
    patient_id: mongoose.Types.ObjectId;
    visit_id?: mongoose.Types.ObjectId;
    tests: string[];
    status: 'Ordered' | 'Collected' | 'Processing' | 'Completed';
    results: ILabResult[];
}

const LabOrderSchema: Schema = new Schema({
    lab_order_id: { type: String, unique: true },
    patient_id: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    visit_id: { type: Schema.Types.ObjectId, ref: 'Visit', required: false },
    tests: [{ type: String, required: true }],
    status: { type: String, enum: ['Ordered', 'Collected', 'Processing', 'Completed'], default: 'Ordered' },
    results: [{
        test_name: { type: String, required: true },
        result_value: { type: String },
        reference_range: { type: String },
        status: { type: String, enum: ['Pending', 'Completed'], default: 'Pending' },
        completed_at: { type: Date }
    }]
}, { timestamps: true });

// Auto-generate LAB-YYYY-000000 format Lab Order ID hook
LabOrderSchema.pre('save', async function (this: any) {
    const doc = this;
    if (!doc.lab_order_id) {
        const currentYear = new Date().getFullYear();
        const counter = await Counter.findOneAndUpdate(
            { name: 'lab_order_id' },
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        );
        const seqStr = String(counter.seq).padStart(6, '0');
        doc.lab_order_id = `LAB-${currentYear}-${seqStr}`;
    }
});

export default mongoose.model<ILabOrder>('LabOrder', LabOrderSchema);
