"use strict";
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
exports.HOSPITAL_ADDRESS = exports.HOSPITAL_LNG = exports.HOSPITAL_LAT = void 0;
exports.createAmbulance = createAmbulance;
exports.updateAmbulance = updateAmbulance;
exports.getFleet = getFleet;
exports.getFleetSummary = getFleetSummary;
exports.createDriver = createDriver;
exports.updateDriver = updateDriver;
exports.getAvailableDrivers = getAvailableDrivers;
exports.getAllDrivers = getAllDrivers;
exports.updateGPS = updateGPS;
exports.findNearestAmbulance = findNearestAmbulance;
exports.dispatchAmbulance = dispatchAmbulance;
exports.driverAcceptTrip = driverAcceptTrip;
exports.driverStartEnRoute = driverStartEnRoute;
exports.driverArrivedAtPatient = driverArrivedAtPatient;
exports.driverStartTransport = driverStartTransport;
exports.driverArrivedAtHospital = driverArrivedAtHospital;
exports.completeTrip = completeTrip;
exports.cancelTrip = cancelTrip;
exports.reassignDispatch = reassignDispatch;
exports.getActiveDispatches = getActiveDispatches;
exports.getTripById = getTripById;
exports.getActiveTripForPatient = getActiveTripForPatient;
exports.getRecentDispatches = getRecentDispatches;
exports.getDriverCurrentTrip = getDriverCurrentTrip;
exports.getAnalytics = getAnalytics;
const mongoose_1 = __importDefault(require("mongoose"));
const Ambulance_1 = __importDefault(require("../models/Ambulance"));
const AmbulanceDriver_1 = __importDefault(require("../models/AmbulanceDriver"));
const AmbulanceTrip_1 = __importDefault(require("../models/AmbulanceTrip"));
const EmergencyDispatch_1 = __importDefault(require("../models/EmergencyDispatch"));
const socket_1 = require("../utils/socket");
// ─── OSM Routing (OSRM public endpoint, no key required) ──────────────────────
const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving';
// Hospital base coords (Nagpur)
exports.HOSPITAL_LAT = 21.1458;
exports.HOSPITAL_LNG = 79.0882;
exports.HOSPITAL_ADDRESS = 'ArogyaMitra Hospital, Nagpur';
/** Haversine distance in km */
function haversineKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
/** Fetch driving ETA from OSRM (public API — no key required) */
function getOSRMEta(fromLat, fromLng, toLat, toLng) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const url = `${OSRM_BASE}/${fromLng},${fromLat};${toLng},${toLat}?overview=false`;
            const res = yield fetch(url, { signal: AbortSignal.timeout(4000) });
            if (!res.ok)
                throw new Error('OSRM error');
            const data = yield res.json();
            const route = (_a = data === null || data === void 0 ? void 0 : data.routes) === null || _a === void 0 ? void 0 : _a[0];
            return {
                duration_min: Math.ceil(route.duration / 60),
                distance_km: Math.round(route.distance / 100) / 10,
            };
        }
        catch (_b) {
            // Fallback: 40 km/h average urban speed
            const d = haversineKm(fromLat, fromLng, toLat, toLng);
            return { duration_min: Math.ceil((d / 40) * 60), distance_km: Math.round(d * 10) / 10 };
        }
    });
}
// ─────────────────────────────────────────────────────────────────────────────
// FLEET MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────
function createAmbulance(data) {
    return __awaiter(this, void 0, void 0, function* () {
        const ambulance = yield Ambulance_1.default.create(data);
        emitSocketEvent('ambulance.fleet_update', { action: 'created', ambulanceId: ambulance._id });
        return ambulance;
    });
}
function updateAmbulance(id, data) {
    return __awaiter(this, void 0, void 0, function* () {
        const ambulance = yield Ambulance_1.default.findByIdAndUpdate(id, data, { new: true });
        if (!ambulance)
            throw new Error('Ambulance not found');
        emitSocketEvent('ambulance.fleet_update', { action: 'updated', ambulanceId: id });
        return ambulance;
    });
}
function getFleet() {
    return __awaiter(this, void 0, void 0, function* () {
        return Ambulance_1.default.find({ is_active: true })
            .populate('current_driver_id', 'name phone status')
            .sort({ status: 1, registration_number: 1 });
    });
}
function getFleetSummary() {
    return __awaiter(this, void 0, void 0, function* () {
        const fleet = yield Ambulance_1.default.find({ is_active: true });
        return {
            total: fleet.length,
            available: fleet.filter(a => a.status === 'available').length,
            dispatched: fleet.filter(a => ['dispatched', 'en_route_to_patient', 'transporting'].includes(a.status)).length,
            maintenance: fleet.filter(a => a.status === 'maintenance').length,
            offline: fleet.filter(a => a.status === 'offline').length,
            at_hospital: fleet.filter(a => a.status === 'at_hospital').length,
        };
    });
}
// ─────────────────────────────────────────────────────────────────────────────
// DRIVER MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────
function createDriver(data) {
    return __awaiter(this, void 0, void 0, function* () {
        const driver = yield AmbulanceDriver_1.default.create(data);
        return driver;
    });
}
function updateDriver(id, data) {
    return __awaiter(this, void 0, void 0, function* () {
        const driver = yield AmbulanceDriver_1.default.findByIdAndUpdate(id, data, { new: true });
        if (!driver)
            throw new Error('Driver not found');
        return driver;
    });
}
function getAvailableDrivers() {
    return __awaiter(this, void 0, void 0, function* () {
        return AmbulanceDriver_1.default.find({ status: 'available', is_active: true })
            .populate('current_ambulance_id', 'registration_number vehicle_number');
    });
}
function getAllDrivers() {
    return __awaiter(this, void 0, void 0, function* () {
        return AmbulanceDriver_1.default.find({ is_active: true }).sort({ status: 1, name: 1 });
    });
}
function updateGPS(update) {
    return __awaiter(this, void 0, void 0, function* () {
        const { ambulanceId, latitude, longitude, speed, heading } = update;
        yield Ambulance_1.default.findByIdAndUpdate(ambulanceId, {
            'current_location.latitude': latitude,
            'current_location.longitude': longitude,
            'current_location.speed': speed,
            'current_location.heading': heading,
            'current_location.updated_at': new Date(),
        });
        // Append to active trip's GPS trail (max 200 points — rolling window)
        const ambulance = yield Ambulance_1.default.findById(ambulanceId);
        if (ambulance === null || ambulance === void 0 ? void 0 : ambulance.current_trip_id) {
            const trip = yield AmbulanceTrip_1.default.findById(ambulance.current_trip_id);
            if (trip && !['completed', 'cancelled'].includes(trip.status)) {
                if (trip.gps_trail.length >= 200)
                    trip.gps_trail.shift();
                trip.gps_trail.push({ latitude, longitude, speed, heading, recorded_at: new Date() });
                yield trip.save();
                // Recalculate live ETA
                if (trip.status === 'en_route_to_patient') {
                    const eta = yield getOSRMEta(latitude, longitude, trip.pickup_location.latitude, trip.pickup_location.longitude);
                    trip.eta_minutes_to_patient = eta.duration_min;
                    trip.distance_km_to_patient = eta.distance_km;
                    yield trip.save();
                    emitSocketEvent('ambulance.eta_update', {
                        tripId: trip._id,
                        ambulanceId,
                        etaMinToPatient: eta.duration_min,
                        distanceKmToPatient: eta.distance_km,
                    });
                }
                else if (trip.status === 'transporting') {
                    const eta = yield getOSRMEta(latitude, longitude, trip.destination_location.latitude, trip.destination_location.longitude);
                    trip.eta_minutes_to_hospital = eta.duration_min;
                    trip.distance_km_to_hospital = eta.distance_km;
                    yield trip.save();
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
    });
}
// ─────────────────────────────────────────────────────────────────────────────
// DISPATCH — find nearest + assign
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Find the geographically closest available ambulance to a pickup point.
 * Falls back to base location if ambulance has no current GPS.
 */
function findNearestAmbulance(pickupLat, pickupLng) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        const available = yield Ambulance_1.default.find({ status: 'available', is_active: true })
            .populate('current_driver_id');
        if (available.length === 0)
            return null;
        let nearest = null;
        let minDist = Infinity;
        for (const ambulance of available) {
            const lat = (_b = (_a = ambulance.current_location) === null || _a === void 0 ? void 0 : _a.latitude) !== null && _b !== void 0 ? _b : ambulance.base_location.latitude;
            const lng = (_d = (_c = ambulance.current_location) === null || _c === void 0 ? void 0 : _c.longitude) !== null && _d !== void 0 ? _d : ambulance.base_location.longitude;
            const d = haversineKm(lat, lng, pickupLat, pickupLng);
            if (d < minDist) {
                minDist = d;
                nearest = ambulance;
            }
        }
        return nearest;
    });
}
function dispatchAmbulance(req) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        const pickupLat = req.pickupLat;
        const pickupLng = req.pickupLng;
        const destLat = (_a = req.destLat) !== null && _a !== void 0 ? _a : exports.HOSPITAL_LAT;
        const destLng = (_b = req.destLng) !== null && _b !== void 0 ? _b : exports.HOSPITAL_LNG;
        const destAddress = (_c = req.destAddress) !== null && _c !== void 0 ? _c : exports.HOSPITAL_ADDRESS;
        // Determine ambulance
        let ambulance;
        if (req.ambulanceId) {
            ambulance = yield Ambulance_1.default.findById(req.ambulanceId);
            if (!ambulance || ambulance.status !== 'available') {
                throw new Error('Selected ambulance is not available');
            }
        }
        else {
            ambulance = yield findNearestAmbulance(pickupLat, pickupLng);
            if (!ambulance)
                throw new Error('No ambulances available right now');
        }
        // Determine driver
        let driver;
        if (req.driverId) {
            driver = yield AmbulanceDriver_1.default.findById(req.driverId);
            if (!driver || driver.status !== 'available') {
                throw new Error('Selected driver is not available');
            }
        }
        else if (ambulance.current_driver_id) {
            driver = yield AmbulanceDriver_1.default.findById(ambulance.current_driver_id);
        }
        else {
            driver = yield AmbulanceDriver_1.default.findOne({ status: 'available', is_active: true });
        }
        if (!driver)
            throw new Error('No available driver found');
        // Create dispatch record
        const dispatch = yield EmergencyDispatch_1.default.create({
            requested_by: req.requestedBy ? new mongoose_1.default.Types.ObjectId(req.requestedBy) : undefined,
            patient_id: req.patientId ? new mongoose_1.default.Types.ObjectId(req.patientId) : undefined,
            ambulance_id: ambulance._id,
            driver_id: driver._id,
            status: 'ambulance_assigned',
            priority: (_d = req.priority) !== null && _d !== void 0 ? _d : 'high',
            caller_name: req.callerName,
            caller_phone: req.callerPhone,
            chief_complaint: req.chiefComplaint,
            pickup_location: { latitude: pickupLat, longitude: pickupLng, address: req.pickupAddress },
            destination_location: { latitude: destLat, longitude: destLng, address: destAddress },
            assigned_at: new Date(),
        });
        // Get initial ETA
        const ambLat = (_f = (_e = ambulance.current_location) === null || _e === void 0 ? void 0 : _e.latitude) !== null && _f !== void 0 ? _f : ambulance.base_location.latitude;
        const ambLng = (_h = (_g = ambulance.current_location) === null || _g === void 0 ? void 0 : _g.longitude) !== null && _h !== void 0 ? _h : ambulance.base_location.longitude;
        const etaToPatient = yield getOSRMEta(ambLat, ambLng, pickupLat, pickupLng);
        const etaToHospital = yield getOSRMEta(pickupLat, pickupLng, destLat, destLng);
        // Create trip
        const trip = yield AmbulanceTrip_1.default.create({
            dispatch_id: dispatch._id,
            ambulance_id: ambulance._id,
            driver_id: driver._id,
            patient_id: req.patientId ? new mongoose_1.default.Types.ObjectId(req.patientId) : undefined,
            status: 'pending',
            pickup_location: { latitude: pickupLat, longitude: pickupLng, address: req.pickupAddress },
            destination_location: { latitude: destLat, longitude: destLng, address: destAddress },
            dispatched_at: new Date(),
            eta_minutes_to_patient: etaToPatient.duration_min,
            eta_minutes_to_hospital: etaToHospital.duration_min,
            distance_km_to_patient: etaToPatient.distance_km,
            distance_km_to_hospital: etaToHospital.distance_km,
        });
        // Update dispatch with trip id
        dispatch.trip_id = trip._id;
        yield dispatch.save();
        // Lock ambulance and driver
        yield Ambulance_1.default.findByIdAndUpdate(ambulance._id, {
            status: 'dispatched',
            current_driver_id: driver._id,
            current_trip_id: trip._id,
        });
        yield AmbulanceDriver_1.default.findByIdAndUpdate(driver._id, {
            status: 'on_trip',
            current_ambulance_id: ambulance._id,
            current_trip_id: trip._id,
        });
        emitSocketEvent('ambulance.dispatched', {
            dispatchId: dispatch._id,
            tripId: trip._id,
            ambulanceId: ambulance._id,
            driverName: driver.name,
            driverPhone: driver.phone,
            registration: ambulance.registration_number,
            etaMinToPatient: etaToPatient.duration_min,
            etaMinToHospital: etaToHospital.duration_min,
            pickupLat, pickupLng,
            destLat, destLng,
        });
        return dispatch;
    });
}
// ─────────────────────────────────────────────────────────────────────────────
// TRIP LIFECYCLE — driver-driven status transitions
// ─────────────────────────────────────────────────────────────────────────────
function driverAcceptTrip(tripId) {
    return __awaiter(this, void 0, void 0, function* () {
        const trip = yield AmbulanceTrip_1.default.findById(tripId);
        if (!trip)
            throw new Error('Trip not found');
        trip.status = 'driver_accepted';
        trip.driver_accepted_at = new Date();
        yield trip.save();
        yield Ambulance_1.default.findByIdAndUpdate(trip.ambulance_id, { status: 'en_route_to_patient' });
        emitSocketEvent('ambulance.trip_update', { tripId, status: trip.status });
        return trip;
    });
}
function driverStartEnRoute(tripId) {
    return __awaiter(this, void 0, void 0, function* () {
        const trip = yield AmbulanceTrip_1.default.findById(tripId);
        if (!trip)
            throw new Error('Trip not found');
        trip.status = 'en_route_to_patient';
        yield trip.save();
        yield Ambulance_1.default.findByIdAndUpdate(trip.ambulance_id, { status: 'en_route_to_patient' });
        emitSocketEvent('ambulance.trip_update', { tripId, status: trip.status });
        return trip;
    });
}
function driverArrivedAtPatient(tripId) {
    return __awaiter(this, void 0, void 0, function* () {
        const trip = yield AmbulanceTrip_1.default.findById(tripId);
        if (!trip)
            throw new Error('Trip not found');
        trip.status = 'arrived_at_patient';
        trip.arrived_at_patient_at = new Date();
        yield trip.save();
        emitSocketEvent('ambulance.trip_update', { tripId, status: trip.status });
        return trip;
    });
}
function driverStartTransport(tripId) {
    return __awaiter(this, void 0, void 0, function* () {
        const trip = yield AmbulanceTrip_1.default.findById(tripId);
        if (!trip)
            throw new Error('Trip not found');
        trip.status = 'transporting';
        trip.trip_started_at = new Date();
        yield trip.save();
        yield Ambulance_1.default.findByIdAndUpdate(trip.ambulance_id, { status: 'transporting' });
        emitSocketEvent('ambulance.trip_update', { tripId, status: trip.status });
        return trip;
    });
}
function driverArrivedAtHospital(tripId) {
    return __awaiter(this, void 0, void 0, function* () {
        const trip = yield AmbulanceTrip_1.default.findById(tripId);
        if (!trip)
            throw new Error('Trip not found');
        trip.status = 'arrived_at_hospital';
        trip.arrived_at_hospital_at = new Date();
        yield trip.save();
        yield Ambulance_1.default.findByIdAndUpdate(trip.ambulance_id, { status: 'at_hospital' });
        emitSocketEvent('ambulance.trip_update', { tripId, status: trip.status });
        return trip;
    });
}
function completeTrip(tripId) {
    return __awaiter(this, void 0, void 0, function* () {
        const trip = yield AmbulanceTrip_1.default.findById(tripId);
        if (!trip)
            throw new Error('Trip not found');
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
        yield trip.save();
        // Update dispatch
        if (trip.dispatch_id) {
            yield EmergencyDispatch_1.default.findByIdAndUpdate(trip.dispatch_id, { status: 'completed', completed_at: new Date() });
        }
        // Free ambulance and driver
        yield Ambulance_1.default.findByIdAndUpdate(trip.ambulance_id, {
            status: 'available',
            current_trip_id: null,
            $inc: { odometer_km: trip.total_distance_km },
        });
        yield AmbulanceDriver_1.default.findByIdAndUpdate(trip.driver_id, {
            status: 'available',
            current_trip_id: null,
            $inc: { total_trips: 1 },
        });
        emitSocketEvent('ambulance.trip_update', { tripId, status: 'completed' });
        return trip;
    });
}
function cancelTrip(tripId, reason) {
    return __awaiter(this, void 0, void 0, function* () {
        const trip = yield AmbulanceTrip_1.default.findById(tripId);
        if (!trip)
            throw new Error('Trip not found');
        trip.status = 'cancelled';
        trip.cancelled_at = new Date();
        trip.cancellation_reason = reason;
        yield trip.save();
        if (trip.dispatch_id) {
            yield EmergencyDispatch_1.default.findByIdAndUpdate(trip.dispatch_id, {
                status: 'cancelled', cancelled_at: new Date(), cancel_reason: reason,
            });
        }
        yield Ambulance_1.default.findByIdAndUpdate(trip.ambulance_id, { status: 'available', current_trip_id: null });
        yield AmbulanceDriver_1.default.findByIdAndUpdate(trip.driver_id, { status: 'available', current_trip_id: null });
        emitSocketEvent('ambulance.trip_update', { tripId, status: 'cancelled', reason });
        return trip;
    });
}
function reassignDispatch(dispatchId, newAmbulanceId, newDriverId) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const dispatch = yield EmergencyDispatch_1.default.findById(dispatchId).populate('trip_id');
        if (!dispatch)
            throw new Error('Dispatch not found');
        // Cancel old trip
        if (dispatch.trip_id) {
            yield cancelTrip(dispatch.trip_id._id.toString(), 'Reassigned');
        }
        // Re-dispatch with overrides
        const newDispatch = yield dispatchAmbulance({
            pickupLat: dispatch.pickup_location.latitude,
            pickupLng: dispatch.pickup_location.longitude,
            pickupAddress: dispatch.pickup_location.address,
            destLat: dispatch.destination_location.latitude,
            destLng: dispatch.destination_location.longitude,
            destAddress: dispatch.destination_location.address,
            chiefComplaint: dispatch.chief_complaint,
            callerName: dispatch.caller_name,
            callerPhone: dispatch.caller_phone,
            priority: dispatch.priority,
            ambulanceId: newAmbulanceId,
            driverId: newDriverId,
            patientId: (_a = dispatch.patient_id) === null || _a === void 0 ? void 0 : _a.toString(),
            requestedBy: (_b = dispatch.requested_by) === null || _b === void 0 ? void 0 : _b.toString(),
        });
        return newDispatch;
    });
}
// ─────────────────────────────────────────────────────────────────────────────
// QUERIES
// ─────────────────────────────────────────────────────────────────────────────
function getActiveDispatches() {
    return __awaiter(this, void 0, void 0, function* () {
        return EmergencyDispatch_1.default.find({ status: { $in: ['pending', 'ambulance_assigned', 'in_progress'] } })
            .populate('ambulance_id', 'registration_number vehicle_number current_location status')
            .populate('driver_id', 'name phone')
            .populate('patient_id', 'name phone age')
            .sort({ priority: 1, createdAt: -1 });
    });
}
function getTripById(tripId) {
    return __awaiter(this, void 0, void 0, function* () {
        return AmbulanceTrip_1.default.findById(tripId)
            .populate('ambulance_id', 'registration_number vehicle_number current_location')
            .populate('driver_id', 'name phone')
            .populate('patient_id', 'name phone');
    });
}
function getActiveTripForPatient(patientId) {
    return __awaiter(this, void 0, void 0, function* () {
        return AmbulanceTrip_1.default.findOne({
            patient_id: new mongoose_1.default.Types.ObjectId(patientId),
            status: { $nin: ['completed', 'cancelled'] },
        })
            .populate('ambulance_id', 'registration_number vehicle_number current_location')
            .populate('driver_id', 'name phone');
    });
}
function getRecentDispatches() {
    return __awaiter(this, arguments, void 0, function* (limit = 50) {
        return EmergencyDispatch_1.default.find({})
            .populate('ambulance_id', 'registration_number')
            .populate('driver_id', 'name phone')
            .populate('patient_id', 'name')
            .sort({ createdAt: -1 })
            .limit(limit);
    });
}
function getDriverCurrentTrip(driverId) {
    return __awaiter(this, void 0, void 0, function* () {
        const driver = yield AmbulanceDriver_1.default.findById(driverId);
        if (!(driver === null || driver === void 0 ? void 0 : driver.current_trip_id))
            return null;
        return getTripById(driver.current_trip_id.toString());
    });
}
// ─────────────────────────────────────────────────────────────────────────────
// ANALYTICS
// ─────────────────────────────────────────────────────────────────────────────
function getAnalytics() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [total, todayCount, completed, cancelled] = yield Promise.all([
            AmbulanceTrip_1.default.countDocuments({}),
            AmbulanceTrip_1.default.countDocuments({ createdAt: { $gte: today } }),
            AmbulanceTrip_1.default.countDocuments({ status: 'completed' }),
            AmbulanceTrip_1.default.countDocuments({ status: 'cancelled' }),
        ]);
        const responseTimeAgg = yield AmbulanceTrip_1.default.aggregate([
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
        const tripTimeAgg = yield AmbulanceTrip_1.default.aggregate([
            { $match: { status: 'completed', trip_started_at: { $exists: true }, completed_at: { $exists: true } } },
            {
                $project: {
                    trip_min: { $divide: [{ $subtract: ['$completed_at', '$trip_started_at'] }, 60000] },
                },
            },
            { $group: { _id: null, avg: { $avg: '$trip_min' } } },
        ]);
        const fleet = yield getFleetSummary();
        return {
            total_trips: total,
            trips_today: todayCount,
            completed_trips: completed,
            cancelled_trips: cancelled,
            success_rate: total > 0 ? Math.round((completed / total) * 100) : 0,
            avg_response_min: Math.round((_b = (_a = responseTimeAgg[0]) === null || _a === void 0 ? void 0 : _a.avg) !== null && _b !== void 0 ? _b : 0),
            avg_trip_min: Math.round((_d = (_c = tripTimeAgg[0]) === null || _c === void 0 ? void 0 : _c.avg) !== null && _d !== void 0 ? _d : 0),
            fleet_utilization_pct: fleet.total > 0
                ? Math.round(((fleet.dispatched + fleet.at_hospital) / fleet.total) * 100)
                : 0,
            fleet,
        };
    });
}
// ─────────────────────────────────────────────────────────────────────────────
// Socket helper
// ─────────────────────────────────────────────────────────────────────────────
function emitSocketEvent(event, data) {
    (0, socket_1.emitQueueUpdate)(event, data);
}
