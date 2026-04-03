const mongoose = require("mongoose");

const abandonedCartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number, // Snapshot of price at time of abandonment
          required: true,
        },
      },
    ],
    cartValue: {
      type: Number,
      required: true, // Total value of abandoned cart
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    emailsSent: [
      {
        sentAt: {
          type: Date,
          default: Date.now,
        },
        type: {
          type: String,
          enum: ["first", "second", "final"], // Multiple reminder levels
          default: "first",
        },
      },
    ],
    recovered: {
      type: Boolean,
      default: false, // True if user completed the purchase
    },
    recoveredAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Index for finding non-recovered carts
abandonedCartSchema.index({ recovered: 1, createdAt: 1 });
abandonedCartSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("AbandonedCart", abandonedCartSchema);
