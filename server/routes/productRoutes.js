import express from "express";
import upload from "../config/multerConfig.js";
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
  getProductByBarcode,
  getProductTransactions,
  getProductTransactionDetail,
} from "../controllers/productController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Create a new product with image upload (protected - admin only)
router.post("/", protect, upload.single("image"), createProduct);

// Get low stock products for dashboard (protected - admin only, must come before /:id)
router.get("/low-stock", protect, getLowStockProducts);

// Get product by barcode (protected - admin only, must come before /:id)
router.get("/barcode/:barcode", protect, getProductByBarcode);

// Get all active products with optional filters (public store catalog & admin inventory)
router.get("/", getProducts);

// Get product transaction history and detail (protected - admin only, must come before /:id)
router.get("/:id/transactions", protect, getProductTransactions);
router.get("/:id/transactions/:txId", protect, getProductTransactionDetail);

// Get a single product by ID (public store product page)
router.get("/:id", getProductById);

// Update a product with image upload (protected - admin only)
router.put("/:id", protect, upload.single("image"), updateProduct);

// Soft delete a product (protected - admin only)
router.delete("/:id", protect, deleteProduct);

export default router;
