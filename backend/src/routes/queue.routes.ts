import { Router } from 'express';
import * as queueController from '../controllers/queueController';

const router = Router();

router.get('/live/:doctorId', queueController.getQueue);
router.post('/next', queueController.nextPatient);
router.post('/emergency', queueController.emergency);
router.get('/predict/:queueId/:tokenNumber', queueController.predictWait);
router.post('/check-in', queueController.checkIn);
router.post('/start', queueController.startConsultation);
router.post('/complete', queueController.completeConsultation);
router.post('/skip', queueController.skipPatient);
router.post('/transfer', queueController.transfer);
router.post('/duration', queueController.changeDuration);
router.post('/pause', queueController.pauseQueue);
router.get('/analytics', queueController.getAnalytics);
router.get('/patient-live/:patientId', queueController.getPatientLiveToken);
router.post('/generate-walkin', queueController.generateWalkInToken);

export default router;
