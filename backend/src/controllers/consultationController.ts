import { Request, Response } from 'express';
import * as consultationService from '../services/consultationService';
import Doctor from '../models/Doctor';
import { evaluatePrescriptionSafety } from '../services/medicationSafetyService';

// Helper to get Doctor Document ID from authenticated User ID
const getDoctorIdFromUser = async (userId: string): Promise<string> => {
    const doctor = await Doctor.findOne({ user_id: userId });
    if (!doctor) {
        throw new Error("Authenticated user is not registered as a Doctor.");
    }
    return doctor._id.toString();
};

export const startConsultation = async (req: Request, res: Response) => {
    try {
        const { patient_id, token_id } = req.body;
        if (!patient_id) {
            return res.status(400).json({ message: "Patient ID is required." });
        }

        const userId = (req as any).user.id;
        const doctorId = await getDoctorIdFromUser(userId);

        const consultation = await consultationService.startConsultation(patient_id, doctorId, token_id);
        return res.status(200).json(consultation);
    } catch (e: any) {
        console.error(e);
        return res.status(500).json({ message: e.message || "Failed to start consultation." });
    }
};

export const getConsultation = async (req: Request, res: Response) => {
    try {
        const { consultationId } = req.params;
        if (!consultationId) {
            return res.status(400).json({ message: "Consultation ID is required." });
        }
        const consultation = await consultationService.getConsultationById(consultationId as string);
        if (!consultation) {
            return res.status(404).json({ message: "Consultation not found." });
        }
        return res.status(200).json(consultation);
    } catch (e: any) {
        console.error(e);
        return res.status(500).json({ message: e.message || "Failed to fetch consultation." });
    }
};

export const getConsultationContext = async (req: Request, res: Response) => {
    try {
        const { patientId } = req.params;
        if (!patientId) {
            return res.status(400).json({ message: "Patient ID parameter is required." });
        }

        const userId = (req as any).user.id;
        const doctorId = await getDoctorIdFromUser(userId);

        const context = await consultationService.getConsultationContext(patientId as string, doctorId);
        return res.status(200).json(context);
    } catch (e: any) {
        console.error(e);
        return res.status(500).json({ message: e.message || "Failed to retrieve consultation context." });
    }
};

export const completeConsultation = async (req: Request, res: Response) => {
    try {
        const { consultationId } = req.params;
        if (!consultationId) {
            return res.status(400).json({ message: "Consultation ID is required." });
        }

        const userId = (req as any).user.id;
        const doctorId = await getDoctorIdFromUser(userId);

        const result = await consultationService.completeConsultation(consultationId as string, doctorId, req.body);
        return res.status(200).json({
            message: "Consultation completed successfully and EMR records updated.",
            consultation: result
        });
    } catch (e: any) {
        console.error(e);
        return res.status(500).json({ message: e.message || "Failed to complete consultation." });
    }
};

export const getAnalytics = async (req: Request, res: Response) => {
    try {
        const analytics = await consultationService.getAnalytics();
        return res.status(200).json(analytics);
    } catch (e: any) {
        console.error(e);
        return res.status(500).json({ message: e.message || "Failed to fetch analytics." });
    }
};

export const checkSafety = async (req: Request, res: Response) => {
    try {
        const { patientId, medicines } = req.body;
        if (!patientId || !medicines) {
            return res.status(400).json({ message: "patientId and medicines array are required." });
        }
        const userId = (req as any).user.id;
        const doctorId = await getDoctorIdFromUser(userId);
        
        const warnings = await evaluatePrescriptionSafety(patientId, medicines, doctorId);
        return res.status(200).json({ success: true, data: warnings });
    } catch (e: any) {
        console.error(e);
        return res.status(500).json({ message: e.message || "Safety check failed." });
    }
};

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
