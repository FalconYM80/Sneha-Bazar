import express from "express";
import {
  registerCustomer,
  loginCustomer,
  getCustomerProfile,
} from "../controllers/customerAuthController.js";
import { protectCustomer } from "../middleware/customerAuthMiddleware.js";

const router = express.Router();

// Register customer
router.post("/register", registerCustomer);

// Login customer
router.post("/login", loginCustomer);

// Get current customer profile (protected route)
router.get("/me", protectCustomer, getCustomerProfile);

export default router;