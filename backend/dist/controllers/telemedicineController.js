"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminAnalytics = exports.getDoctorSessions = exports.getPatientSessions = exports.sendMessage = exports.endSession = exports.startSession = exports.getToken = exports.getSession = void 0;
const telemedicineService = __importStar(require("../services/telemedicineService"));
// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/telemedicine/:appointmentId
// Retrieve session status for an appointment (patient or doctor)
// ─────────────────────────────────────────────────────────────────────────────
const getSession = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { appointmentId } = req.params;
        const session = yield telemedicineService.getSessionByAppointment(appointmentId);
        if (!session) {
            // No session yet — return placeholder so UI knows it's bookable
            return res.json({ status: 'not_started', appointmentId });
        }
        // Strip internal chat tokens, return safe subset
        return res.json({
            sessionId: session._id,
            status: session.status,
            roomName: session.room_name,
            consultationType: session.consultation_type,
            startedAt: session.started_at,
            endedAt: session.ended_at,
            durationSeconds: session.duration_seconds,
            doctorJoinedAt: session.doctor_joined_at,
            patientJoinedAt: session.patient_joined_at,
            chatMessages: session.chat_messages,
            sharedFiles: session.shared_files,
            summary: session.summary,
        });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
exports.getSession = getSession;
// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/telemedicine/token
// Body: { appointmentId, role: 'doctor' | 'patient' }
// Returns: { token, roomName, url, sessionId }
// ─────────────────────────────────────────────────────────────────────────────
const getToken = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const { appointmentId, role } = req.body;
        if (!appointmentId || !role) {
            return res.status(400).json({ message: 'appointmentId and role are required' });
        }
        if (!['doctor', 'patient'].includes(role)) {
            return res.status(400).json({ message: 'role must be doctor or patient' });
        }
        const userId = (_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id) !== null && _b !== void 0 ? _b : (_c = req.user) === null || _c === void 0 ? void 0 : _c.id;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorised' });
        const result = yield telemedicineService.generateJoinToken(appointmentId, userId, role);
        return res.json(result);
    }
    catch (err) {
        const status = err.message.includes('Unauthorised') ? 403
            : err.message.includes('not found') ? 404
                : err.message.includes('ended') ? 410
                    : 500;
        res.status(status).json({ message: err.message });
    }
});
exports.getToken = getToken;
// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/telemedicine/start
// Body: { appointmentId, role }
// Records join time and transitions status → active when both joined
// ─────────────────────────────────────────────────────────────────────────────
const startSession = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { appointmentId, role } = req.body;
        if (!appointmentId || !role) {
            return res.status(400).json({ message: 'appointmentId and role are required' });
        }
        const session = yield telemedicineService.startSession(appointmentId, role);
        return res.json({ status: session.status, startedAt: session.started_at });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
exports.startSession = startSession;
// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/telemedicine/end
// Body: { appointmentId, summary? }
// Closes room, calculates duration, saves summary
// ─────────────────────────────────────────────────────────────────────────────
const endSession = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { appointmentId, summary } = req.body;
        if (!appointmentId) {
            return res.status(400).json({ message: 'appointmentId is required' });
        }
        const session = yield telemedicineService.endSession(appointmentId, summary);
        return res.json({
            status: session.status,
            durationSeconds: session.duration_seconds,
            endedAt: session.ended_at,
            summary: session.summary,
        });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
exports.endSession = endSession;
// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/telemedicine/message
// Body: { sessionId, message, messageType?, fileData? }
// ─────────────────────────────────────────────────────────────────────────────
const sendMessage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const { sessionId, message, messageType, fileData, senderRole, senderName } = req.body;
        const userId = (_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id) !== null && _b !== void 0 ? _b : (_c = req.user) === null || _c === void 0 ? void 0 : _c.id;
        const session = yield telemedicineService.saveMessage(sessionId, userId, senderRole !== null && senderRole !== void 0 ? senderRole : 'patient', senderName !== null && senderName !== void 0 ? senderName : 'User', message, messageType, fileData);
        const lastMsg = session.chat_messages[session.chat_messages.length - 1];
        return res.json({ success: true, message: lastMsg });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
exports.sendMessage = sendMessage;
// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/telemedicine/patient/:patientUserId
// Fetch all sessions for a patient (for portal history view)
// ─────────────────────────────────────────────────────────────────────────────
const getPatientSessions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const sessions = yield telemedicineService.getPatientSessions(req.params.patientUserId);
        return res.json(sessions);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
exports.getPatientSessions = getPatientSessions;
// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/telemedicine/doctor/:doctorUserId
// Doctor's telemedicine session history
// ─────────────────────────────────────────────────────────────────────────────
const getDoctorSessions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const sessions = yield telemedicineService.getDoctorSessions(req.params.doctorUserId);
        return res.json(sessions);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
exports.getDoctorSessions = getDoctorSessions;
// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/telemedicine/admin/analytics
// Admin overview stats
// ─────────────────────────────────────────────────────────────────────────────
const getAdminAnalytics = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const analytics = yield telemedicineService.getAdminAnalytics();
        return res.json(analytics);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
exports.getAdminAnalytics = getAdminAnalytics;
