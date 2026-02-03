import { Request, Response } from 'express';
import Appointment from '../models/Appointment';
import Queue from '../models/Queue';

export const bookAppointment = async (req: Request, res: Response) => {
    try {
        const { patient_id, doctor_id, date, slot_time } = req.body;

        // Logic to calculate waiting token number could be complex, simple increment here
        const count = await Appointment.countDocuments({ doctor_id, date });
        const token_number = count + 1;

        const appointment = await Appointment.create({
            patient_id,
            doctor_id,
            date,
            slot_time,
            token_number
        });

        res.status(201).json({ message: 'Appointment booked', appointment, token_number });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getSlots = async (req: Request, res: Response) => {
    // Mock slot availability logic
    res.json({ slots: ['10:00', '10:15', '10:30', '10:45'] });
};

export const checkIn = async (req: Request, res: Response) => {
    try {
        const { appointmentId } = req.body;
        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

        appointment.status = 'completed'; // Or 'waiting' if logic dictates
        await appointment.save();

        res.json({ message: 'Check-in successful' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
