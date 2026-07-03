"use strict";
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
exports.generateAnalytics = exports.pauseQueue = exports.changeConsultationDuration = exports.transferPatient = exports.insertEmergency = exports.skipPatient = exports.completeConsultation = exports.startConsultation = exports.callNextPatient = exports.checkInPatient = exports.createQueueToken = exports.recalculateQueueWaitTimes = exports.predictWaitTime = exports.getQueueStatus = void 0;
const Queue_1 = __importDefault(require("../models/Queue"));
const Token_1 = __importDefault(require("../models/Token"));
const Doctor_1 = __importDefault(require("../models/Doctor"));
const Appointment_1 = __importDefault(require("../models/Appointment"));
const Patient_1 = __importDefault(require("../models/Patient"));
const QueueHistory_1 = __importDefault(require("../models/QueueHistory"));
const EmergencyQueue_1 = __importDefault(require("../models/EmergencyQueue"));
const QueueAnalytics_1 = __importDefault(require("../models/QueueAnalytics"));
const axios_1 = __importDefault(require("axios"));
const mongoose_1 = __importDefault(require("mongoose"));
const socket_1 = require("../utils/socket");
// Helper to abbreviate department names
const getDeptAbbreviation = (dept) => {
    if (!dept)
        return 'GEN';
    const d = dept.toUpperCase();
    if (d.includes('CARD'))
        return 'CARD';
    if (d.includes('ORTHO'))
        return 'ORTHO';
    if (d.includes('DERM'))
        return 'DERM';
    if (d.includes('PEDI'))
        return 'PEDI';
    if (d.includes('GYNE') || d.includes('OBG'))
        return 'GYNE';
    if (d.includes('GEN') || d.includes('MED'))
        return 'GEN';
    return d.replace(/[^A-Z]/g, '').slice(0, 5) || 'GEN';
};
// Retrieve or create queue
const getQueueStatus = (doctorId, date) => __awaiter(void 0, void 0, void 0, function* () {
    const doctor = yield Doctor_1.default.findOne({ $or: [
            { _id: mongoose_1.default.isValidObjectId(doctorId) ? doctorId : new mongoose_1.default.Types.ObjectId() },
            { user_id: mongoose_1.default.isValidObjectId(doctorId) ? doctorId : new mongoose_1.default.Types.ObjectId() }
        ] });
    if (!doctor)
        throw new Error('Doctor not found');
    const doctorDocId = doctor._id;
    let queue = yield Queue_1.default.findOne({ doctor_id: doctorDocId, date });
    if (!queue) {
        queue = yield Queue_1.default.create({
            department: doctor.department,
            doctor_id: doctorDocId,
            date,
            current_token: 0,
            total_waiting: 0,
            estimated_wait_time_per_patient: doctor.avg_consultation_time || 15
        });
    }
    return queue;
});
exports.getQueueStatus = getQueueStatus;
// Predict wait time using AI service or fallback
const predictWaitTime = (queueId, tokenNumber) => __awaiter(void 0, void 0, void 0, function* () {
    const queue = yield Queue_1.default.findById(queueId);
    if (!queue)
        throw new Error('Queue not found');
    const patientsAhead = Math.max(0, tokenNumber - queue.current_token);
    try {
        const aiUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
        const response = yield axios_1.default.post(`${aiUrl}/predict-wait`, {
            queue_length: patientsAhead,
            avg_consultation_time: queue.estimated_wait_time_per_patient,
            doctor_id: queue.doctor_id.toString()
        });
        return response.data.predicted_wait_minutes;
    }
    catch (error) {
        // Fallback: Simple math
        return patientsAhead * queue.estimated_wait_time_per_patient;
    }
});
exports.predictWaitTime = predictWaitTime;
// Recalculate estimated wait times for all waiting tokens in a queue
const recalculateQueueWaitTimes = (queueId) => __awaiter(void 0, void 0, void 0, function* () {
    const queue = yield Queue_1.default.findById(queueId);
    if (!queue)
        return;
    // Get all pending tokens in order of token_number
    const tokens = yield Token_1.default.find({
        queue_id: queueId,
        status: { $in: ['Booked', 'Checked In', 'Waiting', 'Emergency'] }
    }).sort({ priority: -1, token_number: 1 }); // Emergency priority is processed first
    let waitingIndex = 0;
    for (const token of tokens) {
        const estWait = waitingIndex * queue.estimated_wait_time_per_patient;
        token.estimated_wait_minutes = estWait;
        yield token.save();
        waitingIndex++;
    }
    // Broadcast updated queue state to clients
    (0, socket_1.emitQueueUpdate)('queue.update', {
        queueId: queue._id.toString(),
        doctorId: queue.doctor_id.toString(),
        current_token: queue.current_token,
        total_waiting: queue.total_waiting,
        date: queue.date
    });
});
exports.recalculateQueueWaitTimes = recalculateQueueWaitTimes;
// Create a queue token (linked with booking or walk-in)
const createQueueToken = (appointmentId_1, doctorId_1, patientId_1, date_1, ...args_1) => __awaiter(void 0, [appointmentId_1, doctorId_1, patientId_1, date_1, ...args_1], void 0, function* (appointmentId, doctorId, patientId, date, priority = 'Normal', reason = '') {
    const doctor = yield Doctor_1.default.findOne({ $or: [
            { _id: mongoose_1.default.isValidObjectId(doctorId) ? doctorId : new mongoose_1.default.Types.ObjectId() },
            { user_id: mongoose_1.default.isValidObjectId(doctorId) ? doctorId : new mongoose_1.default.Types.ObjectId() }
        ] });
    if (!doctor)
        throw new Error('Doctor not found');
    const patient = yield Patient_1.default.findById(patientId);
    if (!patient)
        throw new Error('Patient not found');
    const queue = yield (0, exports.getQueueStatus)(doctor._id.toString(), date);
    // Sequence token count
    const tokenCount = yield Token_1.default.countDocuments({ queue_id: queue._id });
    const token_number = tokenCount + 1;
    const deptAbbr = getDeptAbbreviation(doctor.department);
    const display_token = `${deptAbbr}-${String(token_number).padStart(3, '0')}`;
    const token = yield Token_1.default.create({
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
        yield EmergencyQueue_1.default.create({
            patient_id: patient._id,
            doctor_id: doctor._id,
            reason: reason || 'Urgent Emergency Check-In',
            severity: 'critical',
            status: 'pending'
        });
    }
    yield QueueHistory_1.default.create({
        token_id: token._id,
        queue_id: queue._id,
        action: priority === 'Emergency' ? 'emergency-admit' : 'token-created',
        performed_by: 'system',
        details: reason || `Token created: ${display_token}`
    });
    queue.total_waiting += 1;
    yield queue.save();
    yield (0, exports.recalculateQueueWaitTimes)(queue._id.toString());
    return token;
});
exports.createQueueToken = createQueueToken;
// Check-in patient
const checkInPatient = (tokenId_1, ...args_1) => __awaiter(void 0, [tokenId_1, ...args_1], void 0, function* (tokenId, method = 'mobile') {
    const token = yield Token_1.default.findById(tokenId);
    if (!token)
        throw new Error('Token not found');
    token.status = 'Waiting';
    token.check_in_time = new Date();
    yield token.save();
    // If there is an appointment associated, mark it completed or checked-in
    if (token.appointment_id) {
        yield Appointment_1.default.findByIdAndUpdate(token.appointment_id, { status: 'booked' });
    }
    yield QueueHistory_1.default.create({
        token_id: token._id,
        queue_id: token.queue_id,
        action: 'check-in',
        performed_by: 'patient',
        details: `Patient checked in via ${method}`
    });
    yield (0, exports.recalculateQueueWaitTimes)(token.queue_id.toString());
    // Emit live update
    (0, socket_1.emitQueueUpdate)('queue.token.update', {
        tokenId: token._id.toString(),
        patientId: token.patient_id.toString(),
        status: token.status,
        display_token: token.display_token
    });
    return token;
});
exports.checkInPatient = checkInPatient;
// Call next patient (doctor console)
const callNextPatient = (doctorId) => __awaiter(void 0, void 0, void 0, function* () {
    const doctor = yield Doctor_1.default.findOne({ $or: [
            { _id: mongoose_1.default.isValidObjectId(doctorId) ? doctorId : new mongoose_1.default.Types.ObjectId() },
            { user_id: mongoose_1.default.isValidObjectId(doctorId) ? doctorId : new mongoose_1.default.Types.ObjectId() }
        ] });
    if (!doctor)
        throw new Error('Doctor not found');
    const date = new Date().toISOString().split('T')[0];
    const queue = yield Queue_1.default.findOne({ doctor_id: doctor._id, date });
    if (!queue)
        return null;
    // Prioritize emergency tokens first, then waiting tokens sorted by token_number
    let nextToken = yield Token_1.default.findOne({
        queue_id: queue._id,
        status: 'Emergency'
    }).sort({ token_number: 1 });
    if (!nextToken) {
        nextToken = yield Token_1.default.findOne({
            queue_id: queue._id,
            status: { $in: ['Waiting', 'Checked In'] }
        }).sort({ token_number: 1 });
    }
    if (!nextToken)
        return null;
    nextToken.status = 'Called';
    nextToken.call_time = new Date();
    yield nextToken.save();
    queue.current_token = nextToken.token_number;
    yield queue.save();
    yield QueueHistory_1.default.create({
        token_id: nextToken._id,
        queue_id: queue._id,
        action: 'call',
        performed_by: 'doctor',
        details: `Called to Consultation Room`
    });
    yield (0, exports.recalculateQueueWaitTimes)(queue._id.toString());
    (0, socket_1.emitQueueUpdate)('queue.token.update', {
        tokenId: nextToken._id.toString(),
        patientId: nextToken.patient_id.toString(),
        status: nextToken.status,
        display_token: nextToken.display_token,
        current_token: queue.current_token
    });
    return nextToken;
});
exports.callNextPatient = callNextPatient;
// Start Consultation
const startConsultation = (tokenId) => __awaiter(void 0, void 0, void 0, function* () {
    const token = yield Token_1.default.findById(tokenId);
    if (!token)
        throw new Error('Token not found');
    token.status = 'In Consultation';
    token.consultation_start_time = new Date();
    yield token.save();
    yield QueueHistory_1.default.create({
        token_id: token._id,
        queue_id: token.queue_id,
        action: 'consultation-start',
        performed_by: 'doctor'
    });
    yield (0, exports.recalculateQueueWaitTimes)(token.queue_id.toString());
    (0, socket_1.emitQueueUpdate)('queue.token.update', {
        tokenId: token._id.toString(),
        patientId: token.patient_id.toString(),
        status: token.status,
        display_token: token.display_token
    });
    return token;
});
exports.startConsultation = startConsultation;
// Complete Consultation
const completeConsultation = (tokenId) => __awaiter(void 0, void 0, void 0, function* () {
    const token = yield Token_1.default.findById(tokenId);
    if (!token)
        throw new Error('Token not found');
    token.status = 'Completed';
    token.consultation_end_time = new Date();
    yield token.save();
    // Complete related appointment
    if (token.appointment_id) {
        yield Appointment_1.default.findByIdAndUpdate(token.appointment_id, { status: 'completed' });
    }
    // Resolve any pending emergencies
    if (token.priority === 'Emergency') {
        yield EmergencyQueue_1.default.findOneAndUpdate({ patient_id: token.patient_id, doctor_id: token.doctor_id, status: 'pending' }, { status: 'attended', resolved_at: new Date() });
    }
    const queue = yield Queue_1.default.findById(token.queue_id);
    if (queue) {
        queue.total_waiting = Math.max(0, queue.total_waiting - 1);
        yield queue.save();
    }
    yield QueueHistory_1.default.create({
        token_id: token._id,
        queue_id: token.queue_id,
        action: 'complete',
        performed_by: 'doctor'
    });
    yield (0, exports.recalculateQueueWaitTimes)(token.queue_id.toString());
    (0, socket_1.emitQueueUpdate)('queue.token.update', {
        tokenId: token._id.toString(),
        patientId: token.patient_id.toString(),
        status: token.status,
        display_token: token.display_token
    });
    return token;
});
exports.completeConsultation = completeConsultation;
// Skip/No-Show Patient
const skipPatient = (tokenId) => __awaiter(void 0, void 0, void 0, function* () {
    const token = yield Token_1.default.findById(tokenId);
    if (!token)
        throw new Error('Token not found');
    token.status = 'Skipped';
    yield token.save();
    if (token.appointment_id) {
        yield Appointment_1.default.findByIdAndUpdate(token.appointment_id, { status: 'no-show' });
    }
    const queue = yield Queue_1.default.findById(token.queue_id);
    if (queue) {
        queue.total_waiting = Math.max(0, queue.total_waiting - 1);
        yield queue.save();
    }
    yield QueueHistory_1.default.create({
        token_id: token._id,
        queue_id: token.queue_id,
        action: 'skip',
        performed_by: 'doctor'
    });
    yield (0, exports.recalculateQueueWaitTimes)(token.queue_id.toString());
    (0, socket_1.emitQueueUpdate)('queue.token.update', {
        tokenId: token._id.toString(),
        patientId: token.patient_id.toString(),
        status: token.status,
        display_token: token.display_token
    });
    return token;
});
exports.skipPatient = skipPatient;
// Insert emergency case directly into queue
const insertEmergency = (doctorId, patientId, reason, severity) => __awaiter(void 0, void 0, void 0, function* () {
    const date = new Date().toISOString().split('T')[0];
    const token = yield (0, exports.createQueueToken)(null, doctorId, patientId, date, 'Emergency', reason);
    if (severity) {
        yield EmergencyQueue_1.default.findOneAndUpdate({ patient_id: patientId, doctor_id: token.doctor_id, status: 'pending' }, { severity });
    }
    return token;
});
exports.insertEmergency = insertEmergency;
// Transfer Patient Token to another doctor
const transferPatient = (tokenId, targetDoctorId) => __awaiter(void 0, void 0, void 0, function* () {
    const sourceToken = yield Token_1.default.findById(tokenId);
    if (!sourceToken)
        throw new Error('Token not found');
    // Cancel old token
    sourceToken.status = 'Cancelled';
    yield sourceToken.save();
    const sourceQueue = yield Queue_1.default.findById(sourceToken.queue_id);
    if (sourceQueue) {
        sourceQueue.total_waiting = Math.max(0, sourceQueue.total_waiting - 1);
        yield sourceQueue.save();
        yield (0, exports.recalculateQueueWaitTimes)(sourceQueue._id.toString());
    }
    // Create new token in target doctor's queue for today
    const date = new Date().toISOString().split('T')[0];
    const targetToken = yield (0, exports.createQueueToken)(sourceToken.appointment_id ? sourceToken.appointment_id.toString() : null, targetDoctorId, sourceToken.patient_id.toString(), date, sourceToken.priority, `Transferred from Doctor ID: ${sourceToken.doctor_id}`);
    // Update appointment doctor if present
    if (sourceToken.appointment_id) {
        const targetDoctor = yield Doctor_1.default.findOne({ $or: [
                { _id: mongoose_1.default.isValidObjectId(targetDoctorId) ? targetDoctorId : new mongoose_1.default.Types.ObjectId() },
                { user_id: mongoose_1.default.isValidObjectId(targetDoctorId) ? targetDoctorId : new mongoose_1.default.Types.ObjectId() }
            ] });
        if (targetDoctor) {
            yield Appointment_1.default.findByIdAndUpdate(sourceToken.appointment_id, {
                doctor_id: targetDoctor._id,
                token_number: targetToken.token_number
            });
        }
    }
    return targetToken;
});
exports.transferPatient = transferPatient;
// Change Consultation Average Duration
const changeConsultationDuration = (doctorId, newDuration) => __awaiter(void 0, void 0, void 0, function* () {
    const doctor = yield Doctor_1.default.findOne({ $or: [
            { _id: mongoose_1.default.isValidObjectId(doctorId) ? doctorId : new mongoose_1.default.Types.ObjectId() },
            { user_id: mongoose_1.default.isValidObjectId(doctorId) ? doctorId : new mongoose_1.default.Types.ObjectId() }
        ] });
    if (!doctor)
        throw new Error('Doctor not found');
    doctor.avg_consultation_time = newDuration;
    yield doctor.save();
    const date = new Date().toISOString().split('T')[0];
    const queue = yield Queue_1.default.findOne({ doctor_id: doctor._id, date });
    if (queue) {
        queue.estimated_wait_time_per_patient = newDuration;
        yield queue.save();
        yield (0, exports.recalculateQueueWaitTimes)(queue._id.toString());
    }
});
exports.changeConsultationDuration = changeConsultationDuration;
// Freeze/Pause Queue
const pauseQueue = (doctorId_1, ...args_1) => __awaiter(void 0, [doctorId_1, ...args_1], void 0, function* (doctorId, isPaused = true) {
    const doctor = yield Doctor_1.default.findOne({ $or: [
            { _id: mongoose_1.default.isValidObjectId(doctorId) ? doctorId : new mongoose_1.default.Types.ObjectId() },
            { user_id: mongoose_1.default.isValidObjectId(doctorId) ? doctorId : new mongoose_1.default.Types.ObjectId() }
        ] });
    if (!doctor)
        throw new Error('Doctor not found');
    const date = new Date().toISOString().split('T')[0];
    const queue = yield (0, exports.getQueueStatus)(doctor._id.toString(), date);
    queue.status = isPaused ? 'paused' : 'active';
    yield queue.save();
    (0, socket_1.emitQueueUpdate)('queue.update', {
        queueId: queue._id.toString(),
        doctorId: queue.doctor_id.toString(),
        status: queue.status,
        date: queue.date
    });
    return queue;
});
exports.pauseQueue = pauseQueue;
// Generate Dashboard/Admin Analytics
const generateAnalytics = (date, department) => __awaiter(void 0, void 0, void 0, function* () {
    // Find completed tokens
    const completedTokens = yield Token_1.default.find({
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
    const total_patients_pending = yield Token_1.default.countDocuments({
        department,
        status: { $in: ['Waiting', 'Checked In', 'Called', 'In Consultation'] },
        createdAt: {
            $gte: new Date(`${date}T00:00:00.000Z`),
            $lte: new Date(`${date}T23:59:59.999Z`)
        }
    });
    const total_patients_skipped = yield Token_1.default.countDocuments({
        department,
        status: 'Skipped',
        createdAt: {
            $gte: new Date(`${date}T00:00:00.000Z`),
            $lte: new Date(`${date}T23:59:59.999Z`)
        }
    });
    const total_emergencies = yield Token_1.default.countDocuments({
        department,
        priority: 'Emergency',
        createdAt: {
            $gte: new Date(`${date}T00:00:00.000Z`),
            $lte: new Date(`${date}T23:59:59.999Z`)
        }
    });
    // Check max queue length
    const maxQueue = yield Queue_1.default.findOne({ department, date }).select('total_waiting');
    const max_queue_length = maxQueue ? maxQueue.total_waiting : 0;
    let analytics = yield QueueAnalytics_1.default.findOne({ date, department });
    if (!analytics) {
        analytics = new QueueAnalytics_1.default({ date, department });
    }
    analytics.avg_wait_time = avg_wait_time;
    analytics.max_queue_length = max_queue_length;
    analytics.total_patients_served = total_patients_served;
    analytics.total_patients_pending = total_patients_pending;
    analytics.total_patients_skipped = total_patients_skipped;
    analytics.total_emergencies = total_emergencies;
    analytics.doctor_utilization_percent = Math.min(100, Math.round((total_patients_served * 15) / 480 * 100)); // 8 hr shift
    yield analytics.save();
    return analytics;
});
exports.generateAnalytics = generateAnalytics;
