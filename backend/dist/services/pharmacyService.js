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
exports.getPharmacyAnalytics = exports.receivePurchaseOrder = exports.createPurchaseOrder = exports.getPurchaseOrders = exports.createSupplier = exports.getSuppliers = exports.getExpiredList = exports.getNearExpiryList = exports.getBatchesByMedicine = exports.getInventoryList = exports.dispensePrescription = exports.checkSafetyInteractions = exports.updatePrescriptionStatus = exports.getPrescriptionById = exports.getPrescriptions = exports.getMedicineCatalog = exports.seedPharmacyData = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Medicine_1 = __importDefault(require("../models/Medicine"));
const Prescription_1 = __importDefault(require("../models/Prescription"));
const Supplier_1 = __importDefault(require("../models/Supplier"));
const Batch_1 = __importDefault(require("../models/Batch"));
const Inventory_1 = __importDefault(require("../models/Inventory"));
const Dispensing_1 = __importDefault(require("../models/Dispensing"));
const Invoice_1 = __importDefault(require("../models/Invoice"));
const PurchaseOrder_1 = __importDefault(require("../models/PurchaseOrder"));
const MedicineInteraction_1 = __importDefault(require("../models/MedicineInteraction"));
// Seed initial master data if the DB is empty
const seedPharmacyData = () => __awaiter(void 0, void 0, void 0, function* () {
    const medicineCount = yield Medicine_1.default.countDocuments();
    if (medicineCount > 0)
        return;
    console.log('Seeding initial Pharmacy database...');
    // 1. Create a default Supplier
    const supplier = yield Supplier_1.default.create({
        name: 'Arogya Pharma Distributors',
        contact: '+91-98765-43210',
        email: 'distributors@arogyapharma.com',
        gst: '27AAAAA1111A1Z1',
        address: '102, MIDC Industrial Area, Nagpur, Maharashtra - 440016',
        categories: ['Analgesics', 'Antibiotics', 'Antidiabetics', 'Cardiovascular', 'Vitamins'],
        ratings: 4.8
    });
    // 2. Create standard master Medicines
    const medicinesData = [
        { name: 'Paracetamol', generic_name: 'Paracetamol', dosage_form: 'Tablet', strength: '500mg', category: 'Analgesics', manufacturer: 'Cipla Ltd', mrp: 15, gst: 12, storage_instructions: 'Store below 30°C', prescription_required: false },
        { name: 'Amoxicillin', generic_name: 'Amoxicillin', dosage_form: 'Capsule', strength: '500mg', category: 'Antibiotics', manufacturer: 'Alkem Laboratories', mrp: 72, gst: 12, storage_instructions: 'Keep away from direct sunlight', prescription_required: true },
        { name: 'Metformin', generic_name: 'Metformin Hydrochloride', dosage_form: 'Tablet', strength: '500mg', category: 'Antidiabetics', manufacturer: 'Sun Pharma', mrp: 30, gst: 12, storage_instructions: 'Store in dry place', prescription_required: true },
        { name: 'Amlodipine', generic_name: 'Amlodipine Besylate', dosage_form: 'Tablet', strength: '5mg', category: 'Cardiovascular', manufacturer: 'Lupin Ltd', mrp: 22, gst: 12, storage_instructions: 'Store below 25°C', prescription_required: true },
        { name: 'Vitamin D3', generic_name: 'Cholecalciferol', dosage_form: 'Capsule', strength: '60000 IU', category: 'Vitamins', manufacturer: 'Cadila Healthcare', mrp: 45, gst: 18, storage_instructions: 'Store in dark place', prescription_required: false },
        { name: 'Pantoprazole', generic_name: 'Pantoprazole Sodium', dosage_form: 'Tablet', strength: '40mg', category: 'Gastrointestinal', manufacturer: 'Torrent Pharma', mrp: 55, gst: 12, storage_instructions: 'Store below 25°C', prescription_required: true },
        { name: 'Azithromycin', generic_name: 'Azithromycin', dosage_form: 'Tablet', strength: '500mg', category: 'Antibiotics', manufacturer: 'Alembic Pharma', mrp: 120, gst: 12, storage_instructions: 'Store in dry place', prescription_required: true },
        { name: 'Ibuprofen', generic_name: 'Ibuprofen', dosage_form: 'Tablet', strength: '400mg', category: 'Analgesics', manufacturer: 'Abbott India', mrp: 18, gst: 12, storage_instructions: 'Store below 30°C', prescription_required: false }
    ];
    const medicines = yield Medicine_1.default.insertMany(medicinesData);
    // 3. Create Inventory and Batches for each medicine
    const today = new Date();
    const futureDate = (days) => new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
    const pastDate = (days) => new Date(today.getTime() - days * 24 * 60 * 60 * 1000);
    for (let i = 0; i < medicines.length; i++) {
        const med = medicines[i];
        // Batch 1: Good Stock (Expiring in 1 year)
        const batch1 = yield Batch_1.default.create({
            medicine_id: med._id,
            batch_number: `BCH-${med.name.substring(0, 3).toUpperCase()}-001`,
            expiry_date: futureDate(365),
            mrp: med.mrp,
            gst: med.gst,
            stock_quantity: 150,
            initial_quantity: 150,
            storage_instructions: med.storage_instructions,
            barcode: `890${i}123456789`,
            supplier_id: supplier._id
        });
        // Batch 2: Near Expiry (Expiring in 45 days) for testing
        let batch2Stock = 30;
        let batch2Expiry = futureDate(45);
        if (med.name === 'Paracetamol') {
            // Expired batch
            batch2Stock = 10;
            batch2Expiry = pastDate(10);
        }
        else if (med.name === 'Amoxicillin') {
            // Expiring in 20 days
            batch2Stock = 20;
            batch2Expiry = futureDate(20);
        }
        const batch2 = yield Batch_1.default.create({
            medicine_id: med._id,
            batch_number: `BCH-${med.name.substring(0, 3).toUpperCase()}-002`,
            expiry_date: batch2Expiry,
            mrp: med.mrp,
            gst: med.gst,
            stock_quantity: batch2Stock,
            initial_quantity: 50,
            storage_instructions: med.storage_instructions,
            barcode: `890${i}987654321`,
            supplier_id: supplier._id
        });
        // Create consolidated Inventory entry
        const totalStock = batch1.stock_quantity + batch2.stock_quantity;
        const inventory = new Inventory_1.default({
            medicine_id: med._id,
            current_stock: totalStock,
            reserved_stock: 0,
            min_stock: 25,
            max_stock: 500
        });
        yield inventory.save();
    }
    // 4. Create common Medicine Interactions for Drug Safety
    const interactionsData = [
        {
            medicine_a: 'Amoxicillin',
            medicine_b: 'Metformin',
            severity: 'Medium',
            description: 'Amoxicillin may increase the blood level and side effects of Metformin by reducing renal clearance.'
        },
        {
            medicine_a: 'Ibuprofen',
            medicine_b: 'Amlodipine',
            severity: 'High',
            description: 'Ibuprofen can decrease the blood pressure lowering effects of Amlodipine. High risk of hypertensive crisis.'
        },
        {
            medicine_a: 'Pantoprazole',
            medicine_b: 'Azithromycin',
            severity: 'Low',
            description: 'Pantoprazole may delay absorption of Azithromycin but does not significantly reduce overall efficacy.'
        }
    ];
    yield MedicineInteraction_1.default.insertMany(interactionsData);
    console.log('Seeding completed successfully!');
});
exports.seedPharmacyData = seedPharmacyData;
// Retrieve Medicine Catalog
const getMedicineCatalog = () => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, exports.seedPharmacyData)();
    return yield Medicine_1.default.find({ is_active: true }).sort({ name: 1 });
});
exports.getMedicineCatalog = getMedicineCatalog;
// Retrieve Prescriptions by Status
const getPrescriptions = (status) => __awaiter(void 0, void 0, void 0, function* () {
    const filter = status ? { status } : {};
    return yield Prescription_1.default.find(filter)
        .populate('patient_id')
        .populate({
        path: 'doctor_id',
        populate: { path: 'user_id', select: 'name' }
    })
        .sort({ createdAt: -1 });
});
exports.getPrescriptions = getPrescriptions;
// Retrieve Prescription details
const getPrescriptionById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return yield Prescription_1.default.findById(id)
        .populate('patient_id')
        .populate({
        path: 'doctor_id',
        populate: { path: 'user_id', select: 'name' }
    });
});
exports.getPrescriptionById = getPrescriptionById;
// Update Prescription status (Generated -> Received -> Preparing -> Ready)
const updatePrescriptionStatus = (id, status) => __awaiter(void 0, void 0, void 0, function* () {
    return yield Prescription_1.default.findByIdAndUpdate(id, { status }, { new: true });
});
exports.updatePrescriptionStatus = updatePrescriptionStatus;
// Check Drug safety interactions for a list of medicines
const checkSafetyInteractions = (medicineNames) => __awaiter(void 0, void 0, void 0, function* () {
    if (!medicineNames || medicineNames.length < 2)
        return [];
    const interactions = [];
    for (let i = 0; i < medicineNames.length; i++) {
        for (let j = i + 1; j < medicineNames.length; j++) {
            const medA = medicineNames[i];
            const medB = medicineNames[j];
            const match = yield MedicineInteraction_1.default.findOne({
                $or: [
                    { medicine_a: medA, medicine_b: medB },
                    { medicine_a: medB, medicine_b: medA }
                ]
            });
            if (match) {
                interactions.push(match);
            }
        }
    }
    return interactions;
});
exports.checkSafetyInteractions = checkSafetyInteractions;
// Dispense Prescription and update stock + generate invoice
const dispensePrescription = (prescriptionId, pharmacistId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const prescription = yield Prescription_1.default.findById(prescriptionId).session(session);
        if (!prescription) {
            throw new Error('Prescription not found');
        }
        if (prescription.status === 'Completed' || prescription.status === 'Dispensed') {
            throw new Error('Prescription has already been dispensed');
        }
        const patientId = prescription.patient_id;
        const dispensedItems = [];
        let subtotal = 0;
        let totalGst = 0;
        for (const item of payload.items) {
            // 1. Fetch medicine
            const med = yield Medicine_1.default.findOne({ name: item.medicine_name }).session(session);
            if (!med) {
                throw new Error(`Medicine ${item.medicine_name} not found in catalog`);
            }
            // 2. Fetch selected batch
            const batch = yield Batch_1.default.findById(item.batch_id).session(session);
            if (!batch) {
                throw new Error(`Batch ID ${item.batch_id} not found for medicine ${item.medicine_name}`);
            }
            // 3. Prevent dispensing expired medicine
            const today = new Date();
            if (new Date(batch.expiry_date) < today) {
                throw new Error(`Cannot dispense expired medicine: ${med.name} (Batch: ${batch.batch_number} expired on ${batch.expiry_date.toDateString()})`);
            }
            // 4. Prevent negative inventory
            if (batch.stock_quantity < item.quantity_dispensed) {
                throw new Error(`Insufficient stock in Batch ${batch.batch_number} for ${med.name}. Available: ${batch.stock_quantity}, Requested: ${item.quantity_dispensed}`);
            }
            // 5. Update Batch quantity
            batch.stock_quantity -= item.quantity_dispensed;
            yield batch.save({ session });
            // 6. Update consolidated Inventory stock
            const inventory = yield Inventory_1.default.findOne({ medicine_id: med._id }).session(session);
            if (inventory) {
                inventory.current_stock -= item.quantity_dispensed;
                yield inventory.save({ session });
            }
            // 7. Calculate cost
            const cost = batch.mrp * item.quantity_dispensed;
            const gstAmount = (cost * batch.gst) / 100;
            subtotal += cost;
            totalGst += gstAmount;
            const originalPrescribedItem = prescription.medicines.find(m => m.name === item.medicine_name);
            const qtyRequested = originalPrescribedItem ? originalPrescribedItem.quantity : item.quantity_dispensed;
            dispensedItems.push({
                medicine_id: med._id,
                batch_id: batch._id,
                quantity_requested: qtyRequested,
                quantity_dispensed: item.quantity_dispensed,
                unit_price: batch.mrp,
                gst_rate: batch.gst
            });
        }
        // 8. Create Dispensing Record
        const dispensing = new Dispensing_1.default({
            prescription_id: prescriptionId,
            patient_id: patientId,
            pharmacist_id: new mongoose_1.default.Types.ObjectId(pharmacistId),
            dispensed_items: dispensedItems,
            status: 'Completed',
            dispensed_date: new Date()
        });
        yield dispensing.save({ session });
        // 9. Generate Invoice
        const discount = payload.discount_amount || 0;
        const insurance = payload.insurance_covered_amount || 0;
        const finalAmount = Math.max(0, parseFloat((subtotal + totalGst - discount - insurance).toFixed(2)));
        const invoice = new Invoice_1.default({
            patient_id: patientId,
            dispensing_id: dispensing._id,
            subtotal: parseFloat(subtotal.toFixed(2)),
            gst_amount: parseFloat(totalGst.toFixed(2)),
            discount_amount: discount,
            insurance_covered_amount: insurance,
            final_amount: finalAmount,
            payment_status: 'Paid', // Assuming payment completes at counter
            payment_method: payload.payment_method || 'Cash'
        });
        yield invoice.save({ session });
        // Link invoice to dispensing log
        dispensing.invoice_id = invoice._id;
        yield dispensing.save({ session });
        // 10. Complete Prescription
        prescription.status = 'Completed';
        prescription.dispensed_at = new Date();
        yield prescription.save({ session });
        yield session.commitTransaction();
        session.endSession();
        return { dispensing, invoice };
    }
    catch (error) {
        yield session.abortTransaction();
        session.endSession();
        throw error;
    }
});
exports.dispensePrescription = dispensePrescription;
// Inventory Operations
const getInventoryList = () => __awaiter(void 0, void 0, void 0, function* () {
    return yield Inventory_1.default.find()
        .populate('medicine_id')
        .sort({ low_stock_alert: -1, current_stock: 1 });
});
exports.getInventoryList = getInventoryList;
// Batch list for specific medicine
const getBatchesByMedicine = (medicineId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield Batch_1.default.find({ medicine_id: medicineId, stock_quantity: { $gt: 0 } }).sort({ expiry_date: 1 });
});
exports.getBatchesByMedicine = getBatchesByMedicine;
// Near expiry list
const getNearExpiryList = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (days = 90) {
    const today = new Date();
    const limitDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
    return yield Batch_1.default.find({
        expiry_date: { $gte: today, $lte: limitDate },
        stock_quantity: { $gt: 0 }
    }).populate('medicine_id').sort({ expiry_date: 1 });
});
exports.getNearExpiryList = getNearExpiryList;
// Expired list
const getExpiredList = () => __awaiter(void 0, void 0, void 0, function* () {
    const today = new Date();
    return yield Batch_1.default.find({
        expiry_date: { $lt: today },
        stock_quantity: { $gt: 0 }
    }).populate('medicine_id').sort({ expiry_date: -1 });
});
exports.getExpiredList = getExpiredList;
// Suppliers & Purchase Orders
const getSuppliers = () => __awaiter(void 0, void 0, void 0, function* () {
    return yield Supplier_1.default.find().sort({ name: 1 });
});
exports.getSuppliers = getSuppliers;
const createSupplier = (data) => __awaiter(void 0, void 0, void 0, function* () {
    return yield Supplier_1.default.create(data);
});
exports.createSupplier = createSupplier;
const getPurchaseOrders = () => __awaiter(void 0, void 0, void 0, function* () {
    return yield PurchaseOrder_1.default.find().populate('supplier_id').sort({ createdAt: -1 });
});
exports.getPurchaseOrders = getPurchaseOrders;
const createPurchaseOrder = (data) => __awaiter(void 0, void 0, void 0, function* () {
    // Calculate total cost
    let total_cost = 0;
    for (const item of data.items) {
        total_cost += item.quantity * item.unit_cost;
    }
    return yield PurchaseOrder_1.default.create(Object.assign(Object.assign({}, data), { total_cost }));
});
exports.createPurchaseOrder = createPurchaseOrder;
// Complete a Purchase Order (Receive Stock)
const receivePurchaseOrder = (orderId_1, ...args_1) => __awaiter(void 0, [orderId_1, ...args_1], void 0, function* (orderId, batchPrefix = 'PO') {
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const order = yield PurchaseOrder_1.default.findById(orderId).session(session);
        if (!order) {
            throw new Error('Purchase Order not found');
        }
        if (order.status === 'Delivered') {
            throw new Error('Purchase Order already delivered');
        }
        order.status = 'Delivered';
        order.delivery_date = new Date();
        yield order.save({ session });
        const today = new Date();
        const oneYearHence = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
        // Process each item and add to inventory
        for (const item of order.items) {
            // Find or create medicine
            let med = yield Medicine_1.default.findOne({ name: item.medicine_name }).session(session);
            if (!med) {
                med = yield Medicine_1.default.create([{
                        name: item.medicine_name,
                        dosage_form: 'Tablet',
                        strength: '500mg',
                        mrp: Math.round(item.unit_cost * 1.5), // markup for mrp
                        gst: 12,
                        is_active: true
                    }], { session }).then(res => res[0]);
            }
            // Create new batch for the received stock
            const randomSuffix = Math.floor(1000 + Math.random() * 9000);
            const batchNum = `${batchPrefix}-${med.name.substring(0, 3).toUpperCase()}-${randomSuffix}`;
            const barcode = `890${randomSuffix}998877`;
            yield Batch_1.default.create([{
                    medicine_id: med._id,
                    batch_number: batchNum,
                    expiry_date: oneYearHence,
                    mrp: med.mrp,
                    gst: med.gst,
                    stock_quantity: item.quantity,
                    initial_quantity: item.quantity,
                    barcode,
                    supplier_id: order.supplier_id
                }], { session });
            // Update consolidated Inventory record
            let inventory = yield Inventory_1.default.findOne({ medicine_id: med._id }).session(session);
            if (!inventory) {
                inventory = new Inventory_1.default({
                    medicine_id: med._id,
                    current_stock: item.quantity,
                    reserved_stock: 0,
                    min_stock: 20
                });
            }
            else {
                inventory.current_stock += item.quantity;
            }
            yield inventory.save({ session });
        }
        yield session.commitTransaction();
        session.endSession();
        return order;
    }
    catch (error) {
        yield session.abortTransaction();
        session.endSession();
        throw error;
    }
});
exports.receivePurchaseOrder = receivePurchaseOrder;
// Analytics reports
const getPharmacyAnalytics = () => __awaiter(void 0, void 0, void 0, function* () {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    // 1. Today's prescriptions
    const todayPrescriptions = yield Prescription_1.default.countDocuments({
        createdAt: { $gte: startOfToday }
    });
    // 2. Today's dispensed revenue
    const todayInvoices = yield Invoice_1.default.find({
        createdAt: { $gte: startOfToday },
        payment_status: 'Paid'
    });
    const revenue = todayInvoices.reduce((sum, inv) => sum + inv.final_amount, 0);
    // 3. Low stock alerts
    const lowStockCount = yield Inventory_1.default.countDocuments({ low_stock_alert: true });
    // 4. Expired medicines count (non-empty batches)
    const expiredBatches = yield Batch_1.default.find({
        expiry_date: { $lt: today },
        stock_quantity: { $gt: 0 }
    });
    const expiredCount = expiredBatches.length;
    const expiryLosses = expiredBatches.reduce((sum, batch) => sum + (batch.mrp * batch.stock_quantity), 0);
    // 5. Fast moving medicines (top prescribed)
    // For simplicity, sum prescriptions items
    const allCompletedPres = yield Prescription_1.default.find({ status: 'Completed' }).limit(100);
    const medFrequency = {};
    allCompletedPres.forEach(pres => {
        pres.medicines.forEach(med => {
            medFrequency[med.name] = (medFrequency[med.name] || 0) + 1;
        });
    });
    const fastMoving = Object.entries(medFrequency)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    // 6. Total inventory value (MRP * stock in batches)
    const allBatches = yield Batch_1.default.find({ stock_quantity: { $gt: 0 } });
    const inventoryValue = allBatches.reduce((sum, batch) => sum + (batch.mrp * batch.stock_quantity), 0);
    return {
        todayPrescriptions,
        revenue,
        lowStockCount,
        expiredCount,
        expiryLosses,
        fastMoving,
        inventoryValue
    };
});
exports.getPharmacyAnalytics = getPharmacyAnalytics;
