import Customer from "../models/Customer.js";
import jwt from "jsonwebtoken";

// Generate JWT Token for customer
const generateCustomerToken = (id) => {
  return jwt.sign({ id, type: "customer" }, process.env.CUSTOMER_JWT_SECRET, {
    expiresIn: "7d",
  });
};

// Register customer
export const registerCustomer = async (req, res) => {
  try {
    const { name, phone, email, password } = req.body;

    // Validate required fields
    if (!name || name.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    if (!phone || phone.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    if (!password || password.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Password is required",
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    // Validate phone number (basic validation - 10 digits)
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone.trim())) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number format",
      });
    }

    // Validate email format only if provided
    if (email && email.trim() !== "") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: "Invalid email format",
        });
      }
    }

    // Check if phone number already exists
    const existingCustomer = await Customer.findOne({
      phone: phone.trim(),
    });
    if (existingCustomer) {
      return res.status(409).json({
        success: false,
        message: "An account with this phone number already exists",
      });
    }

    // Check if email already exists (only if email is provided)
    if (email && email.trim() !== "") {
      const existingEmail = await Customer.findOne({
        email: email.toLowerCase().trim(),
      });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: "An account with this email already exists",
        });
      }
    }

    // Create customer
    const customer = await Customer.create({
      name: name.trim(),
      phone: phone.trim(),
      email: email ? email.toLowerCase().trim() : undefined,
      password: password.trim(),
    });

    // Generate token
    const token = generateCustomerToken(customer._id);

    // Return customer without password
    res.status(201).json({
      success: true,
      message: "Customer registered successfully",
      data: {
        customer: {
          _id: customer._id,
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
        },
        token,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error registering customer",
    });
  }
};

// Login customer
export const loginCustomer = async (req, res) => {
  try {
    const { phone, password } = req.body;

    // Validate required fields
    if (!phone || phone.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    if (!password || password.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Password is required",
      });
    }

    // Find customer by phone and explicitly select password
    const customer = await Customer.findOne({
      phone: phone.trim(),
    }).select("+password");

    // Generic error message for security
    if (!customer) {
      return res.status(401).json({
        success: false,
        message: "Invalid phone number or password",
      });
    }

    // Check if customer is active
    if (!customer.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated",
      });
    }

    // Compare password
    const isPasswordValid = await customer.matchPassword(password.trim());
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid phone number or password",
      });
    }

    // Generate token
    const token = generateCustomerToken(customer._id);

    // Return customer without password
    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        customer: {
          _id: customer._id,
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
        },
        token,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error logging in",
    });
  }
};

// Get current customer profile (protected route)
export const getCustomerProfile = async (req, res) => {
  try {
    // Customer is already attached to req.customer by middleware
    const customer = req.customer;

    res.status(200).json({
      success: true,
      message: "Customer profile retrieved successfully",
      data: {
        _id: customer._id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        isActive: customer.isActive,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error retrieving customer profile",
    });
  }
};