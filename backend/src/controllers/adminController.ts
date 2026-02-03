import { Request, Response } from 'express';
import Appointment from '../models/Appointment';
import Queue from '../models/Queue';

export const getStats = async (req: Request, res: Response) => {
    try {
        const totalAppointments = await Appointment.countDocuments();
        const activeQueues = await Queue.countDocuments({ status: 'active' });
        const pendingAppointments = await Appointment.countDocuments({ status: 'booked' });

        res.json({
            totalAppointments,
            activeQueues,
            pendingAppointments,
            occupancyRate: '85%' // Mock data
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const emergencyOverride = async (req: Request, res: Response) => {
    try {
        const { doctorId, patientDetails } = req.body;
        // Logic to insert emergency appointment specifically
        // Ideally this would push to the FRONT of the queue in QueueService
        console.log(`[EMERGENCY] Override for Doctor ${doctorId}`);
        res.json({ message: 'Emergency patient inserted', priority: 'HIGH' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
