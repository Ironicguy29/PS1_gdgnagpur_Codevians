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
const AmbulanceSchema = new mongoose_1.Schema({
    registration_number: { type: String, required: true, unique: true, uppercase: true, trim: true },
    vehicle_number: { type: String, required: true, uppercase: true, trim: true },
    type: { type: String, enum: ['basic', 'advanced', 'neonatal', 'bariatric', 'air'], default: 'basic' },
    status: { type: String, enum: ['available', 'dispatched', 'en_route_to_patient', 'transporting', 'at_hospital', 'maintenance', 'offline'], default: 'available' },
    current_driver_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'AmbulanceDriver' },
    current_trip_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'AmbulanceTrip' },
    current_location: {
        latitude: { type: Number },
        longitude: { type: Number },
        speed: { type: Number, default: 0 },
        heading: { type: Number, default: 0 },
        updated_at: { type: Date, default: Date.now },
    },
    features: { type: [String], default: [] },
    capacity: { type: Number, default: 2 },
    fuel_level: { type: Number, default: 100, min: 0, max: 100 },
    odometer_km: { type: Number, default: 0 },
    last_maintenance: { type: Date, default: Date.now },
    next_maintenance: { type: Date },
    is_active: { type: Boolean, default: true },
    base_location: {
        latitude: { type: Number, default: 21.1458 },
        longitude: { type: Number, default: 79.0882 },
        address: { type: String, default: 'ArogyaMitra Hospital, Nagpur' },
    },
    notes: { type: String, default: '' },
}, { timestamps: true });
AmbulanceSchema.index({ status: 1 });
AmbulanceSchema.index({ 'current_location.latitude': 1, 'current_location.longitude': 1 });
exports.default = mongoose_1.default.model('Ambulance', AmbulanceSchema);
