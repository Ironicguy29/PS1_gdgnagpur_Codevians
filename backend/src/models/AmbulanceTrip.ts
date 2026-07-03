import mongoose, { Schema, Document } from 'mongoose';

export type TripStatus =
    | 'pending'
    | 'driver_accepted'
    | 'en_route_to_patient'
    | 'arrived_at_patient'
    | 'transporting'
    | 'arrived_at_hospital'
    | 'completed'
    | 'cancelled';

export interface LatLng {
    latitude:  number;
    longitude: number;
}

export interface IAmbulanceTrip extends Document {
    dispatch_id?:   mongoose.Types.ObjectId;
    ambulance_id:   mongoose.Types.ObjectId;
    driver_id:      mongoose.Types.ObjectId;
    patient_id?:    mongoose.Types.ObjectId;   // existing Patient model
    emergency_id?:  mongoose.Types.ObjectId;   // existing EmergencyQueue

    status: TripStatus;

    pickup_location: LatLng & { address: string };
    destination_location: LatLng & { address: string };

    // Live tracking snapshots (kept compact — only every ~30s)
    gps_trail: Array<{
        latitude:  number;
        longitude: number;
        speed:     number;
        heading:   number;
        recorded_at: Date;
    }>;

    // Milestones
    dispatched_at?:         Date;
    driver_accepted_at?:    Date;
    arrived_at_patient_at?: Date;
    trip_started_at?:       Date;
    arrived_at_hospital_at?: Date;
    completed_at?:           Date;
    cancelled_at?:           Date;

    // ETA & metrics
    eta_minutes_to_patient:   number;
    eta_minutes_to_hospital:  number;
    distance_km_to_patient:   number;
    distance_km_to_hospital:  number;
    total_distance_km:        number;

    cancellation_reason?: string;
    notes:                string;
    rating?:              number;  // patient rating 1-5

    createdAt: Date;
    updatedAt: Date;
}

const LatLngSchema = {
    latitude:  { type: Number, required: true },
    longitude: { type: Number, required: true },
    address:   { type: String, default: '' },
};

const AmbulanceTripSchema: Schema = new Schema({
    dispatch_id:  { type: Schema.Types.ObjectId, ref: 'EmergencyDispatch' },
    ambulance_id: { type: Schema.Types.ObjectId, ref: 'Ambulance', required: true },
    driver_id:    { type: Schema.Types.ObjectId, ref: 'AmbulanceDriver', required: true },
    patient_id:   { type: Schema.Types.ObjectId, ref: 'Patient' },
    emergency_id: { type: Schema.Types.ObjectId, ref: 'EmergencyQueue' },

    status: {
        type: String,
        enum: ['pending','driver_accepted','en_route_to_patient','arrived_at_patient','transporting','arrived_at_hospital','completed','cancelled'],
        default: 'pending',
    },

    pickup_location:      { ...LatLngSchema },
    destination_location: { ...LatLngSchema },

    gps_trail: [{
        latitude:    { type: Number },
        longitude:   { type: Number },
        speed:       { type: Number, default: 0 },
        heading:     { type: Number, default: 0 },
        recorded_at: { type: Date, default: Date.now },
    }],

    dispatched_at:           { type: Date },
    driver_accepted_at:      { type: Date },
    arrived_at_patient_at:   { type: Date },
    trip_started_at:         { type: Date },
    arrived_at_hospital_at:  { type: Date },
    completed_at:            { type: Date },
    cancelled_at:            { type: Date },

    eta_minutes_to_patient:  { type: Number, default: 0 },
    eta_minutes_to_hospital: { type: Number, default: 0 },
    distance_km_to_patient:  { type: Number, default: 0 },
    distance_km_to_hospital: { type: Number, default: 0 },
    total_distance_km:       { type: Number, default: 0 },

    cancellation_reason: { type: String },
    notes:               { type: String, default: '' },
    rating:              { type: Number, min: 1, max: 5 },
}, { timestamps: true });

AmbulanceTripSchema.index({ status: 1, createdAt: -1 });
AmbulanceTripSchema.index({ ambulance_id: 1 });
AmbulanceTripSchema.index({ patient_id: 1 });

export default mongoose.model<IAmbulanceTrip>('AmbulanceTrip', AmbulanceTripSchema);
