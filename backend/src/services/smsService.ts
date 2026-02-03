export const sendSMS = async (phone: string, message: string) => {
    // In production, integrate with Twilio or Gov SMS Gateway
    console.log(`[SMS] To: ${phone} | Message: ${message}`);
    return true;
};

export const sendOTP = async (phone: string) => {
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    await sendSMS(phone, `Your ArogyaMitra OTP is ${otp}`);
    return otp;
};
