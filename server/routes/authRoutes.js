import express from "express";
import {
  registerAdmin,
  loginAdmin,
  getAdminProfile,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Register admin (only allowed if no admin exists)
router.post("/register", registerAdmin);

// Login admin
router.post("/login", loginAdmin);

// Get current admin profile (protected route)
router.get("/me", protect, getAdminProfile);

export default router;
