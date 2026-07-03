"use strict";
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
exports.getClinicalReasoning = exports.translateMedicalText = exports.detectLanguage = void 0;
const axios_1 = __importDefault(require("axios"));
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const detectLanguage = (text) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield axios_1.default.post(`${AI_SERVICE_URL}/voice/detect-language`, { text });
        return response.data;
    }
    catch (error) {
        console.error('Voice AI - Language Detection Error:', error);
        return { language: 'en', language_name: 'English', confidence: 0.5 };
    }
});
exports.detectLanguage = detectLanguage;
const translateMedicalText = (text, source_language, target_language) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield axios_1.default.post(`${AI_SERVICE_URL}/voice/translate`, {
            text,
            source_language,
            target_language
        });
        return response.data;
    }
    catch (error) {
        console.error('Voice AI - Translation Error:', error);
        return { translated_text: text, medical_terms_preserved: [] };
    }
});
exports.translateMedicalText = translateMedicalText;
const getClinicalReasoning = (text, patient_context) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield axios_1.default.post(`${AI_SERVICE_URL}/voice/clinical-reason`, {
            text,
            patient_context: patient_context || {}
        });
        return response.data;
    }
    catch (error) {
        console.error('Voice AI - Clinical Reasoning Error:', error);
        return {
            response: 'I understand your concern. Please consult with a medical professional for accurate diagnosis and treatment.',
            suggestions: []
        };
    }
});
exports.getClinicalReasoning = getClinicalReasoning;
