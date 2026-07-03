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
const DiagnosticLogSchema = new mongoose_1.Schema({
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
exports.default = mongoose_1.default.model('DiagnosticLog', DiagnosticLogSchema);
