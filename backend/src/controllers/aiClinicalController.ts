import { Request, Response } from 'express';
import Authentication from '../models/Authentication';
import Patient from '../models/Patient';
import MedicalProfile from '../models/MedicalProfile';
import SymptomAssessment from '../models/SymptomAssessment';
import HealthScore from '../models/HealthScore';
import AuditLog from '../models/AuditLog';
import { analyzeSymptoms, calculateHealthRisk } from '../services/aiService';
import mongoose from 'mongoose';

// Helper to resolve patient context from request
const resolvePatient = async (req: Request, patientIdParam?: string): Promise<any> => {
    if (patientIdParam && mongoose.Types.ObjectId.isValid(patientIdParam)) {
        const patient = await Patient.findById(patientIdParam);
        if (patient) return patient;
    }
    
    const userId = (req as any).user?._id || (req as any).user?.id;
    if (!userId) {
        throw new Error('Authentication required to resolve patient profile.');
    }
    
    const userAuth = await Authentication.findById(userId).populate('patient_id');
    if (userAuth?.patient_id) {
        return userAuth.patient_id;
    }
    
    // Fallback: search by phone/email
    const query: any = {};
    if (userAuth?.phone) query.phone = userAuth.phone;
    if (userAuth?.email) query.email = userAuth.email;
    
    if (Object.keys(query).length > 0) {
        const patient = await Patient.findOne(query);
        if (patient) return patient;
    }
    
    throw new Error('Patient profile could not be found for this user.');
};

/**
 * Endpoint to analyze symptoms using Gemini AI via Python FastAPI service
 */
export const checkSymptoms = async (req: Request, res: Response) => {
    try {
        const { symptoms, description, language, patientId } = req.body;
        
        if (!Array.isArray(symptoms) || symptoms.length === 0) {
            return res.status(400).json({ message: 'Symptoms must be a non-empty array.' });
        }
        
        const patient = await resolvePatient(req, patientId);
        const age = patient.age || 35;
        
        const result = await analyzeSymptoms(symptoms, age, description, language || 'en');
        
        const assessment = await SymptomAssessment.create({
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
        await AuditLog.create({
            user_id: new mongoose.Types.ObjectId(patient._id),
            user_type: 'Patient',
            action: 'AI_SYMPTOM_ASSESSMENT',
            patient_id: patient._id,
            details: `AI Symptom Assessment completed. Urgency: ${assessment.triage_level}. Recommended Specialty: ${assessment.recommended_department}.`
        });
        
        return res.status(200).json(assessment);
    } catch (error: any) {
        console.error('Symptom Check Controller Error:', error);
        return res.status(500).json({ message: error.message || 'An error occurred during symptom check.' });
    }
};

/**
 * Endpoint to calculate health scores & chronic risks from patient records and vitals
 */
export const calculateHealthScore = async (req: Request, res: Response) => {
    try {
        const { patientId } = req.body;
        const patient = await resolvePatient(req, patientId);
        
        // Get medical profile & vitals
        const profile = await MedicalProfile.findOne({ patient_id: patient._id });
        
        // Dynamic vitals resolution if a Vitals model exists. If not, default to standard.
        let vitalsList: any[] = [];
        try {
            const VitalsModel = mongoose.model('Vitals');
            vitalsList = await VitalsModel.find({ patient_id: patient._id }).sort({ createdAt: -1 }).limit(5);
        } catch (vErr) {
            // Ignore if vitals model doesn't exist
        }
        
        const riskInput = {
            age: patient.age || 35,
            gender: patient.gender || 'Male',
            existing_diseases: profile?.existing_diseases || [],
            allergies: profile?.allergies || [],
            current_medications: profile?.current_medications || [],
            lifestyle: profile?.lifestyle || {},
            vitals: vitalsList.map((v: any) => ({
                blood_pressure: v.blood_pressure || v.systolic ? `${v.systolic}/${v.diastolic}` : '120/80',
                heart_rate: v.heart_rate || v.pulse || 72,
                temperature: v.temperature || 98.6,
                spo2: v.spo2 || v.oxygen_saturation || 98,
                weight: v.weight || 70,
                recordedAt: v.createdAt || new Date()
            }))
        };
        
        const result = await calculateHealthRisk(riskInput);
        
        const score = await HealthScore.create({
            patient_id: patient._id,
            cardiovascular_risk: result.cardiovascular_risk ?? 12,
            diabetes_risk: result.diabetes_risk ?? 15,
            wellness_score: result.wellness_score ?? 80,
            factors: result.factors || ['Default profile baseline'],
            recommendations: result.recommendations || ['Maintain healthy activity and daily hydration.']
        });
        
        // Audit log entry
        await AuditLog.create({
            user_id: new mongoose.Types.ObjectId(patient._id),
            user_type: 'Patient',
            action: 'AI_HEALTH_SCORE_CALCULATION',
            patient_id: patient._id,
            details: `Calculated health risk parameters: Cardiovascular: ${score.cardiovascular_risk}%, Diabetes: ${score.diabetes_risk}%, Wellness Index: ${score.wellness_score}/100.`
        });
        
        return res.status(200).json(score);
    } catch (error: any) {
        console.error('Calculate Health Score Error:', error);
        return res.status(500).json({ message: error.message || 'An error occurred during health score calculation.' });
    }
};

/**
 * Retrieve patient's historical symptom assessments
 */
export const getAssessments = async (req: Request, res: Response) => {
    try {
        const patientId = req.params.patientId as string;
        const patient = await resolvePatient(req, patientId);
        
        const assessments = await SymptomAssessment.find({ patient_id: patient._id })
            .sort({ createdAt: -1 })
            .limit(20);
            
        return res.status(200).json(assessments);
    } catch (error: any) {
        return res.status(500).json({ message: error.message || 'Failed to fetch assessments.' });
    }
};

/**
 * Retrieve patient's historical health scores
 */
export const getHealthScores = async (req: Request, res: Response) => {
    try {
        const patientId = req.params.patientId as string;
        const patient = await resolvePatient(req, patientId);
        
        const scores = await HealthScore.find({ patient_id: patient._id })
            .sort({ createdAt: -1 })
            .limit(20);
            
        return res.status(200).json(scores);
    } catch (error: any) {
        return res.status(500).json({ message: error.message || 'Failed to fetch health scores.' });
    }
};

/**
 * Retrieve system-wide AI usage statistics and safety audit trails for administrators
 */
export const getAdminStats = async (req: Request, res: Response) => {
    try {
        // Triage category distribution
        const triageStats = await SymptomAssessment.aggregate([
            { $group: { _id: '$triage_level', count: { $sum: 1 } } }
        ]);
        
        // Department recommendations distribution
        const deptStats = await SymptomAssessment.aggregate([
            { $group: { _id: '$recommended_department', count: { $sum: 1 } } }
        ]);
        
        // Average risk scores
        const riskMetrics = await HealthScore.aggregate([
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
        const recentAudits = await AuditLog.find({
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
    } catch (error: any) {
        return res.status(500).json({ message: error.message || 'Failed to fetch admin stats.' });
    }
};
