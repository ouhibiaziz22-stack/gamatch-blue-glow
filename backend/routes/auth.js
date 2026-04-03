const express = require("express");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

const router = express.Router();
const ADMIN_EMAIL = "ouhibiaziz22@gmail.com";

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

const GOOGLE_AUTH_BASE_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_TOKEN_INFO_URL = "https://oauth2.googleapis.com/tokeninfo";
const APPLE_AUTH_BASE_URL = "https://appleid.apple.com/auth/authorize";
const APPLE_TOKEN_URL = "https://appleid.apple.com/auth/token";

const getBackendBaseUrl = () =>
  process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;

const getGoogleRedirectUri = () =>
  process.env.GOOGLE_REDIRECT_URI || `${getBackendBaseUrl()}/api/auth/google/callback`;

const getGoogleClientId = () => process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_OAUTH_CLIENT_ID;

const getGoogleClientSecret = () =>
  process.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_OAUTH_CLIENT_SECRET;

const getAppleRedirectUri = () =>
  process.env.APPLE_REDIRECT_URI || `${getBackendBaseUrl()}/api/auth/apple/callback`;

const getFrontendAuthUrl = () => process.env.FRONTEND_URL || "http://localhost:8080/connexion";

const appendQueryParam = (url, key, value) => {
  const delimiter = url.includes("?") ? "&" : "?";
  return `${url}${delimiter}${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
};

const safeDecodeState = (state) => {
  if (!state) return {};
  try {
    const decoded = Buffer.from(state, "base64url").toString("utf8");
    return JSON.parse(decoded);
  } catch (_error) {
    return {};
  }
};

const buildState = (payload) => Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");

const isConfiguredValue = (value) => {
  if (!value) return false;
  const normalized = String(value).trim().toLowerCase();
  if (!normalized) return false;
  if (normalized.startsWith("your_")) return false;
  if (normalized.includes("placeholder")) return false;
  if (normalized.includes("change_me")) return false;
  return true;
};

const isValidGoogleClientId = (value) =>
  isConfiguredValue(value) && /\.apps\.googleusercontent\.com$/i.test(String(value).trim());

const splitFullName = (fullName = "") => {
  const parts = String(fullName).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "User", lastName: "Account" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "User" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
};

const parseJwtPayload = (token) => {
  try {
    const parts = String(token).split(".");
    if (parts.length < 2) return null;
    return JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
  } catch (_error) {
    return null;
  }
};

// POST /api/auth/register
router.post(
  "/register",
  [
    body("firstName").trim().notEmpty().withMessage("First name is required"),
    body("lastName").trim().notEmpty().withMessage("Last name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { firstName, lastName, email, password } = req.body;
      const isAdminEmail = String(email).toLowerCase() === ADMIN_EMAIL;

      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const user = await User.create({ firstName, lastName, email, password, role: isAdminEmail ? "admin" : "user" });
      const token = signToken(user._id);

      res.status(201).json({ token, user });
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// POST /api/auth/login
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;
      const user = await User.findOne({ email });

      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const isAdminEmail = String(email).toLowerCase() === ADMIN_EMAIL;
      if (isAdminEmail && user.role !== "admin") {
        user.role = "admin";
        await user.save({ validateModifiedOnly: true });
      }

      const token = signToken(user._id);
      res.json({ token, user });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// GET /api/auth/google/start
router.get("/google/start", (req, res) => {
  const redirect = typeof req.query.redirect === "string" ? req.query.redirect : getFrontendAuthUrl();
  const clientId = getGoogleClientId();

  if (!isValidGoogleClientId(clientId)) {
    return res.redirect(
      appendQueryParam(
        redirect,
        "googleError",
        "Google login is not configured. Use a valid Web Client ID ending with .apps.googleusercontent.com"
      )
    );
  }

  const state = buildState({ redirect });

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getGoogleRedirectUri(),
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });

  res.redirect(`${GOOGLE_AUTH_BASE_URL}?${params.toString()}`);
});

// GET /api/auth/google/callback
router.get("/google/callback", async (req, res) => {
  const { code, state, error } = req.query;
  const decodedState = safeDecodeState(typeof state === "string" ? state : "");
  const redirectUrl = typeof decodedState.redirect === "string" ? decodedState.redirect : getFrontendAuthUrl();
  const clientId = getGoogleClientId();
  const clientSecret = getGoogleClientSecret();

  if (!isValidGoogleClientId(clientId) || !isConfiguredValue(clientSecret)) {
    return res.redirect(
      appendQueryParam(
        redirectUrl,
        "googleError",
        "Google login is not configured. Set a valid GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in backend/.env"
      )
    );
  }

  if (error) {
    return res.redirect(appendQueryParam(redirectUrl, "googleError", "Google login was cancelled"));
  }

  if (!code || typeof code !== "string") {
    return res.redirect(appendQueryParam(redirectUrl, "googleError", "Missing Google authorization code"));
  }

  try {
    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: getGoogleRedirectUri(),
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const details = await tokenResponse.text();
      console.error("Google token exchange failed:", details);
      return res.redirect(appendQueryParam(redirectUrl, "googleError", "Failed to validate Google account"));
    }

    const tokenData = await tokenResponse.json();
    const idToken = tokenData.id_token;

    if (!idToken) {
      return res.redirect(appendQueryParam(redirectUrl, "googleError", "Google did not return an ID token"));
    }

    const infoResponse = await fetch(`${GOOGLE_TOKEN_INFO_URL}?id_token=${encodeURIComponent(idToken)}`);
    if (!infoResponse.ok) {
      const details = await infoResponse.text();
      console.error("Google token verification failed:", details);
      return res.redirect(appendQueryParam(redirectUrl, "googleError", "Google token verification failed"));
    }

    const profile = await infoResponse.json();

    if (profile.aud !== clientId) {
      return res.redirect(appendQueryParam(redirectUrl, "googleError", "Invalid Google client ID"));
    }

    if (!profile.email || profile.email_verified !== "true") {
      return res.redirect(appendQueryParam(redirectUrl, "googleError", "Google email is not verified"));
    }

    const email = String(profile.email).toLowerCase();
    const fallbackNames = splitFullName(profile.name);
    const firstName = profile.given_name || fallbackNames.firstName;
    const lastName = profile.family_name || fallbackNames.lastName;
    const isAdminEmail = email === ADMIN_EMAIL;

    let user = await User.findOne({ email });

    if (!user) {
      const randomPassword = crypto.randomBytes(24).toString("hex");
      user = await User.create({
        firstName,
        lastName,
        email,
        password: randomPassword,
        role: isAdminEmail ? "admin" : "user",
      });
    } else if (isAdminEmail && user.role !== "admin") {
      user.role = "admin";
      await user.save({ validateModifiedOnly: true });
    }

    const token = signToken(user._id);
    return res.redirect(appendQueryParam(redirectUrl, "token", token));
  } catch (callbackError) {
    console.error("Google callback error:", callbackError);
    return res.redirect(appendQueryParam(redirectUrl, "googleError", "Google sign-in failed"));
  }
});

// GET /api/auth/apple/start
router.get("/apple/start", (req, res) => {
  const clientId = process.env.APPLE_CLIENT_ID;
  const clientSecret = process.env.APPLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(500).json({ message: "Apple OAuth is not configured on the server" });
  }

  const redirect = typeof req.query.redirect === "string" ? req.query.redirect : getFrontendAuthUrl();
  const state = buildState({ redirect });

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getAppleRedirectUri(),
    response_type: "code",
    response_mode: "query",
    scope: "name email",
    state,
  });

  res.redirect(`${APPLE_AUTH_BASE_URL}?${params.toString()}`);
});

// GET /api/auth/apple/callback
router.get("/apple/callback", async (req, res) => {
  const clientId = process.env.APPLE_CLIENT_ID;
  const clientSecret = process.env.APPLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(500).json({ message: "Apple OAuth is not configured on the server" });
  }

  const { code, state, error } = req.query;
  const decodedState = safeDecodeState(typeof state === "string" ? state : "");
  const redirectUrl = typeof decodedState.redirect === "string" ? decodedState.redirect : getFrontendAuthUrl();

  if (error) {
    return res.redirect(appendQueryParam(redirectUrl, "appleError", "Apple login was cancelled"));
  }

  if (!code || typeof code !== "string") {
    return res.redirect(appendQueryParam(redirectUrl, "appleError", "Missing Apple authorization code"));
  }

  try {
    const tokenResponse = await fetch(APPLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: getAppleRedirectUri(),
      }),
    });

    if (!tokenResponse.ok) {
      const details = await tokenResponse.text();
      console.error("Apple token exchange failed:", details);
      return res.redirect(appendQueryParam(redirectUrl, "appleError", "Failed to validate Apple account"));
    }

    const tokenData = await tokenResponse.json();
    const idToken = tokenData.id_token;
    const claims = parseJwtPayload(idToken);

    if (!claims) {
      return res.redirect(appendQueryParam(redirectUrl, "appleError", "Invalid Apple ID token"));
    }

    if (claims.iss !== "https://appleid.apple.com" || claims.aud !== clientId) {
      return res.redirect(appendQueryParam(redirectUrl, "appleError", "Invalid Apple token issuer or audience"));
    }

    if (!claims.exp || Date.now() >= Number(claims.exp) * 1000) {
      return res.redirect(appendQueryParam(redirectUrl, "appleError", "Apple token has expired"));
    }

    const appleSub = typeof claims.sub === "string" ? claims.sub : "";
    const email = typeof claims.email === "string" ? String(claims.email).toLowerCase() : "";

    if (!appleSub) {
      return res.redirect(appendQueryParam(redirectUrl, "appleError", "Apple account identifier missing"));
    }

    if (!email) {
      return res.redirect(appendQueryParam(redirectUrl, "appleError", "Apple email not available for this account"));
    }

    const isAdminEmail = email === ADMIN_EMAIL;

    let user = await User.findOne({
      $or: [{ appleSub }, { email }],
    });

    if (!user) {
      const randomPassword = crypto.randomBytes(24).toString("hex");
      user = await User.create({
        firstName: "Apple",
        lastName: "User",
        email,
        appleSub,
        password: randomPassword,
        role: isAdminEmail ? "admin" : "user",
      });
    } else {
      if (!user.appleSub) {
        user.appleSub = appleSub;
      }
      if (isAdminEmail && user.role !== "admin") {
        user.role = "admin";
      }
      await user.save({ validateModifiedOnly: true });
    }

    const token = signToken(user._id);
    return res.redirect(appendQueryParam(redirectUrl, "token", token));
  } catch (callbackError) {
    console.error("Apple callback error:", callbackError);
    return res.redirect(appendQueryParam(redirectUrl, "appleError", "Apple sign-in failed"));
  }
});

// GET /api/auth/me
router.get("/me", protect, async (req, res) => {
  res.json({ user: req.user });
});

// Email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// POST /api/auth/forgot-password
router.post(
  "/forgot-password",
  [body("email").isEmail().withMessage("Valid email is required")],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email } = req.body;
      const user = await User.findOne({ email });

      if (!user) {
        // Don't reveal whether user exists
        return res.json({ message: "If that email is registered, a code has been sent." });
      }

      // Generate 6-digit code
      const code = crypto.randomInt(100000, 999999).toString();
      user.resetCode = code;
      user.resetCodeExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      await user.save({ validateModifiedOnly: true });

      await transporter.sendMail({
        from: `"GamaTech" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Password Reset Code",
        html: `
          <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#111;color:#fff;border-radius:12px;">
            <h2 style="color:#f59e0b;">GamaTech - Password Reset</h2>
            <p>You requested a password reset. Use the code below:</p>
            <div style="text-align:center;margin:24px 0;">
              <span style="font-size:32px;letter-spacing:8px;font-weight:bold;color:#f59e0b;">${code}</span>
            </div>
            <p style="color:#aaa;font-size:13px;">This code expires in 10 minutes. If you didn't request this, ignore this email.</p>
          </div>
        `,
      });

      res.json({ message: "If that email is registered, a code has been sent." });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// POST /api/auth/verify-code
router.post(
  "/verify-code",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("code").isLength({ min: 6, max: 6 }).withMessage("Code must be 6 digits"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, code } = req.body;
      const user = await User.findOne({ email });

      if (
        !user ||
        !user.resetCode ||
        !user.resetCodeExpiry ||
        user.resetCode !== code ||
        user.resetCodeExpiry < new Date()
      ) {
        return res.status(400).json({ message: "Invalid or expired code" });
      }

      res.json({ message: "Code verified" });
    } catch (error) {
      console.error("Verify code error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// POST /api/auth/reset-password
router.post(
  "/reset-password",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("code").isLength({ min: 6, max: 6 }).withMessage("Code must be 6 digits"),
    body("newPassword").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, code, newPassword } = req.body;
      const user = await User.findOne({ email });

      if (
        !user ||
        !user.resetCode ||
        !user.resetCodeExpiry ||
        user.resetCode !== code ||
        user.resetCodeExpiry < new Date()
      ) {
        return res.status(400).json({ message: "Invalid or expired code" });
      }

      user.password = newPassword;
      user.resetCode = null;
      user.resetCodeExpiry = null;
      await user.save();

      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

module.exports = router;
