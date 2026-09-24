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

describe("Purchases & Connected Inventory Integration Module", () => {
  describe("1. Create Purchase & Stock Connection", () => {
    it("successfully creates a purchase record and increases product stock by quantityPurchased", async () => {
      let productStock = 35;
      const validProdId = new mongoose.Types.ObjectId().toString();
      const validPurId = new mongoose.Types.ObjectId().toString();

      const origCreate = Purchase.create;
      const origProductFindOne = Product.findOne;
      const origProductFindByIdAndUpdate = Product.findByIdAndUpdate;
      const origPurchaseFindById = Purchase.findById;

      Product.findOne = async () => ({
        _id: validProdId,
        name: "Ariel Matic 500G",
        stockQuantity: productStock,
        sellingPrice: 420,
        mrp: 500,
      });

      Product.findByIdAndUpdate = async (id, update) => {
        if (update.$inc && update.$inc.stockQuantity) {
          productStock += update.$inc.stockQuantity;
        }
        return { _id: id, stockQuantity: productStock };
      };

      Purchase.create = async (docs) => {
        const doc = docs[0];
        return [{
          _id: validPurId,
          ...doc,
        }];
      };

      Purchase.findById = () => ({
        populate: async () => ({
          _id: validPurId,
          itemName: "Ariel Matic 500G",
          supplier: "ABC Traders",
          quantityPurchased: 20,
          purchaseAmount: 420,
          sellingPrice: 420,
          mrp: 500,
        }),
      });

      try {
        const req = {
          body: {
            itemName: "Ariel Matic 500G",
            supplier: "ABC Traders",
            quantityPurchased: 20,
            purchaseAmount: 420,
            sellingPrice: 420,
            mrp: 500,
          },
        };
        const res = createMockRes();

        await createPurchase(req, res);

        assert.strictEqual(res.statusCode, 201);
        assert.strictEqual(res.body.success, true);
        assert.strictEqual(productStock, 55, "Product stock was not increased from 35 to 55!");
      } finally {
        Purchase.create = origCreate;
        Product.findOne = origProductFindOne;
        Product.findByIdAndUpdate = origProductFindByIdAndUpdate;
        Purchase.findById = origPurchaseFindById;
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

    it("successfully creates multi-item invoice and increases stock for all items", async () => {
      let productAStock = 10;
      let productBStock = 5;
      const prodAId = new mongoose.Types.ObjectId().toString();
      const prodBId = new mongoose.Types.ObjectId().toString();

      const origCreate = Purchase.create;
      const origProductFindById = Product.findById;
      const origProductFindByIdAndUpdate = Product.findByIdAndUpdate;
      const origPurchaseFind = Purchase.find;

      Product.findById = (id) => ({
        session: () => ({
          _id: id,
          name: id === prodAId ? "Ariel 500g" : "Surf 1kg",
          barcode: id === prodAId ? "89011" : "89022",
        }),
      });

      Product.findByIdAndUpdate = async (id, update) => {
        if (id === prodAId) productAStock += update.$inc.stockQuantity;
        if (id === prodBId) productBStock += update.$inc.stockQuantity;
        return { _id: id };
      };

      Purchase.create = async (docs) => {
        return docs.map((doc) => ({ _id: new mongoose.Types.ObjectId().toString(), ...doc }));
      };

      Purchase.find = () => ({
        populate: async () => [
          { invoiceNumber: "INV-4582", supplier: "ABC Traders", itemName: "Ariel 500g", quantityPurchased: 10 },
          { invoiceNumber: "INV-4582", supplier: "ABC Traders", itemName: "Surf 1kg", quantityPurchased: 5 },
        ],
      });

      try {
        const req = {
          body: {
            invoiceNumber: "INV-4582",
            distributor: "ABC Traders",
            purchaseDate: "2026-09-24",
            items: [
              { product: prodAId, itemName: "Ariel 500g", barcode: "89011", quantityPurchased: 10, purchaseAmount: 120, sellingPrice: 167, mrp: 209 },
              { product: prodBId, itemName: "Surf 1kg", barcode: "89022", quantityPurchased: 5, purchaseAmount: 390, sellingPrice: 450, mrp: 470 },
            ],
          },
        };
        const res = createMockRes();

        await createPurchase(req, res);

        assert.strictEqual(res.statusCode, 201);
        assert.strictEqual(res.body.success, true);
        assert.strictEqual(productAStock, 20, "Product A stock was not increased by 10");
        assert.strictEqual(productBStock, 10, "Product B stock was not increased by 5");
      } finally {
        Purchase.create = origCreate;
        Product.findById = origProductFindById;
        Product.findByIdAndUpdate = origProductFindByIdAndUpdate;
        Purchase.find = origPurchaseFind;
      }
    });
  });

  describe("2. Edit Purchase Stock Difference Calculations", () => {
    it("adjusts stock by difference when quantity increases: 55 stock, 20 -> 30 qty => final stock 65", async () => {
      let productStock = 55;
      const testPurId = new mongoose.Types.ObjectId().toString();
      const testProdId = new mongoose.Types.ObjectId().toString();

      const origPurchaseFindById = Purchase.findById;
      const origPurchaseFindByIdAndUpdate = Purchase.findByIdAndUpdate;
      const origProductFindById = Product.findById;
      const origProductFindByIdAndUpdate = Product.findByIdAndUpdate;

      Purchase.findById = (id) => {
        if (id === testPurId) {
          const doc = {
            _id: testPurId,
            product: testProdId,
            itemName: "Ariel Matic 500G",
            supplier: "ABC Traders",
            quantityPurchased: 20,
            purchaseAmount: 420,
            sellingPrice: 420,
            mrp: 500,
          };
          doc.populate = async () => doc;
          return doc;
        }
        return null;
      };

      Product.findById = async (id) => ({
        _id: id,
        name: "Ariel Matic 500G",
        stockQuantity: productStock,
      });

      Product.findByIdAndUpdate = async (id, update) => {
        if (update.$inc && update.$inc.stockQuantity) {
          productStock += update.$inc.stockQuantity;
        }
        return { _id: id, stockQuantity: productStock };
      };

      Purchase.findByIdAndUpdate = async (id, update) => ({
        _id: id,
        ...update,
      });

      try {
        const req = {
          params: { id: testPurId },
          body: {
            quantityPurchased: 30,
          },
        };
        const res = createMockRes();

        await updatePurchase(req, res);

        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(productStock, 65, "Expected stock to be 65 (55 + 10 difference), got " + productStock);
      } finally {
        Purchase.findById = origPurchaseFindById;
        Purchase.findByIdAndUpdate = origPurchaseFindByIdAndUpdate;
        Product.findById = origProductFindById;
        Product.findByIdAndUpdate = origProductFindByIdAndUpdate;
      }
    });

    it("adjusts stock by difference when quantity decreases: 55 stock, 20 -> 15 qty => final stock 50", async () => {
      let productStock = 55;
      const testPurId = new mongoose.Types.ObjectId().toString();
      const testProdId = new mongoose.Types.ObjectId().toString();

      const origPurchaseFindById = Purchase.findById;
      const origPurchaseFindByIdAndUpdate = Purchase.findByIdAndUpdate;
      const origProductFindById = Product.findById;
      const origProductFindByIdAndUpdate = Product.findByIdAndUpdate;

      Purchase.findById = (id) => {
        if (id === testPurId) {
          const doc = {
            _id: testPurId,
            product: testProdId,
            itemName: "Ariel Matic 500G",
            supplier: "ABC Traders",
            quantityPurchased: 20,
            purchaseAmount: 420,
            sellingPrice: 420,
            mrp: 500,
          };
          doc.populate = async () => doc;
          return doc;
        }
        return null;
      };

      Product.findById = async (id) => ({
        _id: id,
        name: "Ariel Matic 500G",
        stockQuantity: productStock,
      });

      Product.findByIdAndUpdate = async (id, update) => {
        if (update.$inc && update.$inc.stockQuantity) {
          productStock += update.$inc.stockQuantity;
        }
        return { _id: id, stockQuantity: productStock };
      };

      Purchase.findByIdAndUpdate = async (id, update) => ({
        _id: id,
        ...update,
      });

      try {
        const req = {
          params: { id: testPurId },
          body: {
            quantityPurchased: 15,
          },
        };
        const res = createMockRes();

        await updatePurchase(req, res);

        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(productStock, 50, "Expected stock to be 50 (55 - 5 difference), got " + productStock);
      } finally {
        Purchase.findById = origPurchaseFindById;
        Purchase.findByIdAndUpdate = origPurchaseFindByIdAndUpdate;
        Product.findById = origProductFindById;
        Product.findByIdAndUpdate = origProductFindByIdAndUpdate;
      }
    });

    it("correctly handles product reassignment: Product A stock -= 20, Product B stock += 20", async () => {
      let productAStock = 50;
      let productBStock = 10;
      const testPurId = new mongoose.Types.ObjectId().toString();
      const prodAId = new mongoose.Types.ObjectId().toString();
      const prodBId = new mongoose.Types.ObjectId().toString();

      const origPurchaseFindById = Purchase.findById;
      const origPurchaseFindByIdAndUpdate = Purchase.findByIdAndUpdate;
      const origProductFindById = Product.findById;
      const origProductFindByIdAndUpdate = Product.findByIdAndUpdate;

      Purchase.findById = (id) => {
        if (id === testPurId) {
          const doc = {
            _id: testPurId,
            product: prodAId,
            itemName: "Product A",
            supplier: "ABC Traders",
            quantityPurchased: 20,
            purchaseAmount: 200,
            sellingPrice: 15,
            mrp: 20,
          };
          doc.populate = async () => doc;
          return doc;
        }
        return null;
      };

      Product.findById = async (id) => {
        if (id === prodAId) return { _id: prodAId, name: "Product A", stockQuantity: productAStock };
        if (id === prodBId) return { _id: prodBId, name: "Product B", stockQuantity: productBStock };
        return null;
      };

      Product.findByIdAndUpdate = async (id, update) => {
        if (id === prodAId && update.$inc && update.$inc.stockQuantity) {
          productAStock += update.$inc.stockQuantity;
        }
        if (id === prodBId && update.$inc && update.$inc.stockQuantity) {
          productBStock += update.$inc.stockQuantity;
        }
        return { _id: id };
      };

      Purchase.findByIdAndUpdate = async (id, update) => ({
        _id: id,
        ...update,
      });

      try {
        const req = {
          params: { id: testPurId },
          body: {
            product: prodBId,
            itemName: "Product B",
            quantityPurchased: 20,
          },
        };
        const res = createMockRes();

        await updatePurchase(req, res);

        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(productAStock, 30, "Product A stock was not decreased by 20!");
        assert.strictEqual(productBStock, 30, "Product B stock was not increased by 20!");
      } finally {
        Purchase.findById = origPurchaseFindById;
        Purchase.findByIdAndUpdate = origPurchaseFindByIdAndUpdate;
        Product.findById = origProductFindById;
        Product.findByIdAndUpdate = origProductFindByIdAndUpdate;
      }
    });
  });

  describe("3. Delete Purchase & Negative Stock Protection", () => {
    it("reverses purchase quantity from product stock upon deletion", async () => {
      let productStock = 50;
      const testPurId = new mongoose.Types.ObjectId().toString();
      const prodId = new mongoose.Types.ObjectId().toString();

      const origPurchaseFindById = Purchase.findById;
      const origPurchaseFindByIdAndDelete = Purchase.findByIdAndDelete;
      const origProductFindById = Product.findById;
      const origProductFindByIdAndUpdate = Product.findByIdAndUpdate;

      Purchase.findById = async () => ({
        _id: testPurId,
        product: prodId,
        itemName: "Ariel 500g",
        quantityPurchased: 20,
      });

      Product.findById = async () => ({
        _id: prodId,
        name: "Ariel 500g",
        stockQuantity: productStock,
      });

      Product.findByIdAndUpdate = async (id, update) => {
        if (update.$inc && update.$inc.stockQuantity) {
          productStock += update.$inc.stockQuantity;
        }
        return { _id: id, stockQuantity: productStock };
      };

      Purchase.findByIdAndDelete = async (id) => ({ _id: id });

      try {
        const req = { params: { id: testPurId } };
        const res = createMockRes();

        await deletePurchase(req, res);

        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(productStock, 30, "Product stock was not reduced by 20 upon deletion!");
      } finally {
        Purchase.findById = origPurchaseFindById;
        Purchase.findByIdAndDelete = origPurchaseFindByIdAndDelete;
        Product.findById = origProductFindById;
        Product.findByIdAndUpdate = origProductFindByIdAndUpdate;
      }
    });

    it("rejects deletion when product stock is less than purchase quantity to prevent negative stock", async () => {
      const productStock = 5;
      const testPurId = new mongoose.Types.ObjectId().toString();
      const prodId = new mongoose.Types.ObjectId().toString();

      const origPurchaseFindById = Purchase.findById;
      const origProductFindById = Product.findById;

      Purchase.findById = async () => ({
        _id: testPurId,
        product: prodId,
        itemName: "Ariel 500g",
        quantityPurchased: 20,
      });

      Product.findById = async () => ({
        _id: prodId,
        name: "Ariel 500g",
        stockQuantity: productStock,
      });

      try {
        const req = { params: { id: testPurId } };
        const res = createMockRes();

        await deletePurchase(req, res);

        assert.strictEqual(res.statusCode, 400);
        assert.strictEqual(res.body.success, false);
        assert.match(res.body.message, /Cannot delete purchase/i);
      } finally {
        Purchase.findById = origPurchaseFindById;
        Product.findById = origProductFindById;
      }
    });
  });
});
