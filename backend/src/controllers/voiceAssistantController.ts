import { Request, Response } from 'express';
import mongoose from 'mongoose';
import * as voiceRepo from '../repositories/voiceRepository';
import * as voiceService from '../services/voiceAssistantService';
import AuditLog from '../models/AuditLog';

/**
 * Create a new voice assistant session
 */
export const createSession = async (req: Request, res: Response) => {
    try {
        const { patient_id, doctor_id, telemedicine_session_id, patient_preferred_language, doctor_preferred_language } = req.body;

        if (!patient_id) {
            return res.status(400).json({ message: 'patient_id is required.' });
        }

        const session = await voiceRepo.createSession({
            patient_id,
            doctor_id,
            telemedicine_session_id,
            patient_preferred_language: patient_preferred_language || 'en',
            doctor_preferred_language: doctor_preferred_language || 'en',
            status: 'active'
        });

        await AuditLog.create({
            user_id: new mongoose.Types.ObjectId(patient_id),
            user_type: 'Patient',
            action: 'VOICE_SESSION_STARTED',
            patient_id,
            details: `Voice assistant session started. Languages: ${patient_preferred_language || 'en'} ↔ ${doctor_preferred_language || 'en'}`
        });

        return res.status(201).json(session);
    } catch (error: any) {
        console.error('Voice Session Create Error:', error);
        return res.status(500).json({ message: error.message || 'Failed to create voice session.' });
    }
};

/**
 * Process a new voice transcript: detect language, translate, optionally run clinical reasoning
 */
export const processTranscript = async (req: Request, res: Response) => {
    try {
        const sessionId = req.params.sessionId as string;
        const { speaker_id, speaker_role, original_text, target_language, run_clinical_reasoning } = req.body;

        if (!original_text || !speaker_id) {
            return res.status(400).json({ message: 'original_text and speaker_id are required.' });
        }

        const session = await voiceRepo.findSessionById(sessionId);
        if (!session) {
            return res.status(404).json({ message: 'Voice session not found.' });
        }

        // Step 1: Detect language
        const startTime = Date.now();
        const detection = await voiceService.detectLanguage(original_text);
        const detectedLanguage = detection.language || 'en';

        // Step 2: Translate to target language
        const effectiveTarget = target_language || (speaker_role === 'patient' ? session.doctor_preferred_language : session.patient_preferred_language);
        let translatedText = original_text;
        let medicalTerms: string[] = [];

        if (detectedLanguage !== effectiveTarget) {
            const translation = await voiceService.translateMedicalText(original_text, detectedLanguage, effectiveTarget);
            translatedText = translation.translated_text || original_text;
            medicalTerms = translation.medical_terms_preserved || [];
        }

        const processingTime = Date.now() - startTime;

        // Step 3: Save transcript
        const transcript = await voiceRepo.createTranscript({
            session_id: sessionId,
            speaker_id,
            speaker_role,
            original_text,
            translated_text: translatedText,
            original_language: detectedLanguage,
            target_language: effectiveTarget,
            confidence_score: detection.confidence || 0
        });

        // Step 4: Log translation audit
        if (detectedLanguage !== effectiveTarget) {
            const translationType = speaker_role === 'patient' ? 'patient_to_doctor' : 'doctor_to_patient';
            await voiceRepo.createTranslationLog({
                session_id: sessionId,
                source_text: original_text,
                translated_text: translatedText,
                source_language: detectedLanguage,
                target_language: effectiveTarget,
                translation_type: translationType,
                medical_terms_preserved: medicalTerms,
                processing_time_ms: processingTime
            });
        }

        // Step 5: Optionally run clinical reasoning for AI assistant mode
        let clinicalResponse = null;
        if (run_clinical_reasoning) {
            const englishText = detectedLanguage !== 'en'
                ? (await voiceService.translateMedicalText(original_text, detectedLanguage, 'en')).translated_text
                : original_text;
            
            const reasoning = await voiceService.getClinicalReasoning(englishText);
            
            // Translate AI response back to patient language if needed
            let aiResponseInPatientLang = reasoning.response;
            if (detectedLanguage !== 'en') {
                const backTranslation = await voiceService.translateMedicalText(reasoning.response, 'en', detectedLanguage);
                aiResponseInPatientLang = backTranslation.translated_text || reasoning.response;
            }

            clinicalResponse = {
                english_response: reasoning.response,
                patient_language_response: aiResponseInPatientLang,
                suggestions: reasoning.suggestions || []
            };

            // Save AI response transcript
            await voiceRepo.createTranscript({
                session_id: sessionId,
                speaker_id,
                speaker_role: 'ai',
                original_text: reasoning.response,
                translated_text: aiResponseInPatientLang,
                original_language: 'en',
                target_language: detectedLanguage,
                confidence_score: 1.0
            });
        }

        return res.status(200).json({
            transcript,
            detected_language: detectedLanguage,
            detected_language_name: detection.language_name || detectedLanguage,
            translated_text: translatedText,
            medical_terms_preserved: medicalTerms,
            processing_time_ms: processingTime,
            clinical_response: clinicalResponse
        });
    } catch (error: any) {
        console.error('Process Transcript Error:', error);
        return res.status(500).json({ message: error.message || 'Failed to process transcript.' });
    }
};

/**
 * Get all transcripts for a session
 */
export const getTranscripts = async (req: Request, res: Response) => {
    try {
        const sessionId = req.params.sessionId as string;
        const transcripts = await voiceRepo.findTranscriptsBySession(sessionId);
        return res.status(200).json(transcripts);
    } catch (error: any) {
        return res.status(500).json({ message: error.message || 'Failed to fetch transcripts.' });
    }
};

/**
 * End a voice session
 */
export const endSession = async (req: Request, res: Response) => {
    try {
        const sessionId = req.params.sessionId as string;
        const session = await voiceRepo.findSessionById(sessionId);
        if (!session) {
            return res.status(404).json({ message: 'Session not found.' });
        }

        const duration = Math.floor((Date.now() - new Date(session.createdAt as string).getTime()) / 1000);
        const updated = await voiceRepo.updateSession(sessionId, { status: 'completed', duration_seconds: duration });

        return res.status(200).json(updated);
    } catch (error: any) {
        return res.status(500).json({ message: error.message || 'Failed to end session.' });
    }
};

/**
 * Get user voice settings
 */
export const getSettings = async (req: Request, res: Response) => {
    try {
        const userId = req.params.userId as string;
        let settings = await voiceRepo.findSettings(userId);
        if (!settings) {
            settings = await voiceRepo.upsertSettings(userId, {});
        }
        return res.status(200).json(settings);
    } catch (error: any) {
        return res.status(500).json({ message: error.message || 'Failed to fetch settings.' });
    }
};

/**
 * Save/update voice settings
 */
export const saveSettings = async (req: Request, res: Response) => {
    try {
        const { user_id, preferred_language, voice_gender, speaking_rate, volume, auto_play_tts, continuous_listening } = req.body;
        if (!user_id) {
            return res.status(400).json({ message: 'user_id is required.' });
        }

        const settings = await voiceRepo.upsertSettings(user_id, {
            preferred_language,
            voice_gender,
            speaking_rate,
            volume,
            auto_play_tts,
            continuous_listening
        });

        return res.status(200).json(settings);
    } catch (error: any) {
        return res.status(500).json({ message: error.message || 'Failed to save settings.' });
    }
};

/**
 * Get voice assistant analytics for admin dashboard
 */
export const getAnalytics = async (req: Request, res: Response) => {
    try {
        const analytics = await voiceRepo.getVoiceAnalytics();
        return res.status(200).json(analytics);
    } catch (error: any) {
        return res.status(500).json({ message: error.message || 'Failed to fetch analytics.' });
    }
};

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
