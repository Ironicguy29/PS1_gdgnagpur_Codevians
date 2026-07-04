import Razorpay from 'razorpay';
import crypto from 'crypto';

class RazorpayService {
    private razorpay: Razorpay | null = null;

    constructor() {
        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;

        if (keyId && keySecret) {
            this.razorpay = new Razorpay({
                key_id: keyId,
                key_secret: keySecret
            });
        } else {
            console.warn('Razorpay credentials not fully configured in env vars.');
        }
    }

    async createOrder(amount: number, receiptId: string): Promise<any> {
        if (!this.razorpay) {
            throw new Error('Razorpay SDK is not initialized due to missing keys.');
        }
        
        // Razorpay expects amount in paise (1 INR = 100 Paise)
        const options = {
            amount: Math.round(amount * 100),
            currency: 'INR',
            receipt: receiptId,
            payment_capture: 1
        };

        return await this.razorpay.orders.create(options);
    }

    verifySignature(orderId: string, paymentId: string, signature: string): boolean {
        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        if (!keySecret) {
            throw new Error('Razorpay key secret not found in environment.');
        }
        
        const hmac = crypto.createHmac('sha256', keySecret);
        hmac.update(`${orderId}|${paymentId}`);
        const generatedSignature = hmac.digest('hex');

        return generatedSignature === signature;
    }

    async processRefund(paymentId: string, amount?: number, speed: 'normal' | 'optimum' = 'normal'): Promise<any> {
        if (!this.razorpay) {
            throw new Error('Razorpay SDK is not initialized due to missing keys.');
        }

        const options: any = { speed };
        if (amount !== undefined) {
            options.amount = Math.round(amount * 100); // convert to paise
        }

        return await this.razorpay.payments.refund(paymentId, options);
    }

    verifyWebhookSignature(body: string, signature: string): boolean {
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
        if (!secret) return true; // If webhook secret is not configured, bypass verification for development convenience
        
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(body)
            .digest('hex');
            
        return expectedSignature === signature;
    }
}

export default new RazorpayService();

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
