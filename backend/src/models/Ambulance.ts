import mongoose, { Schema, Document } from 'mongoose';

export type AmbulanceStatus = 'available' | 'dispatched' | 'en_route_to_patient' | 'transporting' | 'at_hospital' | 'maintenance' | 'offline';
export type AmbulanceType   = 'basic' | 'advanced' | 'neonatal' | 'bariatric' | 'air';

export interface IAmbulance extends Document {
    registration_number: string;
    vehicle_number:      string;
    type:                AmbulanceType;
    status:              AmbulanceStatus;
    current_driver_id?:  mongoose.Types.ObjectId;
    current_trip_id?:    mongoose.Types.ObjectId;
    current_location?: {
        latitude:  number;
        longitude: number;
        speed:     number;
        heading:   number;
        updated_at: Date;
    };
    features:         string[];       // ['oxygen', 'defibrillator', 'ventilator']
    capacity:         number;
    fuel_level:       number;         // 0–100
    odometer_km:      number;
    last_maintenance: Date;
    next_maintenance: Date;
    is_active:        boolean;
    base_location: {
        latitude:  number;
        longitude: number;
        address:   string;
    };
    notes: string;
    createdAt: Date;
    updatedAt: Date;
}

const AmbulanceSchema: Schema = new Schema({
    registration_number: { type: String, required: true, unique: true, uppercase: true, trim: true },
    vehicle_number:      { type: String, required: true, uppercase: true, trim: true },
    type:    { type: String, enum: ['basic','advanced','neonatal','bariatric','air'], default: 'basic' },
    status:  { type: String, enum: ['available','dispatched','en_route_to_patient','transporting','at_hospital','maintenance','offline'], default: 'available' },
    current_driver_id: { type: Schema.Types.ObjectId, ref: 'AmbulanceDriver' },
    current_trip_id:   { type: Schema.Types.ObjectId, ref: 'AmbulanceTrip' },
    current_location: {
        latitude:   { type: Number },
        longitude:  { type: Number },
        speed:      { type: Number, default: 0 },
        heading:    { type: Number, default: 0 },
        updated_at: { type: Date, default: Date.now },
    },
    features:         { type: [String], default: [] },
    capacity:         { type: Number, default: 2 },
    fuel_level:       { type: Number, default: 100, min: 0, max: 100 },
    odometer_km:      { type: Number, default: 0 },
    last_maintenance: { type: Date, default: Date.now },
    next_maintenance: { type: Date },
    is_active:        { type: Boolean, default: true },
    base_location: {
        latitude:  { type: Number, default: 21.1458 },
        longitude: { type: Number, default: 79.0882 },
        address:   { type: String, default: 'ArogyaMitra Hospital, Nagpur' },
    },
    notes: { type: String, default: '' },
}, { timestamps: true });

AmbulanceSchema.index({ status: 1 });
AmbulanceSchema.index({ 'current_location.latitude': 1, 'current_location.longitude': 1 });

export default mongoose.model<IAmbulance>('Ambulance', AmbulanceSchema);

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
