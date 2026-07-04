import { Router } from 'express';
import * as appointmentController from '../controllers/appointmentController';

const router = Router();

router.post('/book', appointmentController.bookAppointment);
router.get('/slots', appointmentController.getSlots);
router.post('/check-in', appointmentController.checkIn);
router.get('/patient/:patientId', appointmentController.getPatientAppointments);

export default router;

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
