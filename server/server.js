import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import purchaseRoutes from "./routes/purchaseRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import customerAuthRoutes from "./routes/customerAuthRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";

dotenv.config();

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
    ],
  })
);

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Sneha Bazar API is running",
  });
});

// Category routes
app.use("/api/categories", categoryRoutes);

// Product routes
app.use("/api/products", productRoutes);

// Purchase routes
app.use("/api/purchases", purchaseRoutes);

// Order routes
app.use("/api/orders", orderRoutes);

// Auth routes
app.use("/api/auth", authRoutes);

// Customer auth routes
app.use("/api/customer-auth", customerAuthRoutes);

// Cart routes
app.use("/api/cart", cartRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});