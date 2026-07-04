import { Router } from 'express';
import * as prescriptionController from '../controllers/prescriptionController';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Patient routes
router.get('/patient/:patientId', authenticate, prescriptionController.getPatientPrescriptions);
router.get('/:prescriptionId/download', authenticate, prescriptionController.downloadPrescriptionPdf);

// Doctor routes
router.post('/', authenticate, prescriptionController.createPrescription);
router.put('/:prescriptionId/pickup-status', authenticate, prescriptionController.updatePickupStatus);

export default router;

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
