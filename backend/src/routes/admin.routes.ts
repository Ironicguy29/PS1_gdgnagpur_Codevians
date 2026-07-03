import { Router } from 'express';
import * as adminController from '../controllers/adminController';

const router = Router();

router.get('/stats', adminController.getStats);
router.get('/analytics', adminController.getAnalytics);
router.get('/analytics/forecast', adminController.getForecast);
router.get('/analytics/export', adminController.exportAnalytics);
router.post('/emergency-override', adminController.emergencyOverride);

export default router;
