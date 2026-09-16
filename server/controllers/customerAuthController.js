import Customer from "../models/Customer.js";
import jwt from "jsonwebtoken";
import { normalizeIndianPhone, e164ToDigits } from "../utils/phoneUtils.js";

// Generate JWT Token for customer
const generateCustomerToken = (id) => {
  return jwt.sign({ id, type: "customer" }, process.env.CUSTOMER_JWT_SECRET, {
    expiresIn: "7d",
  });
};

// Register customer (Phone + Password, zero SMS cost)
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

    if (!phone || typeof phone !== "string" || phone.trim() === "") {
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

    // Validate and normalize Indian mobile number to E.164 format (+91XXXXXXXXXX)
    let normalizedPhone;
    try {
      normalizedPhone = normalizeIndianPhone(phone);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: err.message || "Enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.",
      });
    }

    // Validate email format only if provided
    if (email && email.trim() !== "") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return res.status(400).json({
          success: false,
          message: "Invalid email format",
        });
      }
    }

    const bare10 = e164ToDigits(normalizedPhone);

    // Check if account with phone already exists (checks normalized E.164 and legacy 10-digit)
    const existingCustomer = await Customer.findOne({
      $or: [{ phone: normalizedPhone }, { phone: bare10 }],
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

    // Create customer with normalized E.164 phone
    const customer = await Customer.create({
      name: name.trim(),
      phone: normalizedPhone,
      email: email ? email.toLowerCase().trim() : undefined,
      password: password.trim(),
      phoneVerified: true,
    });

    // Generate token
    const token = generateCustomerToken(customer._id);

    // Return customer without password
    return res.status(201).json({
      success: true,
      message: "Customer registered successfully",
      data: {
        customer: {
          _id: customer._id,
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          phoneVerified: customer.phoneVerified,
        },
        token,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Error registering customer",
    });
  }
};

// Login customer (Mobile Number OR Email + Password)
export const loginCustomer = async (req, res) => {
  try {
    const { identifier, phone, email, password } = req.body;
    const loginIdentifier = (identifier || email || phone || "").trim();

    // Validate required fields
    if (!loginIdentifier) {
      return res.status(400).json({
        success: false,
        message: "Email or mobile number is required",
      });
    }

    if (!password || password.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Password is required",
      });
    }

    let customer = null;
    const isEmail = loginIdentifier.includes("@");

    if (isEmail) {
      const normalizedEmail = loginIdentifier.toLowerCase().trim();
      customer = await Customer.findOne({ email: normalizedEmail }).select("+password");
    } else {
      let normalizedPhone = null;
      let bare10 = loginIdentifier.replace(/\D/g, "");

      try {
        normalizedPhone = normalizeIndianPhone(loginIdentifier);
        bare10 = e164ToDigits(normalizedPhone);
      } catch {
        // Fallback for legacy phone format
      }

      const query = normalizedPhone
        ? { $or: [{ phone: normalizedPhone }, { phone: bare10 }, { phone: loginIdentifier }] }
        : { phone: loginIdentifier };

      customer = await Customer.findOne(query).select("+password");
    }

    // Generic error message for security
    if (!customer) {
      return res.status(401).json({
        success: false,
        message: "Invalid email/mobile number or password",
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
        message: "Invalid email/mobile number or password",
      });
    }

    // Generate token
    const token = generateCustomerToken(customer._id);

    // Return customer without password
    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        customer: {
          _id: customer._id,
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          phoneVerified: customer.phoneVerified ?? true,
        },
        token,
      },
    });
  } catch (error) {
    return res.status(500).json({
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

    return res.status(200).json({
      success: true,
      message: "Customer profile retrieved successfully",
      data: {
        _id: customer._id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        phoneVerified: customer.phoneVerified ?? true,
        isActive: customer.isActive,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Error retrieving customer profile",
    });
  }
};

// Update current customer profile (protected route)
export const updateCustomerProfile = async (req, res) => {
  try {
    const customerId = req.customer?._id;
    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
      });
    }

    const { name, email } = req.body;

    // Validate name
    if (name !== undefined) {
      if (typeof name !== "string" || name.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Name cannot be empty",
        });
      }
    }

    // Validate email if provided
    let normalizedEmail = undefined;
    if (email !== undefined) {
      if (email !== null && typeof email === "string" && email.trim() !== "") {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
          return res.status(400).json({
            success: false,
            message: "Invalid email format",
          });
        }
        normalizedEmail = email.toLowerCase().trim();

        // Check if another customer already has this email
        const existingEmail = await Customer.findOne({
          email: normalizedEmail,
          _id: { $ne: customerId },
        });

        if (existingEmail) {
          return res.status(400).json({
            success: false,
            message: "An account with this email already exists",
          });
        }
      } else {
        normalizedEmail = null;
      }
    }

    const updateFields = {};
    if (name !== undefined) {
      updateFields.name = name.trim();
    }
    if (email !== undefined) {
      updateFields.email = normalizedEmail;
    }

    const updatedCustomer = await Customer.findByIdAndUpdate(
      customerId,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!updatedCustomer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        _id: updatedCustomer._id,
        name: updatedCustomer.name,
        phone: updatedCustomer.phone,
        email: updatedCustomer.email || "",
        phoneVerified: updatedCustomer.phoneVerified ?? true,
        isActive: updatedCustomer.isActive,
        createdAt: updatedCustomer.createdAt,
        updatedAt: updatedCustomer.updatedAt,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Error updating customer profile",
    });
  }
};