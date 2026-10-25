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
import { ensureAdminAccount } from "./utils/provisionAdmin.js";

dotenv.config();

const app = express();

// Trust reverse proxy (Render and other cloud hosts use a single reverse proxy hop)
app.set("trust proxy", 1);

// Connect to MongoDB and provision admin if env credentials provided
connectDB().then(() => {
  ensureAdminAccount();
});

// CORS configuration
const defaultAllowedOrigins = [
  "https://www.snehabazar.in",
  "https://snehabazar.in",
  "https://admin.snehabazar.in",
  "https://www.admin.snehabazar.in",
  "https://sneha-bazar.vercel.app",
  "https://sneha-bazar-admin.vercel.app",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "http://localhost:5175",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
];

const parseOrigins = (raw) => {
  if (!raw || typeof raw !== "string") return [];
  return raw
    .split(/[,;\s]+/)
    .map((item) => item.trim().replace(/^['"]|['"]$/g, "").replace(/\/+$/, ""))
    .filter(Boolean);
};

const normalizeOrigin = (url) => {
  if (!url || typeof url !== "string") return "";
  return url.trim().replace(/\/+$/, "").toLowerCase();
};

const envOrigins = [
  ...parseOrigins(process.env.CLIENT_URL),
  ...parseOrigins(process.env.ADMIN_URL),
  ...parseOrigins(process.env.ALLOWED_ORIGINS),
];

const normalizedAllowedOrigins = new Set([
  ...defaultAllowedOrigins.map(normalizeOrigin),
  ...envOrigins.map(normalizeOrigin),
]);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, server-to-server, health check)
    if (!origin) {
      return callback(null, true);
    }
    const normalized = normalizeOrigin(origin);
    if (normalizedAllowedOrigins.has(normalized)) {
      // Return exact origin to support credentials: true
      return callback(null, origin);
    }
    // Deny unauthorized origin cleanly without throwing 500 internal server error
    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
  optionsSuccessStatus: 200,
  maxAge: 86400,
};

app.use(cors(corsOptions));

// Body parser
app.use(express.json());

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
app.use("/api/customers", customerAuthRoutes);

// Cart routes
app.use("/api/cart", cartRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});