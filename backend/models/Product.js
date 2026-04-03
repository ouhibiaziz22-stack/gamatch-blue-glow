const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, min: 0, default: null },
    image: { type: String, required: true },
    category: { type: String, required: true, trim: true },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    description: { type: String, required: true },
    featured: { type: Boolean, default: false },
    stock: { type: Number, default: 100, min: 0 },
  },
  { timestamps: true }
);

productSchema.index({ category: 1 });
productSchema.index({ featured: 1 });
productSchema.index({ name: "text", description: "text" });

module.exports = mongoose.model("Product", productSchema);
