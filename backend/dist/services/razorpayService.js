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
const razorpay_1 = __importDefault(require("razorpay"));
const crypto_1 = __importDefault(require("crypto"));
class RazorpayService {
    constructor() {
        this.razorpay = null;
        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        if (keyId && keySecret) {
            this.razorpay = new razorpay_1.default({
                key_id: keyId,
                key_secret: keySecret
            });
        }
        else {
            console.warn('Razorpay credentials not fully configured in env vars.');
        }
    }
    createOrder(amount, receiptId) {
        return __awaiter(this, void 0, void 0, function* () {
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
            return yield this.razorpay.orders.create(options);
        });
    }
    verifySignature(orderId, paymentId, signature) {
        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        if (!keySecret) {
            throw new Error('Razorpay key secret not found in environment.');
        }
        const hmac = crypto_1.default.createHmac('sha256', keySecret);
        hmac.update(`${orderId}|${paymentId}`);
        const generatedSignature = hmac.digest('hex');
        return generatedSignature === signature;
    }
    processRefund(paymentId_1, amount_1) {
        return __awaiter(this, arguments, void 0, function* (paymentId, amount, speed = 'normal') {
            if (!this.razorpay) {
                throw new Error('Razorpay SDK is not initialized due to missing keys.');
            }
            const options = { speed };
            if (amount !== undefined) {
                options.amount = Math.round(amount * 100); // convert to paise
            }
            return yield this.razorpay.payments.refund(paymentId, options);
        });
    }
    verifyWebhookSignature(body, signature) {
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
        if (!secret)
            return true; // If webhook secret is not configured, bypass verification for development convenience
        const expectedSignature = crypto_1.default
            .createHmac('sha256', secret)
            .update(body)
            .digest('hex');
        return expectedSignature === signature;
    }
}
exports.default = new RazorpayService();
