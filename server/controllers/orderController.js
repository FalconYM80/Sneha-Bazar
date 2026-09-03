import mongoose from "mongoose";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Counter from "../models/Counter.js";
import Cart from "../models/Cart.js";

// Helper function to generate sequential order number using atomic counter
const generateOrderNumber = async () => {
  const counter = await Counter.findOneAndUpdate(
    { _id: "orderNumber" },
    { $inc: { sequence_value: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  
  return `SB-${counter.sequence_value}`;
};

// Helper function to process order items and validate products
const processOrderItems = async (items) => {
  const processedItems = [];
  let totalAmount = 0;
  let totalItemCount = 0;

  for (const item of items) {
    // Get product from database
    const product = await Product.findById(item.product);
    if (!product) {
      throw new Error(`Product not found for ID: ${item.product}`);
    }

    // Check if product is active and available
    if (!product.isActive) {
      throw new Error(`Product is not active: ${product.name}`);
    }

    if (!product.isAvailable) {
      throw new Error(`Product is not available: ${product.name}`);
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

  return { processedItems, totalAmount, totalItemCount };
};

// Helper function to calculate preparation time
const calculatePreparationTime = (totalItemCount) => {
  if (totalItemCount >= 1 && totalItemCount <= 5) {
    return 15;
  } else if (totalItemCount >= 6 && totalItemCount <= 10) {
    return 30;
  } else {
    return 45;
  }
};

// Create a new order
export const createOrder = async (req, res) => {
  try {
    const { items } = req.body;

    // Get authenticated customer from middleware
    const customer = req.customer;

    // Validate customer exists (should always exist due to middleware)
    if (!customer) {
      return res.status(401).json({
        success: false,
        message: "Customer authentication required",
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

    // Validate each item structure
    for (const item of items) {
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
    }

    // Process items and validate products
    const { processedItems, totalAmount, totalItemCount } = await processOrderItems(items);

    // Calculate preparation time
    const preparationMinutes = calculatePreparationTime(totalItemCount);
    const estimatedPickupTime = new Date(Date.now() + preparationMinutes * 60000);

    // Generate unique order number
    const orderNumber = await generateOrderNumber();

    // Create order
    const order = await Order.create({
      orderNumber,
      customer: customer._id,
      customerName: customer.name.trim(),
      customerPhone: customer.phone.trim(),
      items: processedItems,
      totalAmount,
      totalItemCount,
      preparationMinutes,
      estimatedPickupTime,
      status: "pending",
    });

    // Populate product and customer references for response
    const populatedOrder = await Order.findById(order._id)
      .populate("customer", "name phone email")
      .populate("items.product", "name itemCode company");

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
        { customerName: searchRegex },
        { customerPhone: searchRegex },
      ]);
    }

    // Get orders with product and customer populated, sorted by createdAt descending
    const orders = await query
      .populate("customer", "name phone email")
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

    const order = await Order.findById(id)
      .populate("customer", "name phone email")
      .populate("items.product", "name itemCode company");

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
    )
      .populate("customer", "name phone email")
      .populate("items.product", "name itemCode company");

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

// Get current customer's orders
export const getMyOrders = async (req, res) => {
  try {
    // Get authenticated customer from middleware
    const customer = req.customer;

    // Validate customer exists (should always exist due to middleware)
    if (!customer) {
      return res.status(401).json({
        success: false,
        message: "Customer authentication required",
      });
    }

    // Get orders for the authenticated customer only
    const orders = await Order.find({ customer: customer._id })
      .populate("customer", "name phone email")
      .populate("items.product", "name itemCode company")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Customer orders retrieved successfully",
      data: orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error retrieving customer orders",
    });
  }
};

// Checkout - create order from customer's cart
export const checkout = async (req, res) => {
  try {
    // Get authenticated customer from middleware
    const customer = req.customer;

    // Validate customer exists (should always exist due to middleware)
    if (!customer) {
      return res.status(401).json({
        success: false,
        message: "Customer authentication required",
      });
    }

    // Get customer's cart
    const cart = await Cart.findOne({ customer: customer._id });

    // Check if cart exists and is not empty
    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    // Convert cart items to order items format
    const orderItems = cart.items.map(item => ({
      product: item.product,
      quantity: item.quantity,
    }));

    // Process items and validate products
    const { processedItems, totalAmount, totalItemCount } = await processOrderItems(orderItems);

    // Calculate preparation time
    const preparationMinutes = calculatePreparationTime(totalItemCount);
    const estimatedPickupTime = new Date(Date.now() + preparationMinutes * 60000);

    // Generate unique order number
    const orderNumber = await generateOrderNumber();

    // Create order
    const order = await Order.create({
      orderNumber,
      customer: customer._id,
      customerName: customer.name.trim(),
      customerPhone: customer.phone.trim(),
      items: processedItems,
      totalAmount,
      totalItemCount,
      preparationMinutes,
      estimatedPickupTime,
      status: "pending",
    });

    // Clear the cart only after successful order creation
    cart.items = [];
    await cart.save();

    // Populate product and customer references for response
    const populatedOrder = await Order.findById(order._id)
      .populate("customer", "name phone email")
      .populate("items.product", "name itemCode company");

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      data: populatedOrder,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error during checkout",
    });
  }
};
