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
exports.checkIn = exports.getSlots = exports.bookAppointment = void 0;
const Appointment_1 = __importDefault(require("../models/Appointment"));
const bookAppointment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { patient_id, doctor_id, date, slot_time } = req.body;
        // Logic to calculate waiting token number could be complex, simple increment here
        const count = yield Appointment_1.default.countDocuments({ doctor_id, date });
        const token_number = count + 1;
        const appointment = yield Appointment_1.default.create({
            patient_id,
            doctor_id,
            date,
            slot_time,
            token_number
        });
        res.status(201).json({ message: 'Appointment booked', appointment, token_number });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.bookAppointment = bookAppointment;
const getSlots = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Mock slot availability logic
    res.json({ slots: ['10:00', '10:15', '10:30', '10:45'] });
});
exports.getSlots = getSlots;
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
