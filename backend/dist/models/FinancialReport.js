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
const FinancialReportSchema = new mongoose_1.Schema({
    report_type: { type: String, enum: ['Daily', 'Weekly', 'Monthly'], required: true },
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
    total_revenue: { type: Number, required: true, default: 0 },
    online_revenue: { type: Number, required: true, default: 0 },
    offline_revenue: { type: Number, required: true, default: 0 },
    total_claims: { type: Number, required: true, default: 0 },
    total_refunds: { type: Number, required: true, default: 0 },
    claims_approved: { type: Number, required: true, default: 0 },
    department_breakdown: { type: Map, of: Number, default: {} },
    generated_at: { type: Date, default: Date.now }
}, { timestamps: true });
exports.default = mongoose_1.default.model('FinancialReport', FinancialReportSchema);
