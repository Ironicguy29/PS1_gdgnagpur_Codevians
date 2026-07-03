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
const EmergencyDispatchSchema = new mongoose_1.Schema({
    requested_by: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    patient_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Patient' },
    emergency_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'EmergencyQueue' },
    ambulance_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Ambulance' },
    driver_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'AmbulanceDriver' },
    trip_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'AmbulanceTrip' },
    status: {
        type: String,
        enum: ['pending', 'ambulance_assigned', 'in_progress', 'completed', 'cancelled'],
        default: 'pending',
    },
    priority: {
        type: String,
        enum: ['critical', 'high', 'moderate', 'low'],
        default: 'high',
    },
    caller_name: { type: String, default: '' },
    caller_phone: { type: String, default: '' },
    chief_complaint: { type: String, required: true },
    pickup_location: {
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true },
        address: { type: String, default: '' },
    },
    destination_location: {
        latitude: { type: Number, default: 21.1458 },
        longitude: { type: Number, default: 79.0882 },
        address: { type: String, default: 'ArogyaMitra Hospital, Nagpur' },
    },
    assigned_at: { type: Date },
    completed_at: { type: Date },
    cancelled_at: { type: Date },
    cancel_reason: { type: String },
    notes: { type: String, default: '' },
}, { timestamps: true });
EmergencyDispatchSchema.index({ status: 1, priority: 1, createdAt: -1 });
EmergencyDispatchSchema.index({ ambulance_id: 1 });
exports.default = mongoose_1.default.model('EmergencyDispatch', EmergencyDispatchSchema);
