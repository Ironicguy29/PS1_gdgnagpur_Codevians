import { Router } from 'express';
import * as queueController from '../controllers/queueController';

const router = Router();

router.get('/live/:doctorId', queueController.getQueue);
router.post('/next', queueController.nextPatient);
router.get('/predict/:queueId/:tokenNumber', queueController.predictWait);

export default router;
