import { Router } from 'express';
import * as controller from '../controllers/pharmacyController';

const router = Router();

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

export default router;
