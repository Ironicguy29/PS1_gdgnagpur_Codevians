import mongoose, { Schema, Document } from 'mongoose';

export interface IDiagnosticLog extends Document {
    hospital_id: string;
    state: string;
    date: Date;
    disease_code: string;
    disease_name: string;
    patient_count: number;
    age_group: 'pediatric' | 'adult' | 'elderly';
    severity: 'mild' | 'moderate' | 'severe' | 'critical';
    test_type: string;
    test_result: 'positive' | 'negative' | 'inconclusive';
    outcome: 'recovered' | 'hospitalized' | 'deceased' | 'ongoing';
    anomaly_score: number;
    is_anomaly: boolean;
    anomaly_details?: {
        deviation_percentage: number;
        expected_cases: number;
        actual_cases: number;
        confidence_score: number;
    };
    response_status?: 'no_action' | 'monitoring' | 'investigation' | 'response_initiated';
    created_at: Date;
}

const DiagnosticLogSchema: Schema = new Schema({
    hospital_id: { type: String, required: true },
    state: { type: String, required: true },
    date: { type: Date, required: true, default: Date.now },
    disease_code: { type: String, required: true },
    disease_name: { type: String, required: true },
    patient_count: { type: Number, required: true },
    age_group: { type: String, enum: ['pediatric', 'adult', 'elderly'], required: true },
    severity: { type: String, enum: ['mild', 'moderate', 'severe', 'critical'], required: true },
    test_type: { type: String, required: true },
    test_result: { type: String, enum: ['positive', 'negative', 'inconclusive'], required: true },
    outcome: { type: String, enum: ['recovered', 'hospitalized', 'deceased', 'ongoing'] },
    anomaly_score: { type: Number, default: 0 },
    is_anomaly: { type: Boolean, default: false },
    anomaly_details: {
        deviation_percentage: Number,
        expected_cases: Number,
        actual_cases: Number,
        confidence_score: Number
    },
    response_status: { 
        type: String, 
        enum: ['no_action', 'monitoring', 'investigation', 'response_initiated'],
        default: 'no_action'
    },
    created_at: { type: Date, default: Date.now }
}, { timestamps: true });

DiagnosticLogSchema.index({ state: 1, date: -1 });
DiagnosticLogSchema.index({ disease_code: 1, date: -1 });
DiagnosticLogSchema.index({ is_anomaly: 1 });
DiagnosticLogSchema.index({ hospital_id: 1, date: -1 });

export default mongoose.model<IDiagnosticLog>('DiagnosticLog', DiagnosticLogSchema);

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
