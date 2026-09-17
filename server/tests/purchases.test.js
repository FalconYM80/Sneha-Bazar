import { describe, it } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import {
  createPurchase,
  getPurchases,
  getPurchaseById,
  updatePurchase,
  deletePurchase,
} from "../controllers/purchaseController.js";
import Purchase from "../models/Purchase.js";
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

describe("Purchases Module (Supplier, Quantity, Selling Price & Inventory Separation)", () => {
  describe("1. Create Purchase Validation", () => {
    it("successfully creates a purchase record with product, supplier, quantity, purchaseAmount, sellingPrice, mrp", async () => {
      const origCreate = Purchase.create;
      let createdDoc = null;

      Purchase.create = async (doc) => {
        createdDoc = {
          _id: new mongoose.Types.ObjectId().toString(),
          ...doc,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        return createdDoc;
      };

      try {
        const req = {
          body: {
            itemName: "Tata Salt 1 kg",
            supplier: "ABC Distributors",
            quantityPurchased: 50,
            purchaseAmount: 50,
            sellingPrice: 55,
            mrp: 60,
            purchaseDate: "2026-09-17",
          },
        };
        const res = createMockRes();

        await createPurchase(req, res);

        assert.strictEqual(res.statusCode, 201);
        assert.strictEqual(res.body.success, true);
        assert.strictEqual(res.body.data.itemName, "Tata Salt 1 kg");
        assert.strictEqual(res.body.data.supplier, "ABC Distributors");
        assert.strictEqual(res.body.data.quantityPurchased, 50);
        assert.strictEqual(res.body.data.purchaseAmount, 50);
        assert.strictEqual(res.body.data.sellingPrice, 55);
        assert.strictEqual(res.body.data.mrp, 60);
      } finally {
        Purchase.create = origCreate;
      }
    });

    it("rejects creation when item name is missing or empty", async () => {
      const req = {
        body: {
          itemName: "   ",
          supplier: "ABC Distributors",
          quantityPurchased: 50,
          purchaseAmount: 50,
          sellingPrice: 55,
          mrp: 60,
        },
      };
      const res = createMockRes();

      await createPurchase(req, res);

      assert.strictEqual(res.statusCode, 400);
      assert.strictEqual(res.body.success, false);
      assert.match(res.body.message, /Item name is required/i);
    });

    it("rejects creation when supplier is missing or empty", async () => {
      const req = {
        body: {
          itemName: "Tata Salt 1 kg",
          supplier: "   ",
          quantityPurchased: 50,
          purchaseAmount: 50,
          sellingPrice: 55,
          mrp: 60,
        },
      };
      const res = createMockRes();

      await createPurchase(req, res);

      assert.strictEqual(res.statusCode, 400);
      assert.strictEqual(res.body.success, false);
      assert.match(res.body.message, /Supplier is required/i);
    });

    it("rejects creation when quantity is missing, zero, negative, or not an integer", async () => {
      const invalidQuantities = [undefined, null, "", 0, -5, -1, 5.5, "abc"];

      for (const invalidQty of invalidQuantities) {
        const req = {
          body: {
            itemName: "Tata Salt 1 kg",
            supplier: "ABC Distributors",
            quantityPurchased: invalidQty,
            purchaseAmount: 50,
            sellingPrice: 55,
            mrp: 60,
          },
        };
        const res = createMockRes();

        await createPurchase(req, res);

        assert.strictEqual(res.statusCode, 400);
        assert.strictEqual(res.body.success, false);
        assert.match(res.body.message, /Quantity purchased/i);
      }
    });

    it("rejects creation when sellingPrice is missing, non-numeric, or negative", async () => {
      const invalidSellingPrices = [undefined, null, "", -1, -10.5, "abc"];

      for (const invalidSP of invalidSellingPrices) {
        const req = {
          body: {
            itemName: "Tata Salt 1 kg",
            supplier: "ABC Distributors",
            quantityPurchased: 50,
            purchaseAmount: 50,
            sellingPrice: invalidSP,
            mrp: 60,
          },
        };
        const res = createMockRes();

        await createPurchase(req, res);

        assert.strictEqual(res.statusCode, 400);
        assert.strictEqual(res.body.success, false);
        assert.match(res.body.message, /Selling price/i);
      }
    });

    it("rejects creation when purchaseAmount or mrp is negative", async () => {
      const req = {
        body: {
          itemName: "Tata Salt 1 kg",
          supplier: "ABC Distributors",
          quantityPurchased: 50,
          purchaseAmount: -10,
          sellingPrice: 55,
          mrp: 60,
        },
      };
      const res = createMockRes();

      await createPurchase(req, res);

      assert.strictEqual(res.statusCode, 400);
      assert.strictEqual(res.body.success, false);
      assert.match(res.body.message, /cannot be negative/i);
    });
  });

  describe("2. Inventory & Product Price Isolation Confirmation", () => {
    it("confirm purchase creation does NOT modify product stock or product selling price", async () => {
      const initialStock = 20;
      const initialProductSellingPrice = 52;
      let productStock = initialStock;
      let productSellingPrice = initialProductSellingPrice;

      const origCreate = Purchase.create;
      const origProductFindById = Product.findById;
      const origProductUpdate = Product.findByIdAndUpdate;

      // Mock Product to track any unwanted mutations
      Product.findById = async () => ({
        _id: "prod1",
        name: "Tata Salt 1 kg",
        stockQuantity: productStock,
        sellingPrice: productSellingPrice,
      });
      Product.findByIdAndUpdate = async (_id, update) => {
        if (update.stockQuantity !== undefined) {
          productStock = update.stockQuantity;
        }
        if (update.sellingPrice !== undefined) {
          productSellingPrice = update.sellingPrice;
        }
        return { _id: "prod1", stockQuantity: productStock, sellingPrice: productSellingPrice };
      };

      Purchase.create = async (doc) => ({
        _id: new mongoose.Types.ObjectId().toString(),
        ...doc,
      });

      try {
        const req = {
          body: {
            itemName: "Tata Salt 1 kg",
            supplier: "ABC Distributors",
            quantityPurchased: 50,
            purchaseAmount: 50,
            sellingPrice: 55,
            mrp: 60,
          },
        };
        const res = createMockRes();

        await createPurchase(req, res);

        assert.strictEqual(res.statusCode, 201);
        // Product stock & product selling price MUST remain strictly unchanged
        assert.strictEqual(productStock, initialStock, "Product stock was modified by purchase creation!");
        assert.strictEqual(productSellingPrice, initialProductSellingPrice, "Product selling price was modified by purchase creation!");
      } finally {
        Purchase.create = origCreate;
        Product.findById = origProductFindById;
        Product.findByIdAndUpdate = origProductUpdate;
      }
    });

    it("confirm purchase update (e.g. sellingPrice ₹55 -> ₹57, qty 50 -> 60) does NOT modify product stock or product price", async () => {
      const testId = new mongoose.Types.ObjectId().toString();
      const initialStock = 20;
      const initialProductSellingPrice = 52;
      let productStock = initialStock;
      let productSellingPrice = initialProductSellingPrice;

      const origFindById = Purchase.findById;
      const origFindByIdAndUpdate = Purchase.findByIdAndUpdate;

      Purchase.findById = async (id) => {
        if (id === testId) {
          return {
            _id: testId,
            itemName: "Tata Salt 1 kg",
            supplier: "ABC Distributors",
            quantityPurchased: 50,
            purchaseAmount: 50,
            sellingPrice: 55,
            mrp: 60,
          };
        }
        return null;
      };

      Purchase.findByIdAndUpdate = async (id, update) => ({
        _id: id,
        itemName: "Tata Salt 1 kg",
        supplier: "ABC Distributors",
        quantityPurchased: update.quantityPurchased || 50,
        purchaseAmount: 50,
        sellingPrice: update.sellingPrice !== undefined ? update.sellingPrice : 55,
        mrp: 60,
      });

      try {
        const req = {
          params: { id: testId },
          body: {
            sellingPrice: 57,
            quantityPurchased: 60,
          },
        };
        const res = createMockRes();

        await updatePurchase(req, res);

        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.body.data.sellingPrice, 57);
        assert.strictEqual(res.body.data.quantityPurchased, 60);
        assert.strictEqual(productStock, initialStock, "Product stock was modified by purchase update!");
        assert.strictEqual(productSellingPrice, initialProductSellingPrice, "Product selling price was modified by purchase update!");
      } finally {
        Purchase.findById = origFindById;
        Purchase.findByIdAndUpdate = origFindByIdAndUpdate;
      }
    });

    it("confirm purchase delete does NOT modify product stock or product price", async () => {
      const testId = new mongoose.Types.ObjectId().toString();
      const initialStock = 20;
      let productStock = initialStock;

      const origFindById = Purchase.findById;
      const origFindByIdAndDelete = Purchase.findByIdAndDelete;

      Purchase.findById = async (id) => ({
        _id: id,
        itemName: "Tata Salt 1 kg",
        supplier: "ABC Distributors",
        quantityPurchased: 50,
        sellingPrice: 55,
      });

      Purchase.findByIdAndDelete = async (id) => ({ _id: id });

      try {
        const req = { params: { id: testId } };
        const res = createMockRes();

        await deletePurchase(req, res);

        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(productStock, initialStock, "Product stock was modified by purchase deletion!");
      } finally {
        Purchase.findById = origFindById;
        Purchase.findByIdAndDelete = origFindByIdAndDelete;
      }
    });
  });

  describe("3. Update Purchase Validation", () => {
    it("updates sellingPrice and supplier correctly", async () => {
      const testId = new mongoose.Types.ObjectId().toString();
      const origFindById = Purchase.findById;
      const origFindByIdAndUpdate = Purchase.findByIdAndUpdate;

      Purchase.findById = async (id) => ({
        _id: id,
        itemName: "Tata Salt 1 kg",
        supplier: "ABC Distributors",
        quantityPurchased: 50,
        purchaseAmount: 50,
        sellingPrice: 55,
        mrp: 60,
      });

      Purchase.findByIdAndUpdate = async (id, update) => ({
        _id: id,
        itemName: update.itemName || "Tata Salt 1 kg",
        supplier: update.supplier || "ABC Distributors",
        quantityPurchased: update.quantityPurchased || 50,
        purchaseAmount: update.purchaseAmount || 50,
        sellingPrice: update.sellingPrice !== undefined ? update.sellingPrice : 55,
        mrp: update.mrp || 60,
      });

      try {
        const req = {
          params: { id: testId },
          body: {
            supplier: "XYZ Traders",
            sellingPrice: 57,
          },
        };
        const res = createMockRes();

        await updatePurchase(req, res);

        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.body.data.supplier, "XYZ Traders");
        assert.strictEqual(res.body.data.sellingPrice, 57);
      } finally {
        Purchase.findById = origFindById;
        Purchase.findByIdAndUpdate = origFindByIdAndUpdate;
      }
    });

    it("rejects invalid sellingPrice update", async () => {
      const testId = new mongoose.Types.ObjectId().toString();
      const origFindById = Purchase.findById;

      Purchase.findById = async (id) => ({
        _id: id,
        itemName: "Tata Salt 1 kg",
      });

      try {
        const req = {
          params: { id: testId },
          body: {
            sellingPrice: -5,
          },
        };
        const res = createMockRes();

        await updatePurchase(req, res);

        assert.strictEqual(res.statusCode, 400);
        assert.match(res.body.message, /Selling price cannot be negative/i);
      } finally {
        Purchase.findById = origFindById;
      }
    });
  });

  describe("4. Search & Querying", () => {
    it("supports search querying by supplier or item name without errors", async () => {
      const origFind = Purchase.find;

      Purchase.find = () => {
        const queryObj = {
          orCondition: null,
          or(conditions) {
            this.orCondition = conditions;
            return this;
          },
          sort() {
            return [
              {
                _id: "1",
                itemName: "Tata Salt 1 kg",
                supplier: "ABC Distributors",
                quantityPurchased: 50,
                purchaseAmount: 50,
                sellingPrice: 55,
                mrp: 60,
              },
            ];
          },
        };
        return queryObj;
      };

      try {
        const req = {
          query: {
            search: "ABC Distributors",
          },
        };
        const res = createMockRes();

        await getPurchases(req, res);

        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.body.data.length, 1);
        assert.strictEqual(res.body.data[0].supplier, "ABC Distributors");
        assert.strictEqual(res.body.data[0].sellingPrice, 55);
      } finally {
        Purchase.find = origFind;
      }
    });
  });

  describe("5. Backward Compatibility for Existing Records", () => {
    it("handles legacy purchase records without supplier, quantityPurchased, or sellingPrice without throwing", async () => {
      const testId = new mongoose.Types.ObjectId().toString();
      const origFindById = Purchase.findById;

      // Old record missing supplier, quantityPurchased, and sellingPrice
      Purchase.findById = async (id) => ({
        _id: id,
        itemName: "Old Legacy Item",
        purchaseAmount: 100,
        mrp: 120,
        purchaseDate: new Date("2024-01-01"),
      });

      try {
        const req = { params: { id: testId } };
        const res = createMockRes();

        await getPurchaseById(req, res);

        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.body.data.itemName, "Old Legacy Item");
        assert.strictEqual(res.body.data.supplier, undefined);
        assert.strictEqual(res.body.data.quantityPurchased, undefined);
        assert.strictEqual(res.body.data.sellingPrice, undefined);
      } finally {
        Purchase.findById = origFindById;
      }
    });
  });
});
