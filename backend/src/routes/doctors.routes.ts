import { Router } from 'express';
import * as doctorController from '../controllers/doctorController';

const router = Router();

router.get('/', doctorController.getDoctors);
router.post('/status', doctorController.updateStatus);

export default router;

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
