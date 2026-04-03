require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const User = require("./models/User");
const {
  helmetConfig,
  generalLimiter,
  authLimiter,
  checkoutLimiter,
  corsOptions,
  sanitizeInput,
} = require("./middleware/security");

// Route imports
const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const cartRoutes = require("./routes/cart");
const orderRoutes = require("./routes/orders");
const reviewRoutes = require("./routes/reviews");
const abandonedCartRoutes = require("./routes/abandoned-carts");
const imageRoutes = require("./routes/images");
const chatRoutes = require("./routes/chat");

const app = express();
const PORT = process.env.PORT || 5000;
const ADMIN_EMAIL = "ouhibiaziz22@gmail.com";

// Security Middleware
app.use(helmetConfig);
app.use(cors(corsOptions));
app.use(generalLimiter);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(sanitizeInput);

// Routes
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", checkoutLimiter, orderRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/abandoned-carts", abandonedCartRoutes);
app.use("/api/images", imageRoutes);
app.use("/api/chat", chatRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Start server
const start = async () => {
  await connectDB();
  // Ensure the admin email always has admin role.
  await User.updateOne({ email: ADMIN_EMAIL }, { $set: { role: "admin" } });
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
