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
const LatLngSchema = {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    address: { type: String, default: '' },
};
const AmbulanceTripSchema = new mongoose_1.Schema({
    dispatch_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'EmergencyDispatch' },
    ambulance_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Ambulance', required: true },
    driver_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'AmbulanceDriver', required: true },
    patient_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Patient' },
    emergency_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'EmergencyQueue' },
    status: {
        type: String,
        enum: ['pending', 'driver_accepted', 'en_route_to_patient', 'arrived_at_patient', 'transporting', 'arrived_at_hospital', 'completed', 'cancelled'],
        default: 'pending',
    },
    pickup_location: Object.assign({}, LatLngSchema),
    destination_location: Object.assign({}, LatLngSchema),
    gps_trail: [{
            latitude: { type: Number },
            longitude: { type: Number },
            speed: { type: Number, default: 0 },
            heading: { type: Number, default: 0 },
            recorded_at: { type: Date, default: Date.now },
        }],
    dispatched_at: { type: Date },
    driver_accepted_at: { type: Date },
    arrived_at_patient_at: { type: Date },
    trip_started_at: { type: Date },
    arrived_at_hospital_at: { type: Date },
    completed_at: { type: Date },
    cancelled_at: { type: Date },
    eta_minutes_to_patient: { type: Number, default: 0 },
    eta_minutes_to_hospital: { type: Number, default: 0 },
    distance_km_to_patient: { type: Number, default: 0 },
    distance_km_to_hospital: { type: Number, default: 0 },
    total_distance_km: { type: Number, default: 0 },
    cancellation_reason: { type: String },
    notes: { type: String, default: '' },
    rating: { type: Number, min: 1, max: 5 },
}, { timestamps: true });
AmbulanceTripSchema.index({ status: 1, createdAt: -1 });
AmbulanceTripSchema.index({ ambulance_id: 1 });
AmbulanceTripSchema.index({ patient_id: 1 });
exports.default = mongoose_1.default.model('AmbulanceTrip', AmbulanceTripSchema);
