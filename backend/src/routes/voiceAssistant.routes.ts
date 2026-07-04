import { Router } from 'express';
import * as voiceController from '../controllers/voiceAssistantController';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Session management
router.post('/sessions', authenticate, voiceController.createSession);
router.put('/sessions/:sessionId/end', authenticate, voiceController.endSession);

// Transcript processing (translate + clinical reasoning)
router.post('/sessions/:sessionId/transcripts', authenticate, voiceController.processTranscript);
router.get('/sessions/:sessionId/transcripts', authenticate, voiceController.getTranscripts);

// User settings
router.get('/settings/:userId', authenticate, voiceController.getSettings);
router.post('/settings', authenticate, voiceController.saveSettings);

// Admin analytics
router.get('/analytics', authenticate, voiceController.getAnalytics);

export default router;

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
