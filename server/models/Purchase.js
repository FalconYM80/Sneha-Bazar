import mongoose from "mongoose";

const purchaseSchema = new mongoose.Schema(
  {
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

const Purchase = mongoose.model("Purchase", purchaseSchema);

export default Purchase;
