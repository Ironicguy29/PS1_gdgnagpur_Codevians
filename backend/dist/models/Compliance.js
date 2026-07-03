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
const ComplianceSchema = new mongoose_1.Schema({
    hospital_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Hospital', required: true },
    claim_id: { type: String, unique: true, required: true },
    patient_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Patient', required: true },
    scheme_type: { type: String, enum: ['AB-PMJAY', 'NDHM', 'Other'], default: 'AB-PMJAY' },
    claim_amount: { type: Number, required: true },
    status: { type: String, enum: ['submitted', 'approved', 'rejected', 'pending'], default: 'pending' },
    admission_date: { type: Date, required: true },
    discharge_date: { type: Date, required: true },
    treatment_type: String,
    diagnosis: String,
    documents_verified: { type: Boolean, default: false },
    compliance_issues: [String],
    verification_notes: String,
    submitted_date: { type: Date, default: Date.now },
    approved_date: Date,
    rejection_reason: String
}, { timestamps: true });
// Index for fast queries
ComplianceSchema.index({ hospital_id: 1, status: 1 });
ComplianceSchema.index({ patient_id: 1, scheme_type: 1 });
ComplianceSchema.index({ claim_id: 1 });
exports.default = mongoose_1.default.model('Compliance', ComplianceSchema);
