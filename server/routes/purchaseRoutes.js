import express from "express";
import {
  createPurchase,
  getPurchases,
  getPurchaseById,
  updatePurchase,
  deletePurchase,
} from "../controllers/purchaseController.js";

const router = express.Router();

// Create a new purchase record
router.post("/", createPurchase);

// Get all purchase records with optional search
router.get("/", getPurchases);

// Get a single purchase record by ID
router.get("/:id", getPurchaseById);

// Update a purchase record
router.put("/:id", updatePurchase);

// Delete a purchase record (permanent delete)
router.delete("/:id", deletePurchase);

export default router;
