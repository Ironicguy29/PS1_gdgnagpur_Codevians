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
exports.predictWait = exports.getPatientLiveToken = exports.getAnalytics = exports.pauseQueue = exports.changeDuration = exports.transfer = exports.emergency = exports.skipPatient = exports.completeConsultation = exports.startConsultation = exports.checkIn = exports.nextPatient = exports.getQueue = void 0;
const queueService = __importStar(require("../services/queueService"));
const Token_1 = __importDefault(require("../models/Token"));
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
