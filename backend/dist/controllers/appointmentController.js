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
exports.getPatientAppointments = exports.checkIn = exports.bookAppointment = exports.getSlots = void 0;
const Appointment_1 = __importDefault(require("../models/Appointment"));
const Doctor_1 = __importDefault(require("../models/Doctor"));
const mongoose_1 = __importDefault(require("mongoose"));
const queueService_1 = require("../services/queueService");
// Helper to generate slots
const generateTimeSlots = (start, end, duration) => {
    const slots = [];
    let current = new Date(`2024-01-01T${start}:00`);
    const endTime = new Date(`2024-01-01T${end}:00`);
    while (current < endTime) {
        slots.push(current.toTimeString().slice(0, 5));
        current.setMinutes(current.getMinutes() + duration);
    }
    return slots;
};
const getSlots = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { doctorId, date } = req.query;
        if (!doctorId || !date)
            return res.status(400).json({ message: 'Missing doctorId or date' });
        // Resolve doctor to ensure correctness
        const doctor = yield Doctor_1.default.findOne({ $or: [
                { _id: mongoose_1.default.isValidObjectId(doctorId) ? doctorId : new mongoose_1.default.Types.ObjectId() },
                { user_id: mongoose_1.default.isValidObjectId(doctorId) ? doctorId : new mongoose_1.default.Types.ObjectId() }
            ] });
        if (!doctor)
            return res.status(404).json({ message: 'Doctor not found' });
        const doctorDocId = doctor._id;
        // 1. Generate all possible slots (9 AM - 5 PM, 20 mins)
        const allSlots = generateTimeSlots('09:00', '17:00', 20);
        // 2. Fetch booked slots
        const bookedAppointments = yield Appointment_1.default.find({ doctor_id: doctorDocId, date });
        const bookedSlots = bookedAppointments.map(app => app.slot_time);
        // 3. Filter available slots
        const availableSlots = allSlots.filter(slot => !bookedSlots.includes(slot));
        res.json({ slots: availableSlots });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.getSlots = getSlots;
const bookAppointment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { patient_id, doctor_id, date, slot_time } = req.body;
        if (!patient_id || !doctor_id || !date || !slot_time) {
            return res.status(400).json({ message: 'Missing required booking parameters' });
        }
        // Resolve doctor
        const doctor = yield Doctor_1.default.findOne({ $or: [
                { _id: mongoose_1.default.isValidObjectId(doctor_id) ? doctor_id : new mongoose_1.default.Types.ObjectId() },
                { user_id: mongoose_1.default.isValidObjectId(doctor_id) ? doctor_id : new mongoose_1.default.Types.ObjectId() }
            ] });
        if (!doctor)
            return res.status(404).json({ message: 'Doctor not found' });
        const doctorDocId = doctor._id;
        // Check if slot is already taken
        const existing = yield Appointment_1.default.findOne({ doctor_id: doctorDocId, date, slot_time });
        if (existing)
            return res.status(409).json({ message: 'Slot already booked' });
        // Logic to calculate waiting token number
        const count = yield Appointment_1.default.countDocuments({ doctor_id: doctorDocId, date });
        const token_number = count + 1;
        const appointment = yield Appointment_1.default.create({
            patient_id,
            doctor_id: doctorDocId,
            date,
            slot_time,
            token_number
        });
        // Update Queue and Create Token using service
        const dateStr = new Date(date).toISOString().split('T')[0];
        const token = yield (0, queueService_1.createQueueToken)(appointment._id.toString(), doctorDocId.toString(), patient_id, dateStr, 'Normal');
        res.status(201).json({
            message: 'Appointment booked',
            appointment,
            token_number: token.token_number,
            token
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.bookAppointment = bookAppointment;
const checkIn = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { appointmentId } = req.body;
        const appointment = yield Appointment_1.default.findById(appointmentId);
        if (!appointment)
            return res.status(404).json({ message: 'Appointment not found' });
        appointment.status = 'completed'; // Or 'waiting' if logic dictates
        yield appointment.save();
        res.json({ message: 'Check-in successful' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.checkIn = checkIn;
const getPatientAppointments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { patientId } = req.params;
        const appointments = yield Appointment_1.default.find({ patient_id: patientId })
            .populate({
            path: 'doctor_id',
            populate: { path: 'user_id', select: 'name' }
        })
            .sort({ date: -1, slot_time: -1 });
        res.json(appointments);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.getPatientAppointments = getPatientAppointments;
