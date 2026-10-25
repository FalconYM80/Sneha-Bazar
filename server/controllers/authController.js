import Admin from "../models/Admin.js";
import jwt from "jsonwebtoken";
import { maskEmail } from "../utils/provisionAdmin.js";

// Generate JWT Token with explicit admin role and 24-hour expiration
const generateToken = (id) => {
  return jwt.sign({ id, role: "admin" }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
};

// Register admin (only allowed if no admin exists and not disabled by policy)
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

    // Validate email format
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

    const cleanEmail = email.toLowerCase().trim();
    const existingAdmin = await Admin.findOne({ email: cleanEmail });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    // Create admin (password is hashed in Admin schema pre-save hook)
    const admin = await Admin.create({
      name: name.trim(),
      email: cleanEmail,
      password: password.trim(),
    });

    // Generate token
    const token = generateToken(admin._id);

    // Set secure cookie if supported
    if (res.cookie) {
      res.cookie("adminToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 24 * 60 * 60 * 1000,
      });
    }

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
    if (!email || typeof email !== "string" || email.trim() === "") {
      console.warn("[Auth] Admin login rejected: Email is missing or empty.");
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    if (!password || typeof password !== "string" || password.trim() === "") {
      console.warn("[Auth] Admin login rejected: Password is missing or empty.");
      return res.status(400).json({
        success: false,
        message: "Password is required",
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();
    const masked = maskEmail(cleanEmail);

    // Case-insensitive, whitespace-tolerant lookup for email resilience
    const escaped = cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const admin = await Admin.findOne({
      $or: [
        { email: cleanEmail },
        { email: new RegExp(`^\\s*${escaped}\\s*$`, "i") },
      ],
    }).select("+password");

    // Generic error message for security (prevents user enumeration on public response)
    if (!admin) {
      const totalAdmins = await Admin.countDocuments();
      console.warn(
        `[Auth] Admin login rejected: No admin account found matching ${masked}. (Total admin accounts in database: ${totalAdmins})`
      );
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Compare password with bcrypt hash
    const isPasswordValid = await admin.comparePassword(cleanPassword);
    if (!isPasswordValid) {
      console.warn(
        `[Auth] Admin login rejected: Password verification failed for admin ${masked}.`
      );
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    console.log(`[Auth] Admin login successful for ${masked}.`);

    // Generate token
    const token = generateToken(admin._id);

    // Set secure cookie
    if (res.cookie) {
      res.cookie("adminToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 24 * 60 * 60 * 1000,
      });
    }

    // Return admin details and token
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
    console.error("[Auth] Admin login server error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message || "Error logging in",
    });
  }
};

// Logout admin
export const logoutAdmin = async (req, res) => {
  try {
    if (res.clearCookie) {
      res.clearCookie("adminToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      });
    }

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error logging out",
    });
  }
};

// Get current admin profile (protected route)
export const getAdminProfile = async (req, res) => {
  try {
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
