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
const RegistrySchema = new mongoose_1.Schema({
    entity_type: { type: String, enum: ['hospital', 'doctor'], required: true },
    entity_id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    registration_number: { type: String, required: true },
    state: { type: String, required: true },
    license_number: { type: String, required: true },
    license_expiry: { type: Date, required: true },
    accreditation_status: {
        type: String,
        enum: ['active', 'expired', 'suspended', 'cancelled'],
        default: 'active'
    },
    accreditation_bodies: [{ type: String }],
    last_audit_date: Date,
    audit_findings: [{
            date: Date,
            status: { type: String, enum: ['compliant', 'non-compliant', 'partially-compliant'] },
            issues: [String],
            resolution_status: { type: String, enum: ['resolved', 'pending', 'critical'] }
        }],
    compliance_score: { type: Number, default: 100 },
    verified_at: { type: Date, default: Date.now },
    credentials: [{
            qualification: String,
            specialization: String,
            experience_years: Number
        }],
    contact_info: {
        email: String,
        phone: String,
        address: String
    },
    flags: {
        flagged: { type: Boolean, default: false },
        flag_reason: String,
        flag_date: Date,
        severity: { type: String, enum: ['low', 'medium', 'high', 'critical'] }
    },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
}, { timestamps: true });
RegistrySchema.index({ entity_type: 1, state: 1 });
RegistrySchema.index({ accreditation_status: 1 });
RegistrySchema.index({ 'flags.flagged': 1 });
exports.default = mongoose_1.default.model('Registry', RegistrySchema);
