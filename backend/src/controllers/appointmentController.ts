import { Request, Response } from 'express';
import Appointment from '../models/Appointment';
import Queue from '../models/Queue';
import Token from '../models/Token';
import Doctor from '../models/Doctor';
import mongoose from 'mongoose';
import { getQueueStatus, createQueueToken } from '../services/queueService';

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

        // Resolve doctor to ensure correctness
        const doctor = await Doctor.findOne({ $or: [
            { _id: mongoose.isValidObjectId(doctorId) ? doctorId : new mongoose.Types.ObjectId() },
            { user_id: mongoose.isValidObjectId(doctorId) ? doctorId : new mongoose.Types.ObjectId() }
        ]});

        if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

        const doctorDocId = doctor._id;

        // 1. Generate all possible slots (9 AM - 5 PM, 20 mins)
        const allSlots = generateTimeSlots('09:00', '17:00', 20);

        // 2. Fetch booked slots
        const bookedAppointments = await Appointment.find({ doctor_id: doctorDocId, date });
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

        if (!patient_id || !doctor_id || !date || !slot_time) {
            return res.status(400).json({ message: 'Missing required booking parameters' });
        }

        // Resolve doctor
        const doctor = await Doctor.findOne({ $or: [
            { _id: mongoose.isValidObjectId(doctor_id) ? doctor_id : new mongoose.Types.ObjectId() },
            { user_id: mongoose.isValidObjectId(doctor_id) ? doctor_id : new mongoose.Types.ObjectId() }
        ]});
        if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

        const doctorDocId = doctor._id;

        // Check if slot is already taken
        const existing = await Appointment.findOne({ doctor_id: doctorDocId, date, slot_time });
        if (existing) return res.status(409).json({ message: 'Slot already booked' });

        // Logic to calculate waiting token number
        const count = await Appointment.countDocuments({ doctor_id: doctorDocId, date });
        const token_number = count + 1;

        const appointment = await Appointment.create({
            patient_id,
            doctor_id: doctorDocId,
            date,
            slot_time,
            token_number
        });

        // Update Queue and Create Token using service
        const dateStr = new Date(date).toISOString().split('T')[0];
        const token = await createQueueToken(
            appointment._id.toString(),
            doctorDocId.toString(),
            patient_id,
            dateStr,
            'Normal'
        );

        res.status(201).json({ 
            message: 'Appointment booked', 
            appointment, 
            token_number: token.token_number,
            token 
        });
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

export const getPatientAppointments = async (req: Request, res: Response) => {
    try {
        const { patientId } = req.params;
        const appointments = await Appointment.find({ patient_id: patientId })
            .populate({
                path: 'doctor_id',
                populate: { path: 'user_id', select: 'name' }
            })
            .sort({ date: -1, slot_time: -1 });

        res.json(appointments);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
