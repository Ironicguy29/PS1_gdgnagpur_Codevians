import { Router } from 'express';
import { 
    getCampus, 
    getAssets, 
    getRoutes, 
    updateTelemetry, 
    toggleEmergency, 
    triggerSimulation 
} from '../controllers/digitalTwinController';

const router = Router();

router.get('/campus', getCampus);
router.get('/assets', getAssets);
router.get('/routes', getRoutes);
router.post('/telemetry/:assetId', updateTelemetry);
router.post('/emergency/:routeId', toggleEmergency);
router.post('/simulate', triggerSimulation);

export default router;

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
