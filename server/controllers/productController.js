import mongoose from "mongoose";
import Product from "../models/Product.js";
import Category from "../models/Category.js";
import Purchase from "../models/Purchase.js";
import Order from "../models/Order.js";
import { uploadToCloudinary, deleteFromCloudinary, isCloudinaryUrl, extractPublicIdFromUrl } from "../config/cloudinaryConfig.js";

// Create a new product
export const createProduct = async (req, res) => {
  try {
    const {
      itemCode,
      barcode,
      name,
      company,
      category,
      sellingPrice,
      mrp,
      stockQuantity,
      unit,
      isAvailable,
    } = req.body;

    // Handle image upload to Cloudinary
    let imageUrl = undefined;
    let imagePublicId = undefined;
    
    if (req.file) {
      try {
        const uploadResult = await uploadToCloudinary(req.file.buffer);
        imageUrl = uploadResult.secure_url;
        imagePublicId = uploadResult.public_id;
      } catch (uploadError) {
        return res.status(400).json({
          success: false,
          message: `Image upload failed: ${uploadError.message}`,
        });
      }
    }

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

    if (sellingPrice === 0) {
      return res.status(400).json({
        success: false,
        message: "Selling price must be greater than 0",
      });
    }

    // Validate MRP if provided
    if (mrp !== undefined && mrp < 0) {
      return res.status(400).json({
        success: false,
        message: "MRP cannot be negative",
      });
    }

    // Validate that selling price is not greater than MRP when MRP is provided
    if (mrp !== undefined && sellingPrice > mrp) {
      return res.status(400).json({
        success: false,
        message: "Selling price cannot be greater than MRP",
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

    // Check for duplicate barcode if provided
    const trimmedBarcode = typeof barcode === 'string' && barcode.trim() !== '' ? barcode.trim() : null;
    if (trimmedBarcode) {
      const existingBarcodeProduct = await Product.findOne({
        barcode: trimmedBarcode,
      });
      if (existingBarcodeProduct) {
        return res.status(400).json({
          success: false,
          message: `Barcode ${trimmedBarcode} is already assigned to ${existingBarcodeProduct.name}`,
        });
      }
    }

    // Validate unit if provided
    const allowedUnits = ["pcs", "kg", "g", "litre", "ml", "pack", "packet", "box", "bottle", "dozen"];
    if (unit && !allowedUnits.includes(unit)) {
      return res.status(400).json({
        success: false,
        message: "Invalid unit. Must be one of: pcs, kg, g, litre, ml, pack, packet, box, bottle, dozen",
      });
    }

    // Create new product
    const product = await Product.create({
      itemCode: itemCode?.trim() || undefined,
      barcode: trimmedBarcode || undefined,
      name: name.trim(),
      company: company?.trim(),
      category,
      sellingPrice,
      mrp,
      stockQuantity: stockQuantity || 0,
      unit: unit?.trim(),
      image: imageUrl,
      imagePublicId,
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
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || "field";
      return res.status(400).json({
        success: false,
        message: field === "barcode"
          ? "Barcode is already assigned to another product"
          : `Product with this ${field} already exists`,
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || "Error creating product",
    });
  }
};

// Get all active products with optional filters and pagination
export const getProducts = async (req, res) => {
  try {
    const { category, search, page = 1, limit = 50, admin = false, stockStatus, lowStockThreshold = 10 } = req.query;

    // Parse pagination parameters with validation
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.max(parseInt(limit, 10) || 12, 1);
    const skip = (pageNum - 1) * limitNum;

    // Parse low stock threshold
    const threshold = parseInt(lowStockThreshold, 10) || 10;

    // Build query filter - admin flag allows seeing all products regardless of availability
    const filter = { isActive: true };
    if (admin !== 'true') {
      filter.isAvailable = true;
    }

    // Filter by category if provided (only for admin or when not searching)
    const trimmedSearch = typeof search === 'string' ? search.trim() : '';
    if (category && (!trimmedSearch || admin === 'true')) {
      if (!mongoose.Types.ObjectId.isValid(category)) {
        return res.status(400).json({
          success: false,
          message: "Invalid category ID",
        });
      }
      filter.category = category;
    }

    // Search by name, company, itemCode, or barcode if search term provided
    if (trimmedSearch) {
      const searchRegex = new RegExp(trimmedSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "i");
      filter.$or = [
        { name: searchRegex },
        { company: searchRegex },
        { itemCode: searchRegex },
        { barcode: searchRegex },
      ];
    }

    // Filter by stock status if provided
    if (stockStatus && admin === 'true') {
      switch (stockStatus) {
        case 'In Stock':
          filter.stockQuantity = { $gt: threshold };
          break;
        case 'Low Stock':
          filter.stockQuantity = { $gt: 0, $lte: threshold };
          break;
        case 'Out of Stock':
          filter.stockQuantity = 0;
          break;
        // 'All Status' doesn't add any filter
      }
    }

    // Get total count for pagination metadata
    const total = await Product.countDocuments(filter);

    // Get products with category populated, sorted by name, with pagination
    const products = await Product.find(filter)
      .populate("category", "name description image")
      .sort({ name: 1 })
      .skip(skip)
      .limit(limitNum);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limitNum);
    const hasMore = pageNum < totalPages;

    // Always return pagination metadata for admin requests
    // For customer requests without pagination params, return legacy format for backward compatibility
    if (admin === 'true' || req.query.page !== undefined || req.query.limit !== undefined) {
      // Return paginated response with metadata
      res.status(200).json({
        success: true,
        message: "Products retrieved successfully",
        data: products,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages,
          hasMore,
        },
      });
    } else {
      // Return legacy response for backward compatibility (customer browse without pagination)
      res.status(200).json({
        success: true,
        message: "Products retrieved successfully",
        data: products,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error retrieving products",
    });
  }
};

// Get low stock products for dashboard
export const getLowStockProducts = async (req, res) => {
  try {
    const { lowStockThreshold = 10, limit = 5 } = req.query;
    const threshold = parseInt(lowStockThreshold, 10) || 10;
    const limitNum = Math.min(parseInt(limit, 10) || 5, 20);

    // Get total count of low stock products
    const totalLowStock = await Product.countDocuments({
      isActive: true,
      stockQuantity: { $lte: threshold }
    });

    // Get low stock products sorted by stock quantity (ascending)
    const lowStockProducts = await Product.find({
      isActive: true,
      stockQuantity: { $lte: threshold }
    })
      .populate("category", "name description image")
      .sort({ stockQuantity: 1, name: 1 })
      .limit(limitNum);

    res.status(200).json({
      success: true,
      message: "Low stock products retrieved successfully",
      data: lowStockProducts,
      total: totalLowStock,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error retrieving low stock products",
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

// Get a product by barcode
export const getProductByBarcode = async (req, res) => {
  try {
    const { barcode } = req.params;

    if (!barcode || typeof barcode !== "string" || barcode.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Barcode parameter is required",
      });
    }

    const normalizedBarcode = barcode.trim();

    const product = await Product.findOne({
      barcode: normalizedBarcode,
      isActive: true,
    }).populate("category", "name description image");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found for this barcode",
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
      message: error.message || "Error retrieving product by barcode",
    });
  }
};

// Update a product
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      itemCode,
      barcode,
      name,
      company,
      category,
      sellingPrice,
      mrp,
      stockQuantity,
      unit,
      isAvailable,
      isActive,
    } = req.body;

    // Handle image upload to Cloudinary
    let imageUrl = undefined;
    let imagePublicId = undefined;
    
    if (req.file) {
      try {
        const uploadResult = await uploadToCloudinary(req.file.buffer);
        imageUrl = uploadResult.secure_url;
        imagePublicId = uploadResult.public_id;
      } catch (uploadError) {
        return res.status(400).json({
          success: false,
          message: `Image upload failed: ${uploadError.message}`,
        });
      }
    }

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
      const trimmedItemCode = typeof itemCode === 'string' ? itemCode.trim() : '';
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

    // If barcode is being updated, check for duplicates
    let trimmedBarcode = undefined;
    if (barcode !== undefined) {
      trimmedBarcode = typeof barcode === 'string' && barcode.trim() !== '' ? barcode.trim() : null;
      if (trimmedBarcode && trimmedBarcode !== product.barcode) {
        const existingBarcodeProduct = await Product.findOne({
          barcode: trimmedBarcode,
          _id: { $ne: id },
        });
        if (existingBarcodeProduct) {
          return res.status(400).json({
            success: false,
            message: `Barcode ${trimmedBarcode} is already assigned to ${existingBarcodeProduct.name}`,
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

    if (sellingPrice !== undefined && sellingPrice === 0) {
      return res.status(400).json({
        success: false,
        message: "Selling price must be greater than 0",
      });
    }

    // Validate mrp if provided
    if (mrp !== undefined && mrp < 0) {
      return res.status(400).json({
        success: false,
        message: "MRP cannot be negative",
      });
    }

    // Validate that selling price is not greater than MRP when both are provided
    if (sellingPrice !== undefined && mrp !== undefined && sellingPrice > mrp) {
      return res.status(400).json({
        success: false,
        message: "Selling price cannot be greater than MRP",
      });
    }

    // Validate stockQuantity if provided
    if (stockQuantity !== undefined && stockQuantity < 0) {
      return res.status(400).json({
        success: false,
        message: "Stock quantity cannot be negative",
      });
    }

    // Validate unit if provided
    const allowedUnits = ["pcs", "kg", "g", "litre", "ml", "pack", "packet", "box", "bottle", "dozen"];
    if (unit !== undefined && unit && !allowedUnits.includes(unit)) {
      return res.status(400).json({
        success: false,
        message: "Invalid unit. Must be one of: pcs, kg, g, litre, ml, pack, packet, box, bottle, dozen",
      });
    }

    // Handle image replacement
    if (req.file && product.imagePublicId) {
      // Delete old image from Cloudinary
      await deleteFromCloudinary(product.imagePublicId);
    }

    // Update product
    const updateData = {
      ...(itemCode !== undefined && { itemCode: typeof itemCode === 'string' ? itemCode.trim() : itemCode }),
      ...(barcode !== undefined && { barcode: trimmedBarcode }),
      ...(name && { name: name.trim() }),
      ...(company !== undefined && { company: company?.trim() }),
      ...(category && { category }),
      ...(sellingPrice !== undefined && { sellingPrice }),
      ...(mrp !== undefined && { mrp }),
      ...(stockQuantity !== undefined && { stockQuantity }),
      ...(unit !== undefined && { unit: unit?.trim() }),
      ...(isAvailable !== undefined && { isAvailable }),
      ...(isActive !== undefined && { isActive }),
    };

    // Only update image fields if a new image was uploaded
    if (req.file) {
      updateData.image = imageUrl;
      updateData.imagePublicId = imagePublicId;
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate("category", "name description image");

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: updatedProduct,
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || "field";
      return res.status(400).json({
        success: false,
        message: field === "barcode"
          ? "Barcode is already assigned to another product"
          : `Product with this ${field} already exists`,
      });
    }
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

    // Delete image from Cloudinary if it exists
    if (product.imagePublicId) {
      await deleteFromCloudinary(product.imagePublicId);
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

// Get transaction history (inbound supplier purchases & outbound customer orders) for a specific product
export const getProductTransactions = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, search, fromDate, startDate, toDate, endDate, page = 1, limit = 25 } = req.query;

    // Check if ID is valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await Product.findById(id).populate("category", "name description image");
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const productIdStr = product._id.toString();
    const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // Build Purchase query filter
    const purchaseFilter = { product: product._id };

    const from = startDate || fromDate;
    const to = endDate || toDate;

    if (from || to) {
      purchaseFilter.purchaseDate = {};
      if (from) {
        const start = new Date(from);
        start.setHours(0, 0, 0, 0);
        purchaseFilter.purchaseDate.$gte = start;
      }
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        purchaseFilter.purchaseDate.$lte = end;
      }
    }

    if (search && typeof search === "string" && search.trim() !== "") {
      const searchRegex = new RegExp(escapeRegex(search.trim()), "i");
      purchaseFilter.$or = [
        { invoiceNumber: searchRegex },
        { supplier: searchRegex },
        { itemName: searchRegex },
        { barcode: searchRegex },
      ];
    }

    // Build Order query filter (items containing this product, excluding cancelled orders)
    const orderFilter = {
      "items.product": product._id,
      status: { $ne: "cancelled" },
    };

    if (from || to) {
      orderFilter.createdAt = {};
      if (from) {
        const start = new Date(from);
        start.setHours(0, 0, 0, 0);
        orderFilter.createdAt.$gte = start;
      }
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        orderFilter.createdAt.$lte = end;
      }
    }

    if (search && typeof search === "string" && search.trim() !== "") {
      const searchRegex = new RegExp(escapeRegex(search.trim()), "i");
      orderFilter.$or = [
        { orderNumber: searchRegex },
        { customerName: searchRegex },
        { customerPhone: searchRegex },
        { "items.productName": searchRegex },
      ];
    }

    const typeUpper = (type || "").toUpperCase().trim();

    let purchaseDocs = [];
    if (typeUpper !== "ORDER" && typeUpper !== "ORDERS" && typeUpper !== "OUT") {
      purchaseDocs = await Purchase.find(purchaseFilter).sort({ purchaseDate: -1, createdAt: -1 });
    }

    let orderDocs = [];
    if (typeUpper !== "PURCHASE" && typeUpper !== "PURCHASES" && typeUpper !== "IN") {
      orderDocs = await Order.find(orderFilter).populate("customer", "name phone email").sort({ createdAt: -1 });
    }

    // Map Purchase docs to unified transaction structure
    const purchaseTxList = purchaseDocs.map((p) => {
      const qty = p.quantityPurchased || 1;
      const unitPrice = p.purchaseAmount || 0;
      const totalAmount = unitPrice * qty;
      return {
        _id: p._id.toString(),
        type: "PURCHASE",
        date: p.purchaseDate || p.createdAt,
        reference: p.invoiceNumber && p.invoiceNumber.trim() ? p.invoiceNumber.trim() : "Single Entry",
        party: p.supplier && p.supplier.trim() ? p.supplier.trim() : "Supplier Not Specified",
        quantity: qty,
        unitPrice,
        totalAmount,
        sellingPrice: p.sellingPrice,
        mrp: p.mrp,
        barcode: p.barcode,
        itemName: p.itemName,
      };
    });

    // Map Order docs to unified transaction structure
    const orderTxList = orderDocs.map((o) => {
      const matchedItem = (o.items || []).find(
        (item) => item.product && item.product.toString() === productIdStr
      );
      const qty = matchedItem ? matchedItem.quantity : 0;
      const unitPrice = matchedItem ? matchedItem.price : 0;
      const totalAmount = matchedItem ? matchedItem.subtotal : unitPrice * qty;

      return {
        _id: `${o._id.toString()}_${productIdStr}`,
        type: "ORDER",
        date: o.createdAt,
        reference: o.orderNumber ? o.orderNumber.trim() : "—",
        party: o.customerName ? o.customerName.trim() : "Customer",
        customerPhone: o.customerPhone,
        status: o.status,
        quantity: -qty,
        unitPrice,
        totalAmount,
        itemName: matchedItem ? matchedItem.productName : product.name,
      };
    });

    // Combine all transactions
    let allTransactions = [...purchaseTxList, ...orderTxList];

    // Sort all transactions chronologically descending (newest first)
    allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Calculate running stock balance starting backward from current product stock quantity
    let currentStock = product.stockQuantity;
    for (let i = 0; i < allTransactions.length; i++) {
      const tx = allTransactions[i];
      tx.runningBalance = currentStock;
      // Subtract this transaction's net quantity change to determine the stock before this transaction
      currentStock = currentStock - tx.quantity;
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 25);
    const total = allTransactions.length;
    const totalPages = Math.ceil(total / limitNum) || 1;
    const skip = (pageNum - 1) * limitNum;

    const paginatedTransactions = allTransactions.slice(skip, skip + limitNum);

    res.status(200).json({
      success: true,
      message: "Product transaction history retrieved successfully",
      data: {
        product: {
          _id: product._id,
          name: product.name,
          company: product.company,
          barcode: product.barcode,
          itemCode: product.itemCode,
          stockQuantity: product.stockQuantity,
          unit: product.unit || "pack",
          sellingPrice: product.sellingPrice,
          mrp: product.mrp,
          category: product.category,
          image: product.image,
        },
        transactions: paginatedTransactions,
        summary: {
          totalTransactions: total,
          totalPurchases: purchaseTxList.length,
          totalOrders: orderTxList.length,
          currentStock: product.stockQuantity,
        },
      },
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasMore: pageNum < totalPages,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error retrieving product transaction history",
    });
  }
};

