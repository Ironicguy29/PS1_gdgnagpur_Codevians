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
const SampleSchema = new mongoose_1.Schema({
    sample_id: { type: String, unique: true },
    barcode: { type: String, unique: true },
    patient_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Patient', required: true },
    lab_order_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'LabOrder', required: true },
    test_names: [{ type: String, required: true }],
    sample_type: { type: String, required: true },
    status: {
        type: String,
        enum: ['Ordered', 'Collected', 'In Transit', 'Received', 'Processing', 'Completed', 'Rejected'],
        default: 'Ordered'
    },
    collected_by: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    collected_by_name: { type: String },
    collection_time: { type: Date },
    received_time: { type: Date },
    rejection_reason: { type: String }
}, { timestamps: true });
// Auto-generate barcode/sample_id
SampleSchema.pre('save', function () {
    return __awaiter(this, void 0, void 0, function* () {
        const doc = this;
        if (!doc.sample_id) {
            const counter = yield Counter_1.default.findOneAndUpdate({ name: 'sample_id' }, { $inc: { seq: 1 } }, { new: true, upsert: true });
            const seqStr = String(counter.seq).padStart(6, '0');
            doc.sample_id = `SMP-${seqStr}`;
        }
        if (!doc.barcode) {
            // Create a structured barcode string
            doc.barcode = `BAR-${doc.patient_id}-${doc.lab_order_id}-${doc.sample_id}`;
        }
    });
});
exports.default = mongoose_1.default.model('Sample', SampleSchema);
