import { Router } from 'express';
import * as doctorController from '../controllers/doctorController';

const router = Router();

router.get('/', doctorController.getDoctors);
router.post('/status', doctorController.updateStatus);

export default router;
