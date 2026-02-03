import { Router } from 'express';
import * as adminController from '../controllers/adminController';

const router = Router();

router.get('/stats', adminController.getStats);
router.post('/emergency-override', adminController.emergencyOverride);

export default router;
