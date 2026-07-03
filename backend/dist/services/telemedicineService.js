"use strict";
/**
 * telemedicineService.ts
 *
 * Business logic for telemedicine sessions.
 * Coordinates between LiveKit, Appointment model, TelemedicineSession model,
 * and downstream modules (Consultation, Prescription, LabOrder, etc.)
 */
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildRoomName = buildRoomName;
exports.getOrCreateSession = getOrCreateSession;
exports.generateJoinToken = generateJoinToken;
exports.startSession = startSession;
exports.endSession = endSession;
exports.saveMessage = saveMessage;
exports.logConnectionEvent = logConnectionEvent;
exports.getSessionByAppointment = getSessionByAppointment;
exports.getPatientSessions = getPatientSessions;
exports.getDoctorSessions = getDoctorSessions;
exports.getAdminAnalytics = getAdminAnalytics;
const mongoose_1 = __importDefault(require("mongoose"));
const TelemedicineSession_1 = __importDefault(require("../models/TelemedicineSession"));
const Appointment_1 = __importDefault(require("../models/Appointment"));
const User_1 = __importDefault(require("../models/User"));
const Doctor_1 = __importDefault(require("../models/Doctor"));
const Patient_1 = __importDefault(require("../models/Patient"));
const livekit = __importStar(require("./livekitService"));
// ─────────────────────────────────────────────────────────────────────────────
// Helper: build stable room name from appointmentId
// ─────────────────────────────────────────────────────────────────────────────
function buildRoomName(appointmentId) {
    return `appointment-${appointmentId}`;
}
// ─────────────────────────────────────────────────────────────────────────────
// Initialise or retrieve a session for an appointment
// Called when doctor or patient wants to join.
// ─────────────────────────────────────────────────────────────────────────────
function getOrCreateSession(appointmentId) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const existing = yield TelemedicineSession_1.default.findOne({ appointment_id: appointmentId });
        if (existing)
            return existing;
        // Verify appointment exists
        const appointment = yield Appointment_1.default.findById(appointmentId);
        if (!appointment)
            throw new Error('Appointment not found');
        const roomName = buildRoomName(appointmentId);
        // Ensure LiveKit room exists
        const exists = yield livekit.roomExists(roomName);
        if (!exists) {
            yield livekit.createRoom(roomName);
        }
        const session = yield TelemedicineSession_1.default.create({
            appointment_id: appointment._id,
            patient_id: appointment.patient_id,
            doctor_id: appointment.doctor_id,
            room_name: roomName,
            livekit_url: livekit.LIVEKIT_URL,
            consultation_type: (_a = appointment.consultation_type) !== null && _a !== void 0 ? _a : 'video',
            status: 'waiting',
        });
        return session;
    });
}
// ─────────────────────────────────────────────────────────────────────────────
// Generate a LiveKit token for doctor or patient
// ─────────────────────────────────────────────────────────────────────────────
function generateJoinToken(appointmentId, userId, userRole) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const session = yield getOrCreateSession(appointmentId);
        // Verify caller belongs to this appointment
        if (userRole === 'patient') {
            const patient = yield Patient_1.default.findOne({ user_id: userId });
            if (!patient || !session.patient_id.equals(patient._id)) {
                throw new Error('Unauthorised: you are not the patient on this appointment');
            }
        }
        else {
            const doctor = yield Doctor_1.default.findOne({ user_id: userId });
            if (!doctor || !session.doctor_id.equals(doctor._id)) {
                throw new Error('Unauthorised: you are not the doctor on this appointment');
            }
        }
        // Validate session is not already completed / cancelled
        if (['completed', 'cancelled'].includes(session.status)) {
            throw new Error('This consultation has already ended');
        }
        const user = yield User_1.default.findById(userId);
        const displayName = (_a = user === null || user === void 0 ? void 0 : user.name) !== null && _a !== void 0 ? _a : userId;
        const token = yield livekit.generateToken({
            roomName: session.room_name,
            identity: `${userRole}-${userId}`,
            name: displayName,
            role: userRole,
        });
        return {
            token,
            roomName: session.room_name,
            url: livekit.LIVEKIT_URL,
            sessionId: session._id.toString(),
        };
    });
}
// ─────────────────────────────────────────────────────────────────────────────
// Mark session as active (doctor admits patient)
// ─────────────────────────────────────────────────────────────────────────────
function startSession(appointmentId, byRole) {
    return __awaiter(this, void 0, void 0, function* () {
        const session = yield TelemedicineSession_1.default.findOne({ appointment_id: appointmentId });
        if (!session)
            throw new Error('Session not found');
        const now = new Date();
        const update = {};
        if (byRole === 'doctor') {
            update.doctor_joined_at = now;
            if (session.status === 'waiting')
                update.status = 'waiting'; // waits for patient
            if (session.patient_joined_at) { // patient already waiting
                update.status = 'active';
                update.started_at = now;
            }
        }
        else {
            update.patient_joined_at = now;
            if (session.doctor_joined_at) { // doctor already there
                update.status = 'active';
                update.started_at = now;
            }
        }
        Object.assign(session, update);
        yield session.save();
        // Log connection event
        yield logConnectionEvent(session._id.toString(), null, byRole, 'joined');
        return session;
    });
}
// ─────────────────────────────────────────────────────────────────────────────
// End session — close LiveKit room, compute duration
// ─────────────────────────────────────────────────────────────────────────────
function endSession(appointmentId, summaryData) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const session = yield TelemedicineSession_1.default.findOne({ appointment_id: appointmentId });
        if (!session)
            throw new Error('Session not found');
        const now = new Date();
        const startedAt = (_a = session.started_at) !== null && _a !== void 0 ? _a : session.createdAt;
        const durationSeconds = Math.round((now.getTime() - startedAt.getTime()) / 1000);
        session.status = 'completed';
        session.ended_at = now;
        session.duration_seconds = durationSeconds;
        if (summaryData) {
            session.summary = Object.assign(Object.assign({}, session.summary), summaryData);
        }
        yield session.save();
        // Update appointment status
        yield Appointment_1.default.findByIdAndUpdate(appointmentId, { status: 'completed' });
        // Close LiveKit room
        yield livekit.deleteRoom(session.room_name);
        return session;
    });
}
// ─────────────────────────────────────────────────────────────────────────────
// Chat message persistence
// ─────────────────────────────────────────────────────────────────────────────
function saveMessage(sessionId_1, senderId_1, senderRole_1, senderName_1, message_1) {
    return __awaiter(this, arguments, void 0, function* (sessionId, senderId, senderRole, senderName, message, messageType = 'text', fileData) {
        const session = yield TelemedicineSession_1.default.findById(sessionId);
        if (!session)
            throw new Error('Session not found');
        session.chat_messages.push({
            sender_id: new mongoose_1.default.Types.ObjectId(senderId),
            sender_role: senderRole,
            sender_name: senderName,
            message,
            message_type: messageType,
            file_url: fileData === null || fileData === void 0 ? void 0 : fileData.url,
            file_name: fileData === null || fileData === void 0 ? void 0 : fileData.name,
            file_size: fileData === null || fileData === void 0 ? void 0 : fileData.size,
            file_type: fileData === null || fileData === void 0 ? void 0 : fileData.type,
            sentAt: new Date(),
        });
        yield session.save();
        return session;
    });
}
// ─────────────────────────────────────────────────────────────────────────────
// Connection log helper
// ─────────────────────────────────────────────────────────────────────────────
function logConnectionEvent(sessionId, userId, role, event, metadata) {
    return __awaiter(this, void 0, void 0, function* () {
        yield TelemedicineSession_1.default.findByIdAndUpdate(sessionId, {
            $push: {
                connection_logs: {
                    user_id: userId ? new mongoose_1.default.Types.ObjectId(userId) : undefined,
                    role,
                    event,
                    timestamp: new Date(),
                    metadata,
                },
            },
        });
    });
}
// ─────────────────────────────────────────────────────────────────────────────
// Queries
// ─────────────────────────────────────────────────────────────────────────────
function getSessionByAppointment(appointmentId) {
    return __awaiter(this, void 0, void 0, function* () {
        return TelemedicineSession_1.default.findOne({ appointment_id: appointmentId })
            .populate('patient_id')
            .populate('doctor_id');
    });
}
function getPatientSessions(patientId) {
    return __awaiter(this, void 0, void 0, function* () {
        const patient = yield Patient_1.default.findOne({ user_id: patientId });
        if (!patient)
            return [];
        return TelemedicineSession_1.default.find({ patient_id: patient._id })
            .sort({ createdAt: -1 })
            .limit(20);
    });
}
function getDoctorSessions(doctorUserId) {
    return __awaiter(this, void 0, void 0, function* () {
        const doctor = yield Doctor_1.default.findOne({ user_id: doctorUserId });
        if (!doctor)
            return [];
        return TelemedicineSession_1.default.find({ doctor_id: doctor._id })
            .sort({ createdAt: -1 })
            .limit(50);
    });
}
function getAdminAnalytics() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [total, todayCount, completed, cancelled, missed] = yield Promise.all([
            TelemedicineSession_1.default.countDocuments({}),
            TelemedicineSession_1.default.countDocuments({ createdAt: { $gte: today } }),
            TelemedicineSession_1.default.countDocuments({ status: 'completed' }),
            TelemedicineSession_1.default.countDocuments({ status: 'cancelled' }),
            TelemedicineSession_1.default.countDocuments({ status: 'missed' }),
        ]);
        const durationAgg = yield TelemedicineSession_1.default.aggregate([
            { $match: { status: 'completed', duration_seconds: { $gt: 0 } } },
            { $group: { _id: null, avg: { $avg: '$duration_seconds' }, total: { $sum: '$duration_seconds' } } },
        ]);
        const avgDuration = (_b = (_a = durationAgg[0]) === null || _a === void 0 ? void 0 : _a.avg) !== null && _b !== void 0 ? _b : 0;
        const successRate = total > 0 ? Math.round((completed / total) * 100) : 0;
        return {
            total_sessions: total,
            sessions_today: todayCount,
            completed_sessions: completed,
            cancelled_sessions: cancelled,
            missed_sessions: missed,
            avg_duration_mins: Math.round(avgDuration / 60),
            call_success_rate: successRate,
        };
    });
}
