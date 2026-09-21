import { describe, it } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import {
  createProduct,
  updateProduct,
  getProductByBarcode,
} from "../controllers/productController.js";
import Product from "../models/Product.js";
import Category from "../models/Category.js";

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

describe("Product Barcode Module", () => {
  describe("1. Barcode Formatting & Normalization", () => {
    it("preserves barcode leading zeroes as a String", async () => {
      const origCategoryFindOne = Category.findOne;
      const origProductFindOne = Product.findOne;
      const origProductCreate = Product.create;
      const origProductFindById = Product.findById;

      Category.findOne = async () => ({ _id: "cat1", isActive: true });
      Product.findOne = async () => null;

      let savedBarcode = null;
      Product.create = async (doc) => {
        savedBarcode = doc.barcode;
        return {
          _id: "prod1",
          ...doc,
        };
      };

      Product.findById = () => ({
        populate: async () => ({
          _id: "prod1",
          name: "Item with Leading Zero Barcode",
          barcode: savedBarcode,
        }),
      });

      try {
        const req = {
          body: {
            name: "Item with Leading Zero Barcode",
            category: "cat1",
            sellingPrice: 100,
            barcode: "08901234567890",
          },
        };
        const res = createMockRes();

        await createProduct(req, res);

        assert.strictEqual(res.statusCode, 201);
        assert.strictEqual(typeof savedBarcode, "string", "Barcode was converted from String!");
        assert.strictEqual(savedBarcode, "08901234567890", "Leading zero was stripped from barcode!");
      } finally {
        Category.findOne = origCategoryFindOne;
        Product.findOne = origProductFindOne;
        Product.create = origProductCreate;
        Product.findById = origProductFindById;
      }
    });
  });

  describe("2. Barcode Lookup", () => {
    it("returns 200 and product when barcode is found", async () => {
      const origProductFindOne = Product.findOne;

      Product.findOne = () => ({
        populate: async () => ({
          _id: "prod_barcode_1",
          name: "Ariel Matic 500G",
          barcode: "8901234567890",
          sellingPrice: 420,
          mrp: 500,
        }),
      });

      try {
        const req = {
          params: { barcode: "8901234567890" },
        };
        const res = createMockRes();

        await getProductByBarcode(req, res);

        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.body.success, true);
        assert.strictEqual(res.body.data.name, "Ariel Matic 500G");
        assert.strictEqual(res.body.data.barcode, "8901234567890");
      } finally {
        Product.findOne = origProductFindOne;
      }
    });

    it("returns 404 when barcode is not found", async () => {
      const origProductFindOne = Product.findOne;

      Product.findOne = () => ({
        populate: async () => null,
      });

      try {
        const req = {
          params: { barcode: "9999999999999" },
        };
        const res = createMockRes();

        await getProductByBarcode(req, res);

        assert.strictEqual(res.statusCode, 404);
        assert.strictEqual(res.body.success, false);
        assert.match(res.body.message, /Product not found for this barcode/i);
      } finally {
        Product.findOne = origProductFindOne;
      }
    });
  });

  describe("3. Duplicate Barcode Rejection", () => {
    it("rejects assigning an existing barcode to another product with clear product name error message", async () => {
      const origProductFindById = Product.findById;
      const origProductFindOne = Product.findOne;

      Product.findById = async () => ({
        _id: "prod_2",
        name: "Surf Excel 1KG",
        barcode: null,
      });

      Product.findOne = async (query) => {
        if (query.barcode === "8901234567890") {
          return {
            _id: "prod_1",
            name: "Ariel Matic 500G",
            barcode: "8901234567890",
          };
        }
        return null;
      };

      try {
        const req = {
          params: { id: "prod_2" },
          body: {
            barcode: "8901234567890",
          },
        };
        const res = createMockRes();

        await updateProduct(req, res);

        assert.strictEqual(res.statusCode, 400);
        assert.strictEqual(res.body.success, false);
        assert.match(res.body.message, /Barcode 8901234567890 is already assigned to Ariel Matic 500G/i);
      } finally {
        Product.findById = origProductFindById;
        Product.findOne = origProductFindOne;
      }
    });
  });
});
