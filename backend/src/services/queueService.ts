import Queue, { IQueue } from '../models/Queue';
import Token, { IToken } from '../models/Token';
import Doctor from '../models/Doctor';
import Appointment from '../models/Appointment';
import Patient from '../models/Patient';
import QueueHistory from '../models/QueueHistory';
import EmergencyQueue from '../models/EmergencyQueue';
import QueueAnalytics, { IQueueAnalytics } from '../models/QueueAnalytics';
import User from '../models/User';
import Authentication from '../models/Authentication';
import axios from 'axios';
import mongoose from 'mongoose';
import { emitQueueUpdate } from '../utils/socket';

// Resolve doctor ID robustly (supporting doctor_id, user_id, auth_id, or email lookups)
export const resolveDoctor = async (doctorId: string) => {
    if (!mongoose.isValidObjectId(doctorId)) return null;

    // 1. Direct match by Doctor ID
    let doctor = await Doctor.findById(doctorId);
    if (doctor) return doctor;

    // 2. Match by legacy User ID
    doctor = await Doctor.findOne({ user_id: doctorId });
    if (doctor) return doctor;

    // 3. Match by Authentication ID
    const auth = await Authentication.findById(doctorId);
    if (auth && auth.email) {
        const user = await User.findOne({ email: auth.email });
        if (user) {
            doctor = await Doctor.findOne({ user_id: user._id });
            if (doctor) return doctor;
        }
    }

    // 4. Try legacy User lookup directly
    const user = await User.findById(doctorId);
    if (user) {
        doctor = await Doctor.findOne({ user_id: user._id });
        if (doctor) return doctor;
    }

    return null;
};

// Helper to abbreviate department names
const getDeptAbbreviation = (dept: string): string => {
    if (!dept) return 'GEN';
    const d = dept.toUpperCase();
    if (d.includes('CARD')) return 'CARD';
    if (d.includes('ORTHO')) return 'ORTHO';
    if (d.includes('DERM')) return 'DERM';
    if (d.includes('PEDI')) return 'PEDI';
    if (d.includes('GYNE') || d.includes('OBG')) return 'GYNE';
    if (d.includes('GEN') || d.includes('MED')) return 'GEN';
    return d.replace(/[^A-Z]/g, '').slice(0, 5) || 'GEN';
};

// Retrieve or create queue
export const getQueueStatus = async (doctorId: string, date: string): Promise<IQueue> => {
    const doctor = await resolveDoctor(doctorId);
    if (!doctor) throw new Error('Doctor not found');

    const doctorDocId = doctor._id;
    let queue = await Queue.findOne({ doctor_id: doctorDocId, date });
    if (!queue) {
        queue = await Queue.create({
            department: doctor.department,
            doctor_id: doctorDocId,
            date,
            current_token: 0,
            total_waiting: 0,
            estimated_wait_time_per_patient: doctor.avg_consultation_time || 15
        });
    }
    return queue;
};

// Predict wait time using AI service or fallback
export const predictWaitTime = async (queueId: string, tokenNumber: number): Promise<number> => {
    const queue = await Queue.findById(queueId);
    if (!queue) throw new Error('Queue not found');

    const patientsAhead = Math.max(0, tokenNumber - queue.current_token);

    try {
        const aiUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
        const response = await axios.post(`${aiUrl}/predict-wait`, {
            queue_length: patientsAhead,
            avg_consultation_time: queue.estimated_wait_time_per_patient,
            doctor_id: queue.doctor_id.toString()
        });
        return response.data.predicted_wait_minutes;
    } catch (error) {
        // Fallback: Simple math
        return patientsAhead * queue.estimated_wait_time_per_patient;
    }
};

// Recalculate estimated wait times for all waiting tokens in a queue
export const recalculateQueueWaitTimes = async (queueId: string): Promise<void> => {
    const queue = await Queue.findById(queueId);
    if (!queue) return;

    // Get all pending tokens in order of token_number
    const tokens = await Token.find({
        queue_id: queueId,
        status: { $in: ['Booked', 'Checked In', 'Waiting', 'Emergency'] }
    }).sort({ priority: -1, token_number: 1 }); // Emergency priority is processed first

    let waitingIndex = 0;
    for (const token of tokens) {
        const estWait = waitingIndex * queue.estimated_wait_time_per_patient;
        token.estimated_wait_minutes = estWait;
        await token.save();
        waitingIndex++;
    }

    // Broadcast updated queue state to clients
    emitQueueUpdate('queue.update', {
        queueId: queue._id.toString(),
        doctorId: queue.doctor_id.toString(),
        current_token: queue.current_token,
        total_waiting: queue.total_waiting,
        date: queue.date
    });
};

// Create a queue token (linked with booking or walk-in)
export const createQueueToken = async (
    appointmentId: string | null,
    doctorId: string,
    patientId: string,
    date: string,
    priority: 'Normal' | 'Emergency' = 'Normal',
    reason: string = ''
): Promise<IToken> => {
    const doctor = await resolveDoctor(doctorId);
    if (!doctor) throw new Error('Doctor not found');

    const patient = await Patient.findById(patientId);
    if (!patient) throw new Error('Patient not found');

    const queue = await getQueueStatus(doctor._id.toString(), date);

    // Sequence token count
    const tokenCount = await Token.countDocuments({ queue_id: queue._id });
    const token_number = tokenCount + 1;

    const deptAbbr = getDeptAbbreviation(doctor.department);
    const display_token = `${deptAbbr}-${String(token_number).padStart(3, '0')}`;

    const token = await Token.create({
        token_number,
        display_token,
        appointment_id: appointmentId || undefined,
        queue_id: queue._id,
        doctor_id: doctor._id,
        patient_id: patient._id,
        department: doctor.department,
        estimated_consultation_time: doctor.avg_consultation_time || 15,
        status: priority === 'Emergency' ? 'Emergency' : 'Booked',
        priority,
        estimated_wait_minutes: 0
    });

    if (priority === 'Emergency') {
        await EmergencyQueue.create({
            patient_id: patient._id,
            doctor_id: doctor._id,
            reason: reason || 'Urgent Emergency Check-In',
            severity: 'critical',
            status: 'pending'
        });
    }

    await QueueHistory.create({
        token_id: token._id,
        queue_id: queue._id,
        action: priority === 'Emergency' ? 'emergency-admit' : 'token-created',
        performed_by: 'system',
        details: reason || `Token created: ${display_token}`
    });

    queue.total_waiting += 1;
    await queue.save();

    await recalculateQueueWaitTimes(queue._id.toString());

    // Emit live update to all connected clients (doctor's queue and patient's token)
    emitQueueUpdate('queue.token.update', {
        tokenId: token._id.toString(),
        patientId: token.patient_id.toString(),
        doctorId: doctor._id.toString(),
        status: token.status,
        display_token: token.display_token,
        token_number: token.token_number,
        action: 'token-created'
    });

    return token;
};

// Check-in patient
export const checkInPatient = async (tokenId: string, method: string = 'mobile'): Promise<IToken> => {
    const token = await Token.findById(tokenId);
    if (!token) throw new Error('Token not found');

    token.status = 'Waiting';
    token.check_in_time = new Date();
    await token.save();

    // If there is an appointment associated, mark it completed or checked-in
    if (token.appointment_id) {
        await Appointment.findByIdAndUpdate(token.appointment_id, { status: 'booked' });
    }

    await QueueHistory.create({
        token_id: token._id,
        queue_id: token.queue_id,
        action: 'check-in',
        performed_by: 'patient',
        details: `Patient checked in via ${method}`
    });

    await recalculateQueueWaitTimes(token.queue_id.toString());

    // Emit live update
    emitQueueUpdate('queue.token.update', {
        tokenId: token._id.toString(),
        patientId: token.patient_id.toString(),
        status: token.status,
        display_token: token.display_token
    });

    return token;
};

// Call next patient (doctor console)
export const callNextPatient = async (doctorId: string): Promise<IToken | null> => {
    const doctor = await resolveDoctor(doctorId);
    if (!doctor) throw new Error('Doctor not found');

    const date = new Date().toISOString().split('T')[0];
    const queue = await Queue.findOne({ doctor_id: doctor._id, date });
    if (!queue) return null;

    // Prioritize emergency tokens first, then waiting tokens sorted by token_number
    let nextToken = await Token.findOne({
        queue_id: queue._id,
        status: 'Emergency'
    }).sort({ token_number: 1 });

    if (!nextToken) {
        nextToken = await Token.findOne({
            queue_id: queue._id,
            status: { $in: ['Waiting', 'Checked In'] }
        }).sort({ token_number: 1 });
    }

    if (!nextToken) return null;

    nextToken.status = 'Called';
    nextToken.call_time = new Date();
    await nextToken.save();

    queue.current_token = nextToken.token_number;
    await queue.save();

    await QueueHistory.create({
        token_id: nextToken._id,
        queue_id: queue._id,
        action: 'call',
        performed_by: 'doctor',
        details: `Called to Consultation Room`
    });

    await recalculateQueueWaitTimes(queue._id.toString());

    emitQueueUpdate('queue.token.update', {
        tokenId: nextToken._id.toString(),
        patientId: nextToken.patient_id.toString(),
        status: nextToken.status,
        display_token: nextToken.display_token,
        current_token: queue.current_token
    });

    return nextToken;
};

// Start Consultation
export const startConsultation = async (tokenId: string): Promise<IToken> => {
    const token = await Token.findById(tokenId);
    if (!token) throw new Error('Token not found');

    token.status = 'In Consultation';
    token.consultation_start_time = new Date();
    await token.save();

    await QueueHistory.create({
        token_id: token._id,
        queue_id: token.queue_id,
        action: 'consultation-start',
        performed_by: 'doctor'
    });

    await recalculateQueueWaitTimes(token.queue_id.toString());

    emitQueueUpdate('queue.token.update', {
        tokenId: token._id.toString(),
        patientId: token.patient_id.toString(),
        status: token.status,
        display_token: token.display_token
    });

    return token;
};

// Complete Consultation
export const completeConsultation = async (tokenId: string): Promise<IToken> => {
    const token = await Token.findById(tokenId);
    if (!token) throw new Error('Token not found');

    token.status = 'Completed';
    token.consultation_end_time = new Date();
    await token.save();

    // Complete related appointment
    if (token.appointment_id) {
        await Appointment.findByIdAndUpdate(token.appointment_id, { status: 'completed' });
    }

    // Resolve any pending emergencies
    if (token.priority === 'Emergency') {
        await EmergencyQueue.findOneAndUpdate(
            { patient_id: token.patient_id, doctor_id: token.doctor_id, status: 'pending' },
            { status: 'attended', resolved_at: new Date() }
        );
    }

    const queue = await Queue.findById(token.queue_id);
    if (queue) {
        queue.total_waiting = Math.max(0, queue.total_waiting - 1);
        await queue.save();
    }

    await QueueHistory.create({
        token_id: token._id,
        queue_id: token.queue_id,
        action: 'complete',
        performed_by: 'doctor'
    });

    await recalculateQueueWaitTimes(token.queue_id.toString());

    emitQueueUpdate('queue.token.update', {
        tokenId: token._id.toString(),
        patientId: token.patient_id.toString(),
        status: token.status,
        display_token: token.display_token
    });

    return token;
};

// Skip/No-Show Patient
export const skipPatient = async (tokenId: string): Promise<IToken> => {
    const token = await Token.findById(tokenId);
    if (!token) throw new Error('Token not found');

    token.status = 'Skipped';
    await token.save();

    if (token.appointment_id) {
        await Appointment.findByIdAndUpdate(token.appointment_id, { status: 'no-show' });
    }

    const queue = await Queue.findById(token.queue_id);
    if (queue) {
        queue.total_waiting = Math.max(0, queue.total_waiting - 1);
        await queue.save();
    }

    await QueueHistory.create({
        token_id: token._id,
        queue_id: token.queue_id,
        action: 'skip',
        performed_by: 'doctor'
    });

    await recalculateQueueWaitTimes(token.queue_id.toString());

    emitQueueUpdate('queue.token.update', {
        tokenId: token._id.toString(),
        patientId: token.patient_id.toString(),
        status: token.status,
        display_token: token.display_token
    });

    return token;
};

// Insert emergency case directly into queue
export const insertEmergency = async (
    doctorId: string,
    patientId: string,
    reason: string,
    severity: 'critical' | 'moderate' | 'stable'
): Promise<IToken> => {
    const date = new Date().toISOString().split('T')[0];
    const token = await createQueueToken(null, doctorId, patientId, date, 'Emergency', reason);

    if (severity) {
        await EmergencyQueue.findOneAndUpdate(
            { patient_id: patientId, doctor_id: token.doctor_id, status: 'pending' },
            { severity }
        );
    }

    return token;
};

// Transfer Patient Token to another doctor
export const transferPatient = async (tokenId: string, targetDoctorId: string): Promise<IToken> => {
    const sourceToken = await Token.findById(tokenId);
    if (!sourceToken) throw new Error('Token not found');

    // Cancel old token
    sourceToken.status = 'Cancelled';
    await sourceToken.save();

    const sourceQueue = await Queue.findById(sourceToken.queue_id);
    if (sourceQueue) {
        sourceQueue.total_waiting = Math.max(0, sourceQueue.total_waiting - 1);
        await sourceQueue.save();
        await recalculateQueueWaitTimes(sourceQueue._id.toString());
    }

    // Create new token in target doctor's queue for today
    const date = new Date().toISOString().split('T')[0];
    const targetToken = await createQueueToken(
        sourceToken.appointment_id ? sourceToken.appointment_id.toString() : null,
        targetDoctorId,
        sourceToken.patient_id.toString(),
        date,
        sourceToken.priority,
        `Transferred from Doctor ID: ${sourceToken.doctor_id}`
    );

    // Update appointment doctor if present
    if (sourceToken.appointment_id) {
        const targetDoctor = await resolveDoctor(targetDoctorId);
        if (targetDoctor) {
            await Appointment.findByIdAndUpdate(sourceToken.appointment_id, {
                doctor_id: targetDoctor._id,
                token_number: targetToken.token_number
            });
        }
    }

    return targetToken;
};

// Change Consultation Average Duration
export const changeConsultationDuration = async (doctorId: string, newDuration: number): Promise<void> => {
    const doctor = await resolveDoctor(doctorId);
    if (!doctor) throw new Error('Doctor not found');

    doctor.avg_consultation_time = newDuration;
    await doctor.save();

    const date = new Date().toISOString().split('T')[0];
    const queue = await Queue.findOne({ doctor_id: doctor._id, date });
    if (queue) {
        queue.estimated_wait_time_per_patient = newDuration;
        await queue.save();
        await recalculateQueueWaitTimes(queue._id.toString());
        
        // Emit update so all connected clients refresh queue data
        emitQueueUpdate('queue.update', {
            queueId: queue._id.toString(),
            doctorId: doctor._id.toString(),
            action: 'duration-changed',
            newDuration,
            affectedTokens: 'all-waiting'
        });
    }
};

// Freeze/Pause Queue
export const pauseQueue = async (doctorId: string, isPaused: boolean = true): Promise<IQueue> => {
    const doctor = await resolveDoctor(doctorId);
    if (!doctor) throw new Error('Doctor not found');

    const date = new Date().toISOString().split('T')[0];
    const queue = await getQueueStatus(doctor._id.toString(), date);
    queue.status = isPaused ? 'paused' : 'active';
    await queue.save();

    emitQueueUpdate('queue.update', {
        queueId: queue._id.toString(),
        doctorId: queue.doctor_id.toString(),
        status: queue.status,
        date: queue.date
    });

    return queue;
};

// Generate Dashboard/Admin Analytics
export const generateAnalytics = async (date: string, department: string): Promise<IQueueAnalytics> => {
    // Find completed tokens
    const completedTokens = await Token.find({
        department,
        status: 'Completed',
        createdAt: {
            $gte: new Date(`${date}T00:00:00.000Z`),
            $lte: new Date(`${date}T23:59:59.999Z`)
        }
    });

    let totalWait = 0;
    completedTokens.forEach(t => {
        if (t.call_time && t.check_in_time) {
            const diff = (t.call_time.getTime() - t.check_in_time.getTime()) / 60000;
            totalWait += diff > 0 ? diff : 0;
        }
    });

    const avg_wait_time = completedTokens.length > 0 ? Math.round(totalWait / completedTokens.length) : 0;
    const total_patients_served = completedTokens.length;

    const total_patients_pending = await Token.countDocuments({
        department,
        status: { $in: ['Waiting', 'Checked In', 'Called', 'In Consultation'] },
        createdAt: {
            $gte: new Date(`${date}T00:00:00.000Z`),
            $lte: new Date(`${date}T23:59:59.999Z`)
        }
    });

    const total_patients_skipped = await Token.countDocuments({
        department,
        status: 'Skipped',
        createdAt: {
            $gte: new Date(`${date}T00:00:00.000Z`),
            $lte: new Date(`${date}T23:59:59.999Z`)
        }
    });

    const total_emergencies = await Token.countDocuments({
        department,
        priority: 'Emergency',
        createdAt: {
            $gte: new Date(`${date}T00:00:00.000Z`),
            $lte: new Date(`${date}T23:59:59.999Z`)
        }
    });

    // Check max queue length
    const maxQueue = await Queue.findOne({ department, date }).select('total_waiting');
    const max_queue_length = maxQueue ? maxQueue.total_waiting : 0;

    let analytics = await QueueAnalytics.findOne({ date, department });
    if (!analytics) {
        analytics = new QueueAnalytics({ date, department });
    }

    analytics.avg_wait_time = avg_wait_time;
    analytics.max_queue_length = max_queue_length;
    analytics.total_patients_served = total_patients_served;
    analytics.total_patients_pending = total_patients_pending;
    analytics.total_patients_skipped = total_patients_skipped;
    analytics.total_emergencies = total_emergencies;
    analytics.doctor_utilization_percent = Math.min(100, Math.round((total_patients_served * 15) / 480 * 100)); // 8 hr shift

    await analytics.save();
    return analytics;
};
