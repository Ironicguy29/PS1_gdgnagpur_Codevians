import { Request, Response } from 'express';
import * as telemedicineService from '../services/telemedicineService';

interface AuthRequest extends Request {
    user?: any;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/telemedicine/:appointmentId
// Retrieve session status for an appointment (patient or doctor)
// ─────────────────────────────────────────────────────────────────────────────
export const getSession = async (req: AuthRequest, res: Response) => {
    try {
        const { appointmentId } = req.params;
        const session = await telemedicineService.getSessionByAppointment(appointmentId as string);

        if (!session) {
            // No session yet — return placeholder so UI knows it's bookable
            return res.json({ status: 'not_started', appointmentId });
        }

        // Strip internal chat tokens, return safe subset
        return res.json({
            sessionId:        session._id,
            status:           session.status,
            roomName:         session.room_name,
            consultationType: session.consultation_type,
            startedAt:        session.started_at,
            endedAt:          session.ended_at,
            durationSeconds:  session.duration_seconds,
            doctorJoinedAt:   session.doctor_joined_at,
            patientJoinedAt:  session.patient_joined_at,
            chatMessages:     session.chat_messages,
            sharedFiles:      session.shared_files,
            summary:          session.summary,
        });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/telemedicine/token
// Body: { appointmentId, role: 'doctor' | 'patient' }
// Returns: { token, roomName, url, sessionId }
// ─────────────────────────────────────────────────────────────────────────────
export const getToken = async (req: AuthRequest, res: Response) => {
    try {
        const { appointmentId, role } = req.body;

        if (!appointmentId || !role) {
            return res.status(400).json({ message: 'appointmentId and role are required' });
        }
        if (!['doctor', 'patient'].includes(role)) {
            return res.status(400).json({ message: 'role must be doctor or patient' });
        }

        const userId = req.user?._id ?? req.user?.id;
        if (!userId) return res.status(401).json({ message: 'Unauthorised' });

        const result = await telemedicineService.generateJoinToken(appointmentId, userId, role);
        return res.json(result);
    } catch (err: any) {
        const status = err.message.includes('Unauthorised') ? 403
                     : err.message.includes('not found')    ? 404
                     : err.message.includes('ended')        ? 410
                     : 500;
        res.status(status).json({ message: err.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/telemedicine/start
// Body: { appointmentId, role }
// Records join time and transitions status → active when both joined
// ─────────────────────────────────────────────────────────────────────────────
export const startSession = async (req: AuthRequest, res: Response) => {
    try {
        const { appointmentId, role } = req.body;
        if (!appointmentId || !role) {
            return res.status(400).json({ message: 'appointmentId and role are required' });
        }
        const session = await telemedicineService.startSession(appointmentId, role);
        return res.json({ status: session.status, startedAt: session.started_at });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/telemedicine/end
// Body: { appointmentId, summary? }
// Closes room, calculates duration, saves summary
// ─────────────────────────────────────────────────────────────────────────────
export const endSession = async (req: AuthRequest, res: Response) => {
    try {
        const { appointmentId, summary } = req.body;
        if (!appointmentId) {
            return res.status(400).json({ message: 'appointmentId is required' });
        }
        const session = await telemedicineService.endSession(appointmentId, summary);
        return res.json({
            status:          session.status,
            durationSeconds: session.duration_seconds,
            endedAt:         session.ended_at,
            summary:         session.summary,
        });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/telemedicine/message
// Body: { sessionId, message, messageType?, fileData? }
// ─────────────────────────────────────────────────────────────────────────────
export const sendMessage = async (req: AuthRequest, res: Response) => {
    try {
        const { sessionId, message, messageType, fileData, senderRole, senderName } = req.body;
        const userId = req.user?._id ?? req.user?.id;

        const session = await telemedicineService.saveMessage(
            sessionId, userId, senderRole ?? 'patient', senderName ?? 'User',
            message, messageType, fileData,
        );

        const lastMsg = session.chat_messages[session.chat_messages.length - 1];
        return res.json({ success: true, message: lastMsg });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/telemedicine/patient/:patientUserId
// Fetch all sessions for a patient (for portal history view)
// ─────────────────────────────────────────────────────────────────────────────
export const getPatientSessions = async (req: AuthRequest, res: Response) => {
    try {
        const sessions = await telemedicineService.getPatientSessions(req.params.patientUserId as string);
        return res.json(sessions);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/telemedicine/doctor/:doctorUserId
// Doctor's telemedicine session history
// ─────────────────────────────────────────────────────────────────────────────
export const getDoctorSessions = async (req: AuthRequest, res: Response) => {
    try {
        const sessions = await telemedicineService.getDoctorSessions(req.params.doctorUserId as string);
        return res.json(sessions);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/telemedicine/admin/analytics
// Admin overview stats
// ─────────────────────────────────────────────────────────────────────────────
export const getAdminAnalytics = async (req: AuthRequest, res: Response) => {
    try {
        const analytics = await telemedicineService.getAdminAnalytics();
        return res.json(analytics);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
