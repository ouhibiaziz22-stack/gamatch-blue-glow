const express = require("express");
const Cart = require("../models/Cart");
const AbandonedCart = require("../models/AbandonedCart");
const Product = require("../models/Product");
const { protect } = require("../middleware/auth");

const router = express.Router();

// All cart routes require authentication
router.use(protect);

// GET /api/cart — get current user's cart
router.get("/", async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate("items.product");
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/cart — add item to cart
router.post("/", async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    if (product.stock < quantity) {
      return res.status(400).json({
        message: `Only ${product.stock} items available`,
      });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    const existingItem = cart.items.find((item) => item.product.toString() === productId);
    if (existingItem) {
      existingItem.quantity += Number(quantity);
      // Validate final quantity doesn't exceed stock
      if (existingItem.quantity > product.stock) {
        existingItem.quantity -= Number(quantity);
        return res.status(400).json({
          message: `Only ${product.stock} items available`,
        });
      }
    } else {
      cart.items.push({ product: productId, quantity: Number(quantity) });
    }

    await cart.save();
    await cart.populate("items.product");
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/cart/:productId — update item quantity
router.put("/:productId", async (req, res) => {
  try {
    const { quantity } = req.body;
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const item = cart.items.find((i) => i.product.toString() === req.params.productId);
    if (!item) return res.status(404).json({ message: "Item not in cart" });

    const product = await Product.findById(req.params.productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    if (Number(quantity) <= 0) {
      cart.items = cart.items.filter((i) => i.product.toString() !== req.params.productId);
    } else {
      if (Number(quantity) > product.stock) {
        return res.status(400).json({
          message: `Only ${product.stock} items available`,
        });
      }
      item.quantity = Number(quantity);
    }

    await cart.save();
    await cart.populate("items.product");
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/cart/:productId — remove item from cart
router.delete("/:productId", async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items = cart.items.filter((i) => i.product.toString() !== req.params.productId);
    await cart.save();
    await cart.populate("items.product");
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/cart — clear entire cart
router.delete("/", async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }
    res.json({ message: "Cart cleared" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/cart/capture — capture abandoned cart on logout
router.post("/capture", async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate("items.product");

    if (!cart || cart.items.length === 0) {
      return res.json({ message: "Cart is empty, nothing to capture" });
    }

    // Calculate cart value
    let cartValue = 0;
    const items = cart.items.map((item) => {
      const itemValue = item.product.price * item.quantity;
      cartValue += itemValue;
      return {
        product: item.product._id,
        quantity: item.quantity,
        price: item.product.price,
      };
    });

    // Check if abandoned cart already exists
    const existingAbandoned = await AbandonedCart.findOne({
      user: req.user._id,
      recovered: false,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });

    if (existingAbandoned) {
      existingAbandoned.items = items;
      existingAbandoned.cartValue = cartValue;
      await existingAbandoned.save();
    } else {
      await AbandonedCart.create({
        user: req.user._id,
        email: req.user.email,
        items,
        cartValue,
      });
    }

    res.json({ message: "Cart captured for recovery" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
