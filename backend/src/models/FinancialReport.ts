import mongoose, { Schema, Document } from 'mongoose';

export interface IFinancialReport extends Document {
    report_type: 'Daily' | 'Weekly' | 'Monthly';
    start_date: Date;
    end_date: Date;
    total_revenue: number;
    online_revenue: number;
    offline_revenue: number;
    total_claims: number;
    total_refunds: number;
    claims_approved: number;
    department_breakdown: Schema.Types.Map;
    generated_at: Date;
}

const FinancialReportSchema: Schema = new Schema({
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

export default mongoose.model<IFinancialReport>('FinancialReport', FinancialReportSchema);

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
