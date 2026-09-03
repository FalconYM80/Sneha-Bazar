import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: [true, "Order number is required"],
      unique: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: [true, "Customer is required"],
    },
    customerName: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
    },
    customerPhone: {
      type: String,
      required: [true, "Customer phone is required"],
      trim: true,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: [true, "Product is required"],
        },
        productName: {
          type: String,
          required: [true, "Product name is required"],
        },
        quantity: {
          type: Number,
          required: [true, "Quantity is required"],
          min: [1, "Quantity must be at least 1"],
        },
        price: {
          type: Number,
          required: [true, "Price is required"],
          min: [0, "Price cannot be negative"],
        },
        subtotal: {
          type: Number,
          required: [true, "Subtotal is required"],
          min: [0, "Subtotal cannot be negative"],
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: [true, "Total amount is required"],
      min: [0, "Total amount cannot be negative"],
    },
    totalItemCount: {
      type: Number,
      required: [true, "Total item count is required"],
      min: [0, "Total item count cannot be negative"],
    },
    preparationMinutes: {
      type: Number,
      required: [true, "Preparation minutes is required"],
      min: [0, "Preparation minutes cannot be negative"],
    },
    estimatedPickupTime: {
      type: Date,
      required: [true, "Estimated pickup time is required"],
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "preparing", "ready", "completed", "cancelled"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model("Order", orderSchema);

export default Order;
