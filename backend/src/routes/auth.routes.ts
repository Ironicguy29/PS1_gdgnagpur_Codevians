import { Router } from 'express';
import * as authController from '../controllers/authController';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/send-otp', authController.sendOtp);
router.post('/verify-otp', authController.verifyOtp);
router.put('/medical-profile', authController.updateMedicalProfile);
router.get('/patient/phone/:phone', authController.getPatientByPhone);

export default router;
