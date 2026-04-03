const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true, // Review must be linked to a verified purchase
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    verified: {
      type: Boolean,
      default: true, // Verified purchase
    },
    helpful: {
      type: Number,
      default: 0, // Count of helpful votes
    },
    unhelpful: {
      type: Number,
      default: 0,
    },
    images: [
      {
        type: String, // URLs to review images from Cloudinary
      },
    ],
  },
  { timestamps: true }
);

// Index for performance
reviewSchema.index({ product: 1, rating: 1 });
reviewSchema.index({ user: 1, createdAt: -1 });
reviewSchema.index({ order: 1 });
reviewSchema.index({ helpful: -1, createdAt: -1 }); // For featured reviews

module.exports = mongoose.model("Review", reviewSchema);
