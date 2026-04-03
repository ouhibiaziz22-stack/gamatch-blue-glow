const express = require("express");
const { body, validationResult } = require("express-validator");
const Product = require("../models/Product");
const { protect, admin } = require("../middleware/auth");

const router = express.Router();

// GET /api/products — list all (public)
router.get("/", async (req, res) => {
  try {
    const { category, featured, search, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (category && category !== "All") filter.category = category;
    if (featured === "true") filter.featured = true;
    if (search) {
      const escaped = String(search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "i");
      filter.$or = [{ name: regex }, { category: regex }, { description: regex }];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [products, total] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Product.countDocuments(filter),
    ]);

    res.json({ products, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/products/:id — single product (public)
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/products — create (admin)
router.post(
  "/",
  protect,
  admin,
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("price").isFloat({ min: 0 }).withMessage("Valid price is required"),
    body("image").trim().notEmpty().withMessage("Image URL is required"),
    body("category").trim().notEmpty().withMessage("Category is required"),
    body("description").trim().notEmpty().withMessage("Description is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const product = await Product.create(req.body);
      res.status(201).json(product);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  }
);

// PUT /api/products/:id — update (admin)
router.put(
  "/:id",
  protect,
  admin,
  [
    body("name").optional().trim().notEmpty(),
    body("price").optional().isFloat({ min: 0 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });
      if (!product) return res.status(404).json({ message: "Product not found" });
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  }
);

// DELETE /api/products/:id — delete (admin)
router.delete("/:id", protect, admin, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
