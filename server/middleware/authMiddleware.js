import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";
import Customer from "../models/Customer.js";

// Helper to extract cookie from request
const extractCookie = (req, name) => {
  if (req.cookies && req.cookies[name]) {
    return req.cookies[name];
  }
  if (req.headers?.cookie) {
    const match = req.headers.cookie.match(new RegExp(`(^|;\\s*)${name}=([^;]*)`));
    return match ? decodeURIComponent(match[2]) : null;
  }
  return null;
};

// Protect routes - verify JWT token for admin
export const protect = async (req, res, next) => {
  try {
    let token;
    if (
      req.headers?.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.query?.token) {
      token = req.query.token;
    } else {
      token = extractCookie(req, "adminToken");
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, no token provided",
      });
    }

    // Verify token using admin JWT secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Explicitly reject customer tokens
    if (decoded.type === "customer") {
      return res.status(403).json({
        success: false,
        message: "Customer accounts are not authorized to access admin resources",
      });
    }

    // Get admin from token
    const admin = await Admin.findById(decoded.id).select("-password");

    // Check if admin still exists
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Admin account not found or deactivated",
      });
    }

    // Attach admin to request object
    req.admin = admin;

    next();
  } catch (error) {
    // Handle different JWT errors
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired",
      });
    }

    res.status(401).json({
      success: false,
      message: "Not authorized",
    });
  }
};

// Protect single order route: allows admin, or customer who placed the order
export const protectOrderAccess = async (req, res, next) => {
  try {
    let token;
    if (
      req.headers?.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else {
      token = extractCookie(req, "adminToken") || extractCookie(req, "customerToken");
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, no token provided",
      });
    }

    // 1. Try admin authentication
    try {
      const decodedAdmin = jwt.verify(token, process.env.JWT_SECRET);
      if (decodedAdmin?.id && decodedAdmin.type !== "customer") {
        const admin = await Admin.findById(decodedAdmin.id).select("-password");
        if (admin) {
          req.admin = admin;
          return next();
        }
      }
    } catch {
      // Not admin token, try customer
    }

    // 2. Try customer authentication
    const customerSecret = process.env.CUSTOMER_JWT_SECRET;
    if (customerSecret) {
      try {
        const decodedCustomer = jwt.verify(token, customerSecret);
        if (decodedCustomer?.id && decodedCustomer.type === "customer") {
          const customer = await Customer.findById(decodedCustomer.id);
          if (customer && customer.isActive) {
            req.customer = customer;
            return next();
          }
        }
      } catch {
        // Not a customer token
      }
    }

    return res.status(401).json({
      success: false,
      message: "Not authorized",
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Not authorized",
    });
  }
};
