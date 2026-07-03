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
exports.checkSafety = exports.getAnalytics = exports.completeConsultation = exports.getConsultationContext = exports.getConsultation = exports.startConsultation = void 0;
const consultationService = __importStar(require("../services/consultationService"));
const Doctor_1 = __importDefault(require("../models/Doctor"));
const medicationSafetyService_1 = require("../services/medicationSafetyService");
// Helper to get Doctor Document ID from authenticated User ID
const getDoctorIdFromUser = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const doctor = yield Doctor_1.default.findOne({ user_id: userId });
    if (!doctor) {
        throw new Error("Authenticated user is not registered as a Doctor.");
    }
    return doctor._id.toString();
});
const startConsultation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { patient_id, token_id } = req.body;
        if (!patient_id) {
            return res.status(400).json({ message: "Patient ID is required." });
        }
        const userId = req.user.id;
        const doctorId = yield getDoctorIdFromUser(userId);
        const consultation = yield consultationService.startConsultation(patient_id, doctorId, token_id);
        return res.status(200).json(consultation);
    }
    catch (e) {
        console.error(e);
        return res.status(500).json({ message: e.message || "Failed to start consultation." });
    }
});
exports.startConsultation = startConsultation;
const getConsultation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { consultationId } = req.params;
        if (!consultationId) {
            return res.status(400).json({ message: "Consultation ID is required." });
        }
        const consultation = yield consultationService.getConsultationById(consultationId);
        if (!consultation) {
            return res.status(404).json({ message: "Consultation not found." });
        }
        return res.status(200).json(consultation);
    }
    catch (e) {
        console.error(e);
        return res.status(500).json({ message: e.message || "Failed to fetch consultation." });
    }
});
exports.getConsultation = getConsultation;
const getConsultationContext = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { patientId } = req.params;
        if (!patientId) {
            return res.status(400).json({ message: "Patient ID parameter is required." });
        }
        const userId = req.user.id;
        const doctorId = yield getDoctorIdFromUser(userId);
        const context = yield consultationService.getConsultationContext(patientId, doctorId);
        return res.status(200).json(context);
    }
    catch (e) {
        console.error(e);
        return res.status(500).json({ message: e.message || "Failed to retrieve consultation context." });
    }
});
exports.getConsultationContext = getConsultationContext;
const completeConsultation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { consultationId } = req.params;
        if (!consultationId) {
            return res.status(400).json({ message: "Consultation ID is required." });
        }
        const userId = req.user.id;
        const doctorId = yield getDoctorIdFromUser(userId);
        const result = yield consultationService.completeConsultation(consultationId, doctorId, req.body);
        return res.status(200).json({
            message: "Consultation completed successfully and EMR records updated.",
            consultation: result
        });
    }
    catch (e) {
        console.error(e);
        return res.status(500).json({ message: e.message || "Failed to complete consultation." });
    }
});
exports.completeConsultation = completeConsultation;
const getAnalytics = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const analytics = yield consultationService.getAnalytics();
        return res.status(200).json(analytics);
    }
    catch (e) {
        console.error(e);
        return res.status(500).json({ message: e.message || "Failed to fetch analytics." });
    }
});
exports.getAnalytics = getAnalytics;
const checkSafety = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { patientId, medicines } = req.body;
        if (!patientId || !medicines) {
            return res.status(400).json({ message: "patientId and medicines array are required." });
        }
        const userId = req.user.id;
        const doctorId = yield getDoctorIdFromUser(userId);
        const warnings = yield (0, medicationSafetyService_1.evaluatePrescriptionSafety)(patientId, medicines, doctorId);
        return res.status(200).json({ success: true, data: warnings });
    }
    catch (e) {
        console.error(e);
        return res.status(500).json({ message: e.message || "Safety check failed." });
    }
});
exports.checkSafety = checkSafety;
