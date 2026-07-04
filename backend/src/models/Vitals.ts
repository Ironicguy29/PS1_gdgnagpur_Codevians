import mongoose, { Schema, Document } from 'mongoose';

export interface IVitals extends Document {
    patient_id: mongoose.Types.ObjectId;
    visit_id?: mongoose.Types.ObjectId;
    temperature: number;      // Fahrenheit or Celsius
    blood_pressure: string;   // e.g. "120/80"
    heart_rate: number;       // bpm
    respiratory_rate: number; // breaths/min
    oxygen_saturation: number;// %
    height: number;
    weight: number;
    bmi: number;
    blood_sugar?: number;     // mg/dL
    pain_scale?: number;      // 1-10
    recorded_at: Date;
}

const VitalsSchema: Schema = new Schema({
    patient_id: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    visit_id: { type: Schema.Types.ObjectId, ref: 'Visit' },
    temperature: { type: Number, required: true },
    blood_pressure: { type: String, required: true },
    heart_rate: { type: Number, required: true },
    respiratory_rate: { type: Number, required: true },
    oxygen_saturation: { type: Number, required: true },
    height: { type: Number, required: true },
    weight: { type: Number, required: true },
    bmi: { type: Number, required: true },
    blood_sugar: { type: Number },
    pain_scale: { type: Number, min: 1, max: 10 },
    recorded_at: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model<IVitals>('Vitals', VitalsSchema);

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
