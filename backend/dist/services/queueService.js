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
exports.predictWaitTime = exports.updateQueueProgress = exports.getQueueStatus = void 0;
const Queue_1 = __importDefault(require("../models/Queue"));
const Doctor_1 = __importDefault(require("../models/Doctor"));
const getQueueStatus = (doctorId, date) => __awaiter(void 0, void 0, void 0, function* () {
    let queue = yield Queue_1.default.findOne({ doctor_id: doctorId, date });
    if (!queue) {
        // If queue doesn't exist for today, create one
        const doctor = yield Doctor_1.default.findOne({ user_id: doctorId });
        if (!doctor)
            throw new Error('Doctor not found');
        queue = yield Queue_1.default.create({
            department: doctor.department,
            doctor_id: doctorId,
            date,
            current_token: 0,
            total_waiting: 0,
            estimated_wait_time_per_patient: doctor.avg_consultation_time
        });
    }
    return queue;
});
exports.getQueueStatus = getQueueStatus;
const updateQueueProgress = (doctorId, date) => __awaiter(void 0, void 0, void 0, function* () {
    const queue = yield Queue_1.default.findOne({ doctor_id: doctorId, date });
    if (!queue)
        throw new Error('Queue not found');
    queue.current_token += 1;
    queue.total_waiting = Math.max(0, queue.total_waiting - 1);
    yield queue.save();
    return queue;
});
exports.updateQueueProgress = updateQueueProgress;
const predictWaitTime = (queueId, tokenNumber) => __awaiter(void 0, void 0, void 0, function* () {
    const queue = yield Queue_1.default.findById(queueId);
    if (!queue)
        throw new Error('Queue not found');
    const patientsAhead = Math.max(0, tokenNumber - queue.current_token);
    return patientsAhead * queue.estimated_wait_time_per_patient;
});
exports.predictWaitTime = predictWaitTime;
