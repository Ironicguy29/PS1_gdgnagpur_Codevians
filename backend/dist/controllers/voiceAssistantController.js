"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAnalytics = exports.saveSettings = exports.getSettings = exports.endSession = exports.getTranscripts = exports.processTranscript = exports.createSession = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const voiceRepo = __importStar(require("../repositories/voiceRepository"));
const voiceService = __importStar(require("../services/voiceAssistantService"));
const AuditLog_1 = __importDefault(require("../models/AuditLog"));
/**
 * Create a new voice assistant session
 */
const createSession = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { patient_id, doctor_id, telemedicine_session_id, patient_preferred_language, doctor_preferred_language } = req.body;
        if (!patient_id) {
            return res.status(400).json({ message: 'patient_id is required.' });
        }
        const session = yield voiceRepo.createSession({
            patient_id,
            doctor_id,
            telemedicine_session_id,
            patient_preferred_language: patient_preferred_language || 'en',
            doctor_preferred_language: doctor_preferred_language || 'en',
            status: 'active'
        });
        yield AuditLog_1.default.create({
            user_id: new mongoose_1.default.Types.ObjectId(patient_id),
            user_type: 'Patient',
            action: 'VOICE_SESSION_STARTED',
            patient_id,
            details: `Voice assistant session started. Languages: ${patient_preferred_language || 'en'} ↔ ${doctor_preferred_language || 'en'}`
        });
        return res.status(201).json(session);
    }
    catch (error) {
        console.error('Voice Session Create Error:', error);
        return res.status(500).json({ message: error.message || 'Failed to create voice session.' });
    }
});
exports.createSession = createSession;
/**
 * Process a new voice transcript: detect language, translate, optionally run clinical reasoning
 */
const processTranscript = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const sessionId = req.params.sessionId;
        const { speaker_id, speaker_role, original_text, target_language, run_clinical_reasoning } = req.body;
        if (!original_text || !speaker_id) {
            return res.status(400).json({ message: 'original_text and speaker_id are required.' });
        }
        const session = yield voiceRepo.findSessionById(sessionId);
        if (!session) {
            return res.status(404).json({ message: 'Voice session not found.' });
        }
        // Step 1: Detect language
        const startTime = Date.now();
        const detection = yield voiceService.detectLanguage(original_text);
        const detectedLanguage = detection.language || 'en';
        // Step 2: Translate to target language
        const effectiveTarget = target_language || (speaker_role === 'patient' ? session.doctor_preferred_language : session.patient_preferred_language);
        let translatedText = original_text;
        let medicalTerms = [];
        if (detectedLanguage !== effectiveTarget) {
            const translation = yield voiceService.translateMedicalText(original_text, detectedLanguage, effectiveTarget);
            translatedText = translation.translated_text || original_text;
            medicalTerms = translation.medical_terms_preserved || [];
        }
        const processingTime = Date.now() - startTime;
        // Step 3: Save transcript
        const transcript = yield voiceRepo.createTranscript({
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
            yield voiceRepo.createTranslationLog({
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
                ? (yield voiceService.translateMedicalText(original_text, detectedLanguage, 'en')).translated_text
                : original_text;
            const reasoning = yield voiceService.getClinicalReasoning(englishText);
            // Translate AI response back to patient language if needed
            let aiResponseInPatientLang = reasoning.response;
            if (detectedLanguage !== 'en') {
                const backTranslation = yield voiceService.translateMedicalText(reasoning.response, 'en', detectedLanguage);
                aiResponseInPatientLang = backTranslation.translated_text || reasoning.response;
            }
            clinicalResponse = {
                english_response: reasoning.response,
                patient_language_response: aiResponseInPatientLang,
                suggestions: reasoning.suggestions || []
            };
            // Save AI response transcript
            yield voiceRepo.createTranscript({
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
    }
    catch (error) {
        console.error('Process Transcript Error:', error);
        return res.status(500).json({ message: error.message || 'Failed to process transcript.' });
    }
});
exports.processTranscript = processTranscript;
/**
 * Get all transcripts for a session
 */
const getTranscripts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const sessionId = req.params.sessionId;
        const transcripts = yield voiceRepo.findTranscriptsBySession(sessionId);
        return res.status(200).json(transcripts);
    }
    catch (error) {
        return res.status(500).json({ message: error.message || 'Failed to fetch transcripts.' });
    }
});
exports.getTranscripts = getTranscripts;
/**
 * End a voice session
 */
const endSession = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const sessionId = req.params.sessionId;
        const session = yield voiceRepo.findSessionById(sessionId);
        if (!session) {
            return res.status(404).json({ message: 'Session not found.' });
        }
        const duration = Math.floor((Date.now() - new Date(session.createdAt).getTime()) / 1000);
        const updated = yield voiceRepo.updateSession(sessionId, { status: 'completed', duration_seconds: duration });
        return res.status(200).json(updated);
    }
    catch (error) {
        return res.status(500).json({ message: error.message || 'Failed to end session.' });
    }
});
exports.endSession = endSession;
/**
 * Get user voice settings
 */
const getSettings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.params.userId;
        let settings = yield voiceRepo.findSettings(userId);
        if (!settings) {
            settings = yield voiceRepo.upsertSettings(userId, {});
        }
        return res.status(200).json(settings);
    }
    catch (error) {
        return res.status(500).json({ message: error.message || 'Failed to fetch settings.' });
    }
});
exports.getSettings = getSettings;
/**
 * Save/update voice settings
 */
const saveSettings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { user_id, preferred_language, voice_gender, speaking_rate, volume, auto_play_tts, continuous_listening } = req.body;
        if (!user_id) {
            return res.status(400).json({ message: 'user_id is required.' });
        }
        const settings = yield voiceRepo.upsertSettings(user_id, {
            preferred_language,
            voice_gender,
            speaking_rate,
            volume,
            auto_play_tts,
            continuous_listening
        });
        return res.status(200).json(settings);
    }
    catch (error) {
        return res.status(500).json({ message: error.message || 'Failed to save settings.' });
    }
});
exports.saveSettings = saveSettings;
/**
 * Get voice assistant analytics for admin dashboard
 */
const getAnalytics = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const analytics = yield voiceRepo.getVoiceAnalytics();
        return res.status(200).json(analytics);
    }
    catch (error) {
        return res.status(500).json({ message: error.message || 'Failed to fetch analytics.' });
    }
});
exports.getAnalytics = getAnalytics;
