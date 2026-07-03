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
exports.getAnalytics = exports.completeConsultation = exports.getConsultationContext = exports.getConsultationById = exports.startConsultation = exports.logConsultationAudit = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Consultation_1 = __importDefault(require("../models/Consultation"));
const ClinicalNote_1 = __importDefault(require("../models/ClinicalNote"));
const Medicine_1 = __importDefault(require("../models/Medicine"));
const FollowUp_1 = __importDefault(require("../models/FollowUp"));
const Referral_1 = __importDefault(require("../models/Referral"));
const DoctorInstruction_1 = __importDefault(require("../models/DoctorInstruction"));
const ConsultationAnalytics_1 = __importDefault(require("../models/ConsultationAnalytics"));
const Visit_1 = __importDefault(require("../models/Visit"));
const Patient_1 = __importDefault(require("../models/Patient"));
const Doctor_1 = __importDefault(require("../models/Doctor"));
const Vitals_1 = __importDefault(require("../models/Vitals"));
const Diagnosis_1 = __importDefault(require("../models/Diagnosis"));
const Prescription_1 = __importDefault(require("../models/Prescription"));
const LabOrder_1 = __importDefault(require("../models/LabOrder"));
const MedicalProfile_1 = __importDefault(require("../models/MedicalProfile"));
const AuditLog_1 = __importDefault(require("../models/AuditLog"));
const axios_1 = __importDefault(require("axios"));
const labService = __importStar(require("./labService"));
// Helper for audit logging
const logConsultationAudit = (userId, action, patientId, details) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield AuditLog_1.default.create({
            user_id: new mongoose_1.default.Types.ObjectId(userId),
            user_type: 'Doctor',
            action,
            patient_id: new mongoose_1.default.Types.ObjectId(patientId),
            details,
            ip_address: '127.0.0.1'
        });
    }
    catch (e) {
        console.error("Consultation audit logging failed", e);
    }
});
exports.logConsultationAudit = logConsultationAudit;
const startConsultation = (patientId, doctorId, tokenId) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if there is an active/InProgress consultation for this patient and doctor
    let consultation = yield Consultation_1.default.findOne({
        patient_id: new mongoose_1.default.Types.ObjectId(patientId),
        doctor_id: new mongoose_1.default.Types.ObjectId(doctorId),
        status: 'InProgress'
    });
    if (!consultation) {
        consultation = new Consultation_1.default({
            patient_id: new mongoose_1.default.Types.ObjectId(patientId),
            doctor_id: new mongoose_1.default.Types.ObjectId(doctorId),
            token_id: tokenId ? new mongoose_1.default.Types.ObjectId(tokenId) : undefined,
            chief_complaint: 'Routine consultation checkup',
            symptoms: [],
            status: 'InProgress',
            duration_seconds: 0
        });
        yield consultation.save();
        yield (0, exports.logConsultationAudit)(doctorId, 'START_CONSULTATION', patientId, `Started consultation session (ID: ${consultation._id}).`);
    }
    return consultation;
});
exports.startConsultation = startConsultation;
const getConsultationById = (consultationId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield Consultation_1.default.findById(consultationId).populate('patient_id');
});
exports.getConsultationById = getConsultationById;
const getConsultationContext = (patientId, doctorId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const patientObjId = new mongoose_1.default.Types.ObjectId(patientId);
    // 1. Fetch Patient, Doctor details
    const patient = yield Patient_1.default.findById(patientId).populate('user_id', 'name email phone gender date_of_birth');
    const medicalProfile = yield MedicalProfile_1.default.findOne({ patient_id: patientObjId });
    // 2. Fetch History
    const visits = yield Visit_1.default.find({ patient_id: patientObjId })
        .populate('vitals')
        .populate('diagnosis')
        .populate('prescription')
        .populate('lab_orders')
        .sort({ date: -1 });
    const vitalsHistory = yield Vitals_1.default.find({ patient_id: patientObjId }).sort({ recorded_at: -1 }).limit(10);
    const labOrders = yield LabOrder_1.default.find({ patient_id: patientObjId }).sort({ createdAt: -1 });
    // 3. AI assistant call
    let aiSuggestions = null;
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    try {
        const payload = {
            patient_name: (patient === null || patient === void 0 ? void 0 : patient.name) || 'Patient',
            age: (patient === null || patient === void 0 ? void 0 : patient.age) || 30,
            gender: (patient === null || patient === void 0 ? void 0 : patient.gender) || 'Male',
            blood_group: (patient === null || patient === void 0 ? void 0 : patient.blood_group) || 'O+',
            allergies: (medicalProfile === null || medicalProfile === void 0 ? void 0 : medicalProfile.allergies) || [],
            chronic_diseases: (medicalProfile === null || medicalProfile === void 0 ? void 0 : medicalProfile.existing_diseases) || [],
            current_medications: (medicalProfile === null || medicalProfile === void 0 ? void 0 : medicalProfile.current_medications) || [],
            symptoms: visits.length > 0 ? (visits[0].symptoms || []) : [],
            vitals: vitalsHistory.length > 0 ? {
                temperature: vitalsHistory[0].temperature,
                blood_pressure: vitalsHistory[0].blood_pressure,
                heart_rate: vitalsHistory[0].heart_rate,
                oxygen_saturation: vitalsHistory[0].oxygen_saturation,
                blood_sugar: vitalsHistory[0].blood_sugar
            } : {},
            previous_visits: visits.slice(0, 3).map(v => ({
                date: v.date,
                symptoms: v.symptoms,
                treatment_plan: v.treatment_plan
            }))
        };
        const res = yield axios_1.default.post(`${aiServiceUrl}/consultation-assistant`, payload, { timeout: 3000 });
        aiSuggestions = res.data;
    }
    catch (e) {
        console.error("AI Assistant Service connection error:", e.message);
        // Rule-based fallback suggestions
        aiSuggestions = {
            summary: "Patient presents for consultation. Check recent vitals and history.",
            differential_diagnoses: ["Viral Infection", "Influenza", "Acute Bronchitis"],
            warnings: ((_a = medicalProfile === null || medicalProfile === void 0 ? void 0 : medicalProfile.allergies) === null || _a === void 0 ? void 0 : _a.length)
                ? [`Allergic warning: Patient is allergic to: ${medicalProfile.allergies.join(', ')}`]
                : ["No allergy profile loaded. Verify drug interactions manually."],
            suggested_investigations: ["Complete Blood Count (CBC)"],
            suggested_follow_up: "Follow up in 5 days if symptoms persist."
        };
    }
    return {
        patient,
        medicalProfile,
        visits,
        vitalsHistory,
        labOrders,
        aiSuggestions
    };
});
exports.getConsultationContext = getConsultationContext;
const completeConsultation = (consultationId, doctorId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // 1. Validation
    if (!payload.diagnosis || !payload.diagnosis.primary_diagnosis) {
        throw new Error("Validation Error: Primary diagnosis is required to complete consultation.");
    }
    if (payload.prescription && !payload.prescription.confirmation_acknowledged) {
        throw new Error("Validation Error: Prescription safety verification must be acknowledged.");
    }
    const consultation = yield Consultation_1.default.findById(consultationId);
    if (!consultation) {
        throw new Error("Consultation not found.");
    }
    if (consultation.status !== 'InProgress') {
        throw new Error("Consultation is already completed or cancelled.");
    }
    const patientId = consultation.patient_id;
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        // Create Clinical Note
        const note = new ClinicalNote_1.default({
            patient_id: patientId,
            doctor_id: doctorId,
            subjective: payload.clinical_note.subjective,
            objective: payload.clinical_note.objective,
            assessment: payload.clinical_note.assessment,
            plan: payload.clinical_note.plan,
            private_notes: payload.clinical_note.private_notes
        });
        yield note.save({ session });
        consultation.clinical_note = note._id;
        // Create Diagnosis
        const diag = new Diagnosis_1.default({
            patient_id: patientId,
            primary_diagnosis: payload.diagnosis.primary_diagnosis,
            secondary_diagnoses: payload.diagnosis.secondary_diagnoses || [],
            icd_code: payload.diagnosis.icd_code,
            severity: payload.diagnosis.severity,
            clinical_impression: payload.diagnosis.clinical_impression
        });
        yield diag.save({ session });
        consultation.diagnosis = diag._id;
        // Save Vitals
        let vitalsRef = null;
        if (payload.vitals) {
            const heightInM = payload.vitals.height / 100;
            const bmi = parseFloat((payload.vitals.weight / (heightInM * heightInM)).toFixed(2));
            const vitals = new Vitals_1.default(Object.assign(Object.assign({ patient_id: patientId }, payload.vitals), { bmi }));
            yield vitals.save({ session });
            vitalsRef = vitals._id;
            // Update patient Master Profile
            yield MedicalProfile_1.default.findOneAndUpdate({ patient_id: patientId }, { height: payload.vitals.height, weight: payload.vitals.weight, bmi }, { upsert: true, session });
        }
        // Create Prescription
        if (payload.prescription && payload.prescription.medicines.length > 0) {
            const pres = new Prescription_1.default({
                patient_id: patientId,
                doctor_id: new mongoose_1.default.Types.ObjectId(doctorId),
                medicines: payload.prescription.medicines.map((m) => (Object.assign(Object.assign({}, m), { quantity: m.quantity || 10 }))),
                instructions: payload.prescription.instructions,
                status: 'Generated'
            });
            yield pres.save({ session });
            consultation.prescription = pres._id;
            // Keep track of medicine database insertion asynchronously or dynamically
            for (const med of payload.prescription.medicines) {
                yield Medicine_1.default.findOneAndUpdate({ name: med.name }, { name: med.name, dosage_form: 'Tablet', strength: med.dosage || '500mg', is_active: true }, { upsert: true, session });
            }
        }
        // Save Follow Up
        if (payload.follow_up && payload.follow_up.follow_up_date) {
            const followUp = new FollowUp_1.default({
                patient_id: patientId,
                doctor_id: doctorId,
                follow_up_date: new Date(payload.follow_up.follow_up_date),
                follow_up_time: payload.follow_up.follow_up_time,
                purpose: payload.follow_up.purpose
            });
            yield followUp.save({ session });
            consultation.follow_up = followUp._id;
        }
        // Save Referral
        if (payload.referral && payload.referral.referral_letter) {
            const referral = new Referral_1.default({
                patient_id: patientId,
                doctor_id: doctorId,
                referred_to_specialist: payload.referral.referred_to_specialist,
                referred_to_department: payload.referral.referred_to_department,
                referred_to_hospital: payload.referral.referred_to_hospital,
                referral_letter: payload.referral.referral_letter
            });
            yield referral.save({ session });
            consultation.referral = referral._id;
        }
        // Save Doctor Instructions
        if (payload.doctor_instruction) {
            const instruction = new DoctorInstruction_1.default({
                patient_id: patientId,
                doctor_id: doctorId,
                diet_advice: payload.doctor_instruction.diet_advice,
                exercise_plan: payload.doctor_instruction.exercise_plan,
                recovery_instructions: payload.doctor_instruction.recovery_instructions,
                preventive_care: payload.doctor_instruction.preventive_care,
                educational_pdfs: payload.doctor_instruction.educational_pdfs || []
            });
            yield instruction.save({ session });
            consultation.doctor_instruction = instruction._id;
        }
        // Save Lab Orders
        const labOrderIds = [];
        if (payload.lab_orders && payload.lab_orders.length > 0) {
            const results = payload.lab_orders.map(testName => ({
                test_name: testName,
                status: 'Pending'
            }));
            const labOrder = new LabOrder_1.default({
                patient_id: patientId,
                tests: payload.lab_orders,
                results,
                status: 'Ordered'
            });
            yield labOrder.save({ session });
            yield labService.initializeSamplesForOrder(labOrder);
            labOrderIds.push(labOrder._id);
            consultation.lab_orders = labOrderIds;
        }
        // Create the legacy EMR "Visit" record for full backwards compatibility
        const doctor = yield Doctor_1.default.findOne({ _id: doctorId }).populate('user_id');
        const department = (doctor === null || doctor === void 0 ? void 0 : doctor.specialization) || 'General';
        const visit = new Visit_1.default({
            patient_id: patientId,
            doctor_id: doctorId,
            department: department,
            symptoms: payload.symptoms,
            treatment_plan: payload.clinical_note.plan,
            vitals: vitalsRef || undefined,
            diagnosis: consultation.diagnosis,
            prescription: consultation.prescription,
            notes: note._id,
            lab_orders: labOrderIds,
            status: 'Completed',
            date: new Date()
        });
        yield visit.save({ session });
        consultation.visit_id = visit._id;
        // Link prescription to visit if it was created
        if (consultation.prescription) {
            yield Prescription_1.default.findByIdAndUpdate(consultation.prescription, { visit_id: visit._id }, { session });
        }
        // Update consultation duration, status
        consultation.chief_complaint = payload.chief_complaint;
        consultation.symptoms = payload.symptoms;
        consultation.examination = payload.examination;
        consultation.duration_seconds = payload.duration_seconds || 0;
        consultation.status = 'Completed';
        yield consultation.save({ session });
        // Update Token queue status to Completed if token exists
        if (consultation.token_id) {
            try {
                // Check if QueueToken model exists
                const QueueToken = mongoose_1.default.model('QueueToken');
                if (QueueToken) {
                    yield QueueToken.findByIdAndUpdate(consultation.token_id, { status: 'Completed', completed_at: new Date() }, { session });
                }
            }
            catch (err) {
                // Ignore if model does not exist
            }
        }
        // Update Analytics
        const todayStr = new Date().toISOString().split('T')[0];
        const todayStart = new Date(todayStr);
        let analytics = yield ConsultationAnalytics_1.default.findOne({ date: todayStart }).session(session);
        if (!analytics) {
            analytics = new ConsultationAnalytics_1.default({
                date: todayStart,
                consultations_count: 0,
                average_consultation_time_seconds: 0,
                doctor_productivity: [],
                department_stats: [],
                medicine_usage: [],
                lab_requests_count: 0
            });
        }
        const prevCount = analytics.consultations_count;
        const prevAvg = analytics.average_consultation_time_seconds;
        const newCount = prevCount + 1;
        const newAvg = parseFloat(((prevAvg * prevCount + consultation.duration_seconds) / newCount).toFixed(2));
        analytics.consultations_count = newCount;
        analytics.average_consultation_time_seconds = newAvg;
        analytics.lab_requests_count += (((_a = payload.lab_orders) === null || _a === void 0 ? void 0 : _a.length) || 0);
        // Update doctor productivity
        const docIndex = analytics.doctor_productivity.findIndex(d => d.doctor_id.toString() === doctorId.toString());
        const doctorName = (doctor === null || doctor === void 0 ? void 0 : doctor.user_id) && 'name' in doctor.user_id ? doctor.user_id.name : 'Doctor';
        if (docIndex >= 0) {
            const dCount = analytics.doctor_productivity[docIndex].consultations_count;
            const dAvg = analytics.doctor_productivity[docIndex].average_time_seconds;
            analytics.doctor_productivity[docIndex].consultations_count += 1;
            analytics.doctor_productivity[docIndex].average_time_seconds = parseFloat(((dAvg * dCount + consultation.duration_seconds) / (dCount + 1)).toFixed(2));
        }
        else {
            analytics.doctor_productivity.push({
                doctor_id: new mongoose_1.default.Types.ObjectId(doctorId),
                name: doctorName,
                consultations_count: 1,
                average_time_seconds: consultation.duration_seconds
            });
        }
        // Update department stats
        const deptIndex = analytics.department_stats.findIndex(d => d.department === department);
        if (deptIndex >= 0) {
            analytics.department_stats[deptIndex].consultations_count += 1;
        }
        else {
            analytics.department_stats.push({
                department: department,
                consultations_count: 1
            });
        }
        // Update medicine usage
        if (payload.prescription && payload.prescription.medicines) {
            for (const med of payload.prescription.medicines) {
                const medIndex = analytics.medicine_usage.findIndex(m => m.medicine_name.toLowerCase() === med.name.toLowerCase());
                if (medIndex >= 0) {
                    analytics.medicine_usage[medIndex].prescription_count += 1;
                }
                else {
                    analytics.medicine_usage.push({
                        medicine_name: med.name,
                        prescription_count: 1
                    });
                }
            }
        }
        yield analytics.save({ session });
        yield (0, exports.logConsultationAudit)(doctorId, 'COMPLETE_CONSULTATION', patientId.toString(), `Completed consultation ${consultation._id}. Duration: ${consultation.duration_seconds}s. Visit: ${visit.visit_id}.`);
        yield session.commitTransaction();
        session.endSession();
        return consultation;
    }
    catch (e) {
        yield session.abortTransaction();
        session.endSession();
        throw e;
    }
});
exports.completeConsultation = completeConsultation;
const getAnalytics = (doctorId) => __awaiter(void 0, void 0, void 0, function* () {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayStart = new Date(todayStr);
    let analytics = yield ConsultationAnalytics_1.default.findOne({ date: todayStart });
    if (!analytics) {
        // Return latest analytics or dummy
        analytics = yield ConsultationAnalytics_1.default.findOne().sort({ date: -1 });
    }
    return analytics;
});
exports.getAnalytics = getAnalytics;
