import { Router } from 'express';
import * as consultationController from '../controllers/consultationController';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', authenticate, consultationController.startConsultation);
router.get('/analytics', authenticate, consultationController.getAnalytics);
router.post('/safety-check', authenticate, consultationController.checkSafety);
router.get('/:consultationId', authenticate, consultationController.getConsultation);
router.get('/context/:patientId', authenticate, consultationController.getConsultationContext);
router.post('/:consultationId/complete', authenticate, consultationController.completeConsultation);

export default router;
