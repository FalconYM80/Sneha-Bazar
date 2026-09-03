import mongoose from "mongoose";
import Product from "../models/Product.js";
import Category from "../models/Category.js";

// Create a new product
export const createProduct = async (req, res) => {
  try {
    const {
      itemCode,
      name,
      company,
      category,
      sellingPrice,
      mrp,
      stockQuantity,
      unit,
      image,
      isAvailable,
    } = req.body;

    // Validate required fields
    if (!name || name.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Product name is required",
      });
    }

    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Category is required",
      });
    }

    if (sellingPrice === undefined || sellingPrice === null) {
      return res.status(400).json({
        success: false,
        message: "Selling price is required",
      });
    }

    if (sellingPrice < 0) {
      return res.status(400).json({
        success: false,
        message: "Selling price cannot be negative",
      });
    }

    // Check if category exists and is active
    const categoryExists = await Category.findOne({
      _id: category,
      isActive: true,
    });
    if (!categoryExists) {
      return res.status(400).json({
        success: false,
        message: "Invalid or inactive category",
      });
    }

    // Check for duplicate itemCode if provided
    if (itemCode && itemCode.trim() !== "") {
      const existingProduct = await Product.findOne({
        itemCode: itemCode.trim(),
      });
      if (existingProduct) {
        return res.status(400).json({
          success: false,
          message: "Product with this item code already exists",
        });
      }
    }

    // Create new product
    const product = await Product.create({
      itemCode: itemCode?.trim(),
      name: name.trim(),
      company: company?.trim(),
      category,
      sellingPrice,
      mrp,
      stockQuantity: stockQuantity || 0,
      unit: unit?.trim(),
      image,
      isAvailable: isAvailable !== undefined ? isAvailable : true,
    });

    // Populate category for response
    const populatedProduct = await Product.findById(product._id).populate(
      "category",
      "name description image"
    );

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: populatedProduct,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error creating product",
    });
  }
};

// Get all active products with optional filters
export const getProducts = async (req, res) => {
  try {
    const { category, search } = req.query;

    // Build query filter
    const filter = { isActive: true };

    // Filter by category if provided
    if (category) {
      if (!mongoose.Types.ObjectId.isValid(category)) {
        return res.status(400).json({
          success: false,
          message: "Invalid category ID",
        });
      }
      filter.category = category;
    }

    // Search by name or company if search term provided
    if (search) {
      const searchRegex = new RegExp(search, "i");
      filter.$or = [
        { name: searchRegex },
        { company: searchRegex },
      ];
    }

    // Get products with category populated, sorted by name
    const products = await Product.find(filter)
      .populate("category", "name description image")
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      message: "Products retrieved successfully",
      data: products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error retrieving products",
    });
  }
};

// Get a single product by ID
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if ID is valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await Product.findById(id).populate(
      "category",
      "name description image"
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product retrieved successfully",
      data: product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error retrieving product",
    });
  }
};

// Update a product
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      itemCode,
      name,
      company,
      category,
      sellingPrice,
      mrp,
      stockQuantity,
      unit,
      image,
      isAvailable,
      isActive,
    } = req.body;

    // Check if ID is valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    // Check if product exists
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // If category is being updated, validate it exists and is active
    if (category && category !== product.category.toString()) {
      if (!mongoose.Types.ObjectId.isValid(category)) {
        return res.status(400).json({
          success: false,
          message: "Invalid category ID",
        });
      }

      const categoryExists = await Category.findOne({
        _id: category,
        isActive: true,
      });
      if (!categoryExists) {
        return res.status(400).json({
          success: false,
          message: "Invalid or inactive category",
        });
      }
    }

    // If itemCode is being updated, check for duplicates
    if (itemCode !== undefined) {
      const trimmedItemCode = itemCode.trim();
      if (trimmedItemCode && trimmedItemCode !== product.itemCode) {
        const existingProduct = await Product.findOne({
          itemCode: trimmedItemCode,
          _id: { $ne: id },
        });
        if (existingProduct) {
          return res.status(400).json({
            success: false,
            message: "Product with this item code already exists",
          });
        }
      }
    }

    // Validate selling price if provided
    if (sellingPrice !== undefined && sellingPrice < 0) {
      return res.status(400).json({
        success: false,
        message: "Selling price cannot be negative",
      });
    }

    // Validate mrp if provided
    if (mrp !== undefined && mrp < 0) {
      return res.status(400).json({
        success: false,
        message: "MRP cannot be negative",
      });
    }

    // Validate stockQuantity if provided
    if (stockQuantity !== undefined && stockQuantity < 0) {
      return res.status(400).json({
        success: false,
        message: "Stock quantity cannot be negative",
      });
    }

    // Update product
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        ...(itemCode !== undefined && { itemCode: itemCode.trim() }),
        ...(name && { name: name.trim() }),
        ...(company !== undefined && { company: company?.trim() }),
        ...(category && { category }),
        ...(sellingPrice !== undefined && { sellingPrice }),
        ...(mrp !== undefined && { mrp }),
        ...(stockQuantity !== undefined && { stockQuantity }),
        ...(unit !== undefined && { unit: unit?.trim() }),
        ...(image !== undefined && { image }),
        ...(isAvailable !== undefined && { isAvailable }),
        ...(isActive !== undefined && { isActive }),
      },
      { new: true, runValidators: true }
    ).populate("category", "name description image");

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: updatedProduct,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error updating product",
    });
  }
};

// Soft delete a product (set isActive to false)
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if ID is valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    // Check if product exists
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Soft delete by setting isActive to false
    const deletedProduct = await Product.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    ).populate("category", "name description image");

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
      data: deletedProduct,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error deleting product",
    });
  }
};
