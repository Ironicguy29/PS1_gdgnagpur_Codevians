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
const MedicalProfileSchema = new mongoose_1.Schema({
    patient_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Patient', required: true },
    height: { type: Number, required: true },
    weight: { type: Number, required: true },
    bmi: { type: Number },
    allergies: [{ type: String }],
    existing_diseases: [{ type: String }],
    current_medications: [{ type: String }],
    disability: { type: String },
    past_surgeries: [{ type: String }],
    family_history: [{ type: String }],
    lifestyle: {
        smoking: { type: String },
        alcohol: { type: String },
        pregnancy_status: { type: String }
    },
    insurance: {
        provider: { type: String },
        policy_number: { type: String },
        expiry_date: { type: Date }
    }
}, { timestamps: true });
// Auto calculate BMI hook
MedicalProfileSchema.pre('save', function () {
    if (this.height && this.weight) {
        // height is in cm, weight in kg
        const heightInMeters = this.height / 100;
        this.bmi = parseFloat((this.weight / (heightInMeters * heightInMeters)).toFixed(2));
    }
});
exports.default = mongoose_1.default.model('MedicalProfile', MedicalProfileSchema);
