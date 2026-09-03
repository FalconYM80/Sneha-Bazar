import express from "express";
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";

const router = express.Router();

// Create a new product
router.post("/", createProduct);

// Get all active products with optional filters
router.get("/", getProducts);

// Get a single product by ID
router.get("/:id", getProductById);

// Update a product
router.put("/:id", updateProduct);

// Soft delete a product
router.delete("/:id", deleteProduct);

export default router;
