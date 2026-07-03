"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const PolicyMetricsSchema = new mongoose_1.Schema({
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
exports.default = mongoose_1.default.model('PolicyMetrics', PolicyMetricsSchema);
