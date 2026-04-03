const express = require("express");
const { body, validationResult } = require("express-validator");
const AbandonedCart = require("../models/AbandonedCart");
const Cart = require("../models/Cart");
const { protect, admin } = require("../middleware/auth");

const router = express.Router();

// Helper: Send reminder email (integrate with SendGrid/Nodemailer)
async function sendAbandonedCartEmail(email, cartItems, cartValue, removalType = "first") {
  // TODO: Implement actual email sending via SendGrid
  // For now, this is a placeholder
  console.log(`Sending ${removalType} reminder email to ${email}`);
  // Example structure:
  // const msg = {
  //   to: email,
  //   from: process.env.EMAIL_FROM,
  //   subject: removalType === 'first' ? 'You left items in your cart!' : 'Last chance to complete your purchase',
  //   html: generateEmailHTML(cartItems, cartValue),
  // };
  // await sgMail.send(msg);
}

// POST /api/abandoned-carts — manually capture cart (called before logout/session end)
router.post("/", protect, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate("items.product");

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
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

    // Check if abandoned cart already exists for this user
    const existingAbandoned = await AbandonedCart.findOne({
      user: req.user._id,
      recovered: false,
    });

    if (existingAbandoned) {
      // Update existing
      existingAbandoned.items = items;
      existingAbandoned.cartValue = cartValue;
      await existingAbandoned.save();
    } else {
      // Create new
      await AbandonedCart.create({
        user: req.user._id,
        email: req.user.email,
        items,
        cartValue,
      });
    }

    res.json({ message: "Cart captured for recovery" });
  } catch (error) {
    console.error("Error capturing abandoned cart:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/abandoned-carts/admin/all — admin view all abandoned carts
router.get("/admin/all", protect, admin, async (req, res) => {
  try {
    const { recovered = false, page = 1, limit = 20 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const [carts, total] = await Promise.all([
      AbandonedCart.find({ recovered: recovered === "true" })
        .populate("user", "firstName lastName email")
        .populate("items.product", "name price")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      AbandonedCart.countDocuments({ recovered: recovered === "true" }),
    ]);

    res.json({
      carts,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    console.error("Error fetching abandoned carts:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/abandoned-carts/user/my — get current user's abandoned carts
router.get("/user/my", protect, async (req, res) => {
  try {
    const abandonedCarts = await AbandonedCart.find({ user: req.user._id })
      .populate("items.product", "name price image")
      .sort({ createdAt: -1 });

    res.json(abandonedCarts);
  } catch (error) {
    console.error("Error fetching user abandoned carts:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/abandoned-carts/:cartId/send-reminder — send reminder email (admin)
router.post("/:cartId/send-reminder", protect, admin, async (req, res) => {
  try {
    const { type = "first" } = req.body; // first, second, or final

    const abandonedCart = await AbandonedCart.findById(req.params.cartId);
    if (!abandonedCart) {
      return res.status(404).json({ message: "Abandoned cart not found" });
    }

    // Check if already sent this type
    const alreadySent = abandonedCart.emailsSent.some((email) => email.type === type);
    if (alreadySent) {
      return res.status(400).json({ message: `${type} reminder already sent` });
    }

    // Send email
    await sendAbandonedCartEmail(abandonedCart.email, abandonedCart.items, abandonedCart.cartValue, type);

    // Log the email send
    abandonedCart.emailsSent.push({ type });
    await abandonedCart.save();

    res.json({ message: `${type} reminder sent to ${abandonedCart.email}` });
  } catch (error) {
    console.error("Error sending reminder:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/abandoned-carts/:cartId/recover — mark as recovered
router.post("/:cartId/recover", protect, async (req, res) => {
  try {
    const abandonedCart = await AbandonedCart.findById(req.params.cartId);
    if (!abandonedCart) {
      return res.status(404).json({ message: "Abandoned cart not found" });
    }

    // Verify ownership
    if (abandonedCart.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    abandonedCart.recovered = true;
    abandonedCart.recoveredAt = new Date();
    await abandonedCart.save();

    res.json({ message: "Cart marked as recovered" });
  } catch (error) {
    console.error("Error marking cart as recovered:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/abandoned-carts/:cartId — delete abandoned cart record
router.delete("/:cartId", protect, async (req, res) => {
  try {
    const abandonedCart = await AbandonedCart.findById(req.params.cartId);
    if (!abandonedCart) {
      return res.status(404).json({ message: "Abandoned cart not found" });
    }

    if (abandonedCart.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    await AbandonedCart.findByIdAndDelete(req.params.cartId);

    res.json({ message: "Abandoned cart deleted" });
  } catch (error) {
    console.error("Error deleting abandoned cart:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
