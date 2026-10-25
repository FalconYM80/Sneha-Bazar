import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import express from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import Notification from "../models/Notification.js";
import Order from "../models/Order.js";
import Admin from "../models/Admin.js";
import Customer from "../models/Customer.js";
import notificationRoutes from "../routes/notificationRoutes.js";
import {
  registerClient,
  createAndBroadcastOrderNotification,
  getActiveClientCount,
} from "../services/notificationService.js";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
} from "../controllers/notificationController.js";

const TEST_JWT_SECRET = "test_notification_jwt_secret_12345";
process.env.JWT_SECRET = TEST_JWT_SECRET;

// Helper to make real HTTP requests to test server
function makeHttpRequest(server, options, body = null) {
  return new Promise((resolve, reject) => {
    const address = server.address();
    const reqOptions = {
      host: "127.0.0.1",
      port: address.port,
      ...options,
    };

    const req = http.request(reqOptions, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          rawBody: data,
          body: json,
        });
      });
    });

    req.on("error", reject);

    if (body) {
      if (typeof body === "string") {
        req.write(body);
      } else {
        req.write(JSON.stringify(body));
      }
    }
    req.end();
  });
}

describe("Order Notification System Tests", () => {
  let app;
  let server;
  let adminUser;
  let customerUser;
  let adminToken;
  let customerToken;

  beforeEach(async () => {
    // Generate valid tokens with mock IDs
    const adminId = new mongoose.Types.ObjectId();
    const customerId = new mongoose.Types.ObjectId();

    adminUser = {
      _id: adminId,
      name: "Admin Tester",
      email: "admintest@snehabazar.in",
      role: "admin",
    };

    customerUser = {
      _id: customerId,
      name: "Customer Tester",
      phone: "+919876543210",
    };

    adminToken = jwt.sign(
      { id: adminId.toString(), role: "admin" },
      TEST_JWT_SECRET,
      { expiresIn: "1h" }
    );

    customerToken = jwt.sign(
      { id: customerId.toString(), type: "customer" },
      TEST_JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Mock Admin & Customer findById to avoid requiring live MongoDB in isolated unit tests
    Admin.findById = (id) => ({
      select: async () => {
        if (id && id.toString() === adminId.toString()) {
          return {
            _id: adminId,
            name: adminUser.name,
            email: adminUser.email,
            role: "admin",
          };
        }
        return null;
      },
    });

    Customer.findById = async (id) => {
      if (id && id.toString() === customerId.toString()) {
        return customerUser;
      }
      return null;
    };

    // Setup Express App
    app = express();
    app.use(express.json());
    app.use("/api/notifications", notificationRoutes);

    await new Promise((resolve) => {
      server = app.listen(0, "127.0.0.1", resolve);
    });
  });

  afterEach(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  describe("Security and Authentication Controls", () => {
    it("rejects unauthenticated requests to GET /api/notifications with 401", async () => {
      const res = await makeHttpRequest(server, {
        method: "GET",
        path: "/api/notifications",
      });

      assert.equal(res.statusCode, 401);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /not authorized/i);
    });

    it("rejects customer JWT token with 403 Forbidden on admin notification endpoints", async () => {
      const res = await makeHttpRequest(server, {
        method: "GET",
        path: "/api/notifications",
        headers: {
          Authorization: `Bearer ${customerToken}`,
        },
      });

      assert.equal(res.statusCode, 403);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /not authorized/i);
    });

    it("rejects unauthenticated requests to GET /api/notifications/unread-count with 401", async () => {
      const res = await makeHttpRequest(server, {
        method: "GET",
        path: "/api/notifications/unread-count",
      });

      assert.equal(res.statusCode, 401);
      assert.equal(res.body.success, false);
    });

    it("rejects unauthenticated requests to PATCH /api/notifications/:id/read with 401", async () => {
      const res = await makeHttpRequest(server, {
        method: "PATCH",
        path: "/api/notifications/660000000000000000000001/read",
      });

      assert.equal(res.statusCode, 401);
    });

    it("rejects unauthenticated requests to PATCH /api/notifications/mark-all-read with 401", async () => {
      const res = await makeHttpRequest(server, {
        method: "PATCH",
        path: "/api/notifications/mark-all-read",
      });

      assert.equal(res.statusCode, 401);
    });

    it("rejects unauthenticated requests to real-time SSE /api/notifications/stream with 401", async () => {
      const res = await makeHttpRequest(server, {
        method: "GET",
        path: "/api/notifications/stream",
      });

      assert.equal(res.statusCode, 401);
    });

    it("accepts authenticated admin requests via query param token for EventSource stream", (t, done) => {
      const address = server.address();
      const req = http.request(
        {
          host: "127.0.0.1",
          port: address.port,
          method: "GET",
          path: `/api/notifications/stream?token=${encodeURIComponent(adminToken)}`,
        },
        (res) => {
          assert.equal(res.statusCode, 200);
          assert.equal(res.headers["content-type"], "text/event-stream");
          assert.equal(res.headers["cache-control"], "no-cache, no-transform");

          let chunkCount = 0;
          res.on("data", (chunk) => {
            const text = chunk.toString();
            chunkCount++;
            if (text.includes('"type":"connected"')) {
              req.destroy();
              done();
            }
          });
        }
      );

      req.on("error", (err) => {
        // Destroying the socket might trigger ECONNRESET, which is expected during test cleanup
        if (err.code !== "ECONNRESET") {
          done(err);
        }
      });

      req.end();
    });
  });

  describe("Notification Deduplication and Model Logic", () => {
    it("handles createAndBroadcastOrderNotification with invalid order gracefully", async () => {
      const result = await createAndBroadcastOrderNotification(null);
      assert.equal(result, null);

      const result2 = await createAndBroadcastOrderNotification({});
      assert.equal(result2, null);
    });

    it("creates exactly one logical notification even if broadcast is called repeatedly", async () => {
      const testOrderId = new mongoose.Types.ObjectId();
      const mockOrder = {
        _id: testOrderId,
        orderNumber: "SB-9901",
        customerName: "Pooja Roy",
        totalAmount: 1450,
        totalItemCount: 3,
        createdAt: new Date(),
      };

      let findOneAndUpdateCalls = 0;
      const originalFindOneAndUpdate = Notification.findOneAndUpdate;

      Notification.findOneAndUpdate = async (query, update, options) => {
        findOneAndUpdateCalls++;
        assert.equal(query.order.toString(), testOrderId.toString());
        assert.equal(options.upsert, true);
        return {
          _id: new mongoose.Types.ObjectId(),
          order: testOrderId,
          orderNumber: mockOrder.orderNumber,
          customerName: mockOrder.customerName,
          totalAmount: mockOrder.totalAmount,
          totalItemCount: mockOrder.totalItemCount,
          isRead: false,
          createdAt: mockOrder.createdAt,
        };
      };

      try {
        const firstCall = await createAndBroadcastOrderNotification(mockOrder);
        const secondCall = await createAndBroadcastOrderNotification(mockOrder);

        assert.ok(firstCall);
        assert.ok(secondCall);
        assert.equal(firstCall.orderNumber, "SB-9901");
        assert.equal(secondCall.orderNumber, "SB-9901");
        assert.equal(findOneAndUpdateCalls, 2);
      } finally {
        Notification.findOneAndUpdate = originalFindOneAndUpdate;
      }
    });

    it("broadcasts new order event over SSE to connected admin clients", (t, done) => {
      const address = server.address();
      const testOrderId = new mongoose.Types.ObjectId();
      const mockOrder = {
        _id: testOrderId,
        orderNumber: "SB-7711",
        customerName: "Amit Sen",
        totalAmount: 890,
        totalItemCount: 2,
        createdAt: new Date(),
      };

      const originalFindOneAndUpdate = Notification.findOneAndUpdate;
      Notification.findOneAndUpdate = async () => ({
        _id: new mongoose.Types.ObjectId(),
        order: testOrderId,
        orderNumber: mockOrder.orderNumber,
        customerName: mockOrder.customerName,
        totalAmount: mockOrder.totalAmount,
        totalItemCount: mockOrder.totalItemCount,
        isRead: false,
        createdAt: mockOrder.createdAt,
      });

      const req = http.request(
        {
          host: "127.0.0.1",
          port: address.port,
          method: "GET",
          path: `/api/notifications/stream?token=${encodeURIComponent(adminToken)}`,
        },
        (res) => {
          let receivedNewOrder = false;

          res.on("data", (chunk) => {
            const text = chunk.toString();
            if (text.includes("event: new_order") && text.includes("SB-7711")) {
              receivedNewOrder = true;
              Notification.findOneAndUpdate = originalFindOneAndUpdate;
              req.destroy();
              done();
            }
          });

          // Wait a moment for registration, then emit notification
          setTimeout(async () => {
            await createAndBroadcastOrderNotification(mockOrder);
          }, 50);
        }
      );

      req.on("error", (err) => {
        if (err.code !== "ECONNRESET") {
          done(err);
        }
      });

      req.end();
    });
  });

  describe("Persistent Read State and Controller Endpoints", () => {
    it("markAsRead updates isRead to true persistently", async () => {
      const notifId = new mongoose.Types.ObjectId();
      let updatedWith = null;

      const originalFindByIdAndUpdate = Notification.findByIdAndUpdate;
      const originalCountDocuments = Notification.countDocuments;
      Notification.findByIdAndUpdate = async (id, update, options) => {
        updatedWith = { id, update, options };
        return {
          _id: notifId,
          isRead: true,
          orderNumber: "SB-1001",
        };
      };
      Notification.countDocuments = async () => 0;

      try {
        const res = await makeHttpRequest(server, {
          method: "PATCH",
          path: `/api/notifications/${notifId}/read`,
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        });

        assert.equal(res.statusCode, 200);
        assert.equal(res.body.success, true);
        assert.equal(res.body.data.isRead, true);
        assert.equal(updatedWith.update.isRead, true);
      } finally {
        Notification.findByIdAndUpdate = originalFindByIdAndUpdate;
        Notification.countDocuments = originalCountDocuments;
      }
    });

    it("markAllAsRead updates all unread notifications to read", async () => {
      let updateManyCalled = false;

      const originalUpdateMany = Notification.updateMany;
      Notification.updateMany = async (filter, update) => {
        updateManyCalled = true;
        assert.equal(filter.isRead, false);
        assert.equal(update.$set?.isRead ?? update.isRead, true);
        return { modifiedCount: 4 };
      };

      try {
        const res = await makeHttpRequest(server, {
          method: "PATCH",
          path: "/api/notifications/mark-all-read",
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        });

        assert.equal(res.statusCode, 200);
        assert.equal(res.body.success, true);
        assert.equal(res.body.data.modifiedCount, 4);
        assert.ok(updateManyCalled);
      } finally {
        Notification.updateMany = originalUpdateMany;
      }
    });

    it("getUnreadCount returns persistent unread count from MongoDB", async () => {
      const originalCountDocuments = Notification.countDocuments;
      Notification.countDocuments = async (query) => {
        assert.equal(query.isRead, false);
        return 7;
      };

      try {
        const res = await makeHttpRequest(server, {
          method: "GET",
          path: "/api/notifications/unread-count",
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        });

        assert.equal(res.statusCode, 200);
        assert.equal(res.body.success, true);
        assert.equal(res.body.unreadCount, 7);
      } finally {
        Notification.countDocuments = originalCountDocuments;
      }
    });
  });
});
