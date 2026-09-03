import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";

// Protect routes - verify JWT token
export const protect = async (req, res, next) => {
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

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get admin from token
    const admin = await Admin.findById(decoded.id);

    // Check if admin still exists
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Admin no longer exists",
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
