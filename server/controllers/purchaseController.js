import mongoose from "mongoose";
import Purchase from "../models/Purchase.js";

// Create a new purchase record
export const createPurchase = async (req, res) => {
  try {
    const { itemName, supplier, quantityPurchased, purchaseAmount, sellingPrice, mrp, purchaseDate } = req.body;

    // Validate required fields
    if (!itemName || typeof itemName !== "string" || itemName.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Item name is required",
      });
    }

    if (!supplier || typeof supplier !== "string" || supplier.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Supplier is required",
      });
    }

    if (quantityPurchased === undefined || quantityPurchased === null || quantityPurchased === "") {
      return res.status(400).json({
        success: false,
        message: "Quantity purchased is required",
      });
    }

    const qty = Number(quantityPurchased);
    if (!Number.isInteger(qty) || qty < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity purchased must be a positive integer (minimum 1)",
      });
    }

    if (purchaseAmount === undefined || purchaseAmount === null || purchaseAmount === "") {
      return res.status(400).json({
        success: false,
        message: "Purchase amount is required",
      });
    }

    if (sellingPrice === undefined || sellingPrice === null || sellingPrice === "") {
      return res.status(400).json({
        success: false,
        message: "Selling price is required",
      });
    }

    if (mrp === undefined || mrp === null || mrp === "") {
      return res.status(400).json({
        success: false,
        message: "MRP is required",
      });
    }

    // Validate numeric values
    const parsedPurchaseAmount = Number(purchaseAmount);
    const parsedSellingPrice = Number(sellingPrice);
    const parsedMrp = Number(mrp);

    if (isNaN(parsedPurchaseAmount) || parsedPurchaseAmount < 0) {
      return res.status(400).json({
        success: false,
        message: "Purchase amount cannot be negative",
      });
    }

    if (isNaN(parsedSellingPrice) || parsedSellingPrice < 0) {
      return res.status(400).json({
        success: false,
        message: "Selling price cannot be negative",
      });
    }

    if (isNaN(parsedMrp) || parsedMrp < 0) {
      return res.status(400).json({
        success: false,
        message: "MRP cannot be negative",
      });
    }

    // Create purchase record (Note: independent ledger record, does NOT modify inventory/stock)
    const purchase = await Purchase.create({
      itemName: itemName.trim(),
      supplier: supplier.trim(),
      quantityPurchased: qty,
      purchaseAmount: parsedPurchaseAmount,
      sellingPrice: parsedSellingPrice,
      mrp: parsedMrp,
      purchaseDate: purchaseDate || Date.now(),
    });

    res.status(201).json({
      success: true,
      message: "Purchase record created successfully",
      data: purchase,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error creating purchase record",
    });
  }
};

// Get all purchase records with optional search across item name and supplier
export const getPurchases = async (req, res) => {
  try {
    const { search } = req.query;

    // Build query
    let query = Purchase.find();

    // If search is provided, filter by itemName or supplier using case-insensitive regex
    if (search && search.trim() !== "") {
      const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const searchRegex = new RegExp(escapeRegex(search.trim()), "i");
      query = query.or([
        { itemName: searchRegex },
        { supplier: searchRegex },
      ]);
    }

    // Get purchases sorted by purchaseDate descending
    const purchases = await query.sort({ purchaseDate: -1 });

    res.status(200).json({
      success: true,
      message: "Purchases retrieved successfully",
      data: purchases,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error retrieving purchases",
    });
  }
};

// Get a single purchase record by ID
export const getPurchaseById = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if ID is valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid purchase ID",
      });
    }

    const purchase = await Purchase.findById(id);

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: "Purchase record not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Purchase record retrieved successfully",
      data: purchase,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error retrieving purchase record",
    });
  }
};

// Update a purchase record
export const updatePurchase = async (req, res) => {
  try {
    const { id } = req.params;
    const { itemName, supplier, quantityPurchased, purchaseAmount, sellingPrice, mrp, purchaseDate } = req.body;

    // Check if ID is valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid purchase ID",
      });
    }

    // Check if purchase exists
    const purchase = await Purchase.findById(id);
    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: "Purchase record not found",
      });
    }

    // Validate itemName if provided
    if (itemName !== undefined && (typeof itemName !== "string" || itemName.trim() === "")) {
      return res.status(400).json({
        success: false,
        message: "Item name cannot be empty",
      });
    }

    // Validate supplier if provided
    if (supplier !== undefined && (typeof supplier !== "string" || supplier.trim() === "")) {
      return res.status(400).json({
        success: false,
        message: "Supplier cannot be empty",
      });
    }

    // Validate quantityPurchased if provided
    let qty;
    if (quantityPurchased !== undefined) {
      qty = Number(quantityPurchased);
      if (!Number.isInteger(qty) || qty < 1) {
        return res.status(400).json({
          success: false,
          message: "Quantity purchased must be a positive integer (minimum 1)",
        });
      }
    }

    // Validate numeric values if provided
    if (purchaseAmount !== undefined) {
      const parsedAmount = Number(purchaseAmount);
      if (isNaN(parsedAmount) || parsedAmount < 0) {
        return res.status(400).json({
          success: false,
          message: "Purchase amount cannot be negative",
        });
      }
    }

    if (sellingPrice !== undefined) {
      const parsedSellingPrice = Number(sellingPrice);
      if (isNaN(parsedSellingPrice) || parsedSellingPrice < 0) {
        return res.status(400).json({
          success: false,
          message: "Selling price cannot be negative",
        });
      }
    }

    if (mrp !== undefined) {
      const parsedMrp = Number(mrp);
      if (isNaN(parsedMrp) || parsedMrp < 0) {
        return res.status(400).json({
          success: false,
          message: "MRP cannot be negative",
        });
      }
    }

    // Update purchase (does NOT modify inventory/stock)
    const updatePayload = {
      ...(itemName !== undefined && { itemName: itemName.trim() }),
      ...(supplier !== undefined && { supplier: supplier.trim() }),
      ...(qty !== undefined && { quantityPurchased: qty }),
      ...(purchaseAmount !== undefined && { purchaseAmount: Number(purchaseAmount) }),
      ...(sellingPrice !== undefined && { sellingPrice: Number(sellingPrice) }),
      ...(mrp !== undefined && { mrp: Number(mrp) }),
      ...(purchaseDate !== undefined && { purchaseDate }),
    };

    const updatedPurchase = await Purchase.findByIdAndUpdate(
      id,
      updatePayload,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Purchase record updated successfully",
      data: updatedPurchase,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error updating purchase record",
    });
  }
};

// Delete a purchase record (permanent delete)
export const deletePurchase = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if ID is valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid purchase ID",
      });
    }

    // Check if purchase exists
    const purchase = await Purchase.findById(id);
    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: "Purchase record not found",
      });
    }

    // Permanently delete the purchase record
    await Purchase.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Purchase record deleted successfully",
      data: {},
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error deleting purchase record",
    });
  }
};
