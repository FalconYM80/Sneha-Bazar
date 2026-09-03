import Admin from "../models/Admin.js";
import jwt from "jsonwebtoken";

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// Register admin (only allowed if no admin exists)
export const registerAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate required fields
    if (!name || name.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    if (!email || email.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Email is required",
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

    // Validate email format (basic validation)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    // Check if any admin already exists
    const existingAdminCount = await Admin.countDocuments();
    if (existingAdminCount > 0) {
      return res.status(403).json({
        success: false,
        message: "Admin account already exists. Registration is disabled.",
      });
    }

    // Check if email already exists (double check)
    const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    // Create admin
    const admin = await Admin.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: password.trim(),
    });

    // Generate token
    const token = generateToken(admin._id);

    // Return admin without password
    res.status(201).json({
      success: true,
      message: "Admin registered successfully",
      data: {
        admin: {
          _id: admin._id,
          name: admin.name,
          email: admin.email,
        },
        token,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error registering admin",
    });
  }
};

// Login admin
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || email.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    if (!password || password.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Password is required",
      });
    }

    // Find admin by email and explicitly select password
    const admin = await Admin.findOne({ email: email.toLowerCase().trim() }).select(
      "+password"
    );

    // Generic error message for security
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Compare password
    const isPasswordValid = await admin.comparePassword(password.trim());
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Generate token
    const token = generateToken(admin._id);

    // Return admin without password
    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        admin: {
          _id: admin._id,
          name: admin.name,
          email: admin.email,
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

// Get current admin profile (protected route)
export const getAdminProfile = async (req, res) => {
  try {
    // Admin is already attached to req.admin by middleware
    const admin = req.admin;

    res.status(200).json({
      success: true,
      message: "Admin profile retrieved successfully",
      data: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error retrieving admin profile",
    });
  }
};
