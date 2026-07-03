import mongoose, { Schema, Document } from 'mongoose';
import Counter from './Counter';

export interface IAttachment {
    name: string;
    file_type: string;
    url: string;
    uploaded_at: Date;
    version: number;
}

export interface IVisit extends Document {
    visit_id: string;
    patient_id: mongoose.Types.ObjectId;
    doctor_id: mongoose.Types.ObjectId;
    department: string;
    date: Date;
    symptoms: string[];
    status: 'Scheduled' | 'Completed' | 'InProgress' | 'Cancelled';
    vitals?: mongoose.Types.ObjectId;
    diagnosis?: mongoose.Types.ObjectId;
    prescription?: mongoose.Types.ObjectId;
    lab_orders: mongoose.Types.ObjectId[];
    notes?: mongoose.Types.ObjectId;
    attachments: IAttachment[];
    follow_up_date?: Date;
    treatment_plan?: string;
}

const AttachmentSchema = new Schema({
    name: { type: String, required: true },
    file_type: { type: String, required: true },
    url: { type: String, required: true },
    uploaded_at: { type: Date, default: Date.now },
    version: { type: Number, default: 1 }
});

const VisitSchema: Schema = new Schema({
    visit_id: { type: String, unique: true },
    patient_id: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctor_id: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    department: { type: String, required: true },
    date: { type: Date, default: Date.now },
    symptoms: [{ type: String }],
    status: { type: String, enum: ['Scheduled', 'Completed', 'InProgress', 'Cancelled'], default: 'Scheduled' },
    vitals: { type: Schema.Types.ObjectId, ref: 'Vitals' },
    diagnosis: { type: Schema.Types.ObjectId, ref: 'Diagnosis' },
    prescription: { type: Schema.Types.ObjectId, ref: 'Prescription' },
    lab_orders: [{ type: Schema.Types.ObjectId, ref: 'LabOrder' }],
    notes: { type: Schema.Types.ObjectId, ref: 'DoctorNote' },
    attachments: [AttachmentSchema],
    follow_up_date: { type: Date },
    treatment_plan: { type: String }
}, { timestamps: true });

// Auto-generate VIS-YYYY-000000 format Visit ID hook
VisitSchema.pre('save', async function (this: any) {
    const doc = this;
    if (!doc.visit_id) {
        const currentYear = new Date().getFullYear();
        const counter = await Counter.findOneAndUpdate(
            { name: 'visit_id' },
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        );
        const seqStr = String(counter.seq).padStart(6, '0');
        doc.visit_id = `VIS-${currentYear}-${seqStr}`;
    }
});

export default mongoose.model<IVisit>('Visit', VisitSchema);
