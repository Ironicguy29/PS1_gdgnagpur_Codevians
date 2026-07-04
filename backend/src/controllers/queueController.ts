import { Request, Response } from 'express';
import * as queueService from '../services/queueService';
import Token from '../models/Token';
import Queue from '../models/Queue';
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

export const getQueueForecast = async (req: Request, res: Response) => {
    try {
        const { doctorId } = req.query;
        const patient = (req as any).user;

        // Get all doctors' queues for current date
        const today = new Date().toISOString().split('T')[0];
        const queues = await Queue.find({ date: today }).populate('doctor_id');

        const forecasts = queues.map((queue: any) => {
            const doctor = queue.doctor_id;
            const waitingTokens = (queue.tokens as any[])?.filter((t: any) => t.status === 'waiting').length || 0;
            const avgConsultTime = doctor?.avg_consultation_time || 15;
            
            // Calculate estimated wait time
            const estimatedWait = Math.ceil(waitingTokens * avgConsultTime / 60);
            
            // Determine delay status
            let delayStatus = 'on-time';
            let delayMinutes = 0;
            
            if (estimatedWait > 45) {
                delayStatus = 'critical';
                delayMinutes = estimatedWait - 30;
            } else if (estimatedWait > 20) {
                delayStatus = 'delayed';
                delayMinutes = estimatedWait - 15;
            }

            // Calculate estimated call time for this patient
            const position = waitingTokens + 1;
            const callTimeMs = Date.now() + (position * avgConsultTime * 60 * 1000);
            const callTime = new Date(callTimeMs).toLocaleTimeString();

            return {
                doctorId: doctor._id,
                doctorName: doctor.name,
                facility: doctor.facility || 'Main Hospital',
                currentWaitTime: Math.max(0, estimatedWait - 5),
                forecastedWaitTime: estimatedWait,
                queueLength: waitingTokens,
                delayStatus,
                delayMinutes,
                estimatedCallTime: callTime
            };
        });

        // Filter by doctorId if specified
        const filtered = doctorId 
            ? forecasts.filter((f: any) => f.doctorId.toString() === doctorId)
            : forecasts;

        // Sort by queue length (ascending)
        filtered.sort((a: any, b: any) => a.queueLength - b.queueLength);

        res.json({ success: true, forecasts: filtered });
    } catch (error) {
        console.error('Forecast error:', error);
        res.status(500).json({ success: false, message: 'Error fetching forecast' });
    }
};

export const checkInWithBarcode = async (req: Request, res: Response) => {
    try {
        const { patientId, facilityBarcode } = req.body;
        const patient = (req as any).user;

        // Verify patient
        if (patient._id.toString() !== patientId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        // Parse barcode (format: FACILITY-DOCTOR-YYYY-MM-DD)
        const parts = facilityBarcode.split('-');
        if (parts.length < 3) {
            return res.status(400).json({ success: false, message: 'Invalid barcode format' });
        }

        // Get all doctors and pick first one available (simplified)
        const doctors = await Doctor.find().limit(1);
        if (!doctors.length) {
            return res.status(404).json({ success: false, message: 'No doctors available' });
        }

        const doctor = doctors[0];
        const date = new Date().toISOString().split('T')[0];

        // Create token for patient at triage
        const token = await queueService.createQueueToken(
            null,
            doctor._id.toString(),
            patient._id.toString(),
            date,
            'Normal',
            'Digital Check-in'
        );

        // Mark onboarding step complete
        await Patient.updateOne(
            { _id: patient._id },
            { 'onboarding_steps.checkin_learned': true }
        );

        // Get waiting tokens count
        const waitingTokens = await Token.countDocuments({ 
            doctor_id: doctor._id,
            status: 'waiting',
            date
        });

        res.json({
            success: true,
            message: 'Check-in successful',
            tokenId: token._id,
            queuePosition: waitingTokens + 1,
            estimatedWaitTime: Math.ceil((waitingTokens + 1) * 15 / 60)
        });
    } catch (error) {
        console.error('Check-in error:', error);
        res.status(500).json({ success: false, message: 'Check-in failed' });
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


// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
