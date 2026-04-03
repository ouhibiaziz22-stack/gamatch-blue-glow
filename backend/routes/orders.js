const express = require("express");
const { body, validationResult } = require("express-validator");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const AbandonedCart = require("../models/AbandonedCart");
const { protect, admin } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

const deliveryFees = { standard: 12, express: 25, pickup: 0 };

// Helper: Check and reserve stock atomically
async function reserveStock(cartItems) {
  const session = await Order.startSession();
  session.startTransaction();
  try {
    for (const item of cartItems) {
      const product = await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: -item.quantity } },
        { new: true, session }
      );

      if (!product || product.stock < 0) {
        throw new Error(`Insufficient stock for product: ${item.product}`);
      }
    }
    await session.commitTransaction();
    return true;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

// Helper: Restore stock if payment fails
async function restoreStock(orderItems) {
  try {
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
    }
  } catch (error) {
    console.error("Error restoring stock:", error);
  }
}

// POST /api/orders/create-payment-intent — create Stripe payment intent
router.post("/create-payment-intent", async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate("items.product");
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Validate all items have stock
    for (const item of cart.items) {
      if (!item.product || item.product.stock < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for ${item.product?.name || "product"}`,
        });
      }
    }

    // Calculate amounts
    const { deliveryMethod = "standard", paymentMethod = "card" } = req.body;
    let subtotal = 0;

    cart.items.forEach((item) => {
      subtotal += item.product.price * item.quantity;
    });

    const deliveryFee = deliveryFees[deliveryMethod] || 0;
    const total = Math.round((subtotal + deliveryFee) * 100); // Convert to cents for Stripe

    // Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: total,
      currency: "usd",
      metadata: {
        userId: req.user._id.toString(),
        deliveryMethod,
        subtotal: Math.round(subtotal * 100),
        deliveryFee: Math.round(deliveryFee * 100),
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      amount: total,
      subtotal: Math.round(subtotal * 100),
      deliveryFee: Math.round(deliveryFee * 100),
    });
  } catch (error) {
    console.error("Payment intent error:", error);
    res.status(500).json({ message: "Payment processing error" });
  }
});

// POST /api/orders — create order from cart (for non-card payments or after Stripe confirmation)
router.post(
  "/",
  [
    body("shippingAddress.fullName")
      .trim()
      .notEmpty()
      .withMessage("Full name is required")
      .isLength({ min: 2, max: 100 }),
    body("shippingAddress.phone")
      .trim()
      .matches(/^[0-9+\\s\\-\\(\\)]{7,}$/)
      .withMessage("Valid phone is required"),
    body("shippingAddress.email").isEmail().withMessage("Valid email is required"),
    body("shippingAddress.address").trim().notEmpty().withMessage("Address is required"),
    body("deliveryMethod")
      .isIn(["standard", "express", "pickup"])
      .withMessage("Invalid delivery method"),
    body("paymentMethod")
      .isIn(["card", "cash", "bank", "wallet"])
      .withMessage("Invalid payment method"),
    body("paymentIntentId").optional(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const cart = await Cart.findOne({ user: req.user._id }).populate("items.product");
      if (!cart || cart.items.length === 0) {
        return res.status(400).json({ message: "Cart is empty" });
      }

      const { shippingAddress, deliveryMethod, paymentMethod, paymentIntentId } = req.body;

      // Build order items and calculate subtotal
      const orderItems = [];
      let subtotal = 0;

      for (const item of cart.items) {
        const product = item.product;
        if (!product) continue;

        orderItems.push({
          product: product._id,
          name: product.name,
          price: product.price,
          quantity: item.quantity,
        });

        subtotal += product.price * item.quantity;
      }

      const deliveryFee = deliveryFees[deliveryMethod] || 0;
      const codFee = paymentMethod === "cash" ? 7 : 0;
      const total = subtotal + deliveryFee + codFee;

      // Verify Stripe payment if card payment
      let paymentStatus = "pending";
      if (paymentMethod === "card" && paymentIntentId) {
        try {
          const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
          if (paymentIntent.status !== "succeeded") {
            return res.status(400).json({ message: "Payment not confirmed" });
          }
          paymentStatus = "paid";
        } catch (error) {
          return res.status(400).json({ message: "Payment verification failed" });
        }
      }

      // Reserve stock atomically
      try {
        // Simplified: just check stock before creating order
        for (const item of orderItems) {
          const product = await Product.findById(item.product);
          if (!product || product.stock < item.quantity) {
            return res.status(400).json({
              message: `Insufficient stock for ${product?.name || "product"}`,
            });
          }
        }

        // Create order
        const order = await Order.create({
          user: req.user._id,
          items: orderItems,
          shippingAddress,
          deliveryMethod,
          paymentMethod,
          subtotal,
          deliveryFee,
          codFee,
          total,
          paymentStatus,
        });

        // Decrement stock
        for (const item of orderItems) {
          await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
        }

        // Mark abandoned cart as recovered
        await AbandonedCart.updateOne(
          { user: req.user._id, recovered: false },
          { recovered: true, recoveredAt: new Date() }
        );

        // Clear cart
        cart.items = [];
        await cart.save();

        res.status(201).json(order);
      } catch (error) {
        // Restore stock on error
        if (paymentStatus === "paid") {
          await restoreStock(orderItems);
        }
        throw error;
      }
    } catch (error) {
      console.error("Order creation error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// GET /api/orders — get current user's orders
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const filter = { user: req.user._id };

    if (status) filter.status = status;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate("items.product", "name image"),
      Order.countDocuments(filter),
    ]);

    res.json({
      orders,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/orders/admin/all — admin get all orders
router.get("/admin/all", admin, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate("user", "firstName lastName email")
        .populate("items.product", "name image"),
      Order.countDocuments(filter),
    ]);

    res.json({ orders, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/orders/:id — get single order
router.get("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("items.product", "name image price")
      .populate("user", "firstName lastName email");

    if (!order) return res.status(404).json({ message: "Order not found" });

    // Users can only see their own orders, admins can see all
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    res.json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/orders/:id/status — update order status (admin)
router.put("/:id/status", admin, async (req, res) => {
  try {
    const { status, paymentStatus } = req.body;

    if (status && !["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const update = {};
    if (status) update.status = status;
    if (paymentStatus) update.paymentStatus = paymentStatus;

    const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!order) return res.status(404).json({ message: "Order not found" });

    res.json(order);
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/orders/:id/cancel — cancel order (user or admin)
router.post("/:id/cancel", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Check authorization
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Can only cancel pending/confirmed orders
    if (!["pending", "confirmed"].includes(order.status)) {
      return res.status(400).json({ message: "Cannot cancel this order" });
    }

    // Update order status
    order.status = "cancelled";
    await order.save();

    // Restore stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
    }

    res.json({ message: "Order cancelled", order });
  } catch (error) {
    console.error("Error cancelling order:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
