import mongoose, { Schema, Document } from 'mongoose';

export interface IPolicyMetrics extends Document {
    hospital_id: string;
    hospital_name: string;
    state: string;
    month: Date;
    kpi_metrics: {
        avg_wait_time_minutes: number;
        patient_satisfaction_score: number;
        discharge_rate_percentage: number;
        readmission_rate_percentage: number;
        mortality_rate_percentage: number;
        bed_occupancy_rate: number;
        staff_to_patient_ratio: number;
        procedure_success_rate: number;
        infection_rate: number;
        average_length_of_stay: number;
    };
    comparative_metrics: {
        state_avg_wait_time: number;
        national_avg_wait_time: number;
        hospital_rank_in_state: number;
        total_hospitals_in_state: number;
        percentile_rank: number;
    };
    policy_compliance: {
        ab_pmjay_compliance: number;
        ndhm_adoption: number;
        emergency_response_time: number;
        waste_management_compliance: number;
        infection_control_score: number;
    };
    trend_analysis: {
        wait_time_trend: number;
        satisfaction_trend: number;
        safety_trend: number;
    };
    flagged_issues?: {
        issue: string;
        severity: 'low' | 'medium' | 'high';
        recommended_action: string;
        reported_date: Date;
    }[];
    created_at: Date;
    updated_at: Date;
}

const PolicyMetricsSchema: Schema = new Schema({
    hospital_id: { type: String, required: true },
    hospital_name: { type: String, required: true },
    state: { type: String, required: true },
    month: { type: Date, required: true },
    kpi_metrics: {
        avg_wait_time_minutes: { type: Number, default: 0 },
        patient_satisfaction_score: { type: Number, default: 0 },
        discharge_rate_percentage: { type: Number, default: 0 },
        readmission_rate_percentage: { type: Number, default: 0 },
        mortality_rate_percentage: { type: Number, default: 0 },
        bed_occupancy_rate: { type: Number, default: 0 },
        staff_to_patient_ratio: { type: Number, default: 0 },
        procedure_success_rate: { type: Number, default: 0 },
        infection_rate: { type: Number, default: 0 },
        average_length_of_stay: { type: Number, default: 0 }
    },
    comparative_metrics: {
        state_avg_wait_time: Number,
        national_avg_wait_time: Number,
        hospital_rank_in_state: Number,
        total_hospitals_in_state: Number,
        percentile_rank: Number
    },
    policy_compliance: {
        ab_pmjay_compliance: { type: Number, default: 0 },
        ndhm_adoption: { type: Number, default: 0 },
        emergency_response_time: { type: Number, default: 0 },
        waste_management_compliance: { type: Number, default: 0 },
        infection_control_score: { type: Number, default: 0 }
    },
    trend_analysis: {
        wait_time_trend: { type: Number, default: 0 },
        satisfaction_trend: { type: Number, default: 0 },
        safety_trend: { type: Number, default: 0 }
    },
    flagged_issues: [{
        issue: String,
        severity: { type: String, enum: ['low', 'medium', 'high'] },
        recommended_action: String,
        reported_date: Date
    }],
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
}, { timestamps: true });

PolicyMetricsSchema.index({ state: 1, month: -1 });
PolicyMetricsSchema.index({ hospital_id: 1, month: -1 });
PolicyMetricsSchema.index({ 'comparative_metrics.percentile_rank': 1 });

export default mongoose.model<IPolicyMetrics>('PolicyMetrics', PolicyMetricsSchema);
