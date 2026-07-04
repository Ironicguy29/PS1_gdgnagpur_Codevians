import { Router } from 'express';
import * as ctrl from '../controllers/ambulanceController';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// ── Fleet management ────────────────────────────────────────────────────────
router.get   ('/',                   authenticate, ctrl.getFleet);
router.get   ('/summary',            authenticate, ctrl.getFleetSummary);
router.post  ('/',                   authenticate, ctrl.createAmbulance);
router.put   ('/:id',                authenticate, ctrl.updateAmbulance);

// ── GPS update (called by ambulance device/app) ─────────────────────────────
router.post  ('/:id/gps',            authenticate, ctrl.postGPS);

// ── Dispatch ────────────────────────────────────────────────────────────────
router.post  ('/dispatch',           authenticate, ctrl.dispatch);
router.get   ('/dispatch/nearest',   authenticate, ctrl.findNearest);
router.get   ('/dispatch/active',    authenticate, ctrl.getActiveDispatches);
router.get   ('/dispatch/recent',    authenticate, ctrl.getRecentDispatches);
router.post  ('/dispatch/:id/cancel',authenticate, ctrl.cancelDispatch);
router.post  ('/dispatch/:id/reassign', authenticate, ctrl.reassignDispatch);

// ── Trip lifecycle ──────────────────────────────────────────────────────────
router.get   ('/trip/:id',                  authenticate, ctrl.getTrip);
router.post  ('/trip/:id/accept',           authenticate, ctrl.tripAccept);
router.post  ('/trip/:id/en-route',         authenticate, ctrl.tripEnRoute);
router.post  ('/trip/:id/arrive-patient',   authenticate, ctrl.tripArrivePatient);
router.post  ('/trip/:id/start-transport',  authenticate, ctrl.tripStartTransport);
router.post  ('/trip/:id/arrive-hospital',  authenticate, ctrl.tripArriveHospital);
router.post  ('/trip/:id/complete',         authenticate, ctrl.tripComplete);
router.post  ('/trip/:id/cancel',           authenticate, ctrl.tripCancel);

// ── Drivers ─────────────────────────────────────────────────────────────────
router.get   ('/drivers',            authenticate, ctrl.getAllDrivers);
router.get   ('/drivers/available',  authenticate, ctrl.getAvailDrivers);
router.post  ('/drivers',            authenticate, ctrl.createDriver);
router.put   ('/drivers/:id',        authenticate, ctrl.updateDriver);
router.get   ('/drivers/:driverId/trip', authenticate, ctrl.driverCurrentTrip);

// ── Patient portal ──────────────────────────────────────────────────────────
router.get   ('/patient/:patientId/trip', authenticate, ctrl.patientActiveTrip);

// ── Analytics ────────────────────────────────────────────────────────────────
router.get   ('/analytics',          authenticate, ctrl.getAnalytics);

export default router;

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
