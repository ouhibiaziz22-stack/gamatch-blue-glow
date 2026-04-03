const express = require("express");
const { body, validationResult, param } = require("express-validator");
const Review = require("../models/Review");
const Product = require("../models/Product");
const Order = require("../models/Order");
const { protect } = require("../middleware/auth");

const router = express.Router();

// GET /api/reviews/product/:productId — get all reviews for a product (public)
router.get("/product/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10, sort = "helpful" } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    // Validate productId
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Build sort object
    let sortObj = { createdAt: -1 };
    if (sort === "helpful") {
      sortObj = { helpful: -1, createdAt: -1 };
    } else if (sort === "rating_high") {
      sortObj = { rating: -1, createdAt: -1 };
    } else if (sort === "rating_low") {
      sortObj = { rating: 1, createdAt: -1 };
    } else if (sort === "recent") {
      sortObj = { createdAt: -1 };
    }

    const [reviews, total, stats] = await Promise.all([
      Review.find({ product: productId })
        .populate("user", "firstName lastName")
        .sort(sortObj)
        .skip(skip)
        .limit(Number(limit)),
      Review.countDocuments({ product: productId }),
      Review.aggregate([
        { $match: { product: require("mongoose").Types.ObjectId(productId) } },
        {
          $group: {
            _id: null,
            avgRating: { $avg: "$rating" },
            count: { $sum: 1 },
            distribution: {
              $push: "$rating",
            },
          },
        },
      ]),
    ]);

    // Calculate rating distribution
    const distribution = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    if (stats.length > 0) {
      stats[0].distribution.forEach((rating) => {
        distribution[rating]++;
      });
    }

    res.json({
      reviews,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      stats: stats.length > 0 ? stats[0] : { avgRating: 0, count: 0 },
      distribution,
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/reviews — create review (authenticated, verified purchase only)
router.post(
  "/",
  protect,
  [
    body("productId").notEmpty().withMessage("Product ID is required"),
    body("orderId").notEmpty().withMessage("Order ID is required"),
    body("rating").isInt({ min: 1, max: 5 }).withMessage("Rating must be 1-5"),
    body("title").trim().notEmpty().withMessage("Title is required"),
    body("comment").optional().trim(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { productId, orderId, rating, title, comment } = req.body;

      // Verify the order belongs to the user and contains the product
      const order = await Order.findById(orderId);
      if (!order || order.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "This order does not belong to you" });
      }

      const productInOrder = order.items.some(
        (item) => item.product.toString() === productId || item._id.toString() === productId
      );
      if (!productInOrder) {
        return res.status(400).json({ message: "Product not in this order" });
      }

      // Check if user already reviewed this product from this order
      const existingReview = await Review.findOne({
        product: productId,
        user: req.user._id,
        order: orderId,
      });
      if (existingReview) {
        return res.status(400).json({ message: "You have already reviewed this product" });
      }

      const review = await Review.create({
        product: productId,
        user: req.user._id,
        order: orderId,
        rating,
        title,
        comment,
        verified: true,
      });

      // Update or recalculate product rating
      await updateProductRating(productId);

      await review.populate("user", "firstName lastName");

      res.status(201).json(review);
    } catch (error) {
      console.error("Error creating review:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// PUT /api/reviews/:reviewId — update review (owner only)
router.put(
  "/:reviewId",
  protect,
  [
    body("rating").optional().isInt({ min: 1, max: 5 }),
    body("title").optional().trim().notEmpty(),
    body("comment").optional().trim(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const review = await Review.findById(req.params.reviewId);
      if (!review) {
        return res.status(404).json({ message: "Review not found" });
      }

      if (review.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Not authorized to update this review" });
      }

      const { rating, title, comment } = req.body;
      if (rating) review.rating = rating;
      if (title) review.title = title;
      if (comment !== undefined) review.comment = comment;

      await review.save();
      await updateProductRating(review.product);

      res.json(review);
    } catch (error) {
      console.error("Error updating review:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// DELETE /api/reviews/:reviewId — delete review
router.delete("/:reviewId", protect, async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    if (review.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to delete this review" });
    }

    const productId = review.product;
    await Review.findByIdAndDelete(req.params.reviewId);
    await updateProductRating(productId);

    res.json({ message: "Review deleted" });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/reviews/:reviewId/helpful — mark as helpful
router.post("/:reviewId/helpful", protect, async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.reviewId,
      { $inc: { helpful: 1 } },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    res.json(review);
  } catch (error) {
    console.error("Error marking review as helpful:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Helper function to update product rating
async function updateProductRating(productId) {
  try {
    const reviews = await Review.find({ product: productId });
    if (reviews.length === 0) {
      await Product.findByIdAndUpdate(productId, { rating: 0 });
    } else {
      const avgRating =
        reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      await Product.findByIdAndUpdate(productId, { rating: Math.round(avgRating * 10) / 10 });
    }
  } catch (error) {
    console.error("Error updating product rating:", error);
  }
}

module.exports = router;
