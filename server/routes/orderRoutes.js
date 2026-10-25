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
import { protect, protectOrderAccess } from "../middleware/authMiddleware.js";

const router = express.Router();

// Checkout - create order from cart (protected - customer only)
router.post("/checkout", protectCustomer, checkout);

// Get current customer's orders (protected - customer only)
router.get("/my-orders", protectCustomer, getMyOrders);

// Create a new order (protected - customer only)
router.post("/", protectCustomer, createOrder);

// Get all orders with optional filters (admin endpoint - protected)
router.get("/", protect, getOrders);

// Get a single order by ID (protected - admin or order owner)
router.get("/:id", protectOrderAccess, getOrderById);

// Update order status (admin endpoint - protected)
router.put("/:id/status", protect, updateOrderStatus);

// Delete an order (admin endpoint - protected)
router.delete("/:id", protect, deleteOrder);

export default router;
