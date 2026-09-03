import jwt from "jsonwebtoken";
import Customer from "../models/Customer.js";

// Protect routes - verify JWT token for customers
export const protectCustomer = async (req, res, next) => {
  try {
    // Get token from Authorization header
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, no token provided",
      });
    }

    // Verify token using customer JWT secret
    const decoded = jwt.verify(token, process.env.CUSTOMER_JWT_SECRET);

    // Verify token type is customer
    if (decoded.type !== "customer") {
      return res.status(401).json({
        success: false,
        message: "Invalid token type",
      });
    }

    // Get customer from token
    const customer = await Customer.findById(decoded.id);

    // Check if customer still exists
    if (!customer) {
      return res.status(401).json({
        success: false,
        message: "Customer no longer exists",
      });
    }

    // Check if customer is active
    if (!customer.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated",
      });
    }

    // Attach customer to request object
    req.customer = customer;

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