import rateLimit from "express-rate-limit";

// Rate limiter for sending/resending OTP by IP address
export const otpSendLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10, // Limit each IP to 10 OTP send requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many OTP requests from this connection. Please try again after 10 minutes.",
  },
});

// Rate limiter for verifying OTP by IP address
export const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 verification requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many verification attempts from this connection. Please try again after 15 minutes.",
  },
});

// Rate limiter for forgot password requests by IP address
export const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 forgot password requests per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    // Return same generic success response so rate limiting cannot be used for account enumeration
    res.status(200).json({
      success: true,
      message: "If an account exists with that email, a password reset link has been sent.",
    });
  },
});

// Rate limiter for reset password attempts
export const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 reset attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many password reset attempts from this connection. Please try again after 15 minutes.",
  },
});

