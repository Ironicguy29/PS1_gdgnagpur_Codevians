import { Router } from 'express';
import * as aiClinicalController from '../controllers/aiClinicalController';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.post('/check-symptoms', authenticate, aiClinicalController.checkSymptoms);
router.post('/calculate-health-score', authenticate, aiClinicalController.calculateHealthScore);
router.get('/assessments/:patientId', authenticate, aiClinicalController.getAssessments);
router.get('/scores/:patientId', authenticate, aiClinicalController.getHealthScores);
router.get('/admin-stats', authenticate, aiClinicalController.getAdminStats);

export default router;

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
