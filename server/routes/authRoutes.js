import express from "express";
import {
  registerAdmin,
  loginAdmin,
  logoutAdmin,
  getAdminProfile,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { adminLoginLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// Register admin (only allowed if no admin exists)
router.post("/register", registerAdmin);

// Login admin (rate limited)
router.post("/login", adminLoginLimiter, loginAdmin);

// Logout admin
router.post("/logout", logoutAdmin);

// Get current admin profile (protected route)
router.get("/me", protect, getAdminProfile);

export default router;
