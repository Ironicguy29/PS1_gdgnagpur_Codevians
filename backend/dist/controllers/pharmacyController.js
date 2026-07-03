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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPharmacyAnalytics = exports.receivePurchaseOrder = exports.createPurchaseOrder = exports.getPurchaseOrders = exports.createSupplier = exports.getSuppliers = exports.getExpiredList = exports.getNearExpiryList = exports.getBatchesByMedicine = exports.getInventoryList = exports.dispensePrescription = exports.checkSafetyInteractions = exports.updatePrescriptionStatus = exports.getPrescriptionById = exports.getPrescriptions = exports.getMedicineCatalog = void 0;
const pharmacyService = __importStar(require("../services/pharmacyService"));
const getMedicineCatalog = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const catalog = yield pharmacyService.getMedicineCatalog();
        res.status(200).json({ success: true, data: catalog });
    }
    catch (error) {
        next(error);
    }
});
exports.getMedicineCatalog = getMedicineCatalog;
const getPrescriptions = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { status } = req.query;
        const prescriptions = yield pharmacyService.getPrescriptions(status);
        res.status(200).json({ success: true, data: prescriptions });
    }
    catch (error) {
        next(error);
    }
});
exports.getPrescriptions = getPrescriptions;
const getPrescriptionById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        const prescription = yield pharmacyService.getPrescriptionById(id);
        if (!prescription) {
            res.status(404).json({ success: false, message: 'Prescription not found' });
            return;
        }
        res.status(200).json({ success: true, data: prescription });
    }
    catch (error) {
        next(error);
    }
});
exports.getPrescriptionById = getPrescriptionById;
const updatePrescriptionStatus = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        const { status } = req.body;
        const updated = yield pharmacyService.updatePrescriptionStatus(id, status);
        res.status(200).json({ success: true, data: updated });
    }
    catch (error) {
        next(error);
    }
});
exports.updatePrescriptionStatus = updatePrescriptionStatus;
const checkSafetyInteractions = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { medicines } = req.body; // array of medicine names
        const interactions = yield pharmacyService.checkSafetyInteractions(medicines);
        res.status(200).json({ success: true, data: interactions });
    }
    catch (error) {
        next(error);
    }
});
exports.checkSafetyInteractions = checkSafetyInteractions;
const dispensePrescription = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        const { pharmacist_id, items, discount_amount, insurance_covered_amount, payment_method } = req.body;
        if (!items || items.length === 0) {
            res.status(400).json({ success: false, message: 'Items to dispense are required' });
            return;
        }
        const result = yield pharmacyService.dispensePrescription(id, pharmacist_id, {
            items,
            discount_amount,
            insurance_covered_amount,
            payment_method
        });
        res.status(200).json({ success: true, data: result });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message || 'Dispensing failed' });
    }
});
exports.dispensePrescription = dispensePrescription;
const getInventoryList = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const inventory = yield pharmacyService.getInventoryList();
        res.status(200).json({ success: true, data: inventory });
    }
    catch (error) {
        next(error);
    }
});
exports.getInventoryList = getInventoryList;
const getBatchesByMedicine = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const medicineId = req.params.medicineId;
        const batches = yield pharmacyService.getBatchesByMedicine(medicineId);
        res.status(200).json({ success: true, data: batches });
    }
    catch (error) {
        next(error);
    }
});
exports.getBatchesByMedicine = getBatchesByMedicine;
const getNearExpiryList = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { days } = req.query;
        const batches = yield pharmacyService.getNearExpiryList(days ? parseInt(days) : undefined);
        res.status(200).json({ success: true, data: batches });
    }
    catch (error) {
        next(error);
    }
});
exports.getNearExpiryList = getNearExpiryList;
const getExpiredList = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const batches = yield pharmacyService.getExpiredList();
        res.status(200).json({ success: true, data: batches });
    }
    catch (error) {
        next(error);
    }
});
exports.getExpiredList = getExpiredList;
const getSuppliers = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const suppliers = yield pharmacyService.getSuppliers();
        res.status(200).json({ success: true, data: suppliers });
    }
    catch (error) {
        next(error);
    }
});
exports.getSuppliers = getSuppliers;
const createSupplier = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const supplier = yield pharmacyService.createSupplier(req.body);
        res.status(201).json({ success: true, data: supplier });
    }
    catch (error) {
        next(error);
    }
});
exports.createSupplier = createSupplier;
const getPurchaseOrders = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const orders = yield pharmacyService.getPurchaseOrders();
        res.status(200).json({ success: true, data: orders });
    }
    catch (error) {
        next(error);
    }
});
exports.getPurchaseOrders = getPurchaseOrders;
const createPurchaseOrder = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const order = yield pharmacyService.createPurchaseOrder(req.body);
        res.status(201).json({ success: true, data: order });
    }
    catch (error) {
        next(error);
    }
});
exports.createPurchaseOrder = createPurchaseOrder;
const receivePurchaseOrder = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        const { batchPrefix } = req.body;
        const order = yield pharmacyService.receivePurchaseOrder(id, batchPrefix);
        res.status(200).json({ success: true, data: order });
    }
    catch (error) {
        next(error);
    }
});
exports.receivePurchaseOrder = receivePurchaseOrder;
const getPharmacyAnalytics = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const analytics = yield pharmacyService.getPharmacyAnalytics();
        res.status(200).json({ success: true, data: analytics });
    }
    catch (error) {
        next(error);
    }
});
exports.getPharmacyAnalytics = getPharmacyAnalytics;
