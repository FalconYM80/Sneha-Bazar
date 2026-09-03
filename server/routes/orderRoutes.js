import express from "express";
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
  getMyOrders,
  checkout,
} from "../controllers/orderController.js";
import { protectCustomer } from "../middleware/customerAuthMiddleware.js";

const router = express.Router();

// Checkout - create order from cart (protected - customer only)
router.post("/checkout", protectCustomer, checkout);

// Get current customer's orders (protected - customer only)
router.get("/my-orders", protectCustomer, getMyOrders);

// Create a new order (protected - customer only)
router.post("/", protectCustomer, createOrder);

// Get all orders with optional filters (admin endpoint - unprotected for now)
router.get("/", getOrders);

// Get a single order by ID (admin endpoint - unprotected for now)
router.get("/:id", getOrderById);

// Update order status
router.put("/:id/status", updateOrderStatus);

// Delete an order (permanent delete)
router.delete("/:id", deleteOrder);

export default router;
