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
const ResourceInventorySchema = new mongoose_1.Schema({
    hospital_id: { type: String, required: true, unique: true },
    hospital_name: { type: String, required: true },
    state: { type: String, required: true },
    district: { type: String, required: true },
    resources: {
        oxygen_plants: {
            count: { type: Number, default: 0 },
            capacity_per_unit: { type: Number, default: 0 },
            total_capacity: { type: Number, default: 0 },
            utilization_rate: { type: Number, default: 0 }
        },
        ventilators: {
            count: { type: Number, default: 0 },
            operational: { type: Number, default: 0 },
            maintenance: { type: Number, default: 0 },
            utilization_rate: { type: Number, default: 0 }
        },
        beds: {
            total: { type: Number, default: 0 },
            icu: { type: Number, default: 0 },
            general: { type: Number, default: 0 },
            occupied: { type: Number, default: 0 }
        },
        specialist_staff: {
            cardiologists: { type: Number, default: 0 },
            pulmonologists: { type: Number, default: 0 },
            neurologists: { type: Number, default: 0 },
            intensivists: { type: Number, default: 0 },
            other_specialists: { type: Number, default: 0 }
        }
    },
    shortage_alerts: [{
            resource_type: String,
            current_availability: Number,
            critical_threshold: Number,
            alert_level: { type: String, enum: ['low', 'medium', 'high', 'critical'] },
            message: String,
            flagged_at: Date
        }],
    redistribution_eligible: { type: Boolean, default: false },
    last_updated: { type: Date, default: Date.now },
    created_at: { type: Date, default: Date.now }
}, { timestamps: true });
ResourceInventorySchema.index({ state: 1, district: 1 });
ResourceInventorySchema.index({ 'shortage_alerts.alert_level': 1 });
exports.default = mongoose_1.default.model('ResourceInventory', ResourceInventorySchema);
