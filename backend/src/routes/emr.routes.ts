import { Router } from 'express';
import * as emrController from '../controllers/emrController';

const router = Router();

router.get('/profile/:patientId', emrController.getProfile);
router.put('/profile/:patientId', emrController.updateProfile);

router.get('/visits/:patientId', emrController.getVisits);
router.post('/visit', emrController.createVisit);

router.get('/vitals/:patientId', emrController.getVitals);

router.put('/lab-order/:orderId', emrController.updateLab);

router.post('/attachment/:visitId', emrController.uploadAttachment);

router.get('/notes', emrController.getNotes);

router.get('/audit/:patientId', emrController.getAudit);
router.get('/lab-orders', emrController.getLabOrders);

export default router;
