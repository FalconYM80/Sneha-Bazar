import { describe, it, beforeEach, afterEach } from "node:test";
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
import {
  ensureAdminAccount,
  sanitizeEnvString,
  maskEmail,
  parseBooleanEnv,
  findAdminByEmail,
} from "../utils/provisionAdmin.js";
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

  describe("Admin Provisioning Utilities", () => {
    it("sanitizeEnvString removes whitespace and surrounding quotes", () => {
      assert.equal(sanitizeEnvString('  "admin@snehabazar.in"  '), "admin@snehabazar.in");
      assert.equal(sanitizeEnvString(" 'secretPassword123' "), "secretPassword123");
      assert.equal(sanitizeEnvString("plainValue"), "plainValue");
      assert.equal(sanitizeEnvString(null), "");
    });

    it("maskEmail securely masks usernames without leaking full address or secrets", () => {
      assert.equal(maskEmail("admin@snehabazar.in"), "ad***n@snehabazar.in");
      assert.equal(maskEmail("me@test.com"), "m*@test.com");
      assert.equal(maskEmail("invalid-email"), "[invalid email format]");
      assert.equal(maskEmail(null), "[unknown]");
    });

    it("parseBooleanEnv handles true, 1, yes, quotes, and case", () => {
      assert.equal(parseBooleanEnv("true"), true);
      assert.equal(parseBooleanEnv('"true"'), true);
      assert.equal(parseBooleanEnv("'TRUE'"), true);
      assert.equal(parseBooleanEnv("1"), true);
      assert.equal(parseBooleanEnv("yes"), true);
      assert.equal(parseBooleanEnv("false"), false);
      assert.equal(parseBooleanEnv("0"), false);
      assert.equal(parseBooleanEnv(undefined), false);
    });

    it("creates initial admin account when none exists and environment credentials provided", async () => {
      process.env.ADMIN_EMAIL = ' "newadmin@snehabazar.in" ';
      process.env.ADMIN_PASSWORD = ' "StrongPass123!" ';
      process.env.ADMIN_NAME = "Sneha Super Admin";
      process.env.ADMIN_FORCE_SYNC = "false";

      const origCount = Admin.countDocuments;
      const origFindOne = Admin.findOne;
      const origCreate = Admin.create;

      Admin.countDocuments = async () => 0;
      Admin.findOne = async () => null;

      let createdDoc = null;
      Admin.create = async (doc) => {
        createdDoc = doc;
        return doc;
      };

      await ensureAdminAccount();

      assert.ok(createdDoc, "Admin.create should have been called");
      assert.equal(createdDoc.email, "newadmin@snehabazar.in");
      assert.equal(createdDoc.password, "StrongPass123!");
      assert.equal(createdDoc.name, "Sneha Super Admin");

      Admin.countDocuments = origCount;
      Admin.findOne = origFindOne;
      Admin.create = origCreate;
    });

    it("preserves existing admin credentials when ADMIN_FORCE_SYNC is not enabled", async () => {
      process.env.ADMIN_EMAIL = "existing@snehabazar.in";
      process.env.ADMIN_PASSWORD = "NewPasswordShouldBeIgnored123";
      process.env.ADMIN_FORCE_SYNC = "false";

      const origCount = Admin.countDocuments;
      const origFindOne = Admin.findOne;

      let saveCalled = false;
      const mockAdmin = {
        name: "Existing Admin",
        email: "existing@snehabazar.in",
        password: "OldPasswordHash",
        save: async () => { saveCalled = true; },
      };

      Admin.countDocuments = async () => 1;
      Admin.findOne = async () => mockAdmin;

      await ensureAdminAccount();

      assert.equal(saveCalled, false, "Existing admin should NOT be modified when ADMIN_FORCE_SYNC is false");
      assert.equal(mockAdmin.password, "OldPasswordHash");

      Admin.countDocuments = origCount;
      Admin.findOne = origFindOne;
    });

    it("updates existing admin credentials when ADMIN_FORCE_SYNC is explicitly true", async () => {
      process.env.ADMIN_EMAIL = "existing@snehabazar.in";
      process.env.ADMIN_PASSWORD = "UpdatedNewPassword123";
      process.env.ADMIN_FORCE_SYNC = '"true"'; // quoted string from Render

      const origCount = Admin.countDocuments;
      const origFindOne = Admin.findOne;

      let saveCalled = false;
      const mockAdmin = {
        name: "Existing Admin",
        email: "existing@snehabazar.in",
        password: "OldPasswordHash",
        save: async () => { saveCalled = true; },
      };

      Admin.countDocuments = async () => 1;
      Admin.findOne = async () => mockAdmin;

      await ensureAdminAccount();

      assert.equal(saveCalled, true, "Existing admin save() should be called when ADMIN_FORCE_SYNC is true");
      assert.equal(mockAdmin.password, "UpdatedNewPassword123");

      Admin.countDocuments = origCount;
      Admin.findOne = origFindOne;
    });

    it("skips provisioning gracefully when ADMIN_EMAIL or ADMIN_PASSWORD is not configured", async () => {
      delete process.env.ADMIN_EMAIL;
      delete process.env.ADMIN_PASSWORD;

      let createCalled = false;
      const origCreate = Admin.create;
      Admin.create = async () => { createCalled = true; };

      await ensureAdminAccount();

      assert.equal(createCalled, false);
      Admin.create = origCreate;
    });
  });

  describe("Admin Model Password Hashing & Comparison", () => {
    it("hashes password with bcrypt on save", async () => {
      const admin = new Admin({
        name: "Test Admin",
        email: "test_hasher@snehabazar.in",
        password: "myPlainPassword123",
      });

      // Trigger pre-save hook
      const salt = await bcryptjs.genSalt(10);
      admin.password = await bcryptjs.hash(admin.password, salt);

      assert.notEqual(admin.password, "myPlainPassword123");
      assert.ok(admin.password.startsWith("$2"), "Password should be bcrypt hash");

      const match = await admin.comparePassword("myPlainPassword123");
      assert.equal(match, true);

      const wrongMatch = await admin.comparePassword("incorrectPassword");
      assert.equal(wrongMatch, false);
    });

    it("prevents double-hashing if password is already a bcrypt hash", async () => {
      const salt = await bcryptjs.genSalt(10);
      const existingHash = await bcryptjs.hash("alreadyHashedPass123", salt);

      const admin = new Admin({
        name: "Test Admin",
        email: "already_hashed@snehabazar.in",
        password: existingHash,
      });

      // Verify regex detector detects valid hash
      const isValidHash = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(admin.password);
      assert.equal(isValidHash, true);

      const match = await admin.comparePassword("alreadyHashedPass123");
      assert.equal(match, true);
    });
  });

  describe("Admin Login Controller with Email Normalization", () => {
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

    it("normalizes mixed-case and whitespace in login email (e.g. ' Admin@SnehaBazar.in ')", async () => {
      const origFindOne = Admin.findOne;

      const salt = await bcryptjs.genSalt(10);
      const hashedPassword = await bcryptjs.hash("secretPassword123", salt);

      let queryRan = null;
      Admin.findOne = (query) => {
        queryRan = query;
        return {
          select: async () => ({
            _id: adminId,
            name: "Sneha Admin",
            email: "admin@snehabazar.in",
            password: hashedPassword,
            comparePassword: async (pwd) => await bcryptjs.compare(pwd, hashedPassword),
          }),
        };
      };

      const req = {
        body: {
          email: "   Admin@SnehaBazar.in   ",
          password: "secretPassword123",
        },
      };
      const res = createMockRes();

      await loginAdmin(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.body.success, true);
      assert.ok(queryRan, "Query should have executed");
      // Check that $or includes normalized lowercased email
      assert.equal(queryRan.$or[0].email, "admin@snehabazar.in");

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

    it("rejects login when admin account does not exist in database", async () => {
      const origFindOne = Admin.findOne;
      const origCount = Admin.countDocuments;
      Admin.findOne = () => ({
        select: async () => null,
      });
      Admin.countDocuments = async () => 0;

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
      Admin.countDocuments = origCount;
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
