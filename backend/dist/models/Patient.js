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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const Counter_1 = __importDefault(require("./Counter"));
const PatientSchema = new mongoose_1.Schema({
    patient_id: { type: String, unique: true },
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    email: { type: String, sparse: true },
    dob: { type: Date, required: true },
    age: { type: Number },
    gender: { type: String, required: true },
    blood_group: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    abha_id: { type: String, unique: true, sparse: true },
    aadhaar_number: { type: String, unique: true, sparse: true },
    registration_date: { type: Date, default: Date.now },
    last_login: { type: Date, default: Date.now },
    medical_profile: { type: mongoose_1.Schema.Types.ObjectId, ref: 'MedicalProfile' },
    emergency_contact: { type: mongoose_1.Schema.Types.ObjectId, ref: 'EmergencyContact' },
    onboarding_completed: { type: Boolean, default: false },
    onboarding_steps: {
        abha_verified: { type: Boolean, default: false },
        routing_understood: { type: Boolean, default: false },
        checkin_learned: { type: Boolean, default: false },
        prescription_viewed: { type: Boolean, default: false }
    }
}, { timestamps: true });
// Auto-calculate age hook
PatientSchema.pre('save', function () {
    return __awaiter(this, void 0, void 0, function* () {
        const doc = this;
        if (doc.isModified('dob') && doc.dob) {
            const today = new Date();
            const birthDate = new Date(doc.dob);
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            doc.age = age;
        }
    });
});
// Auto-generate PAT-YYYY-000000 format Patient ID hook
PatientSchema.pre('save', function () {
    return __awaiter(this, void 0, void 0, function* () {
        const doc = this;
        if (!doc.patient_id) {
            const currentYear = new Date().getFullYear();
            const counter = yield Counter_1.default.findOneAndUpdate({ name: 'patient_id' }, { $inc: { seq: 1 } }, { new: true, upsert: true });
            const seqStr = String(counter.seq).padStart(6, '0');
            doc.patient_id = `PAT-${currentYear}-${seqStr}`;
        }
    });
});
exports.default = mongoose_1.default.model('Patient', PatientSchema);
