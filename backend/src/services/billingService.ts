import mongoose from 'mongoose';
import Invoice, { IInvoice, IInvoiceItem } from '../models/Invoice';
import Payment, { IPayment } from '../models/Payment';
import Refund from '../models/Refund';
import Insurance from '../models/Insurance';
import InsuranceClaim from '../models/InsuranceClaim';
import Consultation from '../models/Consultation';
import LabOrder from '../models/LabOrder';
import Dispensing from '../models/Dispensing';
import Patient from '../models/Patient';
import Doctor from '../models/Doctor';
import User from '../models/User';
import razorpayService from './razorpayService';

class BillingService {
    // Collect all uninvoiced charges for a patient
    async collectPendingCharges(patientId: string): Promise<any[]> {
        const patientObjectId = new mongoose.Types.ObjectId(patientId);

        // Fetch all invoices for this patient to identify already billed items
        const existingInvoices = await Invoice.find({ patient_id: patientObjectId });
        const billedSourceIds = new Set<string>();
        existingInvoices.forEach(inv => {
            inv.items.forEach(item => {
                if (item.sourceId) {
                    billedSourceIds.add(item.sourceId.toString());
                }
            });
        });

        const pendingItems: any[] = [];

        // 1. Check Registration Fee: If patient has no invoices at all, add a registration fee
        if (existingInvoices.length === 0) {
            pendingItems.push({
                name: 'Hospital Registration Fee',
                type: 'Registration',
                quantity: 1,
                unit_price: 150,
                gst_rate: 18,
                gst_amount: 27,
                discount_amount: 0,
                total_price: 177,
                sourceType: 'Registration'
            });
        }

        // 2. Fetch completed Consultations
        const consultations = await Consultation.find({
            patient_id: patientObjectId,
            status: 'Completed'
        }).populate({
            path: 'doctor_id',
            populate: { path: 'user_id', select: 'name' }
        });

        for (const cons of consultations) {
            if (!billedSourceIds.has(cons._id.toString())) {
                const doctor: any = cons.doctor_id;
                const docName = doctor && doctor.user_id ? doctor.user_id.name : 'Medical Officer';
                const docFee = doctor ? (doctor.consultation_fee || 500) : 500;
                const gstRate = 0; // Medical consultations are GST exempt or 0% usually
                const gstAmount = 0;
                
                pendingItems.push({
                    name: `Doctor Consultation - ${docName}`,
                    type: 'Consultation',
                    quantity: 1,
                    unit_price: docFee,
                    gst_rate: gstRate,
                    gst_amount: gstAmount,
                    discount_amount: 0,
                    total_price: docFee,
                    sourceId: cons._id,
                    sourceType: 'Consultation'
                });
            }
        }

        // 3. Fetch completed Lab Orders
        const labOrders = await LabOrder.find({
            patient_id: patientObjectId,
            status: 'Completed'
        });

        for (const order of labOrders) {
            if (!billedSourceIds.has(order._id.toString())) {
                // Estimate price per test if test catalog isn't fully linked
                // We'll charge a default flat rate of 350 per test
                const testCount = order.tests.length;
                const pricePerTest = 350;
                const sub = testCount * pricePerTest;
                const gstRate = 12;
                const gst = parseFloat(((sub * gstRate) / 100).toFixed(2));
                
                pendingItems.push({
                    name: `Lab Investigation: ${order.lab_order_id} (${order.tests.join(', ')})`,
                    type: 'LabTest',
                    quantity: 1,
                    unit_price: sub,
                    gst_rate: gstRate,
                    gst_amount: gst,
                    discount_amount: 0,
                    total_price: sub + gst,
                    sourceId: order._id,
                    sourceType: 'LabOrder'
                });
            }
        }

        // 4. Fetch Dispensing records
        const dispensingLogs = await Dispensing.find({
            patient_id: patientObjectId,
            status: 'Completed',
            $or: [
                { invoice_id: { $exists: false } },
                { invoice_id: null }
            ]
        });

        for (const disp of dispensingLogs) {
            if (!billedSourceIds.has(disp._id.toString())) {
                let dispSubtotal = 0;
                let dispGst = 0;
                disp.dispensed_items.forEach((item: any) => {
                    const itemCost = item.unit_price * item.quantity_dispensed;
                    dispSubtotal += itemCost;
                    dispGst += (itemCost * (item.gst_rate || 12)) / 100;
                });

                dispSubtotal = parseFloat(dispSubtotal.toFixed(2));
                dispGst = parseFloat(dispGst.toFixed(2));

                pendingItems.push({
                    name: `Pharmacy Dispensing Ref: ${disp._id.toString().substring(18).toUpperCase()}`,
                    type: 'Pharmacy',
                    quantity: 1,
                    unit_price: dispSubtotal,
                    gst_rate: 12,
                    gst_amount: dispGst,
                    discount_amount: 0,
                    total_price: dispSubtotal + dispGst,
                    sourceId: disp._id,
                    sourceType: 'Dispensing'
                });
            }
        }

        return pendingItems;
    }

    // Generate unified Invoice for patient
    async generateUnifiedInvoice(
        patientId: string, 
        payload: {
            discount_type?: string;
            discount_amount?: number;
            insurance_id?: string;
        }
    ): Promise<IInvoice | null> {
        const patientObjectId = new mongoose.Types.ObjectId(patientId);
        const pending = await this.collectPendingCharges(patientId);

        if (pending.length === 0) {
            return null;
        }

        let subtotal = 0;
        let gst_amount = 0;
        
        pending.forEach(item => {
            subtotal += item.unit_price;
            gst_amount += item.gst_amount;
        });

        subtotal = parseFloat(subtotal.toFixed(2));
        gst_amount = parseFloat(gst_amount.toFixed(2));

        const discount_amount = payload.discount_amount || 0;
        let insurance_covered_amount = 0;

        let claimId: mongoose.Types.ObjectId | undefined;

        // Apply insurance if active
        if (payload.insurance_id) {
            const insurance = await Insurance.findById(payload.insurance_id);
            if (insurance && insurance.is_active && new Date(insurance.validity) > new Date()) {
                const totalBill = subtotal + gst_amount - discount_amount;
                const coverage = (totalBill * insurance.coverage_percentage) / 100;
                insurance_covered_amount = Math.min(coverage, insurance.balance_limit);
            }
        }

        const final_amount = Math.max(0, parseFloat((subtotal + gst_amount - discount_amount - insurance_covered_amount).toFixed(2)));

        const invoice = new Invoice({
            patient_id: patientObjectId,
            items: pending,
            subtotal,
            gst_amount,
            discount_amount,
            insurance_covered_amount,
            final_amount,
            amount_paid: 0,
            remaining_balance: final_amount,
            payment_status: final_amount === 0 ? 'Paid' : 'Pending',
            payment_method: insurance_covered_amount > 0 ? 'Insurance' : 'Cash',
            billing_date: new Date()
        });

        await invoice.save();

        // If insurance is used, submit a claim
        if (payload.insurance_id && insurance_covered_amount > 0) {
            const claim = new InsuranceClaim({
                invoice_id: invoice._id,
                patient_id: patientObjectId,
                insurance_id: new mongoose.Types.ObjectId(payload.insurance_id),
                requested_amount: insurance_covered_amount,
                status: 'Submitted',
                notes: 'Automated claim submission during billing creation.'
            });
            await claim.save();
            invoice.insurance_claim_id = claim._id;
            await invoice.save();
        }

        // Link pharmacy invoices for backwards compatibility if a single dispensing record was invoiced
        const dispensingItem = pending.find(p => p.sourceType === 'Dispensing');
        if (dispensingItem && dispensingItem.sourceId) {
            await Dispensing.findByIdAndUpdate(dispensingItem.sourceId, {
                invoice_id: invoice._id
            });
        }

        return invoice;
    }

    // Initialize online Razorpay order
    async initiateOnlinePayment(invoiceId: string): Promise<any> {
        const invoice = await Invoice.findById(invoiceId).populate('patient_id');
        if (!invoice) {
            throw new Error('Invoice not found');
        }

        if (invoice.remaining_balance <= 0) {
            throw new Error('This invoice is already fully paid.');
        }

        // Create Razorpay Order
        const order = await razorpayService.createOrder(invoice.remaining_balance, invoice.invoice_number);
        
        // Save order details to invoice
        invoice.razorpay_order_id = order.id;
        invoice.razorpay_payment_status = 'Created';
        await invoice.save();

        return {
            orderId: order.id,
            amount: order.amount, // in paise
            currency: order.currency,
            keyId: process.env.RAZORPAY_KEY_ID,
            invoice_number: invoice.invoice_number
        };
    }

    // Verify online payment
    async verifyOnlinePayment(
        invoiceId: string,
        razorpayOrderId: string,
        razorpayPaymentId: string,
        razorpaySignature: string
    ): Promise<any> {
        const invoice = await Invoice.findById(invoiceId);
        if (!invoice) {
            throw new Error('Invoice not found');
        }

        const isSignatureValid = razorpayService.verifySignature(
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature
        );

        if (!isSignatureValid) {
            // Log failed payment
            await Payment.create({
                invoice_id: invoice._id,
                patient_id: invoice.patient_id,
                amount: invoice.remaining_balance,
                payment_status: 'Failed',
                payment_method: 'UPI',
                razorpayOrderId,
                razorpayPaymentId,
                razorpaySignature,
                paymentGateway: 'Razorpay',
                failureReason: 'Invalid payment signature. Verification failed.',
                payment_date: new Date()
            });

            invoice.razorpay_payment_status = 'Failed';
            await invoice.save();
            throw new Error('Payment signature verification failed.');
        }

        // Check if transaction was already processed to prevent duplicates
        const existingTxn = await Payment.findOne({ razorpayPaymentId });
        if (existingTxn && existingTxn.payment_status === 'Success') {
            return { success: true, invoice, payment: existingTxn };
        }

        const paidAmount = invoice.remaining_balance;

        // Create Payment log
        const payment = new Payment({
            invoice_id: invoice._id,
            patient_id: invoice.patient_id,
            amount: paidAmount,
            payment_status: 'Success',
            payment_method: 'UPI', // Defaulting gateway type to UPI/Card (Gateway UI handles specific types)
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature,
            paymentGateway: 'Razorpay',
            capturedAt: new Date(),
            payment_date: new Date()
        });
        await payment.save();

        // Update Invoice
        invoice.amount_paid = parseFloat((invoice.amount_paid + paidAmount).toFixed(2));
        invoice.remaining_balance = 0;
        invoice.payment_status = 'Paid';
        invoice.payment_method = 'UPI';
        invoice.razorpay_payment_id = razorpayPaymentId;
        invoice.razorpay_payment_status = 'Captured';
        invoice.transaction_id = razorpayPaymentId;
        await invoice.save();

        return { success: true, invoice, payment };
    }

    // Process Cash/Card Offline Payment
    async recordOfflinePayment(
        invoiceId: string,
        payload: {
            amount: number;
            payment_method: 'Cash' | 'Card' | 'UPI' | 'Split';
            cashier_id?: string;
        }
    ): Promise<any> {
        const invoice = await Invoice.findById(invoiceId);
        if (!invoice) {
            throw new Error('Invoice not found');
        }

        if (payload.amount > invoice.remaining_balance) {
            throw new Error(`Payment amount exceeds remaining balance. Max payable: ${invoice.remaining_balance}`);
        }

        const payment = new Payment({
            invoice_id: invoice._id,
            patient_id: invoice.patient_id,
            amount: payload.amount,
            payment_status: 'Success',
            payment_method: payload.payment_method,
            paymentGateway: 'Offline',
            cashier_id: payload.cashier_id ? new mongoose.Types.ObjectId(payload.cashier_id) : undefined,
            capturedAt: new Date(),
            payment_date: new Date()
        });
        await payment.save();

        invoice.amount_paid = parseFloat((invoice.amount_paid + payload.amount).toFixed(2));
        invoice.remaining_balance = Math.max(0, parseFloat((invoice.remaining_balance - payload.amount).toFixed(2)));
        
        if (invoice.remaining_balance === 0) {
            invoice.payment_status = 'Paid';
        } else {
            invoice.payment_status = 'Partial';
        }
        invoice.payment_method = payload.payment_method;
        invoice.transaction_id = payment.transaction_id;
        await invoice.save();

        return { success: true, invoice, payment };
    }

    // Refund workflow (requires Admin/Superintendent approval)
    async requestRefund(
        invoiceId: string,
        amount: number,
        reason: string,
        approvedByUserId: string
    ): Promise<any> {
        const invoice = await Invoice.findById(invoiceId);
        if (!invoice) {
            throw new Error('Invoice not found');
        }

        if (amount > invoice.amount_paid) {
            throw new Error(`Refund amount exceeds amount paid. Max refund: ${invoice.amount_paid}`);
        }

        // Fetch successful payment associated with this invoice to check gateway
        const successfulPayment = await Payment.findOne({
            invoice_id: invoice._id,
            payment_status: 'Success'
        }).sort({ createdAt: -1 });

        const refund = new Refund({
            invoice_id: invoice._id,
            patient_id: invoice.patient_id,
            amount,
            reason,
            status: 'Initiated',
            approved_by: new mongoose.Types.ObjectId(approvedByUserId),
            payment_id: successfulPayment ? successfulPayment._id : undefined
        });

        await refund.save();

        // Process actual Razorpay refund if online
        if (successfulPayment && successfulPayment.paymentGateway === 'Razorpay' && successfulPayment.razorpayPaymentId) {
            try {
                refund.status = 'Processing';
                await refund.save();

                const rzpRefund = await razorpayService.processRefund(
                    successfulPayment.razorpayPaymentId,
                    amount
                );

                refund.status = 'Completed';
                refund.razorpay_refund_id = rzpRefund.id;
                await refund.save();
            } catch (err: any) {
                refund.status = 'Failed';
                await refund.save();
                throw new Error(`Razorpay refund failed: ${err.message}`);
            }
        } else {
            // Offline refund completes instantly upon cash out approval
            refund.status = 'Completed';
            await refund.save();
        }

        // Update Invoice status
        invoice.amount_paid = parseFloat((invoice.amount_paid - amount).toFixed(2));
        invoice.remaining_balance = parseFloat((invoice.remaining_balance + amount).toFixed(2));
        
        if (invoice.amount_paid === 0) {
            invoice.payment_status = 'Refunded';
        } else {
            invoice.payment_status = 'Partial';
        }
        await invoice.save();

        return { success: true, refund, invoice };
    }

    // Fetch Admin HQ Financial Analytics
    async getFinancialAnalytics(): Promise<any> {
        const today = new Date();
        const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        // 1. Revenue Calculations
        const successfulPayments = await Payment.find({ payment_status: 'Success' });
        
        let revenueToday = 0;
        let revenueThisMonth = 0;
        let totalRevenue = 0;
        let onlineRevenue = 0;
        let offlineRevenue = 0;

        successfulPayments.forEach(p => {
            totalRevenue += p.amount;
            if (p.paymentGateway === 'Razorpay') {
                onlineRevenue += p.amount;
            } else {
                offlineRevenue += p.amount;
            }

            if (p.payment_date >= startOfToday) {
                revenueToday += p.amount;
            }
            if (p.payment_date >= startOfMonth) {
                revenueThisMonth += p.amount;
            }
        });

        // 2. Outstanding Invoices
        const outstandingInvoices = await Invoice.find({
            payment_status: { $in: ['Pending', 'Unpaid', 'Partial'] }
        });
        const outstandingAmount = outstandingInvoices.reduce((sum, inv) => sum + inv.remaining_balance, 0);

        // 3. Claims statistics
        const totalClaims = await InsuranceClaim.countDocuments();
        const claimsApproved = await InsuranceClaim.countDocuments({ status: 'Approved' });
        const claimRevenues = await InsuranceClaim.find({ status: 'Approved' });
        const claimsValue = claimRevenues.reduce((sum, c) => sum + c.approved_amount, 0);

        // 4. Refund statistics
        const completedRefunds = await Refund.find({ status: 'Completed' });
        const totalRefundsValue = completedRefunds.reduce((sum, r) => sum + r.amount, 0);

        // 5. Avg Revenue per patient
        const patientCount = await Patient.countDocuments();
        const avgRevenue = patientCount > 0 ? parseFloat((totalRevenue / patientCount).toFixed(2)) : 0;

        // 6. Department revenue splits (from invoice items)
        const allInvoices = await Invoice.find();
        const deptRevenue: Record<string, number> = {};

        allInvoices.forEach(inv => {
            inv.items.forEach(item => {
                const type = item.type || 'Other';
                deptRevenue[type] = (deptRevenue[type] || 0) + item.total_price;
            });
        });

        // 7. Transaction history (Top 10)
        const recentPayments = await Payment.find({ payment_status: 'Success' })
            .populate('patient_id', 'name patient_id')
            .sort({ payment_date: -1 })
            .limit(10);

        // 8. Payment Method distribution
        const methodCounts: Record<string, number> = {};
        successfulPayments.forEach(p => {
            methodCounts[p.payment_method] = (methodCounts[p.payment_method] || 0) + 1;
        });

        return {
            revenueToday: parseFloat(revenueToday.toFixed(2)),
            revenueThisMonth: parseFloat(revenueThisMonth.toFixed(2)),
            totalRevenue: parseFloat(totalRevenue.toFixed(2)),
            onlineRevenue: parseFloat(onlineRevenue.toFixed(2)),
            offlineRevenue: parseFloat(offlineRevenue.toFixed(2)),
            outstandingAmount: parseFloat(outstandingAmount.toFixed(2)),
            totalClaims,
            claimsApproved,
            claimsValue: parseFloat(claimsValue.toFixed(2)),
            refundStatistics: {
                count: completedRefunds.length,
                value: parseFloat(totalRefundsValue.toFixed(2))
            },
            averageRevenuePerPatient: avgRevenue,
            departmentRevenue: deptRevenue,
            recentPayments,
            paymentMethodDistribution: methodCounts
        };
    }
}

export default new BillingService();

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
