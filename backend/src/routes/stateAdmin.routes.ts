import { Router } from 'express';
import * as stateAdminController from '../controllers/stateAdminController';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Registry verification endpoints
router.get('/registries', authenticate, stateAdminController.getRegistryVerification);
router.put('/registries/:registryId/flag', authenticate, stateAdminController.flagRegistry);

// Resource mapping endpoints
router.get('/resources/map', authenticate, stateAdminController.getResourceMapping);
router.put('/resources/update', authenticate, stateAdminController.updateResourceInventory);

// Outbreak tracking endpoints
router.get('/outbreaks/tracking', authenticate, stateAdminController.getOutbreakTracking);
router.post('/outbreaks/response', authenticate, stateAdminController.coordinateResponseTeam);

// Policy evaluation endpoints
router.get('/policy/evaluation', authenticate, stateAdminController.getPolicyEvaluation);
router.post('/policy/report', authenticate, stateAdminController.generatePolicyReport);

export default router;
