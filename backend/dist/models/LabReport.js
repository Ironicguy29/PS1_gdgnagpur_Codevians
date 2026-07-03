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
const LabReportSchema = new mongoose_1.Schema({
    report_id: { type: String, unique: true },
    lab_order_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'LabOrder', required: true },
    patient_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctor_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Doctor' },
    results: [{
            test_name: { type: String, required: true },
            result_value: { type: String, required: true },
            reference_range: { type: String, required: true },
            unit: { type: String, default: '' },
            is_abnormal: { type: Boolean, default: false },
            is_critical: { type: Boolean, default: false }
        }],
    remarks: { type: String },
    verified_by: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    verified_by_name: { type: String },
    approved_by: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    approved_by_name: { type: String },
    digital_signature: { type: String },
    qr_code_hash: { type: String },
    status: {
        type: String,
        enum: ['Draft', 'Pending Approval', 'Approved', 'Completed'],
        default: 'Draft'
    },
    is_critical_alert: { type: Boolean, default: false },
    version: { type: Number, default: 1 },
    audit_history: [{
            action: { type: String, required: true },
            performed_by: { type: String, required: true },
            timestamp: { type: Date, default: Date.now },
            details: { type: String, required: true }
        }]
}, { timestamps: true });
// Auto-generate report_id
LabReportSchema.pre('save', function () {
    return __awaiter(this, void 0, void 0, function* () {
        const doc = this;
        if (!doc.report_id) {
            const counter = yield Counter_1.default.findOneAndUpdate({ name: 'report_id' }, { $inc: { seq: 1 } }, { new: true, upsert: true });
            const seqStr = String(counter.seq).padStart(6, '0');
            doc.report_id = `REP-${seqStr}`;
        }
    });
});
exports.default = mongoose_1.default.model('LabReport', LabReportSchema);
