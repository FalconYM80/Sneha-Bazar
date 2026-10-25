import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import express from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcryptjs from "bcryptjs";
import {
  loginAdmin,
  logoutAdmin,
  getAdminProfile,
} from "../controllers/authController.js";
import { protect, protectOrderAccess } from "../middleware/authMiddleware.js";
import { adminLoginLimiter } from "../middleware/rateLimiter.js";
import Admin from "../models/Admin.js";
import Customer from "../models/Customer.js";
import authRoutes from "../routes/authRoutes.js";
import purchaseRoutes from "../routes/purchaseRoutes.js";
import productRoutes from "../routes/productRoutes.js";
import categoryRoutes from "../routes/categoryRoutes.js";
import orderRoutes from "../routes/orderRoutes.js";

// Mock Response Helper
function createMockRes() {
  return {
    statusCode: 200,
    body: null,
    cookies: {},
    clearedCookies: [],
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
    cookie(name, val, opts) {
      this.cookies[name] = { val, opts };
      return this;
    },
    clearCookie(name, opts) {
      this.clearedCookies.push({ name, opts });
      return this;
    },
  };
}

// Helper to make real HTTP requests to test server
function makeHttpRequest(server, options, body = null) {
  return new Promise((resolve, reject) => {
    const address = server.address();
    const reqOptions = {
      host: "127.0.0.1",
      port: address.port,
      path: options.path,
      method: options.method,
      headers: options.headers || {},
    };

    const req = http.request(reqOptions, (res) => {
      let rawData = "";
      res.on("data", (chunk) => {
        rawData += chunk;
      });
      res.on("end", () => {
        let json = null;
        try {
          json = JSON.parse(rawData);
        } catch {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: json,
          raw: rawData,
        });
      });
    });

    req.on("error", reject);

    if (body) {
      req.write(typeof body === "string" ? body : JSON.stringify(body));
    }
    req.end();
  });
}

describe("Admin Authentication & Security Middleware Tests", () => {
  const jwtSecret = "test_admin_jwt_secret_super_secure_key_123";
  const customerSecret = "test_customer_jwt_secret_customer_key_456";
  const adminId = new mongoose.Types.ObjectId().toString();
  const customerId = new mongoose.Types.ObjectId().toString();

  beforeEach(() => {
    process.env.JWT_SECRET = jwtSecret;
    process.env.CUSTOMER_JWT_SECRET = customerSecret;
  });

  describe("Admin Login Controller", () => {
    it("successfully logs in with valid email and password", async () => {
      const origFindOne = Admin.findOne;

      const salt = await bcryptjs.genSalt(10);
      const hashedPassword = await bcryptjs.hash("secretPassword123", salt);

      Admin.findOne = () => ({
        select: async () => ({
          _id: adminId,
          name: "Sneha Admin",
          email: "admin@snehabazar.in",
          password: hashedPassword,
          comparePassword: async (pwd) => await bcryptjs.compare(pwd, hashedPassword),
        }),
      });

      const req = {
        body: {
          email: "admin@snehabazar.in",
          password: "secretPassword123",
        },
      };
      const res = createMockRes();

      await loginAdmin(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.message, "Login successful");
      assert.equal(res.body.data.admin.email, "admin@snehabazar.in");
      assert.ok(res.body.data.token, "JWT token should be returned");

      // Verify token decoded
      const decoded = jwt.verify(res.body.data.token, jwtSecret);
      assert.equal(decoded.id, adminId);
      assert.equal(decoded.role, "admin");

      Admin.findOne = origFindOne;
    });

    it("rejects login with invalid password", async () => {
      const origFindOne = Admin.findOne;

      const salt = await bcryptjs.genSalt(10);
      const hashedPassword = await bcryptjs.hash("correctPassword", salt);

      Admin.findOne = () => ({
        select: async () => ({
          _id: adminId,
          name: "Sneha Admin",
          email: "admin@snehabazar.in",
          password: hashedPassword,
          comparePassword: async (pwd) => await bcryptjs.compare(pwd, hashedPassword),
        }),
      });

      const req = {
        body: {
          email: "admin@snehabazar.in",
          password: "wrongPassword",
        },
      };
      const res = createMockRes();

      await loginAdmin(req, res);

      assert.equal(res.statusCode, 401);
      assert.equal(res.body.success, false);
      assert.equal(res.body.message, "Invalid email or password");

      Admin.findOne = origFindOne;
    });

    it("rejects login when admin account does not exist", async () => {
      const origFindOne = Admin.findOne;
      Admin.findOne = () => ({
        select: async () => null,
      });

      const req = {
        body: {
          email: "unknown@snehabazar.in",
          password: "password123",
        },
      };
      const res = createMockRes();

      await loginAdmin(req, res);

      assert.equal(res.statusCode, 401);
      assert.equal(res.body.success, false);
      assert.equal(res.body.message, "Invalid email or password");

      Admin.findOne = origFindOne;
    });

    it("rejects login when required fields are missing", async () => {
      const req = { body: { email: "", password: "" } };
      const res = createMockRes();

      await loginAdmin(req, res);

      assert.equal(res.statusCode, 400);
      assert.equal(res.body.success, false);
    });
  });

  describe("Admin Logout Controller", () => {
    it("successfully logs out and clears adminToken cookie", async () => {
      const req = {};
      const res = createMockRes();

      await logoutAdmin(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.clearedCookies.length, 1);
      assert.equal(res.clearedCookies[0].name, "adminToken");
    });
  });

  describe("Admin Route Protection Middleware (protect)", () => {
    it("allows request when valid admin token is provided", async () => {
      const origFindById = Admin.findById;
      Admin.findById = () => ({
        select: async () => ({
          _id: adminId,
          name: "Sneha Admin",
          email: "admin@snehabazar.in",
        }),
      });

      const token = jwt.sign({ id: adminId, role: "admin" }, jwtSecret, { expiresIn: "1h" });
      const req = {
        headers: {
          authorization: `Bearer ${token}`,
        },
      };
      const res = createMockRes();
      let nextCalled = false;
      const next = () => { nextCalled = true; };

      await protect(req, res, next);

      assert.equal(nextCalled, true);
      assert.ok(req.admin);
      assert.equal(req.admin.email, "admin@snehabazar.in");

      Admin.findById = origFindById;
    });

    it("rejects request when no token is provided", async () => {
      const req = { headers: {} };
      const res = createMockRes();
      let nextCalled = false;
      const next = () => { nextCalled = true; };

      await protect(req, res, next);

      assert.equal(nextCalled, false);
      assert.equal(res.statusCode, 401);
      assert.equal(res.body.message, "Not authorized, no token provided");
    });

    it("rejects request when customer token is sent to admin route", async () => {
      const customerToken = jwt.sign({ id: customerId, type: "customer" }, jwtSecret, { expiresIn: "1h" });

      const req = {
        headers: {
          authorization: `Bearer ${customerToken}`,
        },
      };
      const res = createMockRes();
      let nextCalled = false;
      const next = () => { nextCalled = true; };

      await protect(req, res, next);

      assert.equal(nextCalled, false);
      assert.equal(res.statusCode, 403);
      assert.equal(res.body.message, "Customer accounts are not authorized to access admin resources");
    });

    it("rejects request when admin user no longer exists in DB", async () => {
      const origFindById = Admin.findById;
      Admin.findById = () => ({
        select: async () => null,
      });

      const token = jwt.sign({ id: adminId, role: "admin" }, jwtSecret, { expiresIn: "1h" });
      const req = {
        headers: {
          authorization: `Bearer ${token}`,
        },
      };
      const res = createMockRes();
      let nextCalled = false;
      const next = () => { nextCalled = true; };

      await protect(req, res, next);

      assert.equal(nextCalled, false);
      assert.equal(res.statusCode, 401);
      assert.equal(res.body.message, "Admin account not found or deactivated");

      Admin.findById = origFindById;
    });

    it("rejects expired admin token", async () => {
      const expiredToken = jwt.sign({ id: adminId, role: "admin" }, jwtSecret, { expiresIn: "-1s" });
      const req = {
        headers: {
          authorization: `Bearer ${expiredToken}`,
        },
      };
      const res = createMockRes();
      let nextCalled = false;
      const next = () => { nextCalled = true; };

      await protect(req, res, next);

      assert.equal(nextCalled, false);
      assert.equal(res.statusCode, 401);
      assert.equal(res.body.message, "Token expired");
    });
  });

  describe("Single Order Access Middleware (protectOrderAccess)", () => {
    it("allows admin to access single order endpoint", async () => {
      const origFindById = Admin.findById;
      Admin.findById = () => ({
        select: async () => ({
          _id: adminId,
          name: "Sneha Admin",
        }),
      });

      const token = jwt.sign({ id: adminId, role: "admin" }, jwtSecret, { expiresIn: "1h" });
      const req = {
        headers: { authorization: `Bearer ${token}` },
      };
      const res = createMockRes();
      let nextCalled = false;
      const next = () => { nextCalled = true; };

      await protectOrderAccess(req, res, next);

      assert.equal(nextCalled, true);
      assert.ok(req.admin);

      Admin.findById = origFindById;
    });

    it("allows customer to access their own order endpoint", async () => {
      const origCustomerFindById = Customer.findById;
      Customer.findById = async () => ({
        _id: customerId,
        phone: "+919876543210",
        isActive: true,
      });

      const token = jwt.sign({ id: customerId, type: "customer" }, customerSecret, { expiresIn: "1h" });
      const req = {
        headers: { authorization: `Bearer ${token}` },
      };
      const res = createMockRes();
      let nextCalled = false;
      const next = () => { nextCalled = true; };

      await protectOrderAccess(req, res, next);

      assert.equal(nextCalled, true);
      assert.ok(req.customer);

      Customer.findById = origCustomerFindById;
    });

    it("rejects unauthenticated request to order endpoint", async () => {
      const req = { headers: {} };
      const res = createMockRes();
      let nextCalled = false;
      const next = () => { nextCalled = true; };

      await protectOrderAccess(req, res, next);

      assert.equal(nextCalled, false);
      assert.equal(res.statusCode, 401);
    });
  });

  describe("HTTP Router Protection Integration Suite", () => {
    let server;
    let app;

    beforeEach(async () => {
      app = express();
      app.use(express.json());

      // Mount actual application routers
      app.use("/api/auth", authRoutes);
      app.use("/api/purchases", purchaseRoutes);
      app.use("/api/orders", orderRoutes);
      app.use("/api/products", productRoutes);
      app.use("/api/categories", categoryRoutes);

      await new Promise((resolve) => {
        server = app.listen(0, resolve);
      });
    });

    it("rejects direct unauthenticated GET /api/orders with 401", async () => {
      const res = await makeHttpRequest(server, {
        path: "/api/orders",
        method: "GET",
      });
      assert.equal(res.statusCode, 401);
      assert.equal(res.data.success, false);
      assert.equal(res.data.message, "Not authorized, no token provided");
      server.close();
    });

    it("rejects direct unauthenticated POST /api/purchases with 401", async () => {
      const res = await makeHttpRequest(server, {
        path: "/api/purchases",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }, { supplier: "Test", items: [] });
      assert.equal(res.statusCode, 401);
      assert.equal(res.data.success, false);
      server.close();
    });

    it("rejects direct unauthenticated GET /api/purchases with 401", async () => {
      const res = await makeHttpRequest(server, {
        path: "/api/purchases",
        method: "GET",
      });
      assert.equal(res.statusCode, 401);
      assert.equal(res.data.success, false);
      server.close();
    });

    it("rejects direct unauthenticated GET /api/products/low-stock with 401", async () => {
      const res = await makeHttpRequest(server, {
        path: "/api/products/low-stock",
        method: "GET",
      });
      assert.equal(res.statusCode, 401);
      assert.equal(res.data.success, false);
      server.close();
    });

    it("rejects direct unauthenticated POST /api/categories with 401", async () => {
      const res = await makeHttpRequest(server, {
        path: "/api/categories",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }, { name: "Test Category" });
      assert.equal(res.statusCode, 401);
      assert.equal(res.data.success, false);
      server.close();
    });

    it("rejects customer token on GET /api/orders with 403 Forbidden", async () => {
      const customerToken = jwt.sign({ id: customerId, type: "customer" }, jwtSecret, { expiresIn: "1h" });
      const res = await makeHttpRequest(server, {
        path: "/api/orders",
        method: "GET",
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      assert.equal(res.statusCode, 403);
      assert.equal(res.data.message, "Customer accounts are not authorized to access admin resources");
      server.close();
    });

    it("rejects customer token on GET /api/purchases with 403 Forbidden", async () => {
      const customerToken = jwt.sign({ id: customerId, type: "customer" }, jwtSecret, { expiresIn: "1h" });
      const res = await makeHttpRequest(server, {
        path: "/api/purchases",
        method: "GET",
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      assert.equal(res.statusCode, 403);
      assert.equal(res.data.message, "Customer accounts are not authorized to access admin resources");
      server.close();
    });
  });
});
