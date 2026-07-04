import { Request, Response } from 'express';
import * as emrService from '../services/emrService';

export const getProfile = async (req: Request, res: Response) => {
    try {
        const { patientId } = req.params;
        const profile = await emrService.getMedicalProfile(patientId as string);
        res.json(profile || {});
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
};

export const updateProfile = async (req: Request, res: Response) => {
    try {
        const { patientId } = req.params;
        const { operatorId, operatorRole, ...profileData } = req.body;
        
        // Default values for operator if not supplied (for ease of dev/test)
        const opId = (operatorId as string) || '6a46a645e427b1051886244e';
        const opRole = (operatorRole as 'Doctor' | 'Patient' | 'Admin' | 'Lab') || 'Doctor';

        const profile = await emrService.updateMedicalProfile(patientId as string, profileData, opId, opRole);
        res.json({ message: "Medical profile updated successfully", profile });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
};

export const getVisits = async (req: Request, res: Response) => {
    try {
        const { patientId } = req.params;
        const visits = await emrService.getVisitHistory(patientId as string);
        res.json(visits);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
};

export const createVisit = async (req: Request, res: Response) => {
    try {
        const { operatorId, operatorRole, ...visitData } = req.body;

        const opId = (operatorId as string) || (visitData.doctor_id as string);
        const opRole = (operatorRole as 'Doctor' | 'Patient' | 'Admin' | 'Lab') || 'Doctor';

        const visit = await emrService.createVisitRecord(visitData, opId, opRole);
        res.status(201).json({ message: "Clinical visit recorded successfully", visit });
    } catch (e: any) {
        res.status(400).json({ error: e.message });
    }
};

export const getVitals = async (req: Request, res: Response) => {
    try {
        const { patientId } = req.params;
        const vitals = await emrService.getVitalsHistory(patientId as string);
        res.json(vitals);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
};

export const updateLab = async (req: Request, res: Response) => {
    try {
        const { orderId } = req.params;
        const { operatorId, operatorRole, ...updateData } = req.body;

        const opId = (operatorId as string) || '6a46a645e427b1051886244e';
        const opRole = (operatorRole as 'Doctor' | 'Patient' | 'Admin' | 'Lab') || 'Doctor';

        const lab = await emrService.updateLabOrderStatus(orderId as string, updateData, opId, opRole);
        res.json({ message: "Lab order status updated successfully", lab });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
};

export const uploadAttachment = async (req: Request, res: Response) => {
    try {
        const { visitId } = req.params;
        const { operatorId, operatorRole, attachment } = req.body;

        const opId = (operatorId as string) || '6a46a645e427b1051886244e';
        const opRole = (operatorRole as 'Doctor' | 'Patient' | 'Admin' | 'Lab') || 'Doctor';

        const visit = await emrService.addAttachmentToVisit(visitId as string, attachment, opId, opRole);
        res.json({ message: "Attachment added successfully", visit });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
};

export const getNotes = async (req: Request, res: Response) => {
    try {
        const { patientId, doctorId } = req.query;
        if (!patientId || !doctorId) {
            return res.status(400).json({ error: "patientId and doctorId are required" });
        }
        const notes = await emrService.getDoctorNotes(patientId as string, doctorId as string);
        res.json(notes);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
};

export const getAudit = async (req: Request, res: Response) => {
    try {
        const { patientId } = req.params;
        const logs = await emrService.getAuditHistory(patientId as string);
        res.json(logs);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
};

export const getLabOrders = async (req: Request, res: Response) => {
    try {
        const { status } = req.query;
        const orders = await emrService.getLabOrders(status as string);
        res.json(orders);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
};

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
