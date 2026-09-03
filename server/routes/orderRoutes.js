import express from "express";
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
} from "../controllers/orderController.js";

const router = express.Router();

// Create a new order
router.post("/", createOrder);

// Get all orders with optional filters
router.get("/", getOrders);

// Get a single order by ID
router.get("/:id", getOrderById);

// Update order status
router.put("/:id/status", updateOrderStatus);

// Delete an order (permanent delete)
router.delete("/:id", deleteOrder);

export default router;
