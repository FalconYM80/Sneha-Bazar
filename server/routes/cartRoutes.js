import express from "express";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from "../controllers/cartController.js";
import { protectCustomer } from "../middleware/customerAuthMiddleware.js";

const router = express.Router();

// All cart routes require customer authentication
router.use(protectCustomer);

// Get customer's cart
router.get("/", getCart);

// Add product to cart
router.post("/items", addToCart);

// Update cart item quantity
router.put("/items/:productId", updateCartItem);

// Remove product from cart
router.delete("/items/:productId", removeFromCart);

// Clear entire cart
router.delete("/", clearCart);

export default router;