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
const express_1 = require("express");
const ctrl = __importStar(require("../controllers/ambulanceController"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// ── Fleet management ────────────────────────────────────────────────────────
router.get('/', auth_middleware_1.authenticate, ctrl.getFleet);
router.get('/summary', auth_middleware_1.authenticate, ctrl.getFleetSummary);
router.post('/', auth_middleware_1.authenticate, ctrl.createAmbulance);
router.put('/:id', auth_middleware_1.authenticate, ctrl.updateAmbulance);
// ── GPS update (called by ambulance device/app) ─────────────────────────────
router.post('/:id/gps', auth_middleware_1.authenticate, ctrl.postGPS);
// ── Dispatch ────────────────────────────────────────────────────────────────
router.post('/dispatch', auth_middleware_1.authenticate, ctrl.dispatch);
router.get('/dispatch/nearest', auth_middleware_1.authenticate, ctrl.findNearest);
router.get('/dispatch/active', auth_middleware_1.authenticate, ctrl.getActiveDispatches);
router.get('/dispatch/recent', auth_middleware_1.authenticate, ctrl.getRecentDispatches);
router.post('/dispatch/:id/cancel', auth_middleware_1.authenticate, ctrl.cancelDispatch);
router.post('/dispatch/:id/reassign', auth_middleware_1.authenticate, ctrl.reassignDispatch);
// ── Trip lifecycle ──────────────────────────────────────────────────────────
router.get('/trip/:id', auth_middleware_1.authenticate, ctrl.getTrip);
router.post('/trip/:id/accept', auth_middleware_1.authenticate, ctrl.tripAccept);
router.post('/trip/:id/en-route', auth_middleware_1.authenticate, ctrl.tripEnRoute);
router.post('/trip/:id/arrive-patient', auth_middleware_1.authenticate, ctrl.tripArrivePatient);
router.post('/trip/:id/start-transport', auth_middleware_1.authenticate, ctrl.tripStartTransport);
router.post('/trip/:id/arrive-hospital', auth_middleware_1.authenticate, ctrl.tripArriveHospital);
router.post('/trip/:id/complete', auth_middleware_1.authenticate, ctrl.tripComplete);
router.post('/trip/:id/cancel', auth_middleware_1.authenticate, ctrl.tripCancel);
// ── Drivers ─────────────────────────────────────────────────────────────────
router.get('/drivers', auth_middleware_1.authenticate, ctrl.getAllDrivers);
router.get('/drivers/available', auth_middleware_1.authenticate, ctrl.getAvailDrivers);
router.post('/drivers', auth_middleware_1.authenticate, ctrl.createDriver);
router.put('/drivers/:id', auth_middleware_1.authenticate, ctrl.updateDriver);
router.get('/drivers/:driverId/trip', auth_middleware_1.authenticate, ctrl.driverCurrentTrip);
// ── Patient portal ──────────────────────────────────────────────────────────
router.get('/patient/:patientId/trip', auth_middleware_1.authenticate, ctrl.patientActiveTrip);
// ── Analytics ────────────────────────────────────────────────────────────────
router.get('/analytics', auth_middleware_1.authenticate, ctrl.getAnalytics);
exports.default = router;
