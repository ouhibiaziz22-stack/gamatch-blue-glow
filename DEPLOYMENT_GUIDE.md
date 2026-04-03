# Complete Deployment Guide - Gamatch Platform

**Status**: ✅ All systems ready for production deployment

---

## 🚀 Phase 1: Pre-Deployment Checklist

### Backend (.env Configuration)
```bash
# Update backend/.env with production values:
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/gamatch?retryWrites=true
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# AI Assistant
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini

# Stripe (Live Keys)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email Service
SENDGRID_API_KEY=SG.your_key...
SENDGRID_FROM_EMAIL=noreply@gamatch.com

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-secret

# CORS Origins
ALLOWED_ORIGINS=https://gamatch.com,https://www.gamatch.com,https://admin.gamatch.com
```

### Frontend (.env Configuration)
```bash
# Update fontend/.env.production with:
VITE_API_URL=https://api.gamatch.com
VITE_STRIPE_PUBLIC_KEY=pk_live_...
```

### Security Verification
- [ ] `.env` files NOT committed to Git (.gitignore ✅)
- [ ] JWT_SECRET is 32+ characters
- [ ] Stripe keys are LIVE (sk_live_, pk_live_)
- [ ] CORS whitelist includes only your domains
- [ ] Rate limits are tuned (see backend/middleware/security.js)

---

## 📦 Phase 2: Build Optimization

### Frontend Build
```bash
cd fontend

# Install dependencies (should already be done)
npm install

# Build for production
npm run build

# Expected output:
# ✓ 1234 modules transformed.
# dist/index.html                 0.50 kB │ gzip:  0.25 kB
# dist/assets/index-abc123.js     245 kB │ gzip:  78 kB
# dist/assets/index-def456.css    45 kB  │ gzip:  8 kB
```

**Verify**:
- [ ] No errors or warnings
- [ ] dist/ folder created
- [ ] All assets generated
- [ ] index.html present

### Backend Build
```bash
cd backend

# Install with legacy peer deps (already done)
npm install --legacy-peer-deps

# Test server startup
npm start

# Expected output:
# [dotenv] injecting env (16) from .env
# MongoDB connected: ac-kflvqiq-shard-00-01.8fjfmuf.mongodb.net
# Server running on http://localhost:5000
```

**Verify**:
- [ ] No errors
- [ ] MongoDB connects successfully
- [ ] Server listens on correct port

---

## 🌐 Phase 3: Deployment Targets

### Option A: Deploy Backend to Render (Recommended)

**Step 1: Prepare Repository**
```bash
# Ensure backend folder is at root or create render.yaml at project root
# Render.yml:
services:
  - type: web
    name: gamatch-api
    env: node
    repo: https://github.com/your-username/gamatch
    rootDir: backend
    buildCommand: npm install --legacy-peer-deps && npm run seed
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: MONGO_URI
        sync: false
      - key: JWT_SECRET
        sync: false
      - key: STRIPE_SECRET_KEY
        sync: false
      - key: STRIPE_WEBHOOK_SECRET
        sync: false
      - key: SENDGRID_API_KEY
        sync: false
      - key: CLOUDINARY_CLOUD_NAME
        sync: false
      - key: CLOUDINARY_API_KEY
        sync: false
      - key: CLOUDINARY_API_SECRET
        sync: false
      - key: ALLOWED_ORIGINS
        value: https://gamatch.vercel.app,https://gamatch.com

staticSite:
  buildCommand: cd fontend && npm install && npm run build
  publishPath: fontend/dist
  envVars:
    - key: VITE_API_URL
      value: https://gamatch-api.onrender.com
```

**Step 2: Deploy**
1. Push code to GitHub
2. Visit [render.com](https://render.com)
3. New → Web Service
4. Connect GitHub repository
5. Select `render.yaml`
6. Deploy

**Expected URLs**:
- Backend API: `https://gamatch-api.onrender.com`
- Frontend: `https://gamatch.onrender.com`
- API Health: `https://gamatch-api.onrender.com/api/health`

---

### Option B: Deploy Backend to Railway (Alternative)

**Step 1: Connect Repository**
```bash
npm install -g @railway/cli
railway login
railway connect
```

**Step 2: Set Environment**
```bash
# In Railway Dashboard → New → PostgreSQL (for cache) or skip
# Set environment variables in Railway Dashboard

railway variable set NODE_ENV production
railway variable set MONGO_URI "mongodb+srv://..."
railway variable set JWT_SECRET "..."
# ... set other variables
```

**Step 3: Deploy**
```bash
railway up
```

**Expected URL**: Auto-generated Railway URL (e.g., `gamatch-api-production.railway.app`)

---

### Option C: Deploy Frontend to Vercel (Recommended)

**Step 1: Install Vercel CLI**
```bash
npm install -g vercel
cd fontend
vercel login
```

**Step 2: Configure**
```bash
# First deploy (creates vercel.json):
vercel

# Select:
# - Project name: gamatch
# - Framework: Vite
# - Root directory: ./
# - Build command: npm run build
# - Output: dist
```

**Step 3: Set Environment Variables**
```bash
vercel env add VITE_API_URL
# Enter: https://gamatch-api.onrender.com

vercel env add VITE_STRIPE_PUBLIC_KEY
# Enter: pk_live_...
```

**Step 4: Deploy to Production**
```bash
vercel --prod
```

**Expected**:
- Dashboard: [vercel.com/dashboard](https://vercel.com/dashboard)
- Live URL: `https://gamatch.vercel.app`
- All commits auto-deploy to staging
- Production deploys require approval

---

## 🔌 Phase 4: Connect Services

### 1. Stripe Webhook Configuration
```bash
# In Stripe Dashboard → Developers → Webhooks
# Add Endpoint:
Endpoint URL: https://gamatch-api.onrender.com/api/orders/webhook
Events: payment_intent.succeeded, payment_intent.payment_failed
Signing Secret: (copy to STRIPE_WEBHOOK_SECRET in .env)
```

### 2. MongoDB Atlas IP Whitelist
```bash
# In MongoDB Atlas → Network Access
# Add IP Address:
0.0.0.0/0  # Or specific IP ranges:
# - Render: varies (auto-handled)
# - Railway: varies (auto-handled)
# - Your office/home: x.x.x.x
```

### 3. Cloudinary Webhook (Optional - for image processing)
```bash
# Not required for basic setup, but enable later for:
# - Auto-scaling images
# - Format detection
# - Advanced transformations
```

### 4. SendGrid SMTP Configuration (Optional)
```bash
# For production emails (order confirmations, abandoned cart)
# In SendGrid → Settings → Sender Authentication
# Add domain: gamatch.com (requires DNS records)
```

---

## ✅ Phase 5: Post-Deployment Verification

### Health Checks
```bash
# Backend Health
curl https://gamatch-api.onrender.com/api/health
# Expected: {"status":"ok","timestamp":"2026-03-27T..."}

# Frontend
curl https://gamatch.vercel.app
# Expected: HTML with <title>Gamatch - Premium Gaming PCs</title>
```

### API Endpoints Test
```bash
# Test Products
curl https://gamatch-api.onrender.com/api/products

# Test Authentication
curl -X POST https://gamatch-api.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@gamatch.com","password":"Test123!","username":"testuser"}'

# Test Reviews
curl https://gamatch-api.onrender.com/api/reviews/product/{product_id}
```

### Frontend Functionality
- [ ] Homepage loads (http://localhost:8082 → production URL)
- [ ] Products display with images
- [ ] Add to cart works
- [ ] Checkout process works (test with Stripe test card: 4242 4242 4242 4242)
- [ ] Login/Register works
- [ ] Admin dashboard accessible (/admin)
- [ ] Recommendations show on ProductDetail
- [ ] Image upload works in admin

### Performance Validation
```bash
# Run Lighthouse
# Chrome DevTools → Lighthouse → Generate report

# Check metrics:
# - Performance: 90+
# - Accessibility: 100
# - Best Practices: 93+
# - SEO: 100
```

---

## 🔐 Phase 6: Security Hardening

### Frontend Security
```bash
# 1. Content Security Policy (in Vercel dashboard or via headers)
# 2. X-Frame-Options: DENY (prevent clickjacking)
# 3. X-Content-Type-Options: nosniff
# 4. Referrer-Policy: strict-origin-when-cross-origin
```

### Backend Security
```bash
# Already implemented in middleware/security.js:
# ✅ Helmet (sets security headers)
# ✅ CORS whitelist (restrict origins)
# ✅ Rate limiting (general, auth, checkout tiers)
# ✅ Input sanitization (strip HTML, limit length)
# ✅ JWT authentication

# Additional checks:
# [ ] HTTPS enforced (Render/Vercel auto-handles)
# [ ] Secrets never logged (check server logs)
# [ ] Database backups configured (MongoDB Atlas)
# [ ] Rate limits tuned for your traffic
```

### Monitoring & Alerts
```bash
# Set up in Render/Railway/Vercel:
# - CPU > 80%: alert
# - Memory > 85%: alert
# - Error rate > 1%: alert
# - Any 5xx responses: log
```

---

## 📊 Phase 7: Analytics & Monitoring

### Google Analytics (Future)
```html
<!-- Add to fontend/index.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### Vercel Analytics
```bash
# Already tracked in Vercel
# View in: dashboard.vercel.com → Analytics
# Metrics: Web Vitals, Traffic, Performance
```

### Sentry Error Tracking (Optional)
```bash
npm install @sentry/react --save

# In main.tsx:
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://your-sentry-url",
  environment: "production",
});
```

---

## 📈 Phase 8: Scaling & Optimization

### Database Optimization
```bash
# Add indexes in MongoDB Atlas:
# db.products.createIndex({ "category": 1 })
# db.orders.createIndex({ "userId": 1, "createdAt": -1 })
# db.reviews.createIndex({ "productId": 1, "verified": 1 })
```

### Caching Strategy
```bash
# Frontend: Vercel auto-caches versioned files
# Backend: Add Redis for session/cart caching (future)
# API: Add Cache-Control headers to GET endpoints
```

### CDN Configuration
```bash
# Vercel Edge Network: Auto-configured ✅
# Images via Cloudinary: Auto-CDN ✅
# Custom domains: Point to Vercel nameservers
```

---

## 🚨 Troubleshooting

### Backend Won't Start
```bash
# Check logs
railway logs
# or
vercel logs gamatch-api

# Common issues:
# 1. NODE_ENV not set → set to "production"
# 2. MongoDB connection failed → verify MONGO_URI
# 3. Port conflict → use PORT env var
# 4. Missing env vars → check all required keys
```

### Frontend Build Failed
```bash
# Check build logs
vercel logs

# Common issues:
# 1. TypeScript errors → npm run type-check
# 2. Missing env vars → vercel env ls
# 3. Dependency conflict → npm audit fix
# 4. API URL wrong → check VITE_API_URL
```

### 5xx Errors
```bash
# Check backend logs:
# - Is MongoDB connected?
# - Are rate limits exceeded?
# - Is Stripe webhook configured?
# - Check middleware errors

# Verify API endpoint:
curl -v https://gamatch-api.onrender.com/api/health
```

### CORS Errors
```bash
# In backend middleware/security.js:
# Update ALLOWED_ORIGINS to include your frontend URL
# Example: https://gamatch.vercel.app

# Restart backend after change
```

---

## 📋 Deployment Checklist

```
PRE-DEPLOYMENT
[ ] All .env files configured with production values
[ ] No console.error() or debugging logs
[ ] All tests pass (if applicable)
[ ] Stripe webhook URL configured
[ ] MongoDB backup configured
[ ] SSL certificates ready (auto-handled by Render/Vercel)

DEPLOYMENT
[ ] Backend deployed to Render
[ ] Frontend deployed to Vercel
[ ] Environment variables set in both
[ ] Custom domain configured (optional)
[ ] SSL certificate active

POST-DEPLOYMENT
[ ] Health endpoints respond 200
[ ] API endpoints functional
[ ] Frontend loads without errors
[ ] Payments process correctly (test transaction)
[ ] User registration works
[ ] Image uploads work
[ ] Admin dashboard accessible
[ ] Lighthouse score > 90
[ ] No 5xx errors in logs
[ ] Monitoring alerts configured

SECURITY
[ ] HTTPS enforced
[ ] CORS whitelist correct
[ ] Rate limits active
[ ] Input validation working
[ ] Secrets never logged
[ ] Backups automated
```

---

## 🎉 Production URLs (After Deployment)

```
Frontend (Vercel):      https://gamatch.vercel.app
Backend (Render):       https://gamatch-api.onrender.com
Database:               MongoDB Atlas (auto-managed)
Images:                 Cloudinary CDN
Payments:               Stripe Live
Email:                  SendGrid (or nodemailer)
```

---

## 📞 Support

For issues during deployment:
1. Check service status pages:
   - Vercel: [status.vercel.com](https://status.vercel.com)
   - Render: [status.render.com](https://status.render.com)
   - MongoDB: [status.mongodb.com](https://status.mongodb.com)

2. Review logs:
   - Vercel CLI: `vercel logs`
   - Render dashboard: Logs tab
   - MongoDB Atlas: Logs section

3. Common fixes:
   - Restart service (most resolve 80% of issues)
   - Clear cache and rebuild
   - Verify environment variables
   - Check CORS configuration
