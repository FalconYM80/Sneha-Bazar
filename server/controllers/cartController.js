import mongoose from "mongoose";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

// Get customer's cart
export const getCart = async (req, res) => {
  try {
    // Get authenticated customer from middleware
    const customer = req.customer;

    // Find cart for the authenticated customer
    let cart = await Cart.findOne({ customer: customer._id }).populate(
      "items.product",
      "name itemCode company sellingPrice mrp image unit isAvailable isActive"
    );

    // If cart doesn't exist, return empty cart structure
    if (!cart) {
      return res.status(200).json({
        success: true,
        message: "Cart retrieved successfully",
        data: {
          customer: customer._id,
          items: [],
        },
      });
    }

    res.status(200).json({
      success: true,
      message: "Cart retrieved successfully",
      data: cart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error retrieving cart",
    });
  }
};

// Add product to cart
export const addToCart = async (req, res) => {
  try {
    const { product: productId, quantity } = req.body;

    // Get authenticated customer from middleware
    const customer = req.customer;

    // Validate product ObjectId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    // Validate quantity
    if (!quantity || quantity < 1 || !Number.isInteger(quantity)) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a positive integer",
      });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(400).json({
        success: false,
        message: "Product not found",
      });
    }

    // Check if product is active
    if (!product.isActive) {
      return res.status(400).json({
        success: false,
        message: "Product is not active",
      });
    }

    // Check if product is available
    if (!product.isAvailable) {
      return res.status(400).json({
        success: false,
        message: "Product is not available",
      });
    }

    // Find customer's cart
    let cart = await Cart.findOne({ customer: customer._id });

    // If cart doesn't exist, create new cart
    if (!cart) {
      cart = await Cart.create({
        customer: customer._id,
        items: [
          {
            product: productId,
            quantity: quantity,
          },
        ],
      });
    } else {
      // Check if product already exists in cart
      const existingItemIndex = cart.items.findIndex(
        (item) => item.product.toString() === productId
      );

      if (existingItemIndex !== -1) {
        // Update existing item quantity
        cart.items[existingItemIndex].quantity += quantity;
      } else {
        // Add new item to cart
        cart.items.push({
          product: productId,
          quantity: quantity,
        });
      }

      await cart.save();
    }

    // Populate product details for response
    const populatedCart = await Cart.findById(cart._id).populate(
      "items.product",
      "name itemCode company sellingPrice mrp image unit isAvailable isActive"
    );

    res.status(201).json({
      success: true,
      message: "Product added to cart successfully",
      data: populatedCart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error adding product to cart",
    });
  }
};

// Update cart item quantity
export const updateCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    // Get authenticated customer from middleware
    const customer = req.customer;

    // Validate product ObjectId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    // Validate quantity
    if (!quantity || quantity < 1 || !Number.isInteger(quantity)) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a positive integer",
      });
    }

    // Find customer's cart
    const cart = await Cart.findOne({ customer: customer._id });

    // If cart doesn't exist
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    // Find the product in cart items
    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    // If product not in cart
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Product not found in cart",
      });
    }

    // Update quantity
    cart.items[itemIndex].quantity = quantity;
    await cart.save();

    // Populate product details for response
    const populatedCart = await Cart.findById(cart._id).populate(
      "items.product",
      "name itemCode company sellingPrice mrp image unit isAvailable isActive"
    );

    res.status(200).json({
      success: true,
      message: "Cart item updated successfully",
      data: populatedCart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error updating cart item",
    });
  }
};

// Remove product from cart
export const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;

    // Get authenticated customer from middleware
    const customer = req.customer;

    // Validate product ObjectId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    // Find customer's cart
    const cart = await Cart.findOne({ customer: customer._id });

    // If cart doesn't exist
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    // Find the product in cart items
    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    // If product not in cart
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Product not found in cart",
      });
    }

    // Remove the item from cart
    cart.items.splice(itemIndex, 1);
    await cart.save();

    // Populate product details for response
    const populatedCart = await Cart.findById(cart._id).populate(
      "items.product",
      "name itemCode company sellingPrice mrp image unit isAvailable isActive"
    );

    res.status(200).json({
      success: true,
      message: "Product removed from cart successfully",
      data: populatedCart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error removing product from cart",
    });
  }
};

// Clear entire cart
export const clearCart = async (req, res) => {
  try {
    // Get authenticated customer from middleware
    const customer = req.customer;

    // Find customer's cart
    const cart = await Cart.findOne({ customer: customer._id });

    // If cart exists, clear it
    if (cart) {
      cart.items = [];
      await cart.save();
    }

    res.status(200).json({
      success: true,
      message: "Cart cleared successfully",
      data: {},
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error clearing cart",
    });
  }
};