import mongoose, { Schema, Document } from 'mongoose';

export interface ILabTest extends Document {
    test_id: string;
    name: string;
    category: 'Blood Tests' | 'Urine Tests' | 'Stool Tests' | 'Biochemistry' | 'Microbiology' | 'Pathology' | 'Radiology' | 'Cardiology' | 'Hormone Tests' | 'Custom Tests';
    department: string;
    estimated_time_hours: number;
    preparation_instructions: string;
    normal_reference_range: string;
    unit: string;
    price: number;
    priority: 'Routine' | 'Urgent' | 'Stat';
}

const LabTestSchema: Schema = new Schema({
    test_id: { type: String, unique: true, required: true },
    name: { type: String, required: true, unique: true },
    category: { 
        type: String, 
        enum: [
            'Blood Tests', 'Urine Tests', 'Stool Tests', 'Biochemistry', 
            'Microbiology', 'Pathology', 'Radiology', 'Cardiology', 
            'Hormone Tests', 'Custom Tests'
        ], 
        required: true 
    },
    department: { type: String, required: true },
    estimated_time_hours: { type: Number, default: 24 },
    preparation_instructions: { type: String, default: 'No special preparation needed.' },
    normal_reference_range: { type: String, required: true },
    unit: { type: String, default: '' },
    price: { type: Number, required: true },
    priority: { type: String, enum: ['Routine', 'Urgent', 'Stat'], default: 'Routine' }
}, { timestamps: true });

export default mongoose.model<ILabTest>('LabTest', LabTestSchema);

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
