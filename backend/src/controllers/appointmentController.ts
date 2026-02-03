import { Request, Response } from 'express';
import Appointment from '../models/Appointment';
import Queue from '../models/Queue';

// Helper to generate slots
const generateTimeSlots = (start: string, end: string, duration: number) => {
    const slots = [];
    let current = new Date(`2024-01-01T${start}:00`);
    const endTime = new Date(`2024-01-01T${end}:00`);

    while (current < endTime) {
        slots.push(current.toTimeString().slice(0, 5));
        current.setMinutes(current.getMinutes() + duration);
    }
    return slots;
};

export const getSlots = async (req: Request, res: Response) => {
    try {
        const { doctorId, date } = req.query;
        if (!doctorId || !date) return res.status(400).json({ message: 'Missing doctorId or date' });

        // 1. Generate all possible slots (9 AM - 5 PM, 20 mins)
        const allSlots = generateTimeSlots('09:00', '17:00', 20);

        // 2. Fetch booked slots
        const bookedAppointments = await Appointment.find({ doctor_id: doctorId, date });
        const bookedSlots = bookedAppointments.map(app => app.slot_time);

        // 3. Filter available slots
        const availableSlots = allSlots.filter(slot => !bookedSlots.includes(slot));

        res.json({ slots: availableSlots });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const bookAppointment = async (req: Request, res: Response) => {
    try {
        const { patient_id, doctor_id, date, slot_time } = req.body;

        // Check if slot is already taken
        const existing = await Appointment.findOne({ doctor_id, date, slot_time });
        if (existing) return res.status(409).json({ message: 'Slot already booked' });

        // Logic to calculate waiting token number
        const count = await Appointment.countDocuments({ doctor_id, date });
        const token_number = count + 1;

        const appointment = await Appointment.create({
            patient_id,
            doctor_id,
            date,
            slot_time,
            token_number
        });

        // Update Queue (Add to waiting list)
        // Find existing queue or create one? queueService.getQueueStatus handles creation but let's just update if exists
        // simplified: when appointment is "checked in" it enters queue. 
        // For now, let's assume booking doesn't immediately put you in "active queue" until you arrive.
        // But the requirement says "Token Generation after booking".

        res.status(201).json({ message: 'Appointment booked', appointment, token_number });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
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
