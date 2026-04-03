const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

// Rate limiting middleware
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again after 15 minutes",
  skip: (req) => process.env.NODE_ENV === "development", // Disable in dev
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Stricter limit for auth
  message: "Too many auth attempts, please try again after 15 minutes",
  skipSuccessfulRequests: true,
  skip: (req) => process.env.NODE_ENV === "development",
});

const checkoutLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: "Too many checkout attempts, please try again after 1 hour",
  skip: (req) => process.env.NODE_ENV === "development",
});

// CORS whitelist (restrict to your domains)
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",")
    : ["http://localhost:5173", "http://localhost:3000"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400, // 24 hours
};

// Helmet configuration for security headers
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https:"],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true },
  frameguard: { action: "deny" },
  noSniff: true,
  xssFilter: true,
});

// Validation middleware for common injection attacks
const sanitizeInput = (req, res, next) => {
  const sanitize = (str) => {
    if (typeof str !== "string") return str;
    return str
      .replace(/[<>\"'`]/g, "")
      .trim()
      .substring(0, 1000); // Also limit length
  };

  // Sanitize body
  if (req.body && typeof req.body === "object") {
    Object.keys(req.body).forEach((key) => {
      if (typeof req.body[key] === "string") {
        req.body[key] = sanitize(req.body[key]);
      }
    });
  }

  // Sanitize query params
  Object.keys(req.query).forEach((key) => {
    if (typeof req.query[key] === "string") {
      req.query[key] = sanitize(req.query[key]);
    }
  });

  next();
};

module.exports = {
  helmetConfig,
  generalLimiter,
  authLimiter,
  checkoutLimiter,
  corsOptions,
  sanitizeInput,
};
