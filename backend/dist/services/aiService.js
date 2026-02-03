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
exports.getTriageScore = exports.predictWaitTime = void 0;
const axios_1 = __importDefault(require("axios"));
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const predictWaitTime = (queueLength, avgTime, doctorId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield axios_1.default.post(`${AI_SERVICE_URL}/predict-wait`, {
            queue_length: queueLength,
            avg_consultation_time: avgTime,
            doctor_id: doctorId
        });
        return response.data;
    }
    catch (error) {
        console.error('AI Service Error:', error);
        // Fallback logic
        return { predicted_wait_minutes: queueLength * avgTime, confidence_score: 0.5 };
    }
});
exports.predictWaitTime = predictWaitTime;
const getTriageScore = (data) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield axios_1.default.post(`${AI_SERVICE_URL}/triage-score`, data);
        return response.data;
    }
    catch (error) {
        console.error('AI Service Error:', error);
        return { triage_score: 0, category: 'Unknown' };
    }
});
exports.getTriageScore = getTriageScore;
