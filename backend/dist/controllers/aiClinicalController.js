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
exports.getAdminStats = exports.getHealthScores = exports.getAssessments = exports.calculateHealthScore = exports.checkSymptoms = void 0;
const Authentication_1 = __importDefault(require("../models/Authentication"));
const Patient_1 = __importDefault(require("../models/Patient"));
const MedicalProfile_1 = __importDefault(require("../models/MedicalProfile"));
const SymptomAssessment_1 = __importDefault(require("../models/SymptomAssessment"));
const HealthScore_1 = __importDefault(require("../models/HealthScore"));
const AuditLog_1 = __importDefault(require("../models/AuditLog"));
const aiService_1 = require("../services/aiService");
const mongoose_1 = __importDefault(require("mongoose"));
// Helper to resolve patient context from request
const resolvePatient = (req, patientIdParam) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    if (patientIdParam && mongoose_1.default.Types.ObjectId.isValid(patientIdParam)) {
        const patient = yield Patient_1.default.findById(patientIdParam);
        if (patient)
            return patient;
    }
    const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a._id) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id);
    if (!userId) {
        throw new Error('Authentication required to resolve patient profile.');
    }
    const userAuth = yield Authentication_1.default.findById(userId).populate('patient_id');
    if (userAuth === null || userAuth === void 0 ? void 0 : userAuth.patient_id) {
        return userAuth.patient_id;
    }
    // Fallback: search by phone/email
    const query = {};
    if (userAuth === null || userAuth === void 0 ? void 0 : userAuth.phone)
        query.phone = userAuth.phone;
    if (userAuth === null || userAuth === void 0 ? void 0 : userAuth.email)
        query.email = userAuth.email;
    if (Object.keys(query).length > 0) {
        const patient = yield Patient_1.default.findOne(query);
        if (patient)
            return patient;
    }
    throw new Error('Patient profile could not be found for this user.');
});
/**
 * Endpoint to analyze symptoms using Gemini AI via Python FastAPI service
 */
const checkSymptoms = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { symptoms, description, language, patientId } = req.body;
        if (!Array.isArray(symptoms) || symptoms.length === 0) {
            return res.status(400).json({ message: 'Symptoms must be a non-empty array.' });
        }
        const patient = yield resolvePatient(req, patientId);
        const age = patient.age || 35;
        const result = yield (0, aiService_1.analyzeSymptoms)(symptoms, age, description, language || 'en');
        const assessment = yield SymptomAssessment_1.default.create({
            patient_id: patient._id,
            symptoms,
            description,
            triage_level: result.triage_level || 'Routine',
            potential_conditions: result.potential_conditions || [],
            recommended_department: result.recommended_department || 'General Medicine',
            suggested_next_steps: result.suggested_next_steps || [],
            language: language || 'en'
        });
        // Audit log entry
        yield AuditLog_1.default.create({
            user_id: new mongoose_1.default.Types.ObjectId(patient._id),
            user_type: 'Patient',
            action: 'AI_SYMPTOM_ASSESSMENT',
            patient_id: patient._id,
            details: `AI Symptom Assessment completed. Urgency: ${assessment.triage_level}. Recommended Specialty: ${assessment.recommended_department}.`
        });
        return res.status(200).json(assessment);
    }
    catch (error) {
        console.error('Symptom Check Controller Error:', error);
        return res.status(500).json({ message: error.message || 'An error occurred during symptom check.' });
    }
});
exports.checkSymptoms = checkSymptoms;
/**
 * Endpoint to calculate health scores & chronic risks from patient records and vitals
 */
const calculateHealthScore = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const { patientId } = req.body;
        const patient = yield resolvePatient(req, patientId);
        // Get medical profile & vitals
        const profile = yield MedicalProfile_1.default.findOne({ patient_id: patient._id });
        // Dynamic vitals resolution if a Vitals model exists. If not, default to standard.
        let vitalsList = [];
        try {
            const VitalsModel = mongoose_1.default.model('Vitals');
            vitalsList = yield VitalsModel.find({ patient_id: patient._id }).sort({ createdAt: -1 }).limit(5);
        }
        catch (vErr) {
            // Ignore if vitals model doesn't exist
        }
        const riskInput = {
            age: patient.age || 35,
            gender: patient.gender || 'Male',
            existing_diseases: (profile === null || profile === void 0 ? void 0 : profile.existing_diseases) || [],
            allergies: (profile === null || profile === void 0 ? void 0 : profile.allergies) || [],
            current_medications: (profile === null || profile === void 0 ? void 0 : profile.current_medications) || [],
            lifestyle: (profile === null || profile === void 0 ? void 0 : profile.lifestyle) || {},
            vitals: vitalsList.map((v) => ({
                blood_pressure: v.blood_pressure || v.systolic ? `${v.systolic}/${v.diastolic}` : '120/80',
                heart_rate: v.heart_rate || v.pulse || 72,
                temperature: v.temperature || 98.6,
                spo2: v.spo2 || v.oxygen_saturation || 98,
                weight: v.weight || 70,
                recordedAt: v.createdAt || new Date()
            }))
        };
        const result = yield (0, aiService_1.calculateHealthRisk)(riskInput);
        const score = yield HealthScore_1.default.create({
            patient_id: patient._id,
            cardiovascular_risk: (_a = result.cardiovascular_risk) !== null && _a !== void 0 ? _a : 12,
            diabetes_risk: (_b = result.diabetes_risk) !== null && _b !== void 0 ? _b : 15,
            wellness_score: (_c = result.wellness_score) !== null && _c !== void 0 ? _c : 80,
            factors: result.factors || ['Default profile baseline'],
            recommendations: result.recommendations || ['Maintain healthy activity and daily hydration.']
        });
        // Audit log entry
        yield AuditLog_1.default.create({
            user_id: new mongoose_1.default.Types.ObjectId(patient._id),
            user_type: 'Patient',
            action: 'AI_HEALTH_SCORE_CALCULATION',
            patient_id: patient._id,
            details: `Calculated health risk parameters: Cardiovascular: ${score.cardiovascular_risk}%, Diabetes: ${score.diabetes_risk}%, Wellness Index: ${score.wellness_score}/100.`
        });
        return res.status(200).json(score);
    }
    catch (error) {
        console.error('Calculate Health Score Error:', error);
        return res.status(500).json({ message: error.message || 'An error occurred during health score calculation.' });
    }
});
exports.calculateHealthScore = calculateHealthScore;
/**
 * Retrieve patient's historical symptom assessments
 */
const getAssessments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const patientId = req.params.patientId;
        const patient = yield resolvePatient(req, patientId);
        const assessments = yield SymptomAssessment_1.default.find({ patient_id: patient._id })
            .sort({ createdAt: -1 })
            .limit(20);
        return res.status(200).json(assessments);
    }
    catch (error) {
        return res.status(500).json({ message: error.message || 'Failed to fetch assessments.' });
    }
});
exports.getAssessments = getAssessments;
/**
 * Retrieve patient's historical health scores
 */
const getHealthScores = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const patientId = req.params.patientId;
        const patient = yield resolvePatient(req, patientId);
        const scores = yield HealthScore_1.default.find({ patient_id: patient._id })
            .sort({ createdAt: -1 })
            .limit(20);
        return res.status(200).json(scores);
    }
    catch (error) {
        return res.status(500).json({ message: error.message || 'Failed to fetch health scores.' });
    }
});
exports.getHealthScores = getHealthScores;
/**
 * Retrieve system-wide AI usage statistics and safety audit trails for administrators
 */
const getAdminStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Triage category distribution
        const triageStats = yield SymptomAssessment_1.default.aggregate([
            { $group: { _id: '$triage_level', count: { $sum: 1 } } }
        ]);
        // Department recommendations distribution
        const deptStats = yield SymptomAssessment_1.default.aggregate([
            { $group: { _id: '$recommended_department', count: { $sum: 1 } } }
        ]);
        // Average risk scores
        const riskMetrics = yield HealthScore_1.default.aggregate([
            {
                $group: {
                    _id: null,
                    avgCardioRisk: { $avg: '$cardiovascular_risk' },
                    avgDiabetesRisk: { $avg: '$diabetes_risk' },
                    avgWellness: { $avg: '$wellness_score' }
                }
            }
        ]);
        // Grab recent audit logs matching AI symptom checks & safety checks
        const recentAudits = yield AuditLog_1.default.find({
            action: { $in: ['PRESCRIPTION_SAFETY_CHECK', 'AI_SYMPTOM_ASSESSMENT', 'AI_HEALTH_SCORE_CALCULATION'] }
        })
            .sort({ createdAt: -1 })
            .limit(20);
        return res.status(200).json({
            triageStats,
            deptStats,
            riskMetrics: riskMetrics[0] || { avgCardioRisk: 0, avgDiabetesRisk: 0, avgWellness: 0 },
            recentAudits
        });
    }
    catch (error) {
        return res.status(500).json({ message: error.message || 'Failed to fetch admin stats.' });
    }
});
exports.getAdminStats = getAdminStats;
