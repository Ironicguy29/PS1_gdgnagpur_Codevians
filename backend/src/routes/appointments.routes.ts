import { Router } from 'express';
import * as appointmentController from '../controllers/appointmentController';

const router = Router();

router.post('/book', appointmentController.bookAppointment);
router.get('/slots', appointmentController.getSlots);
router.post('/check-in', appointmentController.checkIn);

export default router;
