import mongoose, { Schema, Document } from 'mongoose';

export type DriverStatus = 'available' | 'on_trip' | 'off_duty' | 'on_break';

export interface IAmbulanceDriver extends Document {
    user_id?:      mongoose.Types.ObjectId;   // links to existing User model
    name:          string;
    phone:         string;
    license_number: string;
    license_expiry: Date;
    status:        DriverStatus;
    current_ambulance_id?: mongoose.Types.ObjectId;
    current_trip_id?:      mongoose.Types.ObjectId;
    total_trips:   number;
    avg_rating:    number;
    is_active:     boolean;
    address:       string;
    emergency_contact: {
        name:  string;
        phone: string;
    };
    profile_photo?: string;
    notes:         string;
    createdAt: Date;
    updatedAt: Date;
}

const AmbulanceDriverSchema: Schema = new Schema({
    user_id:        { type: Schema.Types.ObjectId, ref: 'User' },
    name:           { type: String, required: true, trim: true },
    phone:          { type: String, required: true, trim: true },
    license_number: { type: String, required: true, unique: true, uppercase: true, trim: true },
    license_expiry: { type: Date, required: true },
    status:         { type: String, enum: ['available','on_trip','off_duty','on_break'], default: 'available' },
    current_ambulance_id: { type: Schema.Types.ObjectId, ref: 'Ambulance' },
    current_trip_id:      { type: Schema.Types.ObjectId, ref: 'AmbulanceTrip' },
    total_trips:    { type: Number, default: 0 },
    avg_rating:     { type: Number, default: 5.0, min: 0, max: 5 },
    is_active:      { type: Boolean, default: true },
    address:        { type: String, default: '' },
    emergency_contact: {
        name:  { type: String, default: '' },
        phone: { type: String, default: '' },
    },
    profile_photo: { type: String },
    notes:         { type: String, default: '' },
}, { timestamps: true });

AmbulanceDriverSchema.index({ status: 1 });

export default mongoose.model<IAmbulanceDriver>('AmbulanceDriver', AmbulanceDriverSchema);

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
