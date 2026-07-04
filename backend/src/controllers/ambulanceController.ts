import { Request, Response } from 'express';
import * as svc from '../services/ambulanceService';

interface AuthReq extends Request { user?: any; }

// ── Fleet ──────────────────────────────────────────────────────────────────
export const getFleet          = async (_: Request, res: Response) => wrap(res, svc.getFleet());
export const getFleetSummary   = async (_: Request, res: Response) => wrap(res, svc.getFleetSummary());
export const createAmbulance   = async (req: Request, res: Response) => wrap(res, svc.createAmbulance(req.body), 201);
export const updateAmbulance   = async (req: Request, res: Response) => wrap(res, svc.updateAmbulance(req.params.id as string, req.body));

// ── Drivers ────────────────────────────────────────────────────────────────
export const getAllDrivers      = async (_: Request, res: Response) => wrap(res, svc.getAllDrivers());
export const getAvailDrivers   = async (_: Request, res: Response) => wrap(res, svc.getAvailableDrivers());
export const createDriver      = async (req: Request, res: Response) => wrap(res, svc.createDriver(req.body), 201);
export const updateDriver      = async (req: Request, res: Response) => wrap(res, svc.updateDriver(req.params.id as string, req.body));

// ── GPS ────────────────────────────────────────────────────────────────────
export const postGPS = async (req: AuthReq, res: Response) => {
    try {
        await svc.updateGPS({
            ambulanceId: req.params.id as string,
            latitude:  Number(req.body.latitude),
            longitude: Number(req.body.longitude),
            speed:     Number(req.body.speed   ?? 0),
            heading:   Number(req.body.heading  ?? 0),
        });
        res.json({ ok: true });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

// ── Dispatch ───────────────────────────────────────────────────────────────
export const dispatch = async (req: AuthReq, res: Response) => {
    try {
        const userId = req.user?._id ?? req.user?.id;
        const result = await svc.dispatchAmbulance({ ...req.body, requestedBy: userId });
        res.status(201).json(result);
    } catch (err: any) {
        const status = err.message.includes('not available') || err.message.includes('No ambulance') ? 422 : 500;
        res.status(status).json({ message: err.message });
    }
};

export const findNearest = async (req: Request, res: Response) => {
    try {
        const lat = Number(req.query.lat);
        const lng = Number(req.query.lng);
        if (isNaN(lat) || isNaN(lng)) return res.status(400).json({ message: 'lat & lng required' });
        const ambulance = await svc.findNearestAmbulance(lat, lng);
        res.json(ambulance ?? { message: 'No ambulances available' });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

export const getActiveDispatches = async (_: Request, res: Response) => wrap(res, svc.getActiveDispatches());
export const getRecentDispatches = async (_: Request, res: Response) => wrap(res, svc.getRecentDispatches());

export const cancelDispatch = async (req: Request, res: Response) => {
    try {
        const dispatch = await svc.getActiveDispatches();
        const d = dispatch.find(x => x._id.toString() === req.params.id);
        if (!d || !d.trip_id) return res.status(404).json({ message: 'Active dispatch not found' });
        const trip = await svc.cancelTrip((d.trip_id as any).toString(), req.body.reason ?? 'Admin cancelled');
        res.json(trip);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

export const reassignDispatch = async (req: Request, res: Response) => {
    try {
        const { ambulanceId, driverId } = req.body;
        const result = await svc.reassignDispatch(req.params.id as string, ambulanceId, driverId);
        res.json(result);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

// ── Trip lifecycle (driver) ─────────────────────────────────────────────────
export const tripAccept        = async (req: Request, res: Response) => wrap(res, svc.driverAcceptTrip(req.params.id as string));
export const tripEnRoute       = async (req: Request, res: Response) => wrap(res, svc.driverStartEnRoute(req.params.id as string));
export const tripArrivePatient = async (req: Request, res: Response) => wrap(res, svc.driverArrivedAtPatient(req.params.id as string));
export const tripStartTransport= async (req: Request, res: Response) => wrap(res, svc.driverStartTransport(req.params.id as string));
export const tripArriveHospital= async (req: Request, res: Response) => wrap(res, svc.driverArrivedAtHospital(req.params.id as string));
export const tripComplete      = async (req: Request, res: Response) => wrap(res, svc.completeTrip(req.params.id as string));
export const tripCancel        = async (req: Request, res: Response) => wrap(res, svc.cancelTrip(req.params.id as string, req.body.reason ?? ''));

export const getTrip = async (req: Request, res: Response) => wrap(res, svc.getTripById(req.params.id as string));

// ── Patient portal ─────────────────────────────────────────────────────────
export const patientActiveTrip = async (req: Request, res: Response) => wrap(res, svc.getActiveTripForPatient(req.params.patientId as string));

// ── Driver dashboard ───────────────────────────────────────────────────────
export const driverCurrentTrip = async (req: Request, res: Response) => wrap(res, svc.getDriverCurrentTrip(req.params.driverId as string));

// ── Analytics ──────────────────────────────────────────────────────────────
export const getAnalytics = async (_: Request, res: Response) => wrap(res, svc.getAnalytics());

// ── Utility ────────────────────────────────────────────────────────────────
async function wrap(res: Response, promise: Promise<any>, status = 200) {
    try {
        const data = await promise;
        res.status(status).json(data ?? null);
    } catch (err: any) {
        const code = err.message.includes('not found') ? 404 : 500;
        res.status(code).json({ message: err.message });
    }
}

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
