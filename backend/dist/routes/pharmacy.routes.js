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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controller = __importStar(require("../controllers/pharmacyController"));
const router = (0, express_1.Router)();
// Catalog
router.get('/catalog', controller.getMedicineCatalog);
// Prescriptions
router.get('/prescriptions', controller.getPrescriptions);
router.get('/prescriptions/:id', controller.getPrescriptionById);
router.put('/prescriptions/:id/status', controller.updatePrescriptionStatus);
router.post('/prescriptions/:id/dispense', controller.dispensePrescription);
// Safety Alerts
router.post('/safety/check', controller.checkSafetyInteractions);
// Inventory & Expiry
router.get('/inventory', controller.getInventoryList);
router.get('/inventory/:medicineId/batches', controller.getBatchesByMedicine);
router.get('/expiry/near', controller.getNearExpiryList);
router.get('/expiry/expired', controller.getExpiredList);
// Suppliers
router.get('/suppliers', controller.getSuppliers);
router.post('/suppliers', controller.createSupplier);
// Purchase Orders
router.get('/purchase-orders', controller.getPurchaseOrders);
router.post('/purchase-orders', controller.createPurchaseOrder);
router.post('/purchase-orders/:id/receive', controller.receivePurchaseOrder);
// Analytics
router.get('/analytics', controller.getPharmacyAnalytics);
exports.default = router;
