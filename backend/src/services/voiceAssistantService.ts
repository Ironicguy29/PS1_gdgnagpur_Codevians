import axios from 'axios';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export const detectLanguage = async (text: string) => {
    try {
        const response = await axios.post(`${AI_SERVICE_URL}/voice/detect-language`, { text });
        return response.data;
    } catch (error) {
        console.error('Voice AI - Language Detection Error:', error);
        return { language: 'en', language_name: 'English', confidence: 0.5 };
    }
};

export const translateMedicalText = async (
    text: string,
    source_language: string,
    target_language: string
) => {
    try {
        const response = await axios.post(`${AI_SERVICE_URL}/voice/translate`, {
            text,
            source_language,
            target_language
        });
        return response.data;
    } catch (error) {
        console.error('Voice AI - Translation Error:', error);
        return { translated_text: text, medical_terms_preserved: [] };
    }
};

export const getClinicalReasoning = async (
    text: string,
    patient_context?: any
) => {
    try {
        const response = await axios.post(`${AI_SERVICE_URL}/voice/clinical-reason`, {
            text,
            patient_context: patient_context || {}
        });
        return response.data;
    } catch (error) {
        console.error('Voice AI - Clinical Reasoning Error:', error);
        return {
            response: 'I understand your concern. Please consult with a medical professional for accurate diagnosis and treatment.',
            suggestions: []
        };
    }
};
