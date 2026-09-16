import jwt from "jsonwebtoken";
import { normalizeIndianPhone } from "../utils/phoneUtils.js";
import { otpService } from "../services/otpService.js";
import { otpRateStore } from "../services/otpRateStore.js";

/**
 * POST /api/customers/send-otp
 * Body: { phone: string }
 */
export const sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone || typeof phone !== "string" || phone.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    // Validate and normalize to E.164
    let normalizedPhone;
    try {
      normalizedPhone = normalizeIndianPhone(phone);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: err.message || "Enter a valid 10-digit mobile number.",
      });
    }

    // Check rate limit and resend cooldown per phone number
    const rateCheck = otpRateStore.canSend(normalizedPhone);
    if (!rateCheck.allowed) {
      return res.status(429).json({
        success: false,
        message: rateCheck.message,
        retryAfter: rateCheck.retryAfter,
      });
    }

    // Send OTP via configured provider
    const result = await otpService.sendOtp(normalizedPhone);

    // Record send timestamp
    otpRateStore.recordSend(normalizedPhone);

    return res.status(200).json({
      success: true,
      message: result.message || "OTP sent successfully",
      data: {
        message: result.message || "OTP sent successfully",
      },
    });
  } catch (error) {
    console.error("sendOtp error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to send OTP. Please try again.",
    });
  }
};

/**
 * POST /api/customers/verify-otp
 * Body: { phone: string, otp: string }
 */
export const verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || typeof phone !== "string" || phone.trim() === "") {
      return res.status(400).json({
        success: false,
        verified: false,
        message: "Phone number is required",
      });
    }

    let normalizedPhone;
    try {
      normalizedPhone = normalizeIndianPhone(phone);
    } catch (err) {
      return res.status(400).json({
        success: false,
        verified: false,
        message: err.message || "Enter a valid 10-digit mobile number.",
      });
    }

    // Validate OTP format (must be 6 digits)
    const otpClean = typeof otp === "string" ? otp.trim() : String(otp || "").trim();
    if (!otpClean || !/^\d{6}$/.test(otpClean)) {
      return res.status(400).json({
        success: false,
        verified: false,
        message: "Please enter the 6-digit OTP.",
      });
    }

    // Check verify attempts / lockout
    const verifyCheck = otpRateStore.canVerify(normalizedPhone);
    if (!verifyCheck.allowed) {
      return res.status(429).json({
        success: false,
        verified: false,
        message: verifyCheck.message,
      });
    }

    // Verify OTP with provider
    const result = await otpService.verifyOtp(normalizedPhone, otpClean);

    // Record result in rate store
    otpRateStore.recordVerifyResult(normalizedPhone, result.verified);

    if (!result.verified) {
      return res.status(400).json({
        success: false,
        verified: false,
        message: result.message || "Invalid or expired OTP",
      });
    }

    // Verification succeeded. Generate short-lived verification token
    const verificationToken = jwt.sign(
      { phone: normalizedPhone, purpose: "phone_verification" },
      process.env.CUSTOMER_JWT_SECRET,
      { expiresIn: "15m" }
    );

    return res.status(200).json({
      success: true,
      verified: true,
      verificationToken,
      message: "Mobile number verified successfully",
      data: {
        verified: true,
        verificationToken,
        message: "Mobile number verified successfully",
      },
    });
  } catch (error) {
    console.error("verifyOtp error:", error.message);
    return res.status(500).json({
      success: false,
      verified: false,
      message: error.message || "Failed to verify OTP. Please try again.",
    });
  }
};

/**
 * POST /api/customers/resend-otp
 * Body: { phone: string }
 */
export const resendOtp = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone || typeof phone !== "string" || phone.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    let normalizedPhone;
    try {
      normalizedPhone = normalizeIndianPhone(phone);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: err.message || "Enter a valid 10-digit mobile number.",
      });
    }

    // Check rate limit and resend cooldown (60s)
    const rateCheck = otpRateStore.canSend(normalizedPhone);
    if (!rateCheck.allowed) {
      return res.status(429).json({
        success: false,
        message: rateCheck.message,
        retryAfter: rateCheck.retryAfter,
      });
    }

    const result = await otpService.resendOtp(normalizedPhone);
    otpRateStore.recordSend(normalizedPhone);

    return res.status(200).json({
      success: true,
      message: result.message || "OTP resent successfully",
      data: {
        message: result.message || "OTP resent successfully",
      },
    });
  } catch (error) {
    console.error("resendOtp error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Unable to resend OTP. Please try again.",
    });
  }
};
