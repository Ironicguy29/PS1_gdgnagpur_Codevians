import { Request, Response } from 'express';
import Doctor from '../models/Doctor';
import User from '../models/User';

export const getDoctors = async (req: Request, res: Response) => {
    try {
        const doctors = await Doctor.find().populate('user_id', 'name');
        res.json(doctors);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updateStatus = async (req: Request, res: Response) => {
    try {
        const { doctorId, isAvailable } = req.body;
        const doctor = await Doctor.findOneAndUpdate(
            { user_id: doctorId },
            { is_available: isAvailable },
            { new: true }
        );
        res.json(doctor);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
