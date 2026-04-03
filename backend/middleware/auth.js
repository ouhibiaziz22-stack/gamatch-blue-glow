const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ADMIN_EMAIL = "ouhibiaziz22@gmail.com";

const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ message: "User no longer exists" });
    }

    const isAdminEmail = String(user.email).toLowerCase() === ADMIN_EMAIL;
    if (isAdminEmail && user.role !== "admin") {
      user.role = "admin";
      await user.save({ validateModifiedOnly: true });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

const admin = (req, res, next) => {
  const isAdmin =
    (req.user && req.user.role === "admin") ||
    (req.user && String(req.user.email).toLowerCase() === ADMIN_EMAIL);
  if (isAdmin) return next();
  return res.status(403).json({ message: "Admin access required" });
};

module.exports = { protect, admin };
