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
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendOTP = exports.sendSMS = void 0;
const sendSMS = (phone, message) => __awaiter(void 0, void 0, void 0, function* () {
    // In production, integrate with Twilio or Gov SMS Gateway
    console.log(`[SMS] To: ${phone} | Message: ${message}`);
    return true;
});
exports.sendSMS = sendSMS;
const sendOTP = (phone) => __awaiter(void 0, void 0, void 0, function* () {
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    yield (0, exports.sendSMS)(phone, `Your ArogyaMitra OTP is ${otp}`);
    return otp;
});
exports.sendOTP = sendOTP;
