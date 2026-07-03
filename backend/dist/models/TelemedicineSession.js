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
const ChatMessageSchema = new mongoose_1.Schema({
    sender_id: { type: mongoose_1.Schema.Types.ObjectId, required: true },
    sender_role: { type: String, enum: ['patient', 'doctor'], required: true },
    sender_name: { type: String, required: true },
    message: { type: String, default: '' },
    message_type: { type: String, enum: ['text', 'file', 'voice_note', 'instruction'], default: 'text' },
    file_url: { type: String },
    file_name: { type: String },
    file_size: { type: Number },
    file_type: { type: String },
    sentAt: { type: Date, default: Date.now },
});
const SharedFileSchema = new mongoose_1.Schema({
    uploader_id: { type: mongoose_1.Schema.Types.ObjectId, required: true },
    uploader_role: { type: String, enum: ['patient', 'doctor'], required: true },
    file_name: { type: String, required: true },
    file_url: { type: String, required: true },
    file_type: { type: String, required: true },
    file_size: { type: Number, required: true },
    category: { type: String, enum: ['lab_report', 'prescription', 'image', 'document', 'other'], default: 'other' },
    uploaded_at: { type: Date, default: Date.now },
});
const ConnectionLogSchema = new mongoose_1.Schema({
    user_id: { type: mongoose_1.Schema.Types.ObjectId },
    role: { type: String },
    event: { type: String, enum: ['joined', 'left', 'reconnected', 'network_poor', 'network_good'] },
    timestamp: { type: Date, default: Date.now },
    metadata: { type: mongoose_1.Schema.Types.Mixed },
});
const TelemedicineSessionSchema = new mongoose_1.Schema({
    appointment_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Appointment', required: true, unique: true },
    consultation_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Consultation' },
    patient_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctor_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    room_name: { type: String, required: true, unique: true },
    livekit_url: { type: String, required: true },
    consultation_type: { type: String, enum: ['video', 'audio', 'physical'], default: 'video' },
    status: { type: String, enum: ['waiting', 'active', 'completed', 'cancelled', 'missed'], default: 'waiting' },
    doctor_joined_at: { type: Date },
    patient_joined_at: { type: Date },
    started_at: { type: Date },
    ended_at: { type: Date },
    duration_seconds: { type: Number, default: 0 },
    chat_messages: [ChatMessageSchema],
    shared_files: [SharedFileSchema],
    connection_logs: [ConnectionLogSchema],
    summary: {
        chief_complaint: { type: String },
        diagnosis: { type: String },
        notes: { type: String },
        prescription_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Prescription' },
        lab_order_ids: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'LabOrder' }],
        follow_up_date: { type: Date },
        follow_up_notes: { type: String },
    },
    analytics: {
        avg_network_quality: { type: Number },
        reconnection_count: { type: Number, default: 0 },
        bandwidth_mode: { type: String, enum: ['hd', 'sd', 'audio_only'], default: 'hd' },
        patient_rating: { type: Number, min: 1, max: 5 },
        patient_feedback: { type: String },
    },
}, { timestamps: true });
// Index for quick lookups
TelemedicineSessionSchema.index({ appointment_id: 1 });
TelemedicineSessionSchema.index({ patient_id: 1, status: 1 });
TelemedicineSessionSchema.index({ doctor_id: 1, status: 1 });
TelemedicineSessionSchema.index({ room_name: 1 });
exports.default = mongoose_1.default.model('TelemedicineSession', TelemedicineSessionSchema);
