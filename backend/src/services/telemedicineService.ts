/**
 * telemedicineService.ts
 * 
 * Business logic for telemedicine sessions.
 * Coordinates between LiveKit, Appointment model, TelemedicineSession model, 
 * and downstream modules (Consultation, Prescription, LabOrder, etc.)
 */

import mongoose from 'mongoose';
import TelemedicineSession, { ITelemedicineSession } from '../models/TelemedicineSession';
import Appointment from '../models/Appointment';
import User from '../models/User';
import Doctor from '../models/Doctor';
import Patient from '../models/Patient';
import * as livekit from './livekitService';

// ─────────────────────────────────────────────────────────────────────────────
// Helper: build stable room name from appointmentId
// ─────────────────────────────────────────────────────────────────────────────
export function buildRoomName(appointmentId: string): string {
    return `appointment-${appointmentId}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Initialise or retrieve a session for an appointment
// Called when doctor or patient wants to join.
// ─────────────────────────────────────────────────────────────────────────────
export async function getOrCreateSession(appointmentId: string): Promise<ITelemedicineSession> {
    const existing = await TelemedicineSession.findOne({ appointment_id: appointmentId });
    if (existing) return existing;

    // Verify appointment exists
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) throw new Error('Appointment not found');

    const roomName = buildRoomName(appointmentId);

    // Ensure LiveKit room exists
    const exists = await livekit.roomExists(roomName);
    if (!exists) {
        await livekit.createRoom(roomName);
    }

    const session = await TelemedicineSession.create({
        appointment_id:    appointment._id,
        patient_id:        appointment.patient_id,
        doctor_id:         appointment.doctor_id,
        room_name:         roomName,
        livekit_url:       livekit.LIVEKIT_URL,
        consultation_type: (appointment as any).consultation_type ?? 'video',
        status:            'waiting',
    });

    return session;
}

// ─────────────────────────────────────────────────────────────────────────────
// Generate a LiveKit token for doctor or patient
// ─────────────────────────────────────────────────────────────────────────────
export async function generateJoinToken(
    appointmentId: string,
    userId: string,
    userRole: 'doctor' | 'patient',
): Promise<{ token: string; roomName: string; url: string; sessionId: string }> {
    const session = await getOrCreateSession(appointmentId);

    // Verify caller belongs to this appointment
    if (userRole === 'patient') {
        const patient = await Patient.findOne({ user_id: userId });
        if (!patient || !session.patient_id.equals(patient._id)) {
            throw new Error('Unauthorised: you are not the patient on this appointment');
        }
    } else {
        const doctor = await Doctor.findOne({ user_id: userId });
        if (!doctor || !session.doctor_id.equals(doctor._id)) {
            throw new Error('Unauthorised: you are not the doctor on this appointment');
        }
    }

    // Validate session is not already completed / cancelled
    if (['completed', 'cancelled'].includes(session.status)) {
        throw new Error('This consultation has already ended');
    }

    const user = await User.findById(userId);
    const displayName = user?.name ?? userId;

    const token = await livekit.generateToken({
        roomName: session.room_name,
        identity: `${userRole}-${userId}`,
        name:     displayName,
        role:     userRole,
    });

    return {
        token,
        roomName:  session.room_name,
        url:       livekit.LIVEKIT_URL,
        sessionId: (session._id as mongoose.Types.ObjectId).toString(),
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Mark session as active (doctor admits patient)
// ─────────────────────────────────────────────────────────────────────────────
export async function startSession(appointmentId: string, byRole: 'doctor' | 'patient'): Promise<ITelemedicineSession> {
    const session = await TelemedicineSession.findOne({ appointment_id: appointmentId });
    if (!session) throw new Error('Session not found');

    const now = new Date();
    const update: any = {};

    if (byRole === 'doctor') {
        update.doctor_joined_at = now;
        if (session.status === 'waiting') update.status = 'waiting'; // waits for patient
        if (session.patient_joined_at) { // patient already waiting
            update.status = 'active';
            update.started_at = now;
        }
    } else {
        update.patient_joined_at = now;
        if (session.doctor_joined_at) { // doctor already there
            update.status = 'active';
            update.started_at = now;
        }
    }

    Object.assign(session, update);
    await session.save();

    // Log connection event
    await logConnectionEvent(session._id.toString(), null, byRole, 'joined');

    return session;
}

// ─────────────────────────────────────────────────────────────────────────────
// End session — close LiveKit room, compute duration
// ─────────────────────────────────────────────────────────────────────────────
export async function endSession(
    appointmentId: string,
    summaryData?: Partial<ITelemedicineSession['summary']>,
): Promise<ITelemedicineSession> {
    const session = await TelemedicineSession.findOne({ appointment_id: appointmentId });
    if (!session) throw new Error('Session not found');

    const now = new Date();
    const startedAt = session.started_at ?? session.createdAt;
    const durationSeconds = Math.round((now.getTime() - startedAt.getTime()) / 1000);

    session.status           = 'completed';
    session.ended_at         = now;
    session.duration_seconds = durationSeconds;

    if (summaryData) {
        session.summary = { ...session.summary, ...summaryData } as any;
    }

    await session.save();

    // Update appointment status
    await Appointment.findByIdAndUpdate(appointmentId, { status: 'completed' });

    // Close LiveKit room
    await livekit.deleteRoom(session.room_name);

    return session;
}

// ─────────────────────────────────────────────────────────────────────────────
// Chat message persistence
// ─────────────────────────────────────────────────────────────────────────────
export async function saveMessage(
    sessionId: string,
    senderId: string,
    senderRole: 'patient' | 'doctor',
    senderName: string,
    message: string,
    messageType: 'text' | 'file' | 'voice_note' | 'instruction' = 'text',
    fileData?: { url: string; name: string; size: number; type: string },
): Promise<ITelemedicineSession> {
    const session = await TelemedicineSession.findById(sessionId);
    if (!session) throw new Error('Session not found');

    session.chat_messages.push({
        sender_id:    new mongoose.Types.ObjectId(senderId),
        sender_role:  senderRole,
        sender_name:  senderName,
        message,
        message_type: messageType,
        file_url:     fileData?.url,
        file_name:    fileData?.name,
        file_size:    fileData?.size,
        file_type:    fileData?.type,
        sentAt:       new Date(),
    });

    await session.save();
    return session;
}

// ─────────────────────────────────────────────────────────────────────────────
// Connection log helper
// ─────────────────────────────────────────────────────────────────────────────
export async function logConnectionEvent(
    sessionId: string,
    userId: string | null,
    role: string,
    event: 'joined' | 'left' | 'reconnected' | 'network_poor' | 'network_good',
    metadata?: Record<string, any>,
): Promise<void> {
    await TelemedicineSession.findByIdAndUpdate(sessionId, {
        $push: {
            connection_logs: {
                user_id:   userId ? new mongoose.Types.ObjectId(userId) : undefined,
                role,
                event,
                timestamp: new Date(),
                metadata,
            },
        },
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// Queries
// ─────────────────────────────────────────────────────────────────────────────
export async function getSessionByAppointment(appointmentId: string): Promise<ITelemedicineSession | null> {
    return TelemedicineSession.findOne({ appointment_id: appointmentId })
        .populate('patient_id')
        .populate('doctor_id');
}

export async function getPatientSessions(patientId: string): Promise<ITelemedicineSession[]> {
    const patient = await Patient.findOne({ user_id: patientId });
    if (!patient) return [];
    return TelemedicineSession.find({ patient_id: patient._id })
        .sort({ createdAt: -1 })
        .limit(20);
}

export async function getDoctorSessions(doctorUserId: string): Promise<ITelemedicineSession[]> {
    const doctor = await Doctor.findOne({ user_id: doctorUserId });
    if (!doctor) return [];
    return TelemedicineSession.find({ doctor_id: doctor._id })
        .sort({ createdAt: -1 })
        .limit(50);
}

export async function getAdminAnalytics(): Promise<Record<string, any>> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [total, todayCount, completed, cancelled, missed] = await Promise.all([
        TelemedicineSession.countDocuments({}),
        TelemedicineSession.countDocuments({ createdAt: { $gte: today } }),
        TelemedicineSession.countDocuments({ status: 'completed' }),
        TelemedicineSession.countDocuments({ status: 'cancelled' }),
        TelemedicineSession.countDocuments({ status: 'missed' }),
    ]);

    const durationAgg = await TelemedicineSession.aggregate([
        { $match: { status: 'completed', duration_seconds: { $gt: 0 } } },
        { $group: { _id: null, avg: { $avg: '$duration_seconds' }, total: { $sum: '$duration_seconds' } } },
    ]);

    const avgDuration = durationAgg[0]?.avg ?? 0;
    const successRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
        total_sessions:     total,
        sessions_today:     todayCount,
        completed_sessions: completed,
        cancelled_sessions: cancelled,
        missed_sessions:    missed,
        avg_duration_mins:  Math.round(avgDuration / 60),
        call_success_rate:  successRate,
    };
}

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
