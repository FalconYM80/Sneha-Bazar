import express from "express";
import {
  registerCustomer,
  loginCustomer,
  getCustomerProfile,
  updateCustomerProfile,
} from "../controllers/customerAuthController.js";
import {
  sendOtp,
  verifyOtp,
  resendOtp,
} from "../controllers/otpController.js";
import { protectCustomer } from "../middleware/customerAuthMiddleware.js";
import {
  otpSendLimiter,
  otpVerifyLimiter,
} from "../middleware/rateLimiter.js";

const router = express.Router();

// OTP Endpoints
router.post("/send-otp", otpSendLimiter, sendOtp);
router.post("/verify-otp", otpVerifyLimiter, verifyOtp);
router.post("/resend-otp", otpSendLimiter, resendOtp);

// Registration & Login
router.post("/register", registerCustomer);
router.post("/login", loginCustomer);

// Current customer profile (protected)
router.get("/me", protectCustomer, getCustomerProfile);
router.patch("/profile", protectCustomer, updateCustomerProfile);
router.put("/profile", protectCustomer, updateCustomerProfile);

export default router;