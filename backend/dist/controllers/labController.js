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
exports.getLIMSAnalytics = exports.getPatientLabRecords = exports.approveReport = exports.submitResults = exports.updateSampleStatus = exports.scanBarcode = exports.collectSample = exports.getLabOrderDetails = exports.getSamplesDashboard = exports.getTestCatalog = void 0;
const labService = __importStar(require("../services/labService"));
const User_1 = __importDefault(require("../models/User"));
// Helper to get authenticated user name
const getUserName = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield User_1.default.findById(userId);
        return user ? user.name : 'Laboratory Staff';
    }
    catch (_a) {
        return 'Laboratory Staff';
    }
});
const getTestCatalog = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const catalog = yield labService.getTestCatalog();
        return res.json(catalog);
    }
    catch (e) {
        return res.status(500).json({ message: e.message || 'Failed to fetch catalog' });
    }
});
exports.getTestCatalog = getTestCatalog;
const getSamplesDashboard = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield labService.getSamplesDashboardData();
        return res.json(data);
    }
    catch (e) {
        return res.status(500).json({ message: e.message || 'Failed to fetch dashboard data' });
    }
});
exports.getSamplesDashboard = getSamplesDashboard;
const getLabOrderDetails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { orderId } = req.params;
        const details = yield labService.getLabOrderDetails(orderId);
        if (!details) {
            return res.status(404).json({ message: 'Lab order not found' });
        }
        return res.json(details);
    }
    catch (e) {
        return res.status(500).json({ message: e.message || 'Failed to fetch lab order details' });
    }
});
exports.getLabOrderDetails = getLabOrderDetails;
const collectSample = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { sampleId, sampleType } = req.body;
        if (!sampleId || !sampleType) {
            return res.status(400).json({ message: 'Missing sampleId or sampleType' });
        }
        const userId = req.user.id || req.user._id;
        const technicianName = yield getUserName(userId);
        const sample = yield labService.collectSample(sampleId, userId, technicianName, sampleType);
        return res.json(sample);
    }
    catch (e) {
        return res.status(500).json({ message: e.message || 'Failed to collect sample' });
    }
});
exports.collectSample = collectSample;
const scanBarcode = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { barcode } = req.body;
        if (!barcode) {
            return res.status(400).json({ message: 'Barcode is required' });
        }
        const userId = req.user.id || req.user._id;
        const technicianName = yield getUserName(userId);
        const sample = yield labService.scanBarcode(barcode, userId, technicianName);
        return res.json(sample);
    }
    catch (e) {
        return res.status(500).json({ message: e.message || 'Failed to process barcode' });
    }
});
exports.scanBarcode = scanBarcode;
const updateSampleStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { sampleId, status, rejectionReason } = req.body;
        if (!sampleId || !status) {
            return res.status(400).json({ message: 'Missing sampleId or status' });
        }
        const userId = req.user.id || req.user._id;
        const technicianName = yield getUserName(userId);
        const sample = yield labService.updateSampleStatus(sampleId, status, userId, technicianName, rejectionReason);
        return res.json(sample);
    }
    catch (e) {
        return res.status(500).json({ message: e.message || 'Failed to update sample status' });
    }
});
exports.updateSampleStatus = updateSampleStatus;
const submitResults = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { labOrderId, results, remarks } = req.body;
        if (!labOrderId || !results || !Array.isArray(results)) {
            return res.status(400).json({ message: 'Invalid payload. labOrderId and results array are required.' });
        }
        const userId = req.user.id || req.user._id;
        const technicianName = yield getUserName(userId);
        const report = yield labService.submitResults(labOrderId, results, remarks || '', userId, technicianName);
        return res.json(report);
    }
    catch (e) {
        return res.status(500).json({ message: e.message || 'Failed to submit test results' });
    }
});
exports.submitResults = submitResults;
const approveReport = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { reportId, digitalSignature } = req.body;
        if (!reportId || !digitalSignature) {
            return res.status(400).json({ message: 'reportId and digitalSignature are required.' });
        }
        const userId = req.user.id || req.user._id;
        const supervisorName = yield getUserName(userId);
        const report = yield labService.approveReport(reportId, userId, supervisorName, digitalSignature);
        return res.json(report);
    }
    catch (e) {
        return res.status(500).json({ message: e.message || 'Failed to approve report' });
    }
});
exports.approveReport = approveReport;
const getPatientLabRecords = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { patientId } = req.params;
        const records = yield labService.getPatientLabRecords(patientId);
        return res.json(records);
    }
    catch (e) {
        return res.status(500).json({ message: e.message || 'Failed to fetch patient lab records' });
    }
});
exports.getPatientLabRecords = getPatientLabRecords;
const getLIMSAnalytics = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const analytics = yield labService.getLIMSAnalytics();
        return res.json(analytics);
    }
    catch (e) {
        return res.status(500).json({ message: e.message || 'Failed to fetch LIMS analytics' });
    }
});
exports.getLIMSAnalytics = getLIMSAnalytics;
