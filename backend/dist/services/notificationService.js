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
exports.sendEmail = exports.sendSMS = void 0;
const sendSMS = (phone, message) => __awaiter(void 0, void 0, void 0, function* () {
    // Integration with Twilio or Gov SMS Gateway would go here
    console.log(`[SMS] To ${phone}: ${message}`);
    return true;
});
exports.sendSMS = sendSMS;
const sendEmail = (email, subject, body) => __awaiter(void 0, void 0, void 0, function* () {
    // Integration with Nodemailer/SendGrid
    console.log(`[Email] To ${email}: ${subject}`);
    return true;
});
exports.sendEmail = sendEmail;
