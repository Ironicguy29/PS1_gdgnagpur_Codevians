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
const controller = __importStar(require("../controllers/billingController"));
const router = (0, express_1.Router)();
// Charges
router.get('/pending-charges/:patientId', controller.getPendingCharges);
// Invoices
router.get('/invoices', controller.getInvoices);
router.post('/invoices/generate', controller.generateInvoice);
router.get('/invoices/:invoiceId', controller.getInvoiceDetails);
// Online Payments (Razorpay)
router.post('/invoices/:invoiceId/pay/online', controller.initiateOnlinePayment);
router.post('/invoices/:invoiceId/verify/online', controller.verifyOnlinePayment);
// Offline Payments (Cash, Card, UPI)
router.post('/invoices/:invoiceId/pay/offline', controller.recordOfflinePayment);
// Refunds
router.post('/invoices/:invoiceId/refund', controller.processRefund);
// Insurance Policies & Claims
router.get('/insurance/policies/:patientId', controller.getPatientPolicies);
router.post('/insurance/policies', controller.addInsurancePolicy);
router.get('/insurance/claims', controller.getClaims);
router.put('/insurance/claims/:claimId', controller.updateClaimStatus);
// Admin HQ Financial Analytics
router.get('/analytics', controller.getFinancialAnalytics);
exports.default = router;
