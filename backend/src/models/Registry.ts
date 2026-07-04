import mongoose, { Schema, Document } from 'mongoose';

export interface IRegistry extends Document {
    entity_type: 'hospital' | 'doctor';
    entity_id: string;
    name: string;
    registration_number: string;
    state: string;
    license_number: string;
    license_expiry: Date;
    accreditation_status: 'active' | 'expired' | 'suspended' | 'cancelled';
    accreditation_bodies: string[];
    last_audit_date: Date;
    audit_findings: {
        date: Date;
        status: 'compliant' | 'non-compliant' | 'partially-compliant';
        issues: string[];
        resolution_status: 'resolved' | 'pending' | 'critical';
    }[];
    compliance_score: number;
    verified_at: Date;
    credentials: {
        qualification: string;
        specialization?: string;
        experience_years?: number;
    }[];
    contact_info: {
        email: string;
        phone: string;
        address: string;
    };
    flags: {
        flagged: boolean;
        flag_reason?: string;
        flag_date?: Date;
        severity: 'low' | 'medium' | 'high' | 'critical';
    };
    created_at: Date;
    updated_at: Date;
}

const RegistrySchema: Schema = new Schema({
    entity_type: { type: String, enum: ['hospital', 'doctor'], required: true },
    entity_id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    registration_number: { type: String, required: true },
    state: { type: String, required: true },
    license_number: { type: String, required: true },
    license_expiry: { type: Date, required: true },
    accreditation_status: { 
        type: String, 
        enum: ['active', 'expired', 'suspended', 'cancelled'],
        default: 'active'
    },
    accreditation_bodies: [{ type: String }],
    last_audit_date: Date,
    audit_findings: [{
        date: Date,
        status: { type: String, enum: ['compliant', 'non-compliant', 'partially-compliant'] },
        issues: [String],
        resolution_status: { type: String, enum: ['resolved', 'pending', 'critical'] }
    }],
    compliance_score: { type: Number, default: 100 },
    verified_at: { type: Date, default: Date.now },
    credentials: [{
        qualification: String,
        specialization: String,
        experience_years: Number
    }],
    contact_info: {
        email: String,
        phone: String,
        address: String
    },
    flags: {
        flagged: { type: Boolean, default: false },
        flag_reason: String,
        flag_date: Date,
        severity: { type: String, enum: ['low', 'medium', 'high', 'critical'] }
    },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
}, { timestamps: true });

RegistrySchema.index({ entity_type: 1, state: 1 });
RegistrySchema.index({ accreditation_status: 1 });
RegistrySchema.index({ 'flags.flagged': 1 });

export default mongoose.model<IRegistry>('Registry', RegistrySchema);

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
