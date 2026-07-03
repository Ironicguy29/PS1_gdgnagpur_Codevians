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
const DispensingSchema = new mongoose_1.Schema({
    prescription_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Prescription', required: true },
    patient_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Patient', required: true },
    pharmacist_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    dispensed_items: [{
            medicine_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Medicine', required: true },
            batch_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Batch', required: true },
            quantity_requested: { type: Number, required: true },
            quantity_dispensed: { type: Number, required: true },
            unit_price: { type: Number, required: true },
            gst_rate: { type: Number, default: 12 }
        }],
    dispensed_date: { type: Date, default: Date.now },
    invoice_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Invoice' },
    status: { type: String, enum: ['Completed', 'Partially_Dispensed', 'Cancelled'], default: 'Completed' }
}, { timestamps: true });
exports.default = mongoose_1.default.model('Dispensing', DispensingSchema);
