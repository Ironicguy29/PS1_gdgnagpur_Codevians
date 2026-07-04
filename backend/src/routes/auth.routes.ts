import { Router } from 'express';
import * as authController from '../controllers/authController';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/send-otp', authController.sendOtp);
router.post('/verify-otp', authController.verifyOtp);
router.put('/medical-profile', authController.updateMedicalProfile);
router.post('/verify-abha', authController.verifyAbha);
router.get('/patient/phone/:phone', authController.getPatientByPhone);
router.get('/patient/verify/:identifier', authController.getPatientByIdentifier);

export default router;

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
