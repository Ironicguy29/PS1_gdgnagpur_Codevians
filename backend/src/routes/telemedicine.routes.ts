import { Router } from 'express';
import * as ctrl from '../controllers/telemedicineController';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Token & session lifecycle
router.post('/token',    authenticate, ctrl.getToken);
router.post('/start',    authenticate, ctrl.startSession);
router.post('/end',      authenticate, ctrl.endSession);

// Messaging
router.post('/message',  authenticate, ctrl.sendMessage);

// Admin analytics
router.get('/admin/analytics', authenticate, ctrl.getAdminAnalytics);

// Per-role history
router.get('/patient/:patientUserId', authenticate, ctrl.getPatientSessions);
router.get('/doctor/:doctorUserId',   authenticate, ctrl.getDoctorSessions);

// Session lookup by appointment (must be last to avoid route conflicts)
router.get('/:appointmentId',         authenticate, ctrl.getSession);

export default router;

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
