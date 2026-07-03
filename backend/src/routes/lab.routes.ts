import { Router } from 'express';
import * as labController from '../controllers/labController';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.get('/catalog', authenticate, labController.getTestCatalog);
router.get('/dashboard', authenticate, labController.getSamplesDashboard);
router.get('/analytics', authenticate, labController.getLIMSAnalytics);
router.get('/order/:orderId', authenticate, labController.getLabOrderDetails);
router.get('/patient/:patientId', authenticate, labController.getPatientLabRecords);

router.post('/collect', authenticate, labController.collectSample);
router.post('/scan', authenticate, labController.scanBarcode);
router.post('/status', authenticate, labController.updateSampleStatus);
router.post('/submit-results', authenticate, labController.submitResults);
router.post('/approve', authenticate, labController.approveReport);

export default router;
