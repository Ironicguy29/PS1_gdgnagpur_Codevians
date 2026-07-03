import { Request, Response, NextFunction } from 'express';
import { digitalTwinService } from '../services/digitalTwinService';

export const getCampus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await digitalTwinService.getCampusData();
        res.status(200).json({ success: true, ...data });
    } catch (error) {
        next(error);
    }
};

export const getAssets = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const assets = await digitalTwinService.getLiveAssets();
        res.status(200).json({ success: true, assets });
    } catch (error) {
        next(error);
    }
};

export const getRoutes = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const routes = await digitalTwinService.getNavigationRoutes();
        res.status(200).json({ success: true, routes });
    } catch (error) {
        next(error);
    }
};

export const updateTelemetry = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { assetId } = req.params;
        const asset = await digitalTwinService.updateAssetTelemetry(assetId as string, req.body);
        res.status(200).json({ success: true, asset });
    } catch (error) {
        next(error);
    }
};

export const toggleEmergency = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { routeId } = req.params;
        const { isEmergency, isBlocked } = req.body;
        const route = await digitalTwinService.toggleEmergencyRoute(routeId as string, isEmergency, isBlocked);
        res.status(200).json({ success: true, route });
    } catch (error) {
        next(error);
    }
};

// Simulation trigger (handy for testing or starting intervals from admin desk)
export const triggerSimulation = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await digitalTwinService.simulateStep();
        res.status(200).json({ success: true, message: 'Simulation step complete' });
    } catch (error) {
        next(error);
    }
};
