import { describe, it } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { getOrders } from "../controllers/orderController.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";

function createMockRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
  };
}

describe("Orders Historical Search & Pagination Module", () => {
  it("supports multi-field historical search by customer name, order number, and product name", async () => {
    const origFind = Order.find;
    const origCount = Order.countDocuments;
    const origProdFind = Product.find;

    Product.find = () => ({
      select: async () => [],
    });

    let queriedFilter = null;

    Order.countDocuments = async (filter) => {
      queriedFilter = filter;
      return 1;
    };

    Order.find = (filter) => {
      queriedFilter = filter;
      return {
        populate: () => ({
          populate: () => ({
            sort: () => ({
              skip: () => ({
                limit: async () => [
                  {
                    _id: new mongoose.Types.ObjectId().toString(),
                    orderNumber: "SB-3",
                    customerName: "Ajay K",
                    customerPhone: "9876543210",
                    items: [{ productName: "Ariel Matic 500G", quantity: 2, price: 120 }],
                    totalAmount: 240,
                    status: "completed",
                    createdAt: new Date("2026-09-24T08:30:00.000Z"),
                  },
                ],
              }),
            }),
          }),
        }),
      };
    };

    try {
      // Test search by customer name "Ajay"
      const reqAjay = { query: { search: "Ajay" } };
      const resAjay = createMockRes();
      await getOrders(reqAjay, resAjay);

      assert.strictEqual(resAjay.statusCode, 200);
      assert.strictEqual(resAjay.body.success, true);
      assert.strictEqual(resAjay.body.data.length, 1);
      assert.strictEqual(resAjay.body.data[0].customerName, "Ajay K");
      assert.strictEqual(resAjay.body.pagination.total, 1);

      // Verify filter contains $or with customerName, orderNumber, customerPhone, items.productName
      assert.ok(queriedFilter.$or, "Filter did not contain $or clause");
      const hasCustomerNameMatch = queriedFilter.$or.some((c) => c.customerName && c.customerName.toString().includes("Ajay"));
      assert.ok(hasCustomerNameMatch, "customerName regex search was missing");
    } finally {
      Order.find = origFind;
      Order.countDocuments = origCount;
      Product.find = origProdFind;
    }
  });

  it("supports date range filtering combined with status and pagination", async () => {
    const origFind = Order.find;
    const origCount = Order.countDocuments;
    const origProdFind = Product.find;

    Product.find = () => ({
      select: async () => [],
    });

    let queriedFilter = null;

    Order.countDocuments = async (filter) => {
      queriedFilter = filter;
      return 15;
    };

    Order.find = (filter) => {
      queriedFilter = filter;
      return {
        populate: () => ({
          populate: () => ({
            sort: () => ({
              skip: () => ({
                limit: async () => [
                  {
                    _id: new mongoose.Types.ObjectId().toString(),
                    orderNumber: "SB-8",
                    customerName: "Ajay K",
                    status: "completed",
                    createdAt: new Date("2026-09-20T10:00:00.000Z"),
                  },
                ],
              }),
            }),
          }),
        }),
      };
    };

    try {
      const req = {
        query: {
          search: "Ajay",
          status: "completed",
          startDate: "2026-09-18",
          endDate: "2026-09-24",
          page: "2",
          limit: "5",
        },
      };
      const res = createMockRes();
      await getOrders(req, res);

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.pagination.page, 2);
      assert.strictEqual(res.body.pagination.limit, 5);
      assert.strictEqual(res.body.pagination.total, 15);
      assert.strictEqual(res.body.pagination.totalPages, 3);
      assert.strictEqual(res.body.pagination.hasMore, true);

      // Verify combined filter fields
      assert.strictEqual(queriedFilter.status, "completed");
      assert.ok(queriedFilter.createdAt.$gte, "Start date filter missing");
      assert.ok(queriedFilter.createdAt.$lte, "End date filter missing");
      assert.ok(queriedFilter.$or, "Search $or missing");
    } finally {
      Order.find = origFind;
      Order.countDocuments = origCount;
      Product.find = origProdFind;
    }
  });
});
