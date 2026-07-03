import { Request, Response } from 'express';
import billingService from '../services/billingService';
import Invoice from '../models/Invoice';
import Insurance from '../models/Insurance';
import InsuranceClaim from '../models/InsuranceClaim';
import Payment from '../models/Payment';
import Patient from '../models/Patient';
import Refund from '../models/Refund';

export const getPendingCharges = async (req: Request, res: Response): Promise<void> => {
    try {
        const patientId = req.params.patientId as string;
        const pending = await billingService.collectPendingCharges(patientId);
        res.json({ success: true, pending });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const generateInvoice = async (req: Request, res: Response): Promise<void> => {
    try {
        const { patientId, discount_amount, insurance_id } = req.body;
        if (!patientId) {
            res.status(400).json({ success: false, message: 'Patient ID is required.' });
            return;
        }

        const invoice = await billingService.generateUnifiedInvoice(patientId, {
            discount_amount: discount_amount ? parseFloat(discount_amount) : 0,
            insurance_id
        });

        if (!invoice) {
            res.status(400).json({ success: false, message: 'No pending charges found for this patient.' });
            return;
        }

        res.status(201).json({ success: true, invoice });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const initiateOnlinePayment = async (req: Request, res: Response): Promise<void> => {
    try {
        const invoiceId = req.params.invoiceId as string;
        const paymentData = await billingService.initiateOnlinePayment(invoiceId);
        res.json({ success: true, ...paymentData });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const verifyOnlinePayment = async (req: Request, res: Response): Promise<void> => {
    try {
        const invoiceId = req.params.invoiceId as string;
        const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

        if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
            res.status(400).json({ success: false, message: 'Missing Razorpay response properties.' });
            return;
        }

        const result = await billingService.verifyOnlinePayment(
            invoiceId,
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature
        );

        res.json(result);
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const recordOfflinePayment = async (req: Request, res: Response): Promise<void> => {
    try {
        const invoiceId = req.params.invoiceId as string;
        const { amount, payment_method, cashier_id } = req.body;

        if (amount === undefined || !payment_method) {
            res.status(400).json({ success: false, message: 'Missing payment amount or method.' });
            return;
        }

        const result = await billingService.recordOfflinePayment(invoiceId, {
            amount: parseFloat(amount),
            payment_method,
            cashier_id
        });

        res.json(result);
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const processRefund = async (req: Request, res: Response): Promise<void> => {
    try {
        const invoiceId = req.params.invoiceId as string;
        const { amount, reason, approved_by } = req.body;

        if (amount === undefined || !reason || !approved_by) {
            res.status(400).json({ success: false, message: 'Missing amount, reason, or approver ID.' });
            return;
        }

        const result = await billingService.requestRefund(
            invoiceId,
            parseFloat(amount),
            reason,
            approved_by
        );

        res.json(result);
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const getFinancialAnalytics = async (req: Request, res: Response): Promise<void> => {
    try {
        const analytics = await billingService.getFinancialAnalytics();
        res.json({ success: true, analytics });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const getInvoices = async (req: Request, res: Response): Promise<void> => {
    try {
        const { patient_id, payment_status } = req.query;
        const filter: any = {};
        if (patient_id) filter.patient_id = patient_id;
        if (payment_status) filter.payment_status = payment_status;

        const invoices = await Invoice.find(filter)
            .populate('patient_id', 'name patient_id phone')
            .sort({ createdAt: -1 });

        res.json({ success: true, invoices });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const getInvoiceDetails = async (req: Request, res: Response): Promise<void> => {
    try {
        const invoiceId = req.params.invoiceId as string;
        const invoice = await Invoice.findById(invoiceId)
            .populate('patient_id', 'name patient_id phone address city state pincode dob gender blood_group abha_id')
            .populate({
                path: 'insurance_claim_id',
                populate: { path: 'insurance_id' }
            });

        if (!invoice) {
            res.status(404).json({ success: false, message: 'Invoice not found.' });
            return;
        }

        // Fetch any payments associated with this invoice
        const payments = await Payment.find({ invoice_id: invoice._id });
        // Fetch any refunds associated with this invoice
        const refunds = await Refund.find({ invoice_id: invoice._id });

        res.json({ success: true, invoice, payments, refunds });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Insurance policy endpoints
export const getPatientPolicies = async (req: Request, res: Response): Promise<void> => {
    try {
        const patientId = req.params.patientId as string;
        const policies = await Insurance.find({ patient_id: patientId });
        res.json({ success: true, policies });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const addInsurancePolicy = async (req: Request, res: Response): Promise<void> => {
    try {
        const { patient_id, provider, policy_number, coverage_percentage, validity, coverage_limit, balance_limit, insurance_type } = req.body;
        
        if (!patient_id || !provider || !policy_number || !coverage_percentage || !validity || coverage_limit === undefined) {
            res.status(400).json({ success: false, message: 'Missing required insurance details.' });
            return;
        }

        const policy = new Insurance({
            patient_id,
            provider,
            policy_number,
            coverage_percentage: parseFloat(coverage_percentage),
            validity: new Date(validity),
            coverage_limit: parseFloat(coverage_limit),
            balance_limit: balance_limit !== undefined ? parseFloat(balance_limit) : parseFloat(coverage_limit),
            insurance_type: insurance_type || 'Private',
            is_active: true
        });

        await policy.save();
        res.status(201).json({ success: true, policy });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Claims list and updates
export const getClaims = async (req: Request, res: Response): Promise<void> => {
    try {
        const claims = await InsuranceClaim.find()
            .populate('patient_id', 'name patient_id')
            .populate('insurance_id')
            .populate('invoice_id', 'invoice_number final_amount payment_status')
            .sort({ createdAt: -1 });

        res.json({ success: true, claims });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const updateClaimStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const claimId = req.params.claimId as string;
        const { status, approved_amount, notes } = req.body;

        const claim = await InsuranceClaim.findById(claimId);
        if (!claim) {
            res.status(404).json({ success: false, message: 'Claim not found.' });
            return;
        }

        claim.status = status;
        if (approved_amount !== undefined) {
            claim.approved_amount = parseFloat(approved_amount);
        }
        if (notes) {
            claim.notes = notes;
        }

        if (status === 'Approved' || status === 'Settled' || status === 'Partially Approved') {
            claim.settled_date = new Date();
            
            // Deduct approved amount from insurance limit
            const insurance = await Insurance.findById(claim.insurance_id);
            if (insurance) {
                insurance.balance_limit = Math.max(0, parseFloat((insurance.balance_limit - claim.approved_amount).toFixed(2)));
                await insurance.save();
            }

            // Update associated invoice details
            const invoice = await Invoice.findById(claim.invoice_id);
            if (invoice) {
                // If claim is approved/settled, deduct that from final paid amount or adjust
                invoice.insurance_covered_amount = claim.approved_amount;
                invoice.remaining_balance = Math.max(0, parseFloat((invoice.final_amount - invoice.amount_paid - invoice.insurance_covered_amount).toFixed(2)));
                
                if (invoice.remaining_balance === 0) {
                    invoice.payment_status = 'Paid';
                }
                await invoice.save();
            }
        }

        await claim.save();
        res.json({ success: true, claim });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};
