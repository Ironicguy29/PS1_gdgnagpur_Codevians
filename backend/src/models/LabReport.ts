import mongoose, { Schema, Document } from 'mongoose';
import Counter from './Counter';

export interface ILabReportResult {
    test_name: string;
    result_value: string;
    reference_range: string;
    unit: string;
    is_abnormal: boolean;
    is_critical: boolean;
}

export interface ILabReportAudit {
    action: string;
    performed_by: string;
    timestamp: Date;
    details: string;
}

export interface ILabReport extends Document {
    report_id: string;
    lab_order_id: mongoose.Types.ObjectId;
    patient_id: mongoose.Types.ObjectId;
    doctor_id?: mongoose.Types.ObjectId;
    results: ILabReportResult[];
    remarks?: string;
    verified_by?: mongoose.Types.ObjectId;
    verified_by_name?: string;
    approved_by?: mongoose.Types.ObjectId;
    approved_by_name?: string;
    digital_signature?: string;
    qr_code_hash?: string;
    status: 'Draft' | 'Pending Approval' | 'Approved' | 'Completed';
    is_critical_alert: boolean;
    version: number;
    audit_history: ILabReportAudit[];
    createdAt: Date;
    updatedAt: Date;
}

const LabReportSchema: Schema = new Schema({
    report_id: { type: String, unique: true },
    lab_order_id: { type: Schema.Types.ObjectId, ref: 'LabOrder', required: true },
    patient_id: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctor_id: { type: Schema.Types.ObjectId, ref: 'Doctor' },
    results: [{
        test_name: { type: String, required: true },
        result_value: { type: String, required: true },
        reference_range: { type: String, required: true },
        unit: { type: String, default: '' },
        is_abnormal: { type: Boolean, default: false },
        is_critical: { type: Boolean, default: false }
    }],
    remarks: { type: String },
    verified_by: { type: Schema.Types.ObjectId, ref: 'User' },
    verified_by_name: { type: String },
    approved_by: { type: Schema.Types.ObjectId, ref: 'User' },
    approved_by_name: { type: String },
    digital_signature: { type: String },
    qr_code_hash: { type: String },
    status: { 
        type: String, 
        enum: ['Draft', 'Pending Approval', 'Approved', 'Completed'], 
        default: 'Draft' 
    },
    is_critical_alert: { type: Boolean, default: false },
    version: { type: Number, default: 1 },
    audit_history: [{
        action: { type: String, required: true },
        performed_by: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        details: { type: String, required: true }
    }]
}, { timestamps: true });

// Auto-generate report_id
LabReportSchema.pre('save', async function (this: any) {
    const doc = this;
    if (!doc.report_id) {
        const counter = await Counter.findOneAndUpdate(
            { name: 'report_id' },
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        );
        const seqStr = String(counter.seq).padStart(6, '0');
        doc.report_id = `REP-${seqStr}`;
    }
});

export default mongoose.model<ILabReport>('LabReport', LabReportSchema);

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
