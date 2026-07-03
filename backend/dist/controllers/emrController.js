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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLabOrders = exports.getAudit = exports.getNotes = exports.uploadAttachment = exports.updateLab = exports.getVitals = exports.createVisit = exports.getVisits = exports.updateProfile = exports.getProfile = void 0;
const emrService = __importStar(require("../services/emrService"));
const getProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { patientId } = req.params;
        const profile = yield emrService.getMedicalProfile(patientId);
        res.json(profile || {});
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
exports.getProfile = getProfile;
const updateProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { patientId } = req.params;
        const _a = req.body, { operatorId, operatorRole } = _a, profileData = __rest(_a, ["operatorId", "operatorRole"]);
        // Default values for operator if not supplied (for ease of dev/test)
        const opId = operatorId || '6a46a645e427b1051886244e';
        const opRole = operatorRole || 'Doctor';
        const profile = yield emrService.updateMedicalProfile(patientId, profileData, opId, opRole);
        res.json({ message: "Medical profile updated successfully", profile });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
exports.updateProfile = updateProfile;
const getVisits = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { patientId } = req.params;
        const visits = yield emrService.getVisitHistory(patientId);
        res.json(visits);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
exports.getVisits = getVisits;
const createVisit = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const _a = req.body, { operatorId, operatorRole } = _a, visitData = __rest(_a, ["operatorId", "operatorRole"]);
        const opId = operatorId || visitData.doctor_id;
        const opRole = operatorRole || 'Doctor';
        const visit = yield emrService.createVisitRecord(visitData, opId, opRole);
        res.status(201).json({ message: "Clinical visit recorded successfully", visit });
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
});
exports.createVisit = createVisit;
const getVitals = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { patientId } = req.params;
        const vitals = yield emrService.getVitalsHistory(patientId);
        res.json(vitals);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
exports.getVitals = getVitals;
const updateLab = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { orderId } = req.params;
        const _a = req.body, { operatorId, operatorRole } = _a, updateData = __rest(_a, ["operatorId", "operatorRole"]);
        const opId = operatorId || '6a46a645e427b1051886244e';
        const opRole = operatorRole || 'Doctor';
        const lab = yield emrService.updateLabOrderStatus(orderId, updateData, opId, opRole);
        res.json({ message: "Lab order status updated successfully", lab });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
exports.updateLab = updateLab;
const uploadAttachment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { visitId } = req.params;
        const { operatorId, operatorRole, attachment } = req.body;
        const opId = operatorId || '6a46a645e427b1051886244e';
        const opRole = operatorRole || 'Doctor';
        const visit = yield emrService.addAttachmentToVisit(visitId, attachment, opId, opRole);
        res.json({ message: "Attachment added successfully", visit });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
exports.uploadAttachment = uploadAttachment;
const getNotes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { patientId, doctorId } = req.query;
        if (!patientId || !doctorId) {
            return res.status(400).json({ error: "patientId and doctorId are required" });
        }
        const notes = yield emrService.getDoctorNotes(patientId, doctorId);
        res.json(notes);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
exports.getNotes = getNotes;
const getAudit = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { patientId } = req.params;
        const logs = yield emrService.getAuditHistory(patientId);
        res.json(logs);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
exports.getAudit = getAudit;
const getLabOrders = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { status } = req.query;
        const orders = yield emrService.getLabOrders(status);
        res.json(orders);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
exports.getLabOrders = getLabOrders;
