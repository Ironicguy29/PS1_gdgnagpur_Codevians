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
exports.updatePickupStatus = exports.createPrescription = exports.downloadPrescriptionPdf = exports.getPatientPrescriptions = void 0;
const Prescription_1 = __importDefault(require("../models/Prescription"));
const Patient_1 = __importDefault(require("../models/Patient"));
const getPatientPrescriptions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { patientId } = req.params;
        const patient = req.user;
        // Verify patient can only see their own prescriptions
        if (patient._id.toString() !== patientId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const prescriptions = yield Prescription_1.default.find({ patient_id: patientId })
            .populate('doctor_id', 'name')
            .sort({ createdAt: -1 });
        // Mark prescription viewed
        yield Patient_1.default.findByIdAndUpdate(patientId, {
            'onboarding_steps.prescription_viewed': true
        });
        res.json({
            success: true,
            prescriptions: prescriptions.map(rx => {
                var _a;
                return ({
                    id: rx._id,
                    doctorName: ((_a = rx.doctor_id) === null || _a === void 0 ? void 0 : _a.name) || 'Dr. Unknown',
                    date: rx.createdAt || new Date(),
                    visitType: 'Consultation',
                    diagnosis: 'General Consultation',
                    medicines: rx.medicines || [],
                    notes: rx.instructions,
                    pickupStatus: rx.status === 'Ready' || rx.status === 'Dispensed' ? 'ready' : rx.status === 'Completed' ? 'completed' : 'pending'
                });
            })
        });
    }
    catch (error) {
        console.error('Get prescriptions error:', error);
        res.status(500).json({ success: false, message: 'Error fetching prescriptions' });
    }
});
exports.getPatientPrescriptions = getPatientPrescriptions;
const downloadPrescriptionPdf = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { prescriptionId } = req.params;
        const patient = req.user;
        const prescription = yield Prescription_1.default.findById(prescriptionId).populate('doctor_id');
        if (!prescription) {
            return res.status(404).json({ success: false, message: 'Prescription not found' });
        }
        // Verify ownership
        if (prescription.patient_id.toString() !== patient._id.toString()) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        // Generate simple PDF (in production, use a proper PDF library)
        const pdfContent = `
PRESCRIPTION REPORT
==================

Doctor: ${prescription.doctor_id.name}
Date: ${new Date(prescription.createdAt || Date.now()).toLocaleDateString()}
Visit Type: Consultation

MEDICINES
---------
${(_a = prescription.medicines) === null || _a === void 0 ? void 0 : _a.map(m => `${m.name} - ${m.dosage} - ${m.frequency} - ${m.duration}`).join('\n')}

NOTES
-----
${prescription.instructions || 'No additional notes'}

==================
This is a digital prescription. Please carry this to the pharmacy.
        `;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=prescription-${prescriptionId}.pdf`);
        // For now, send as text (in production, generate actual PDF)
        res.send(pdfContent);
    }
    catch (error) {
        console.error('Download PDF error:', error);
        res.status(500).json({ success: false, message: 'Error downloading prescription' });
    }
});
exports.downloadPrescriptionPdf = downloadPrescriptionPdf;
const createPrescription = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { patientId, doctorId, medicines, notes } = req.body;
        const doctor = req.user;
        if (doctor._id.toString() !== doctorId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const prescription = new Prescription_1.default({
            patient_id: patientId,
            doctor_id: doctorId,
            medicines,
            instructions: notes,
            status: 'Generated'
        });
        yield prescription.save();
        res.json({
            success: true,
            message: 'Prescription created',
            prescription: prescription._id
        });
    }
    catch (error) {
        console.error('Create prescription error:', error);
        res.status(500).json({ success: false, message: 'Error creating prescription' });
    }
});
exports.createPrescription = createPrescription;
const updatePickupStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { prescriptionId } = req.params;
        const { status } = req.body;
        // Map user-friendly status to model status
        const statusMap = {
            'pending': 'Preparing',
            'ready': 'Ready',
            'completed': 'Dispensed'
        };
        const prescription = yield Prescription_1.default.findByIdAndUpdate(prescriptionId, Object.assign({ status: statusMap[status] || status }, (status === 'completed' && { dispensed_at: new Date() })), { new: true });
        res.json({
            success: true,
            message: 'Pickup status updated',
            prescription
        });
    }
    catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({ success: false, message: 'Error updating status' });
    }
});
exports.updatePickupStatus = updatePickupStatus;
