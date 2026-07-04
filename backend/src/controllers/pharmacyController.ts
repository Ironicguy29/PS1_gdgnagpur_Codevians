import { Request, Response, NextFunction } from 'express';
import * as pharmacyService from '../services/pharmacyService';

export const getMedicineCatalog = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const catalog = await pharmacyService.getMedicineCatalog();
        res.status(200).json({ success: true, data: catalog });
    } catch (error) {
        next(error);
    }
};

export const getPrescriptions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { status } = req.query;
        const prescriptions = await pharmacyService.getPrescriptions(status as string);
        res.status(200).json({ success: true, data: prescriptions });
    } catch (error) {
        next(error);
    }
};

export const getPrescriptionById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = req.params.id as string;
        const prescription = await pharmacyService.getPrescriptionById(id);
        if (!prescription) {
            res.status(404).json({ success: false, message: 'Prescription not found' });
            return;
        }
        res.status(200).json({ success: true, data: prescription });
    } catch (error) {
        next(error);
    }
};

export const updatePrescriptionStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = req.params.id as string;
        const { status } = req.body;
        const updated = await pharmacyService.updatePrescriptionStatus(id, status);
        res.status(200).json({ success: true, data: updated });
    } catch (error) {
        next(error);
    }
};

export const checkSafetyInteractions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { medicines } = req.body; // array of medicine names
        const interactions = await pharmacyService.checkSafetyInteractions(medicines);
        res.status(200).json({ success: true, data: interactions });
    } catch (error) {
        next(error);
    }
};

export const dispensePrescription = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = req.params.id as string;
        const { pharmacist_id, items, discount_amount, insurance_covered_amount, payment_method } = req.body;
        
        if (!items || items.length === 0) {
            res.status(400).json({ success: false, message: 'Items to dispense are required' });
            return;
        }

        const result = await pharmacyService.dispensePrescription(id, pharmacist_id, {
            items,
            discount_amount,
            insurance_covered_amount,
            payment_method
        });
        res.status(200).json({ success: true, data: result });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message || 'Dispensing failed' });
    }
};

export const getInventoryList = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const inventory = await pharmacyService.getInventoryList();
        res.status(200).json({ success: true, data: inventory });
    } catch (error) {
        next(error);
    }
};

export const getBatchesByMedicine = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const medicineId = req.params.medicineId as string;
        const batches = await pharmacyService.getBatchesByMedicine(medicineId);
        res.status(200).json({ success: true, data: batches });
    } catch (error) {
        next(error);
    }
};

export const getNearExpiryList = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { days } = req.query;
        const batches = await pharmacyService.getNearExpiryList(days ? parseInt(days as string) : undefined);
        res.status(200).json({ success: true, data: batches });
    } catch (error) {
        next(error);
    }
};

export const getExpiredList = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const batches = await pharmacyService.getExpiredList();
        res.status(200).json({ success: true, data: batches });
    } catch (error) {
        next(error);
    }
};

export const getSuppliers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const suppliers = await pharmacyService.getSuppliers();
        res.status(200).json({ success: true, data: suppliers });
    } catch (error) {
        next(error);
    }
};

export const createSupplier = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const supplier = await pharmacyService.createSupplier(req.body);
        res.status(201).json({ success: true, data: supplier });
    } catch (error) {
        next(error);
    }
};

export const getPurchaseOrders = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const orders = await pharmacyService.getPurchaseOrders();
        res.status(200).json({ success: true, data: orders });
    } catch (error) {
        next(error);
    }
};

export const createPurchaseOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const order = await pharmacyService.createPurchaseOrder(req.body);
        res.status(201).json({ success: true, data: order });
    } catch (error) {
        next(error);
    }
};

export const receivePurchaseOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = req.params.id as string;
        const { batchPrefix } = req.body;
        const order = await pharmacyService.receivePurchaseOrder(id, batchPrefix);
        res.status(200).json({ success: true, data: order });
    } catch (error) {
        next(error);
    }
};

export const getPharmacyAnalytics = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const analytics = await pharmacyService.getPharmacyAnalytics();
        res.status(200).json({ success: true, data: analytics });
    } catch (error) {
        next(error);
    }
};

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
