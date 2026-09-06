import express from "express";
import upload from "../config/multerConfig.js";
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";

const router = express.Router();

// Create a new product with image upload
router.post("/", upload.single("image"), createProduct);

// Get all active products with optional filters
router.get("/", getProducts);

// Get a single product by ID
router.get("/:id", getProductById);

// Update a product with image upload
router.put("/:id", upload.single("image"), updateProduct);

// Soft delete a product
router.delete("/:id", deleteProduct);

export default router;
