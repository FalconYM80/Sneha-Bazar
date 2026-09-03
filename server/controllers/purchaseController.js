import mongoose from "mongoose";
import Purchase from "../models/Purchase.js";

// Create a new purchase record
export const createPurchase = async (req, res) => {
  try {
    const { itemName, purchaseAmount, mrp, purchaseDate } = req.body;

    // Validate required fields
    if (!itemName || itemName.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Item name is required",
      });
    }

    if (purchaseAmount === undefined || purchaseAmount === null) {
      return res.status(400).json({
        success: false,
        message: "Purchase amount is required",
      });
    }

    if (mrp === undefined || mrp === null) {
      return res.status(400).json({
        success: false,
        message: "MRP is required",
      });
    }

    // Validate numeric values
    if (purchaseAmount < 0) {
      return res.status(400).json({
        success: false,
        message: "Purchase amount cannot be negative",
      });
    }

    if (mrp < 0) {
      return res.status(400).json({
        success: false,
        message: "MRP cannot be negative",
      });
    }

    // Create purchase record
    const purchase = await Purchase.create({
      itemName: itemName.trim(),
      purchaseAmount,
      mrp,
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

// Get all purchase records with optional search
export const getPurchases = async (req, res) => {
  try {
    const { search } = req.query;

    // Build query
    let query = Purchase.find();

    // If search is provided, filter by itemName using case-insensitive regex
    if (search) {
      const searchRegex = new RegExp(search, "i");
      query = query.where("itemName").regex(searchRegex);
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
    const { itemName, purchaseAmount, mrp, purchaseDate } = req.body;

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
    if (itemName !== undefined && itemName.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Item name cannot be empty",
      });
    }

    // Validate numeric values if provided
    if (purchaseAmount !== undefined && purchaseAmount < 0) {
      return res.status(400).json({
        success: false,
        message: "Purchase amount cannot be negative",
      });
    }

    if (mrp !== undefined && mrp < 0) {
      return res.status(400).json({
        success: false,
        message: "MRP cannot be negative",
      });
    }

    // Update purchase
    const updatedPurchase = await Purchase.findByIdAndUpdate(
      id,
      {
        ...(itemName !== undefined && { itemName: itemName.trim() }),
        ...(purchaseAmount !== undefined && { purchaseAmount }),
        ...(mrp !== undefined && { mrp }),
        ...(purchaseDate !== undefined && { purchaseDate }),
      },
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
