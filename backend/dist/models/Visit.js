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
const AttachmentSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    file_type: { type: String, required: true },
    url: { type: String, required: true },
    uploaded_at: { type: Date, default: Date.now },
    version: { type: Number, default: 1 }
});
const VisitSchema = new mongoose_1.Schema({
    visit_id: { type: String, unique: true },
    patient_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctor_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    department: { type: String, required: true },
    date: { type: Date, default: Date.now },
    symptoms: [{ type: String }],
    status: { type: String, enum: ['Scheduled', 'Completed', 'InProgress', 'Cancelled'], default: 'Scheduled' },
    vitals: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Vitals' },
    diagnosis: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Diagnosis' },
    prescription: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Prescription' },
    lab_orders: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'LabOrder' }],
    notes: { type: mongoose_1.Schema.Types.ObjectId, ref: 'DoctorNote' },
    attachments: [AttachmentSchema],
    follow_up_date: { type: Date },
    treatment_plan: { type: String }
}, { timestamps: true });
// Auto-generate VIS-YYYY-000000 format Visit ID hook
VisitSchema.pre('save', function () {
    return __awaiter(this, void 0, void 0, function* () {
        const doc = this;
        if (!doc.visit_id) {
            const currentYear = new Date().getFullYear();
            const counter = yield Counter_1.default.findOneAndUpdate({ name: 'visit_id' }, { $inc: { seq: 1 } }, { new: true, upsert: true });
            const seqStr = String(counter.seq).padStart(6, '0');
            doc.visit_id = `VIS-${currentYear}-${seqStr}`;
        }
    });
});
exports.default = mongoose_1.default.model('Visit', VisitSchema);
