/**
 * ambulanceService.ts
 *
 * Core business logic for the Smart Ambulance Tracking & Dispatch System.
 * Covers:
 *   Fleet management   – CRUD ambulances/drivers
 *   GPS Service        – location ingestion, ETA math via OSRM
 *   Dispatch           – find nearest, validate, dispatch, reassign, cancel
 *   Trip lifecycle     – accept → arrive → transport → complete
 *   Analytics          – fleet utilization, response times
 *   Real-time          – emits socket events using existing emitQueueUpdate
 */

import mongoose from 'mongoose';
import Ambulance, { IAmbulance }           from '../models/Ambulance';
import AmbulanceDriver, { IAmbulanceDriver } from '../models/AmbulanceDriver';
import AmbulanceTrip, { IAmbulanceTrip }   from '../models/AmbulanceTrip';
import EmergencyDispatch, { IEmergencyDispatch } from '../models/EmergencyDispatch';
import { emitQueueUpdate } from '../utils/socket';

// ─── OSM Routing (OSRM public endpoint, no key required) ──────────────────────
const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving';

// Hospital base coords (Nagpur)
export const HOSPITAL_LAT = 21.1458;
export const HOSPITAL_LNG = 79.0882;
export const HOSPITAL_ADDRESS = 'ArogyaMitra Hospital, Nagpur';

/** Haversine distance in km */
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Fetch driving ETA from OSRM (public API — no key required) */
async function getOSRMEta(
    fromLat: number, fromLng: number,
    toLat:   number, toLng:   number,
): Promise<{ duration_min: number; distance_km: number }> {
    try {
        const url = `${OSRM_BASE}/${fromLng},${fromLat};${toLng},${toLat}?overview=false`;
        const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
        if (!res.ok) throw new Error('OSRM error');
        const data: any = await res.json();
        const route = data?.routes?.[0];
        return {
            duration_min: Math.ceil(route.duration / 60),
            distance_km:  Math.round(route.distance / 100) / 10,
        };
    } catch {
        // Fallback: 40 km/h average urban speed
        const d = haversineKm(fromLat, fromLng, toLat, toLng);
        return { duration_min: Math.ceil((d / 40) * 60), distance_km: Math.round(d * 10) / 10 };
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// FLEET MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

export async function createAmbulance(data: Partial<IAmbulance>): Promise<IAmbulance> {
    const ambulance = await Ambulance.create(data);
    emitSocketEvent('ambulance.fleet_update', { action: 'created', ambulanceId: ambulance._id });
    return ambulance;
}

export async function updateAmbulance(id: string, data: Partial<IAmbulance>): Promise<IAmbulance> {
    const ambulance = await Ambulance.findByIdAndUpdate(id, data, { new: true });
    if (!ambulance) throw new Error('Ambulance not found');
    emitSocketEvent('ambulance.fleet_update', { action: 'updated', ambulanceId: id });
    return ambulance;
}

export async function getFleet(): Promise<IAmbulance[]> {
    return Ambulance.find({ is_active: true })
        .populate('current_driver_id', 'name phone status')
        .sort({ status: 1, registration_number: 1 });
}

export async function getFleetSummary() {
    const fleet = await Ambulance.find({ is_active: true });
    return {
        total:         fleet.length,
        available:     fleet.filter(a => a.status === 'available').length,
        dispatched:    fleet.filter(a => ['dispatched','en_route_to_patient','transporting'].includes(a.status)).length,
        maintenance:   fleet.filter(a => a.status === 'maintenance').length,
        offline:       fleet.filter(a => a.status === 'offline').length,
        at_hospital:   fleet.filter(a => a.status === 'at_hospital').length,
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// DRIVER MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

export async function createDriver(data: Partial<IAmbulanceDriver>): Promise<IAmbulanceDriver> {
    const driver = await AmbulanceDriver.create(data);
    return driver;
}

export async function updateDriver(id: string, data: Partial<IAmbulanceDriver>): Promise<IAmbulanceDriver> {
    const driver = await AmbulanceDriver.findByIdAndUpdate(id, data, { new: true });
    if (!driver) throw new Error('Driver not found');
    return driver;
}

export async function getAvailableDrivers(): Promise<IAmbulanceDriver[]> {
    return AmbulanceDriver.find({ status: 'available', is_active: true })
        .populate('current_ambulance_id', 'registration_number vehicle_number');
}

export async function getAllDrivers(): Promise<IAmbulanceDriver[]> {
    return AmbulanceDriver.find({ is_active: true }).sort({ status: 1, name: 1 });
}

// ─────────────────────────────────────────────────────────────────────────────
// GPS SERVICE — real-time location ingestion
// ─────────────────────────────────────────────────────────────────────────────

export interface GPSUpdate {
    ambulanceId: string;
    latitude:    number;
    longitude:   number;
    speed:       number;
    heading:     number;
}

export async function updateGPS(update: GPSUpdate): Promise<void> {
    const { ambulanceId, latitude, longitude, speed, heading } = update;

    await Ambulance.findByIdAndUpdate(ambulanceId, {
        'current_location.latitude':   latitude,
        'current_location.longitude':  longitude,
        'current_location.speed':      speed,
        'current_location.heading':    heading,
        'current_location.updated_at': new Date(),
    });

    // Append to active trip's GPS trail (max 200 points — rolling window)
    const ambulance = await Ambulance.findById(ambulanceId);
    if (ambulance?.current_trip_id) {
        const trip = await AmbulanceTrip.findById(ambulance.current_trip_id);
        if (trip && !['completed', 'cancelled'].includes(trip.status)) {
            if (trip.gps_trail.length >= 200) trip.gps_trail.shift();
            trip.gps_trail.push({ latitude, longitude, speed, heading, recorded_at: new Date() });
            await trip.save();

            // Recalculate live ETA
            if (trip.status === 'en_route_to_patient') {
                const eta = await getOSRMEta(latitude, longitude, trip.pickup_location.latitude, trip.pickup_location.longitude);
                trip.eta_minutes_to_patient = eta.duration_min;
                trip.distance_km_to_patient = eta.distance_km;
                await trip.save();
                emitSocketEvent('ambulance.eta_update', {
                    tripId:           trip._id,
                    ambulanceId,
                    etaMinToPatient:  eta.duration_min,
                    distanceKmToPatient: eta.distance_km,
                });
            } else if (trip.status === 'transporting') {
                const eta = await getOSRMEta(latitude, longitude, trip.destination_location.latitude, trip.destination_location.longitude);
                trip.eta_minutes_to_hospital = eta.duration_min;
                trip.distance_km_to_hospital = eta.distance_km;
                await trip.save();
                emitSocketEvent('ambulance.eta_update', {
                    tripId: trip._id,
                    ambulanceId,
                    etaMinToHospital: eta.duration_min,
                    distanceKmToHospital: eta.distance_km,
                });
            }
        }
    }

    // Broadcast live location for map
    emitSocketEvent('ambulance.location', {
        ambulanceId,
        latitude,
        longitude,
        speed,
        heading,
        timestamp: new Date().toISOString(),
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// DISPATCH — find nearest + assign
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Find the geographically closest available ambulance to a pickup point.
 * Falls back to base location if ambulance has no current GPS.
 */
export async function findNearestAmbulance(pickupLat: number, pickupLng: number): Promise<IAmbulance | null> {
    const available = await Ambulance.find({ status: 'available', is_active: true })
        .populate('current_driver_id');

    if (available.length === 0) return null;

    let nearest: IAmbulance | null = null;
    let minDist = Infinity;

    for (const ambulance of available) {
        const lat = ambulance.current_location?.latitude  ?? ambulance.base_location.latitude;
        const lng = ambulance.current_location?.longitude ?? ambulance.base_location.longitude;
        const d = haversineKm(lat, lng, pickupLat, pickupLng);
        if (d < minDist) { minDist = d; nearest = ambulance; }
    }

    return nearest;
}

export interface DispatchRequest {
    pickupLat:       number;
    pickupLng:       number;
    pickupAddress:   string;
    destLat?:        number;
    destLng?:        number;
    destAddress?:    string;
    chiefComplaint:  string;
    callerName:      string;
    callerPhone:     string;
    priority?:       'critical' | 'high' | 'moderate' | 'low';
    patientId?:      string;
    ambulanceId?:    string;   // manual override
    driverId?:       string;   // manual override
    requestedBy?:    string;   // user ID
}

export async function dispatchAmbulance(req: DispatchRequest): Promise<IEmergencyDispatch> {
    const pickupLat  = req.pickupLat;
    const pickupLng  = req.pickupLng;
    const destLat    = req.destLat    ?? HOSPITAL_LAT;
    const destLng    = req.destLng    ?? HOSPITAL_LNG;
    const destAddress = req.destAddress ?? HOSPITAL_ADDRESS;

    // Determine ambulance
    let ambulance: IAmbulance | null;
    if (req.ambulanceId) {
        ambulance = await Ambulance.findById(req.ambulanceId);
        if (!ambulance || ambulance.status !== 'available') {
            throw new Error('Selected ambulance is not available');
        }
    } else {
        ambulance = await findNearestAmbulance(pickupLat, pickupLng);
        if (!ambulance) throw new Error('No ambulances available right now');
    }

    // Determine driver
    let driver: IAmbulanceDriver | null;
    if (req.driverId) {
        driver = await AmbulanceDriver.findById(req.driverId);
        if (!driver || driver.status !== 'available') {
            throw new Error('Selected driver is not available');
        }
    } else if (ambulance.current_driver_id) {
        driver = await AmbulanceDriver.findById(ambulance.current_driver_id);
    } else {
        driver = await AmbulanceDriver.findOne({ status: 'available', is_active: true });
    }

    if (!driver) throw new Error('No available driver found');

    // Create dispatch record
    const dispatch = await EmergencyDispatch.create({
        requested_by:  req.requestedBy ? new mongoose.Types.ObjectId(req.requestedBy) : undefined,
        patient_id:    req.patientId   ? new mongoose.Types.ObjectId(req.patientId)   : undefined,
        ambulance_id:  ambulance._id,
        driver_id:     driver._id,
        status:        'ambulance_assigned',
        priority:      req.priority ?? 'high',
        caller_name:   req.callerName,
        caller_phone:  req.callerPhone,
        chief_complaint: req.chiefComplaint,
        pickup_location:      { latitude: pickupLat, longitude: pickupLng, address: req.pickupAddress },
        destination_location: { latitude: destLat,   longitude: destLng,   address: destAddress },
        assigned_at:   new Date(),
    });

    // Get initial ETA
    const ambLat = ambulance.current_location?.latitude  ?? ambulance.base_location.latitude;
    const ambLng = ambulance.current_location?.longitude ?? ambulance.base_location.longitude;
    const etaToPatient  = await getOSRMEta(ambLat, ambLng, pickupLat, pickupLng);
    const etaToHospital = await getOSRMEta(pickupLat, pickupLng, destLat, destLng);

    // Create trip
    const trip = await AmbulanceTrip.create({
        dispatch_id:  dispatch._id,
        ambulance_id: ambulance._id,
        driver_id:    driver._id,
        patient_id:   req.patientId ? new mongoose.Types.ObjectId(req.patientId) : undefined,
        status:       'pending',
        pickup_location:      { latitude: pickupLat, longitude: pickupLng, address: req.pickupAddress },
        destination_location: { latitude: destLat,   longitude: destLng,   address: destAddress },
        dispatched_at: new Date(),
        eta_minutes_to_patient:  etaToPatient.duration_min,
        eta_minutes_to_hospital: etaToHospital.duration_min,
        distance_km_to_patient:  etaToPatient.distance_km,
        distance_km_to_hospital: etaToHospital.distance_km,
    });

    // Update dispatch with trip id
    dispatch.trip_id = trip._id as mongoose.Types.ObjectId;
    await dispatch.save();

    // Lock ambulance and driver
    await Ambulance.findByIdAndUpdate(ambulance._id, {
        status:            'dispatched',
        current_driver_id: driver._id,
        current_trip_id:   trip._id,
    });
    await AmbulanceDriver.findByIdAndUpdate(driver._id, {
        status:               'on_trip',
        current_ambulance_id: ambulance._id,
        current_trip_id:      trip._id,
    });

    emitSocketEvent('ambulance.dispatched', {
        dispatchId:    dispatch._id,
        tripId:        trip._id,
        ambulanceId:   ambulance._id,
        driverName:    driver.name,
        driverPhone:   driver.phone,
        registration:  ambulance.registration_number,
        etaMinToPatient: etaToPatient.duration_min,
        etaMinToHospital: etaToHospital.duration_min,
        pickupLat, pickupLng,
        destLat, destLng,
    });

    return dispatch;
}

// ─────────────────────────────────────────────────────────────────────────────
// TRIP LIFECYCLE — driver-driven status transitions
// ─────────────────────────────────────────────────────────────────────────────

export async function driverAcceptTrip(tripId: string): Promise<IAmbulanceTrip> {
    const trip = await AmbulanceTrip.findById(tripId);
    if (!trip) throw new Error('Trip not found');
    trip.status = 'driver_accepted';
    trip.driver_accepted_at = new Date();
    await trip.save();
    await Ambulance.findByIdAndUpdate(trip.ambulance_id, { status: 'en_route_to_patient' });
    emitSocketEvent('ambulance.trip_update', { tripId, status: trip.status });
    return trip;
}

export async function driverStartEnRoute(tripId: string): Promise<IAmbulanceTrip> {
    const trip = await AmbulanceTrip.findById(tripId);
    if (!trip) throw new Error('Trip not found');
    trip.status = 'en_route_to_patient';
    await trip.save();
    await Ambulance.findByIdAndUpdate(trip.ambulance_id, { status: 'en_route_to_patient' });
    emitSocketEvent('ambulance.trip_update', { tripId, status: trip.status });
    return trip;
}

export async function driverArrivedAtPatient(tripId: string): Promise<IAmbulanceTrip> {
    const trip = await AmbulanceTrip.findById(tripId);
    if (!trip) throw new Error('Trip not found');
    trip.status = 'arrived_at_patient';
    trip.arrived_at_patient_at = new Date();
    await trip.save();
    emitSocketEvent('ambulance.trip_update', { tripId, status: trip.status });
    return trip;
}

export async function driverStartTransport(tripId: string): Promise<IAmbulanceTrip> {
    const trip = await AmbulanceTrip.findById(tripId);
    if (!trip) throw new Error('Trip not found');
    trip.status = 'transporting';
    trip.trip_started_at = new Date();
    await trip.save();
    await Ambulance.findByIdAndUpdate(trip.ambulance_id, { status: 'transporting' });
    emitSocketEvent('ambulance.trip_update', { tripId, status: trip.status });
    return trip;
}

export async function driverArrivedAtHospital(tripId: string): Promise<IAmbulanceTrip> {
    const trip = await AmbulanceTrip.findById(tripId);
    if (!trip) throw new Error('Trip not found');
    trip.status = 'arrived_at_hospital';
    trip.arrived_at_hospital_at = new Date();
    await trip.save();
    await Ambulance.findByIdAndUpdate(trip.ambulance_id, { status: 'at_hospital' });
    emitSocketEvent('ambulance.trip_update', { tripId, status: trip.status });
    return trip;
}

export async function completeTrip(tripId: string): Promise<IAmbulanceTrip> {
    const trip = await AmbulanceTrip.findById(tripId);
    if (!trip) throw new Error('Trip not found');

    trip.status = 'completed';
    trip.completed_at = new Date();

    // Compute actual total distance from GPS trail
    if (trip.gps_trail.length > 1) {
        let totalKm = 0;
        for (let i = 1; i < trip.gps_trail.length; i++) {
            const a = trip.gps_trail[i - 1];
            const b = trip.gps_trail[i];
            totalKm += haversineKm(a.latitude, a.longitude, b.latitude, b.longitude);
        }
        trip.total_distance_km = Math.round(totalKm * 10) / 10;
    }

    await trip.save();

    // Update dispatch
    if (trip.dispatch_id) {
        await EmergencyDispatch.findByIdAndUpdate(trip.dispatch_id, { status: 'completed', completed_at: new Date() });
    }

    // Free ambulance and driver
    await Ambulance.findByIdAndUpdate(trip.ambulance_id, {
        status: 'available',
        current_trip_id: null,
        $inc: { odometer_km: trip.total_distance_km },
    });
    await AmbulanceDriver.findByIdAndUpdate(trip.driver_id, {
        status: 'available',
        current_trip_id: null,
        $inc: { total_trips: 1 },
    });

    emitSocketEvent('ambulance.trip_update', { tripId, status: 'completed' });
    return trip;
}

export async function cancelTrip(tripId: string, reason: string): Promise<IAmbulanceTrip> {
    const trip = await AmbulanceTrip.findById(tripId);
    if (!trip) throw new Error('Trip not found');

    trip.status = 'cancelled';
    trip.cancelled_at = new Date();
    trip.cancellation_reason = reason;
    await trip.save();

    if (trip.dispatch_id) {
        await EmergencyDispatch.findByIdAndUpdate(trip.dispatch_id, {
            status: 'cancelled', cancelled_at: new Date(), cancel_reason: reason,
        });
    }

    await Ambulance.findByIdAndUpdate(trip.ambulance_id, { status: 'available', current_trip_id: null });
    await AmbulanceDriver.findByIdAndUpdate(trip.driver_id, { status: 'available', current_trip_id: null });

    emitSocketEvent('ambulance.trip_update', { tripId, status: 'cancelled', reason });
    return trip;
}

export async function reassignDispatch(dispatchId: string, newAmbulanceId: string, newDriverId: string): Promise<IEmergencyDispatch> {
    const dispatch = await EmergencyDispatch.findById(dispatchId).populate('trip_id');
    if (!dispatch) throw new Error('Dispatch not found');

    // Cancel old trip
    if (dispatch.trip_id) {
        await cancelTrip((dispatch.trip_id as any)._id.toString(), 'Reassigned');
    }

    // Re-dispatch with overrides
    const newDispatch = await dispatchAmbulance({
        pickupLat:      dispatch.pickup_location.latitude,
        pickupLng:      dispatch.pickup_location.longitude,
        pickupAddress:  dispatch.pickup_location.address,
        destLat:        dispatch.destination_location.latitude,
        destLng:        dispatch.destination_location.longitude,
        destAddress:    dispatch.destination_location.address,
        chiefComplaint: dispatch.chief_complaint,
        callerName:     dispatch.caller_name,
        callerPhone:    dispatch.caller_phone,
        priority:       dispatch.priority,
        ambulanceId:    newAmbulanceId,
        driverId:       newDriverId,
        patientId:      dispatch.patient_id?.toString(),
        requestedBy:    dispatch.requested_by?.toString(),
    });

    return newDispatch;
}

// ─────────────────────────────────────────────────────────────────────────────
// QUERIES
// ─────────────────────────────────────────────────────────────────────────────

export async function getActiveDispatches(): Promise<IEmergencyDispatch[]> {
    return EmergencyDispatch.find({ status: { $in: ['pending','ambulance_assigned','in_progress'] } })
        .populate('ambulance_id', 'registration_number vehicle_number current_location status')
        .populate('driver_id', 'name phone')
        .populate('patient_id', 'name phone age')
        .sort({ priority: 1, createdAt: -1 });
}

export async function getTripById(tripId: string): Promise<IAmbulanceTrip | null> {
    return AmbulanceTrip.findById(tripId)
        .populate('ambulance_id', 'registration_number vehicle_number current_location')
        .populate('driver_id', 'name phone')
        .populate('patient_id', 'name phone');
}

export async function getActiveTripForPatient(patientId: string): Promise<IAmbulanceTrip | null> {
    return AmbulanceTrip.findOne({
        patient_id: new mongoose.Types.ObjectId(patientId),
        status: { $nin: ['completed', 'cancelled'] },
    })
        .populate('ambulance_id', 'registration_number vehicle_number current_location')
        .populate('driver_id', 'name phone');
}

export async function getRecentDispatches(limit = 50): Promise<IEmergencyDispatch[]> {
    return EmergencyDispatch.find({})
        .populate('ambulance_id', 'registration_number')
        .populate('driver_id', 'name phone')
        .populate('patient_id', 'name')
        .sort({ createdAt: -1 })
        .limit(limit);
}

export async function getDriverCurrentTrip(driverId: string): Promise<IAmbulanceTrip | null> {
    const driver = await AmbulanceDriver.findById(driverId);
    if (!driver?.current_trip_id) return null;
    return getTripById(driver.current_trip_id.toString());
}

// ─────────────────────────────────────────────────────────────────────────────
// ANALYTICS
// ─────────────────────────────────────────────────────────────────────────────

export async function getAnalytics(): Promise<Record<string, any>> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [total, todayCount, completed, cancelled] = await Promise.all([
        AmbulanceTrip.countDocuments({}),
        AmbulanceTrip.countDocuments({ createdAt: { $gte: today } }),
        AmbulanceTrip.countDocuments({ status: 'completed' }),
        AmbulanceTrip.countDocuments({ status: 'cancelled' }),
    ]);

    const responseTimeAgg = await AmbulanceTrip.aggregate([
        { $match: { status: 'completed', dispatched_at: { $exists: true }, arrived_at_patient_at: { $exists: true } } },
        {
            $project: {
                response_min: {
                    $divide: [
                        { $subtract: ['$arrived_at_patient_at', '$dispatched_at'] },
                        60000,
                    ],
                },
            },
        },
        { $group: { _id: null, avg: { $avg: '$response_min' } } },
    ]);

    const tripTimeAgg = await AmbulanceTrip.aggregate([
        { $match: { status: 'completed', trip_started_at: { $exists: true }, completed_at: { $exists: true } } },
        {
            $project: {
                trip_min: { $divide: [{ $subtract: ['$completed_at', '$trip_started_at'] }, 60000] },
            },
        },
        { $group: { _id: null, avg: { $avg: '$trip_min' } } },
    ]);

    const fleet = await getFleetSummary();

    return {
        total_trips:           total,
        trips_today:           todayCount,
        completed_trips:       completed,
        cancelled_trips:       cancelled,
        success_rate:          total > 0 ? Math.round((completed / total) * 100) : 0,
        avg_response_min:      Math.round(responseTimeAgg[0]?.avg ?? 0),
        avg_trip_min:          Math.round(tripTimeAgg[0]?.avg ?? 0),
        fleet_utilization_pct: fleet.total > 0
            ? Math.round(((fleet.dispatched + fleet.at_hospital) / fleet.total) * 100)
            : 0,
        fleet,
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Socket helper
// ─────────────────────────────────────────────────────────────────────────────

function emitSocketEvent(event: string, data: any) {
    emitQueueUpdate(event, data);
}
