import { Request, Response } from 'express';
import * as labService from '../services/labService';
import User from '../models/User';

// Helper to get authenticated user name
const getUserName = async (userId: string): Promise<string> => {
    try {
        const user = await User.findById(userId);
        return user ? user.name : 'Laboratory Staff';
    } catch {
        return 'Laboratory Staff';
    }
};

export const getTestCatalog = async (req: Request, res: Response) => {
    try {
        const catalog = await labService.getTestCatalog();
        return res.json(catalog);
    } catch (e: any) {
        return res.status(500).json({ message: e.message || 'Failed to fetch catalog' });
    }
};

export const getSamplesDashboard = async (req: Request, res: Response) => {
    try {
        const data = await labService.getSamplesDashboardData();
        return res.json(data);
    } catch (e: any) {
        return res.status(500).json({ message: e.message || 'Failed to fetch dashboard data' });
    }
};

export const getLabOrderDetails = async (req: Request, res: Response) => {
    try {
        const { orderId } = req.params;
        const details = await labService.getLabOrderDetails(orderId as string);
        if (!details) {
            return res.status(404).json({ message: 'Lab order not found' });
        }
        return res.json(details);
    } catch (e: any) {
        return res.status(500).json({ message: e.message || 'Failed to fetch lab order details' });
    }
};

export const collectSample = async (req: Request, res: Response) => {
    try {
        const { sampleId, sampleType } = req.body;
        if (!sampleId || !sampleType) {
            return res.status(400).json({ message: 'Missing sampleId or sampleType' });
        }
        const userId = (req as any).user.id || (req as any).user._id;
        const technicianName = await getUserName(userId);

        const sample = await labService.collectSample(sampleId, userId, technicianName, sampleType);
        return res.json(sample);
    } catch (e: any) {
        return res.status(500).json({ message: e.message || 'Failed to collect sample' });
    }
};

export const scanBarcode = async (req: Request, res: Response) => {
    try {
        const { barcode } = req.body;
        if (!barcode) {
            return res.status(400).json({ message: 'Barcode is required' });
        }
        const userId = (req as any).user.id || (req as any).user._id;
        const technicianName = await getUserName(userId);

        const sample = await labService.scanBarcode(barcode, userId, technicianName);
        return res.json(sample);
    } catch (e: any) {
        return res.status(500).json({ message: e.message || 'Failed to process barcode' });
    }
};

export const updateSampleStatus = async (req: Request, res: Response) => {
    try {
        const { sampleId, status, rejectionReason } = req.body;
        if (!sampleId || !status) {
            return res.status(400).json({ message: 'Missing sampleId or status' });
        }
        const userId = (req as any).user.id || (req as any).user._id;
        const technicianName = await getUserName(userId);

        const sample = await labService.updateSampleStatus(sampleId, status, userId, technicianName, rejectionReason);
        return res.json(sample);
    } catch (e: any) {
        return res.status(500).json({ message: e.message || 'Failed to update sample status' });
    }
};

export const submitResults = async (req: Request, res: Response) => {
    try {
        const { labOrderId, results, remarks } = req.body;
        if (!labOrderId || !results || !Array.isArray(results)) {
            return res.status(400).json({ message: 'Invalid payload. labOrderId and results array are required.' });
        }
        const userId = (req as any).user.id || (req as any).user._id;
        const technicianName = await getUserName(userId);

        const report = await labService.submitResults(labOrderId, results, remarks || '', userId, technicianName);
        return res.json(report);
    } catch (e: any) {
        return res.status(500).json({ message: e.message || 'Failed to submit test results' });
    }
};

export const approveReport = async (req: Request, res: Response) => {
    try {
        const { reportId, digitalSignature } = req.body;
        if (!reportId || !digitalSignature) {
            return res.status(400).json({ message: 'reportId and digitalSignature are required.' });
        }
        const userId = (req as any).user.id || (req as any).user._id;
        const supervisorName = await getUserName(userId);

        const report = await labService.approveReport(reportId, userId, supervisorName, digitalSignature);
        return res.json(report);
    } catch (e: any) {
        return res.status(500).json({ message: e.message || 'Failed to approve report' });
    }
};

export const getPatientLabRecords = async (req: Request, res: Response) => {
    try {
        const { patientId } = req.params;
        const records = await labService.getPatientLabRecords(patientId as string);
        return res.json(records);
    } catch (e: any) {
        return res.status(500).json({ message: e.message || 'Failed to fetch patient lab records' });
    }
};

export const getLIMSAnalytics = async (req: Request, res: Response) => {
    try {
        const analytics = await labService.getLIMSAnalytics();
        return res.json(analytics);
    } catch (e: any) {
        return res.status(500).json({ message: e.message || 'Failed to fetch LIMS analytics' });
    }
};
