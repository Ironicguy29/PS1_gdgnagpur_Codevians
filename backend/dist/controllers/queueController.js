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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateWalkInToken = exports.checkInWithBarcode = exports.getQueueForecast = exports.predictWait = exports.getPatientLiveToken = exports.getAnalytics = exports.pauseQueue = exports.changeDuration = exports.transfer = exports.emergency = exports.skipPatient = exports.completeConsultation = exports.startConsultation = exports.checkIn = exports.nextPatient = exports.getQueue = void 0;
const queueService = __importStar(require("../services/queueService"));
const Token_1 = __importDefault(require("../models/Token"));
const Queue_1 = __importDefault(require("../models/Queue"));
const Doctor_1 = __importDefault(require("../models/Doctor"));
const Patient_1 = __importDefault(require("../models/Patient"));
const getQueue = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const doctorId = req.params.doctorId;
        const date = new Date().toISOString().split('T')[0]; // Today
        const queue = yield queueService.getQueueStatus(doctorId, date);
        // Fetch all tokens for this queue
        const tokens = yield Token_1.default.find({ queue_id: queue._id })
            .populate('patient_id')
            .sort({ token_number: 1 });
        res.json({ queue, tokens });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.getQueue = getQueue;
const nextPatient = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { doctorId } = req.body;
        const nextToken = yield queueService.callNextPatient(doctorId);
        if (!nextToken) {
            return res.status(404).json({ message: 'No waiting patients in queue' });
        }
        res.json(nextToken);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.nextPatient = nextPatient;
const checkIn = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { tokenId, method } = req.body;
        if (!tokenId)
            return res.status(400).json({ message: 'Missing tokenId' });
        const token = yield queueService.checkInPatient(tokenId, method || 'mobile');
        res.json(token);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.checkIn = checkIn;
const startConsultation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { tokenId } = req.body;
        if (!tokenId)
            return res.status(400).json({ message: 'Missing tokenId' });
        const token = yield queueService.startConsultation(tokenId);
        res.json(token);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.startConsultation = startConsultation;
const completeConsultation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { tokenId } = req.body;
        if (!tokenId)
            return res.status(400).json({ message: 'Missing tokenId' });
        const token = yield queueService.completeConsultation(tokenId);
        res.json(token);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.completeConsultation = completeConsultation;
const skipPatient = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { tokenId } = req.body;
        if (!tokenId)
            return res.status(400).json({ message: 'Missing tokenId' });
        const token = yield queueService.skipPatient(tokenId);
        res.json(token);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.skipPatient = skipPatient;
const emergency = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { patientId, doctorId, reason, severity } = req.body;
        const token = yield queueService.insertEmergency(doctorId, patientId, reason, severity);
        res.json(token);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.emergency = emergency;
const transfer = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { tokenId, targetDoctorId } = req.body;
        const token = yield queueService.transferPatient(tokenId, targetDoctorId);
        res.json(token);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.transfer = transfer;
const changeDuration = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { doctorId, newDuration } = req.body;
        yield queueService.changeConsultationDuration(doctorId, parseInt(newDuration));
        res.json({ message: 'Consultation duration and wait times updated successfully' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.changeDuration = changeDuration;
const pauseQueue = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { doctorId, isPaused } = req.body;
        const queue = yield queueService.pauseQueue(doctorId, isPaused);
        res.json(queue);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.pauseQueue = pauseQueue;
const getAnalytics = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { date, department } = req.query;
        if (!date || !department)
            return res.status(400).json({ message: 'Missing date or department' });
        const analytics = yield queueService.generateAnalytics(date, department);
        res.json(analytics);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.getAnalytics = getAnalytics;
const getPatientLiveToken = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { patientId } = req.params;
        const date = new Date().toISOString().split('T')[0];
        const token = yield Token_1.default.findOne({
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
        const queue = token.queue_id;
        const position = (yield Token_1.default.countDocuments({
            queue_id: queue._id,
            status: { $in: ['Waiting', 'Checked In', 'Emergency', 'Booked'] },
            token_number: { $lt: token.token_number }
        })) + 1;
        res.json({
            token,
            position,
            doctor: token.doctor_id,
            queue
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.getPatientLiveToken = getPatientLiveToken;
const predictWait = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const queueId = req.params.queueId;
        const tokenNumber = req.params.tokenNumber;
        const waitTime = yield queueService.predictWaitTime(queueId, parseInt(tokenNumber));
        res.json({ waitTime });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.predictWait = predictWait;
const getQueueForecast = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { doctorId } = req.query;
        const patient = req.user;
        // Get all doctors' queues for current date
        const today = new Date().toISOString().split('T')[0];
        const queues = yield Queue_1.default.find({ date: today }).populate('doctor_id');
        const forecasts = queues.map((queue) => {
            var _a;
            const doctor = queue.doctor_id;
            const waitingTokens = ((_a = queue.tokens) === null || _a === void 0 ? void 0 : _a.filter((t) => t.status === 'waiting').length) || 0;
            const avgConsultTime = (doctor === null || doctor === void 0 ? void 0 : doctor.avg_consultation_time) || 15;
            // Calculate estimated wait time
            const estimatedWait = Math.ceil(waitingTokens * avgConsultTime / 60);
            // Determine delay status
            let delayStatus = 'on-time';
            let delayMinutes = 0;
            if (estimatedWait > 45) {
                delayStatus = 'critical';
                delayMinutes = estimatedWait - 30;
            }
            else if (estimatedWait > 20) {
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
            ? forecasts.filter((f) => f.doctorId.toString() === doctorId)
            : forecasts;
        // Sort by queue length (ascending)
        filtered.sort((a, b) => a.queueLength - b.queueLength);
        res.json({ success: true, forecasts: filtered });
    }
    catch (error) {
        console.error('Forecast error:', error);
        res.status(500).json({ success: false, message: 'Error fetching forecast' });
    }
});
exports.getQueueForecast = getQueueForecast;
const checkInWithBarcode = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { patientId, facilityBarcode } = req.body;
        const patient = req.user;
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
        const doctors = yield Doctor_1.default.find().limit(1);
        if (!doctors.length) {
            return res.status(404).json({ success: false, message: 'No doctors available' });
        }
        const doctor = doctors[0];
        const date = new Date().toISOString().split('T')[0];
        // Create token for patient at triage
        const token = yield queueService.createQueueToken(null, doctor._id.toString(), patient._id.toString(), date, 'Normal', 'Digital Check-in');
        // Mark onboarding step complete
        yield Patient_1.default.updateOne({ _id: patient._id }, { 'onboarding_steps.checkin_learned': true });
        // Get waiting tokens count
        const waitingTokens = yield Token_1.default.countDocuments({
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
    }
    catch (error) {
        console.error('Check-in error:', error);
        res.status(500).json({ success: false, message: 'Check-in failed' });
    }
});
exports.checkInWithBarcode = checkInWithBarcode;
const generateWalkInToken = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { patientId, department } = req.body;
        if (!patientId || !department) {
            return res.status(400).json({ message: 'Missing patientId or department' });
        }
        // Find patient
        const patient = yield Patient_1.default.findById(patientId);
        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }
        // Find a doctor in the department
        const doctor = yield Doctor_1.default.findOne({ department, is_available: true });
        if (!doctor) {
            return res.status(404).json({ message: `No available doctor in department: ${department}` });
        }
        const date = new Date().toISOString().split('T')[0];
        // Create token
        const token = yield queueService.createQueueToken(null, // No pre-booked appointment
        doctor._id.toString(), patient._id.toString(), date, 'Normal', 'Walk-in OPD consultation');
        res.json({
            message: 'Walk-in token generated successfully',
            token
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.generateWalkInToken = generateWalkInToken;
