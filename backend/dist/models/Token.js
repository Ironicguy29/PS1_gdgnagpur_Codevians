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
const TokenSchema = new mongoose_1.Schema({
    token_number: { type: Number, required: true },
    display_token: { type: String, required: true },
    appointment_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Appointment' },
    queue_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Queue', required: true },
    doctor_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    patient_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Patient', required: true },
    department: { type: String, required: true },
    estimated_wait_minutes: { type: Number, default: 0 },
    estimated_consultation_time: { type: Number, default: 15 },
    status: {
        type: String,
        enum: ['Booked', 'Checked In', 'Waiting', 'Called', 'In Consultation', 'Completed', 'Skipped', 'Cancelled', 'Emergency'],
        default: 'Booked'
    },
    priority: { type: String, enum: ['Normal', 'Emergency'], default: 'Normal' },
    check_in_time: { type: Date },
    call_time: { type: Date },
    consultation_start_time: { type: Date },
    consultation_end_time: { type: Date }
}, { timestamps: true });
exports.default = mongoose_1.default.model('Token', TokenSchema);
