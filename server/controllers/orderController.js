import mongoose from "mongoose";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Counter from "../models/Counter.js";

// Helper function to generate sequential order number using atomic counter
const generateOrderNumber = async () => {
  const counter = await Counter.findOneAndUpdate(
    { _id: "orderNumber" },
    { $inc: { sequence_value: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  
  return `SB-${counter.sequence_value}`;
};

// Create a new order
export const createOrder = async (req, res) => {
  try {
    const { customer, items } = req.body;

    // Validate customer information
    if (!customer || !customer.name || !customer.phone) {
      return res.status(400).json({
        success: false,
        message: "Customer name and phone are required",
      });
    }

    if (customer.name.trim() === "" || customer.phone.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Customer name and phone cannot be empty",
      });
    }

    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one item is required",
      });
    }

    // Check for duplicate products in the same order
    const productIds = items.map(item => item.product);
    const uniqueProductIds = new Set(productIds);
    if (productIds.length !== uniqueProductIds.size) {
      return res.status(400).json({
        success: false,
        message: "Duplicate products are not allowed in an order",
      });
    }

    // Process each item
    const processedItems = [];
    let totalAmount = 0;
    let totalItemCount = 0;

    for (const item of items) {
      // Validate item structure
      if (!item.product || !item.quantity) {
        return res.status(400).json({
          success: false,
          message: "Each item must have product and quantity",
        });
      }

      // Validate product ObjectId
      if (!mongoose.Types.ObjectId.isValid(item.product)) {
        return res.status(400).json({
          success: false,
          message: "Invalid product ID",
        });
      }

      // Validate quantity
      if (item.quantity < 1 || !Number.isInteger(item.quantity)) {
        return res.status(400).json({
          success: false,
          message: "Quantity must be a positive integer",
        });
      }

      // Get product from database
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product not found for ID: ${item.product}`,
        });
      }

      // Check if product is active and available
      if (!product.isActive) {
        return res.status(400).json({
          success: false,
          message: `Product is not active: ${product.name}`,
        });
      }

      if (!product.isAvailable) {
        return res.status(400).json({
          success: false,
          message: `Product is not available: ${product.name}`,
        });
      }

      // Calculate item details using current database price
      const price = product.sellingPrice;
      const quantity = item.quantity;
      const subtotal = price * quantity;

      // Add to totals
      totalAmount += subtotal;
      totalItemCount += quantity;

      // Add processed item
      processedItems.push({
        product: product._id,
        productName: product.name,
        quantity: quantity,
        price: price,
        subtotal: subtotal,
      });
    }

    // Calculate preparation minutes based on total item count
    let preparationMinutes;
    if (totalItemCount >= 1 && totalItemCount <= 5) {
      preparationMinutes = 15;
    } else if (totalItemCount >= 6 && totalItemCount <= 10) {
      preparationMinutes = 30;
    } else {
      preparationMinutes = 45;
    }

    // Calculate estimated pickup time
    const estimatedPickupTime = new Date(Date.now() + preparationMinutes * 60000);

    // Generate unique order number
    const orderNumber = await generateOrderNumber();

    // Create order
    const order = await Order.create({
      orderNumber,
      customer: {
        name: customer.name.trim(),
        phone: customer.phone.trim(),
      },
      items: processedItems,
      totalAmount,
      totalItemCount,
      preparationMinutes,
      estimatedPickupTime,
      status: "pending",
    });

    // Populate product references for response
    const populatedOrder = await Order.findById(order._id).populate(
      "items.product",
      "name itemCode company"
    );

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: populatedOrder,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error creating order",
    });
  }
};

// Get all orders with optional filters
export const getOrders = async (req, res) => {
  try {
    const { status, search } = req.query;

    // Build query
    let query = Order.find();

    // Filter by status if provided
    if (status) {
      const validStatuses = ["pending", "confirmed", "preparing", "ready", "completed", "cancelled"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status value",
        });
      }
      query = query.where("status").equals(status);
    }

    // Search by orderNumber, customer name, or customer phone
    if (search) {
      const searchRegex = new RegExp(search, "i");
      query = query.or([
        { orderNumber: searchRegex },
        { "customer.name": searchRegex },
        { "customer.phone": searchRegex },
      ]);
    }

    // Get orders with product populated, sorted by createdAt descending
    const orders = await query
      .populate("items.product", "name itemCode company")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Orders retrieved successfully",
      data: orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error retrieving orders",
    });
  }
};

// Get a single order by ID
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if ID is valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const order = await Order.findById(id).populate(
      "items.product",
      "name itemCode company"
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Order retrieved successfully",
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error retrieving order",
    });
  }
};

// Update order status
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Check if ID is valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    // Validate status
    const validStatuses = ["pending", "confirmed", "preparing", "ready", "completed", "cancelled"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    // Check if order exists
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Update order status
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    ).populate("items.product", "name itemCode company");

    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      data: updatedOrder,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error updating order status",
    });
  }
};

// Delete an order (permanent delete)
export const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if ID is valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    // Check if order exists
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Permanently delete the order
    await Order.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Order deleted successfully",
      data: {},
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error deleting order",
    });
  }
};
