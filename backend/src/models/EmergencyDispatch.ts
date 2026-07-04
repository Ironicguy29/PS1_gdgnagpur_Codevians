import mongoose, { Schema, Document } from 'mongoose';

export type DispatchStatus = 'pending' | 'ambulance_assigned' | 'in_progress' | 'completed' | 'cancelled';
export type DispatchPriority = 'critical' | 'high' | 'moderate' | 'low';

export interface IEmergencyDispatch extends Document {
    // Who requested
    requested_by?:  mongoose.Types.ObjectId;   // User (admin/reception)
    patient_id?:    mongoose.Types.ObjectId;   // Patient model
    emergency_id?:  mongoose.Types.ObjectId;   // EmergencyQueue

    // What was assigned
    ambulance_id?:  mongoose.Types.ObjectId;
    driver_id?:     mongoose.Types.ObjectId;
    trip_id?:       mongoose.Types.ObjectId;

    status:     DispatchStatus;
    priority:   DispatchPriority;

    caller_name:    string;
    caller_phone:   string;
    chief_complaint: string;

    pickup_location: {
        latitude:  number;
        longitude: number;
        address:   string;
    };
    destination_location: {
        latitude:  number;
        longitude: number;
        address:   string;
    };

    // Audit trail
    assigned_at?:   Date;
    completed_at?:  Date;
    cancelled_at?:  Date;
    cancel_reason?: string;

    notes: string;
    createdAt: Date;
    updatedAt: Date;
}

const EmergencyDispatchSchema: Schema = new Schema({
    requested_by: { type: Schema.Types.ObjectId, ref: 'User' },
    patient_id:   { type: Schema.Types.ObjectId, ref: 'Patient' },
    emergency_id: { type: Schema.Types.ObjectId, ref: 'EmergencyQueue' },

    ambulance_id: { type: Schema.Types.ObjectId, ref: 'Ambulance' },
    driver_id:    { type: Schema.Types.ObjectId, ref: 'AmbulanceDriver' },
    trip_id:      { type: Schema.Types.ObjectId, ref: 'AmbulanceTrip' },

    status: {
        type: String,
        enum: ['pending','ambulance_assigned','in_progress','completed','cancelled'],
        default: 'pending',
    },
    priority: {
        type: String,
        enum: ['critical','high','moderate','low'],
        default: 'high',
    },

    caller_name:     { type: String, default: '' },
    caller_phone:    { type: String, default: '' },
    chief_complaint: { type: String, required: true },

    pickup_location: {
        latitude:  { type: Number, required: true },
        longitude: { type: Number, required: true },
        address:   { type: String, default: '' },
    },
    destination_location: {
        latitude:  { type: Number, default: 21.1458 },
        longitude: { type: Number, default: 79.0882 },
        address:   { type: String, default: 'ArogyaMitra Hospital, Nagpur' },
    },

    assigned_at:   { type: Date },
    completed_at:  { type: Date },
    cancelled_at:  { type: Date },
    cancel_reason: { type: String },

    notes: { type: String, default: '' },
}, { timestamps: true });

EmergencyDispatchSchema.index({ status: 1, priority: 1, createdAt: -1 });
EmergencyDispatchSchema.index({ ambulance_id: 1 });

export default mongoose.model<IEmergencyDispatch>('EmergencyDispatch', EmergencyDispatchSchema);

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
