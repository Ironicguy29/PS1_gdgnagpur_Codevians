import { Router } from 'express';
import * as controller from '../controllers/billingController';

const router = Router();

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

export default router;

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
