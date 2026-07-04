import mongoose, { Schema, Document } from 'mongoose';

export interface IDoctorNote extends Document {
    patient_id: mongoose.Types.ObjectId;
    visit_id: mongoose.Types.ObjectId;
    doctor_id: mongoose.Types.ObjectId;
    private_notes: string;
}

const DoctorNoteSchema: Schema = new Schema({
    patient_id: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    visit_id: { type: Schema.Types.ObjectId, ref: 'Visit', required: true },
    doctor_id: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    private_notes: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model<IDoctorNote>('DoctorNote', DoctorNoteSchema);

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
