import mongoose from "mongoose";

const purchaseSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      trim: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
    barcode: {
      type: String,
      trim: true,
    },
    itemName: {
      type: String,
      required: [true, "Item name is required"],
      trim: true,
    },
    supplier: {
      type: String,
      trim: true,
    },
    quantityPurchased: {
      type: Number,
      min: [1, "Quantity purchased must be at least 1"],
      validate: {
        validator: function (v) {
          return v === undefined || v === null || (Number.isInteger(v) && v >= 1);
        },
        message: "Quantity purchased must be a positive integer (minimum 1)",
      },
    },
    purchaseAmount: {
      type: Number,
      required: [true, "Purchase amount is required"],
      min: [0, "Purchase amount cannot be negative"],
    },
    sellingPrice: {
      type: Number,
      min: [0, "Selling price cannot be negative"],
    },
    mrp: {
      type: Number,
      required: [true, "MRP is required"],
      min: [0, "MRP cannot be negative"],
    },
    purchaseDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast server-side filtering, search, and invoice grouping
purchaseSchema.index({ invoiceNumber: 1 });
purchaseSchema.index({ supplier: 1 });
purchaseSchema.index({ purchaseDate: -1 });
purchaseSchema.index({ product: 1 });
purchaseSchema.index({ barcode: 1 });
purchaseSchema.index({ itemName: 1 });

const Purchase = mongoose.model("Purchase", purchaseSchema);

export default Purchase;
