import { Request, Response } from 'express';
import Prescription from '../models/Prescription';
import Patient from '../models/Patient';

export const getPatientPrescriptions = async (req: Request, res: Response) => {
    try {
        const { patientId } = req.params;
        const patient = (req as any).user;

        // Verify patient can only see their own prescriptions
        if (patient._id.toString() !== patientId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const prescriptions = await Prescription.find({ patient_id: patientId })
            .populate('doctor_id', 'name')
            .sort({ createdAt: -1 });

        // Mark prescription viewed
        await Patient.findByIdAndUpdate(patientId, {
            'onboarding_steps.prescription_viewed': true
        });

        res.json({
            success: true,
            prescriptions: prescriptions.map(rx => ({
                id: rx._id,
                doctorName: (rx.doctor_id as any)?.name || 'Dr. Unknown',
                date: (rx as any).createdAt || new Date(),
                visitType: 'Consultation',
                diagnosis: 'General Consultation',
                medicines: rx.medicines || [],
                notes: rx.instructions,
                pickupStatus: rx.status === 'Ready' || rx.status === 'Dispensed' ? 'ready' : rx.status === 'Completed' ? 'completed' : 'pending'
            }))
        });
    } catch (error: any) {
        console.error('Get prescriptions error:', error);
        res.status(500).json({ success: false, message: 'Error fetching prescriptions' });
    }
};

export const downloadPrescriptionPdf = async (req: Request, res: Response) => {
    try {
        const { prescriptionId } = req.params;
        const patient = (req as any).user;

        const prescription = await Prescription.findById(prescriptionId).populate('doctor_id');

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

Doctor: ${(prescription.doctor_id as any).name}
Date: ${new Date((prescription as any).createdAt || Date.now()).toLocaleDateString()}
Visit Type: Consultation

MEDICINES
---------
${prescription.medicines?.map(m => `${m.name} - ${m.dosage} - ${m.frequency} - ${m.duration}`).join('\n')}

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
    } catch (error: any) {
        console.error('Download PDF error:', error);
        res.status(500).json({ success: false, message: 'Error downloading prescription' });
    }
};

export const createPrescription = async (req: Request, res: Response) => {
    try {
        const { patientId, doctorId, medicines, notes } = req.body;
        const doctor = (req as any).user;

        if (doctor._id.toString() !== doctorId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const prescription = new Prescription({
            patient_id: patientId,
            doctor_id: doctorId,
            medicines,
            instructions: notes,
            status: 'Generated'
        });

        await prescription.save();

        res.json({
            success: true,
            message: 'Prescription created',
            prescription: prescription._id
        });
    } catch (error: any) {
        console.error('Create prescription error:', error);
        res.status(500).json({ success: false, message: 'Error creating prescription' });
    }
};

export const updatePickupStatus = async (req: Request, res: Response) => {
    try {
        const { prescriptionId } = req.params;
        const { status } = req.body;

        // Map user-friendly status to model status
        const statusMap: { [key: string]: string } = {
            'pending': 'Preparing',
            'ready': 'Ready',
            'completed': 'Dispensed'
        };

        const prescription = await Prescription.findByIdAndUpdate(
            prescriptionId,
            { 
                status: statusMap[status] || status,
                ...(status === 'completed' && { dispensed_at: new Date() })
            },
            { new: true }
        );

        res.json({
            success: true,
            message: 'Pickup status updated',
            prescription
        });
    } catch (error: any) {
        console.error('Update status error:', error);
        res.status(500).json({ success: false, message: 'Error updating status' });
    }
};

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
