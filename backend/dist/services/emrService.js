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
exports.getLabOrders = exports.getAuditHistory = exports.getDoctorNotes = exports.addAttachmentToVisit = exports.updateLabOrderStatus = exports.getVitalsHistory = exports.createVisitRecord = exports.getVisitHistory = exports.updateMedicalProfile = exports.getMedicalProfile = exports.logAudit = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const MedicalProfile_1 = __importDefault(require("../models/MedicalProfile"));
const Patient_1 = __importDefault(require("../models/Patient"));
const Visit_1 = __importDefault(require("../models/Visit"));
const Vitals_1 = __importDefault(require("../models/Vitals"));
const Diagnosis_1 = __importDefault(require("../models/Diagnosis"));
const Prescription_1 = __importDefault(require("../models/Prescription"));
const LabOrder_1 = __importDefault(require("../models/LabOrder"));
const DoctorNote_1 = __importDefault(require("../models/DoctorNote"));
const AuditLog_1 = __importDefault(require("../models/AuditLog"));
// Helper to log actions
const logAudit = (userId, userType, action, patientId, details, ipAddress) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield AuditLog_1.default.create({
            user_id: new mongoose_1.default.Types.ObjectId(userId),
            user_type: userType,
            action,
            patient_id: new mongoose_1.default.Types.ObjectId(patientId),
            details,
            ip_address: ipAddress || '127.0.0.1'
        });
    }
    catch (e) {
        console.error("Audit log creation failed", e);
    }
});
exports.logAudit = logAudit;
const getMedicalProfile = (patientId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield MedicalProfile_1.default.findOne({ patient_id: new mongoose_1.default.Types.ObjectId(patientId) });
});
exports.getMedicalProfile = getMedicalProfile;
const updateMedicalProfile = (patientId, profileData, operatorId, operatorRole) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    let profile = yield MedicalProfile_1.default.findOne({ patient_id: new mongoose_1.default.Types.ObjectId(patientId) });
    if (profile) {
        // Enforce that we do not delete fields, only merge/update
        Object.assign(profile, profileData);
        yield profile.save();
    }
    else {
        profile = new MedicalProfile_1.default(Object.assign({ patient_id: new mongoose_1.default.Types.ObjectId(patientId) }, profileData));
        yield profile.save();
        // Connect back to patient model
        yield Patient_1.default.findByIdAndUpdate(patientId, { medical_profile: profile._id });
    }
    yield (0, exports.logAudit)(operatorId, operatorRole, 'UPDATE_MEDICAL_PROFILE', patientId, `Updated patient medical profile. Allergies count: ${((_a = profile.allergies) === null || _a === void 0 ? void 0 : _a.length) || 0}.`);
    return profile;
});
exports.updateMedicalProfile = updateMedicalProfile;
const getVisitHistory = (patientId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield Visit_1.default.find({ patient_id: new mongoose_1.default.Types.ObjectId(patientId) })
        .populate('doctor_id', 'user_id specialization')
        .populate({
        path: 'doctor_id',
        populate: { path: 'user_id', select: 'name' }
    })
        .populate('vitals')
        .populate('diagnosis')
        .populate('prescription')
        .populate('lab_orders')
        .sort({ date: -1 }); // Newest first
});
exports.getVisitHistory = getVisitHistory;
const createVisitRecord = (visitData, operatorId, operatorRole) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const patientIdObj = new mongoose_1.default.Types.ObjectId(visitData.patient_id);
        const doctorIdObj = new mongoose_1.default.Types.ObjectId(visitData.doctor_id);
        // Prevent duplicate visit record: Check if there's already a visit for this patient with this doctor in the last 15 minutes
        const minutesAgo = new Date(Date.now() - 15 * 60 * 1000);
        const duplicate = yield Visit_1.default.findOne({
            patient_id: patientIdObj,
            doctor_id: doctorIdObj,
            createdAt: { $gte: minutesAgo }
        }).session(session);
        if (duplicate) {
            throw new Error("A recent visit record with this doctor already exists (potential double submit).");
        }
        // Create Visit
        const visit = new Visit_1.default({
            patient_id: patientIdObj,
            doctor_id: doctorIdObj,
            department: visitData.department,
            symptoms: visitData.symptoms,
            treatment_plan: visitData.treatment_plan,
            status: 'Completed'
        });
        yield visit.save({ session });
        // Save Vitals if provided
        if (visitData.vitals) {
            // Calculate BMI
            const heightInM = visitData.vitals.height / 100;
            const bmi = parseFloat((visitData.vitals.weight / (heightInM * heightInM)).toFixed(2));
            const vitalsRecord = new Vitals_1.default(Object.assign(Object.assign({ patient_id: patientIdObj, visit_id: visit._id }, visitData.vitals), { bmi }));
            yield vitalsRecord.save({ session });
            visit.vitals = vitalsRecord._id;
            // Also update the patient's master MedicalProfile with recent height/weight
            yield MedicalProfile_1.default.findOneAndUpdate({ patient_id: patientIdObj }, {
                height: visitData.vitals.height,
                weight: visitData.vitals.weight,
                bmi
            }, { upsert: true, session });
        }
        // Save Diagnosis if provided
        if (visitData.diagnosis) {
            const diagRecord = new Diagnosis_1.default(Object.assign({ patient_id: patientIdObj, visit_id: visit._id }, visitData.diagnosis));
            yield diagRecord.save({ session });
            visit.diagnosis = diagRecord._id;
        }
        // Save Prescription if provided
        if (visitData.prescription) {
            const presRecord = new Prescription_1.default(Object.assign({ patient_id: patientIdObj, visit_id: visit._id }, visitData.prescription));
            yield presRecord.save({ session });
            visit.prescription = presRecord._id;
        }
        // Save Lab Orders if provided
        if (visitData.lab_orders && visitData.lab_orders.tests && visitData.lab_orders.tests.length > 0) {
            const results = visitData.lab_orders.tests.map(testName => ({
                test_name: testName,
                status: 'Pending'
            }));
            const labOrderRecord = new LabOrder_1.default({
                patient_id: patientIdObj,
                visit_id: visit._id,
                tests: visitData.lab_orders.tests,
                results,
                status: 'Ordered'
            });
            yield labOrderRecord.save({ session });
            visit.lab_orders.push(labOrderRecord._id);
        }
        // Save Doctor Private Notes if provided
        if (visitData.private_notes) {
            const notesRecord = new DoctorNote_1.default({
                patient_id: patientIdObj,
                visit_id: visit._id,
                doctor_id: doctorIdObj,
                private_notes: visitData.private_notes
            });
            yield notesRecord.save({ session });
            visit.notes = notesRecord._id;
        }
        yield visit.save({ session });
        yield (0, exports.logAudit)(operatorId, operatorRole, 'CREATE_VISIT_RECORD', visitData.patient_id, `Created clinical encounter visit ${visit.visit_id}.`);
        yield session.commitTransaction();
        session.endSession();
        return visit;
    }
    catch (e) {
        yield session.abortTransaction();
        session.endSession();
        throw e;
    }
});
exports.createVisitRecord = createVisitRecord;
const getVitalsHistory = (patientId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield Vitals_1.default.find({ patient_id: new mongoose_1.default.Types.ObjectId(patientId) })
        .sort({ recorded_at: 1 }); // chronological order for trend charts
});
exports.getVitalsHistory = getVitalsHistory;
const updateLabOrderStatus = (orderId, updateData, operatorId, operatorRole) => __awaiter(void 0, void 0, void 0, function* () {
    const labOrder = yield LabOrder_1.default.findById(orderId);
    if (!labOrder) {
        throw new Error("Lab order not found.");
    }
    labOrder.status = updateData.status;
    if (updateData.results) {
        // Map results back
        labOrder.results = labOrder.results.map(r => {
            var _a;
            const match = (_a = updateData.results) === null || _a === void 0 ? void 0 : _a.find(ur => ur.test_name === r.test_name);
            if (match) {
                return Object.assign(Object.assign({}, r), { result_value: match.result_value, reference_range: match.reference_range || r.reference_range, status: 'Completed', completed_at: new Date() });
            }
            return r;
        });
    }
    yield labOrder.save();
    yield (0, exports.logAudit)(operatorId, operatorRole, 'UPDATE_LAB_ORDER', labOrder.patient_id.toString(), `Updated Lab Order ${labOrder.lab_order_id} status to ${updateData.status}.`);
    return labOrder;
});
exports.updateLabOrderStatus = updateLabOrderStatus;
const addAttachmentToVisit = (visitId, attachment, operatorId, operatorRole) => __awaiter(void 0, void 0, void 0, function* () {
    const visit = yield Visit_1.default.findById(visitId);
    if (!visit) {
        throw new Error("Visit not found.");
    }
    // Check version
    const existingCount = visit.attachments.filter(a => a.name === attachment.name).length;
    const version = existingCount + 1;
    visit.attachments.push(Object.assign(Object.assign({}, attachment), { uploaded_at: new Date(), version }));
    yield visit.save();
    yield (0, exports.logAudit)(operatorId, operatorRole, 'ADD_ATTACHMENT', visit.patient_id.toString(), `Attached file ${attachment.name} (version ${version}) to visit ${visit.visit_id}.`);
    return visit;
});
exports.addAttachmentToVisit = addAttachmentToVisit;
const getDoctorNotes = (patientId, doctorId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield DoctorNote_1.default.find({
        patient_id: new mongoose_1.default.Types.ObjectId(patientId),
        doctor_id: new mongoose_1.default.Types.ObjectId(doctorId)
    }).sort({ createdAt: -1 });
});
exports.getDoctorNotes = getDoctorNotes;
const getAuditHistory = (patientId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield AuditLog_1.default.find({ patient_id: new mongoose_1.default.Types.ObjectId(patientId) })
        .sort({ timestamp: -1 });
});
exports.getAuditHistory = getAuditHistory;
const getLabOrders = (status) => __awaiter(void 0, void 0, void 0, function* () {
    const query = status ? { status } : {};
    return yield LabOrder_1.default.find(query)
        .populate({
        path: 'patient_id',
        select: 'name patient_id gender age phone'
    })
        .populate({
        path: 'visit_id',
        populate: {
            path: 'doctor_id',
            populate: {
                path: 'user_id',
                select: 'name'
            }
        }
    })
        .sort({ createdAt: -1 });
});
exports.getLabOrders = getLabOrders;
