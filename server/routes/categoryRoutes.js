import express from "express";
import {
  createCategory,
  getCategories,
  getCategoriesWithThumbnails,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Create a new category (protected - admin only)
router.post("/", protect, createCategory);

// Get categories with thumbnails derived from product images (public - must come before /:id)
router.get("/with-thumbnails", getCategoriesWithThumbnails);

// Get all active categories (public)
router.get("/", getCategories);

// Get a single category by ID (public)
router.get("/:id", getCategoryById);

// Update a category (protected - admin only)
router.put("/:id", protect, updateCategory);

// Soft delete a category (protected - admin only)
router.delete("/:id", protect, deleteCategory);

export default router;
