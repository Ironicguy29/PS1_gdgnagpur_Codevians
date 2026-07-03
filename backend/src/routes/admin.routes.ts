import { Router } from 'express';
import * as adminController from '../controllers/adminController';

const router = Router();

router.get('/stats', adminController.getStats);
router.get('/analytics', adminController.getAnalytics);
router.get('/analytics/forecast', adminController.getForecast);
router.get('/analytics/export', adminController.exportAnalytics);
router.post('/emergency-override', adminController.emergencyOverride);

// Hospital management endpoints
router.get('/department-load', adminController.getDepartmentLoad);
router.get('/beds', adminController.getBedAllocation);
router.put('/beds/:bedId', adminController.updateBedStatus);
router.get('/compliance/report', adminController.getComplianceReport);
router.post('/compliance/claim', adminController.submitComplianceClaim);

export default router;
