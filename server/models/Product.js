import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    itemCode: {
      type: String,
      trim: true,
      unique: true,
      sparse: true, // Allows multiple documents to have no value for this field
    },
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    company: {
      type: String,
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },
    sellingPrice: {
      type: Number,
      required: [true, "Selling price is required"],
      min: [0, "Selling price cannot be negative"],
    },
    mrp: {
      type: Number,
      min: [0, "MRP cannot be negative"],
    },
    stockQuantity: {
      type: Number,
      default: 0,
      min: [0, "Stock quantity cannot be negative"],
    },
    unit: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.model("Product", productSchema);

export default Product;
