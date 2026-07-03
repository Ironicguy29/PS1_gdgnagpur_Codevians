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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAnalytics = exports.driverCurrentTrip = exports.patientActiveTrip = exports.getTrip = exports.tripCancel = exports.tripComplete = exports.tripArriveHospital = exports.tripStartTransport = exports.tripArrivePatient = exports.tripEnRoute = exports.tripAccept = exports.reassignDispatch = exports.cancelDispatch = exports.getRecentDispatches = exports.getActiveDispatches = exports.findNearest = exports.dispatch = exports.postGPS = exports.updateDriver = exports.createDriver = exports.getAvailDrivers = exports.getAllDrivers = exports.updateAmbulance = exports.createAmbulance = exports.getFleetSummary = exports.getFleet = void 0;
const svc = __importStar(require("../services/ambulanceService"));
// ── Fleet ──────────────────────────────────────────────────────────────────
const getFleet = (_, res) => __awaiter(void 0, void 0, void 0, function* () { return wrap(res, svc.getFleet()); });
exports.getFleet = getFleet;
const getFleetSummary = (_, res) => __awaiter(void 0, void 0, void 0, function* () { return wrap(res, svc.getFleetSummary()); });
exports.getFleetSummary = getFleetSummary;
const createAmbulance = (req, res) => __awaiter(void 0, void 0, void 0, function* () { return wrap(res, svc.createAmbulance(req.body), 201); });
exports.createAmbulance = createAmbulance;
const updateAmbulance = (req, res) => __awaiter(void 0, void 0, void 0, function* () { return wrap(res, svc.updateAmbulance(req.params.id, req.body)); });
exports.updateAmbulance = updateAmbulance;
// ── Drivers ────────────────────────────────────────────────────────────────
const getAllDrivers = (_, res) => __awaiter(void 0, void 0, void 0, function* () { return wrap(res, svc.getAllDrivers()); });
exports.getAllDrivers = getAllDrivers;
const getAvailDrivers = (_, res) => __awaiter(void 0, void 0, void 0, function* () { return wrap(res, svc.getAvailableDrivers()); });
exports.getAvailDrivers = getAvailDrivers;
const createDriver = (req, res) => __awaiter(void 0, void 0, void 0, function* () { return wrap(res, svc.createDriver(req.body), 201); });
exports.createDriver = createDriver;
const updateDriver = (req, res) => __awaiter(void 0, void 0, void 0, function* () { return wrap(res, svc.updateDriver(req.params.id, req.body)); });
exports.updateDriver = updateDriver;
// ── GPS ────────────────────────────────────────────────────────────────────
const postGPS = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        yield svc.updateGPS({
            ambulanceId: req.params.id,
            latitude: Number(req.body.latitude),
            longitude: Number(req.body.longitude),
            speed: Number((_a = req.body.speed) !== null && _a !== void 0 ? _a : 0),
            heading: Number((_b = req.body.heading) !== null && _b !== void 0 ? _b : 0),
        });
        res.json({ ok: true });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
exports.postGPS = postGPS;
// ── Dispatch ───────────────────────────────────────────────────────────────
const dispatch = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const userId = (_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id) !== null && _b !== void 0 ? _b : (_c = req.user) === null || _c === void 0 ? void 0 : _c.id;
        const result = yield svc.dispatchAmbulance(Object.assign(Object.assign({}, req.body), { requestedBy: userId }));
        res.status(201).json(result);
    }
    catch (err) {
        const status = err.message.includes('not available') || err.message.includes('No ambulance') ? 422 : 500;
        res.status(status).json({ message: err.message });
    }
});
exports.dispatch = dispatch;
const findNearest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const lat = Number(req.query.lat);
        const lng = Number(req.query.lng);
        if (isNaN(lat) || isNaN(lng))
            return res.status(400).json({ message: 'lat & lng required' });
        const ambulance = yield svc.findNearestAmbulance(lat, lng);
        res.json(ambulance !== null && ambulance !== void 0 ? ambulance : { message: 'No ambulances available' });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
exports.findNearest = findNearest;
const getActiveDispatches = (_, res) => __awaiter(void 0, void 0, void 0, function* () { return wrap(res, svc.getActiveDispatches()); });
exports.getActiveDispatches = getActiveDispatches;
const getRecentDispatches = (_, res) => __awaiter(void 0, void 0, void 0, function* () { return wrap(res, svc.getRecentDispatches()); });
exports.getRecentDispatches = getRecentDispatches;
const cancelDispatch = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const dispatch = yield svc.getActiveDispatches();
        const d = dispatch.find(x => x._id.toString() === req.params.id);
        if (!d || !d.trip_id)
            return res.status(404).json({ message: 'Active dispatch not found' });
        const trip = yield svc.cancelTrip(d.trip_id.toString(), (_a = req.body.reason) !== null && _a !== void 0 ? _a : 'Admin cancelled');
        res.json(trip);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
exports.cancelDispatch = cancelDispatch;
const reassignDispatch = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { ambulanceId, driverId } = req.body;
        const result = yield svc.reassignDispatch(req.params.id, ambulanceId, driverId);
        res.json(result);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
exports.reassignDispatch = reassignDispatch;
// ── Trip lifecycle (driver) ─────────────────────────────────────────────────
const tripAccept = (req, res) => __awaiter(void 0, void 0, void 0, function* () { return wrap(res, svc.driverAcceptTrip(req.params.id)); });
exports.tripAccept = tripAccept;
const tripEnRoute = (req, res) => __awaiter(void 0, void 0, void 0, function* () { return wrap(res, svc.driverStartEnRoute(req.params.id)); });
exports.tripEnRoute = tripEnRoute;
const tripArrivePatient = (req, res) => __awaiter(void 0, void 0, void 0, function* () { return wrap(res, svc.driverArrivedAtPatient(req.params.id)); });
exports.tripArrivePatient = tripArrivePatient;
const tripStartTransport = (req, res) => __awaiter(void 0, void 0, void 0, function* () { return wrap(res, svc.driverStartTransport(req.params.id)); });
exports.tripStartTransport = tripStartTransport;
const tripArriveHospital = (req, res) => __awaiter(void 0, void 0, void 0, function* () { return wrap(res, svc.driverArrivedAtHospital(req.params.id)); });
exports.tripArriveHospital = tripArriveHospital;
const tripComplete = (req, res) => __awaiter(void 0, void 0, void 0, function* () { return wrap(res, svc.completeTrip(req.params.id)); });
exports.tripComplete = tripComplete;
const tripCancel = (req, res) => __awaiter(void 0, void 0, void 0, function* () { var _a; return wrap(res, svc.cancelTrip(req.params.id, (_a = req.body.reason) !== null && _a !== void 0 ? _a : '')); });
exports.tripCancel = tripCancel;
const getTrip = (req, res) => __awaiter(void 0, void 0, void 0, function* () { return wrap(res, svc.getTripById(req.params.id)); });
exports.getTrip = getTrip;
// ── Patient portal ─────────────────────────────────────────────────────────
const patientActiveTrip = (req, res) => __awaiter(void 0, void 0, void 0, function* () { return wrap(res, svc.getActiveTripForPatient(req.params.patientId)); });
exports.patientActiveTrip = patientActiveTrip;
// ── Driver dashboard ───────────────────────────────────────────────────────
const driverCurrentTrip = (req, res) => __awaiter(void 0, void 0, void 0, function* () { return wrap(res, svc.getDriverCurrentTrip(req.params.driverId)); });
exports.driverCurrentTrip = driverCurrentTrip;
// ── Analytics ──────────────────────────────────────────────────────────────
const getAnalytics = (_, res) => __awaiter(void 0, void 0, void 0, function* () { return wrap(res, svc.getAnalytics()); });
exports.getAnalytics = getAnalytics;
// ── Utility ────────────────────────────────────────────────────────────────
function wrap(res_1, promise_1) {
    return __awaiter(this, arguments, void 0, function* (res, promise, status = 200) {
        try {
            const data = yield promise;
            res.status(status).json(data !== null && data !== void 0 ? data : null);
        }
        catch (err) {
            const code = err.message.includes('not found') ? 404 : 500;
            res.status(code).json({ message: err.message });
        }
    });
}
