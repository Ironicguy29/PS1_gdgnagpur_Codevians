import { Request, Response } from 'express';
import * as queueService from '../services/queueService';
import Token from '../models/Token';
import Doctor from '../models/Doctor';
import Patient from '../models/Patient';
import mongoose from 'mongoose';

export const getQueue = async (req: Request, res: Response) => {
    try {
        const doctorId = req.params.doctorId as string;
        const date = new Date().toISOString().split('T')[0]; // Today
        const queue = await queueService.getQueueStatus(doctorId, date);

        // Fetch all tokens for this queue
        const tokens = await Token.find({ queue_id: queue._id })
            .populate('patient_id')
            .sort({ token_number: 1 });

        res.json({ queue, tokens });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const nextPatient = async (req: Request, res: Response) => {
    try {
        const { doctorId } = req.body;
        const nextToken = await queueService.callNextPatient(doctorId);
        if (!nextToken) {
            return res.status(404).json({ message: 'No waiting patients in queue' });
        }
        res.json(nextToken);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const checkIn = async (req: Request, res: Response) => {
    try {
        const { tokenId, method } = req.body;
        if (!tokenId) return res.status(400).json({ message: 'Missing tokenId' });
        
        const token = await queueService.checkInPatient(tokenId, method || 'mobile');
        res.json(token);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const startConsultation = async (req: Request, res: Response) => {
    try {
        const { tokenId } = req.body;
        if (!tokenId) return res.status(400).json({ message: 'Missing tokenId' });
        
        const token = await queueService.startConsultation(tokenId);
        res.json(token);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const completeConsultation = async (req: Request, res: Response) => {
    try {
        const { tokenId } = req.body;
        if (!tokenId) return res.status(400).json({ message: 'Missing tokenId' });
        
        const token = await queueService.completeConsultation(tokenId);
        res.json(token);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const skipPatient = async (req: Request, res: Response) => {
    try {
        const { tokenId } = req.body;
        if (!tokenId) return res.status(400).json({ message: 'Missing tokenId' });
        
        const token = await queueService.skipPatient(tokenId);
        res.json(token);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const emergency = async (req: Request, res: Response) => {
    try {
        const { patientId, doctorId, reason, severity } = req.body;
        const token = await queueService.insertEmergency(doctorId, patientId, reason, severity);
        res.json(token);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const transfer = async (req: Request, res: Response) => {
    try {
        const { tokenId, targetDoctorId } = req.body;
        const token = await queueService.transferPatient(tokenId, targetDoctorId);
        res.json(token);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const changeDuration = async (req: Request, res: Response) => {
    try {
        const { doctorId, newDuration } = req.body;
        await queueService.changeConsultationDuration(doctorId, parseInt(newDuration));
        res.json({ message: 'Consultation duration and wait times updated successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const pauseQueue = async (req: Request, res: Response) => {
    try {
        const { doctorId, isPaused } = req.body;
        const queue = await queueService.pauseQueue(doctorId, isPaused);
        res.json(queue);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getAnalytics = async (req: Request, res: Response) => {
    try {
        const { date, department } = req.query;
        if (!date || !department) return res.status(400).json({ message: 'Missing date or department' });
        
        const analytics = await queueService.generateAnalytics(date as string, department as string);
        res.json(analytics);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getPatientLiveToken = async (req: Request, res: Response) => {
    try {
        const { patientId } = req.params;
        const date = new Date().toISOString().split('T')[0];

        const token = await Token.findOne({
            patient_id: patientId,
            createdAt: {
                $gte: new Date(`${date}T00:00:00.000Z`),
                $lte: new Date(`${date}T23:59:59.999Z`)
            },
            status: { $ne: 'Cancelled' }
        }).populate('doctor_id').populate('queue_id');

        if (!token) {
            return res.status(404).json({ message: 'No live token for patient today' });
        }

        const queue = token.queue_id as any;
        const position = await Token.countDocuments({
            queue_id: queue._id,
            status: { $in: ['Waiting', 'Checked In', 'Emergency', 'Booked'] },
            token_number: { $lt: token.token_number }
        }) + 1;

        res.json({
            token,
            position,
            doctor: token.doctor_id,
            queue
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const predictWait = async (req: Request, res: Response) => {
    try {
        const queueId = req.params.queueId as string;
        const tokenNumber = req.params.tokenNumber as string;
        const waitTime = await queueService.predictWaitTime(queueId, parseInt(tokenNumber));
        res.json({ waitTime });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const generateWalkInToken = async (req: Request, res: Response) => {
    try {
        const { patientId, department } = req.body;
        if (!patientId || !department) {
            return res.status(400).json({ message: 'Missing patientId or department' });
        }

        // Find patient
        const patient = await Patient.findById(patientId);
        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        // Find a doctor in the department
        const doctor = await Doctor.findOne({ department, is_available: true });
        if (!doctor) {
            return res.status(404).json({ message: `No available doctor in department: ${department}` });
        }

        const date = new Date().toISOString().split('T')[0];

        // Create token
        const token = await queueService.createQueueToken(
            null, // No pre-booked appointment
            doctor._id.toString(),
            patient._id.toString(),
            date,
            'Normal',
            'Walk-in OPD consultation'
        );

        res.json({
            message: 'Walk-in token generated successfully',
            token
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

