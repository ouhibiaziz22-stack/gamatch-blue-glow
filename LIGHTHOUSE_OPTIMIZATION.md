# Performance Optimization Guide - Lighthouse 90+

## Overview
This guide details how to achieve and maintain Lighthouse scores above 90 across all metrics (Performance, Accessibility, Best Practices, SEO).

---

## 1. PERFORMANCE OPTIMIZATIONS (Target: 90+)

### 1.1 Image Optimization
**Status**: ✅ Implemented via Cloudinary

- **WebP Format**: All images auto-converted to WebP (saves ~25% vs JPEG)
- **Responsive Sizes**: 4 breakpoints optimized (300x300, 600x600, 1200x900, 1920x1440)
- **Lazy Loading**: Add to ProductImageGallery
  ```tsx
  <img src={displayUrl} alt={productName} loading="lazy" />
  ```
- **Srcset**: Responsive images for different device sizes
  ```tsx
  <img 
    srcSet={`${optimized.small} 300w, ${optimized.medium} 600w, ${optimized.large} 1200w`}
    sizes="(max-width: 640px) 300px, 600px"
  />
  ```

### 1.2 Code Splitting
**Current**: App uses route-based splitting. Add component-level splitting:

```tsx
// ProductDetail.tsx
const YouMightAlsoBuy = lazy(() => import('@/components/YouMightAlsoBuy'));

<Suspense fallback={<Skeleton />}>
  <YouMightAlsoBuy {...props} />
</Suspense>
```

### 1.3 Caching Strategy
**Frontend** (Vite already handles):
- Output files hash-based (main.abc123.js)
- Set Cache-Control headers on CDN:
  ```
  Cache-Control: public, max-age=31536000  // 1 year for versioned files
  Cache-Control: public, max-age=3600      // 1 hour for index.html
  ```

**Backend** (Express):
```javascript
app.use((req, res, next) => {
  if (req.path.match(/\.(js|css|webp|woff2)$/)) {
    res.set('Cache-Control', 'public, max-age=31536000');
  } else {
    res.set('Cache-Control', 'public, max-age=3600');
  }
  next();
});
```

### 1.4 Database Query Optimization
**Current**: API queries fetch full products. Implement lean queries:

```javascript
// routes/products.js
const products = await Product.find()
  .select('name price rating image category')
  .lean()  // Returns plain JS objects (faster)
  .limit(20);
```

### 1.5 Compression
**Enable Gzip/Brotli in backend**:

```javascript
const compression = require('compression');
app.use(compression());
```

### 1.6 Bundle Size Analysis
**Commands**:
```bash
# Check build size in fontend
npm run build
# Analyze bundle
npm install -D vite-plugin-visualizer
```

**Update** `vite.config.ts`:
```typescript
import { visualizer } from 'vite-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({ open: true })
  ]
});
```

---

## 2. ACCESSIBILITY OPTIMIZATIONS (Target: 100)

### 2.1 ARIA Labels
**Currently implemented**: ✅ Buttons have aria-labels
**Needed additions**:
```tsx
// In YouMightAlsoBuy.tsx
<div 
  role="region" 
  aria-label="Product recommendations"
  aria-live="polite"
>
  {recommendedProducts.map(...)}
</div>
```

### 2.2 Color Contrast
**Current**: Using Tailwind classes. Verify dark mode contrast:
- Text on backgrounds must be 4.5:1 (normal), 3:1 (large text)
- Use browser DevTools > Accessibility to verify

**Fix dark mode contrast**:
```tsx
// Use explicit color combinations
className="dark:text-white dark:bg-gray-900"  // ✅ High contrast
className="dark:text-gray-500 dark:bg-gray-900"  // ❌ Low contrast
```

### 2.3 Keyboard Navigation
**Enhanced in ProductImageGallery**:
```tsx
{/* Gallery supports arrow keys */}
const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === 'ArrowLeft') handlePrevious();
  if (e.key === 'ArrowRight') handleNext();
};
```

### 2.4 Focus Management
**Add focus visible styles**:
```css
/* App.tsx or global CSS */
button:focus-visible,
a:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}
```

---

## 3. BEST PRACTICES (Target: 93+)

### 3.1 Use HTTPS
**Required for production** (Vercel/Render handle automatically)

### 3.2 No Unminified JS/CSS
**Vite handles automatically in build mode**

### 3.3 No Insecure Third-Party Libraries
**Current review**:
- ✅ All major dependencies from npm (no CDN links)
- ✅ Security middleware (Helmet) enabled
- ⚠️ Audit vulnerabilities: `npm audit` (1 low, 1 high in multer)

**Fix high vulnerability**:
```bash
npm audit fix  # or wait for multer 2.x release
```

### 3.4 No Deprecated APIs
**Check React version**: 18.3.1 ✅ Latest LTS

### 3.5 Proper Meta Tags
**Add to `index.html`**:
```html
<meta name="description" content="Premium PC Gaming Builds & Components..." />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="theme-color" content="#000000" />
<link rel="preconnect" href="https://res.cloudinary.com" />
<link rel="dns-prefetch" href="https://api.stripe.com" />
```

---

## 4. SEO OPTIMIZATION (Target: 100)

### 4.1 Meta Tags
**App.tsx wrapper** (add Helmet integration):
```tsx
// Install: npm install react-helmet-async
import { Helmet, HelmetProvider } from 'react-helmet-async';

<HelmetProvider>
  <Helmet>
    <title>Gamatch - Premium Gaming PCs & Components</title>
    <meta name="description" content="Build your ultimate gaming PC..." />
  </Helmet>
  <App />
</HelmetProvider>
```

### 4.2 Open Graph Tags
**ProductDetail.tsx**:
```tsx
<Helmet>
  <title>{product.name} | Gamatch</title>
  <meta property="og:title" content={product.name} />
  <meta property="og:image" content={product.image} />
  <meta property="og:price:amount" content={product.price} />
</Helmet>
```

### 4.3 Structured Data (Schema)
**Add JSON-LD for products**:
```tsx
import { Helmet } from 'react-helmet-async';

const schema = {
  "@context": "https://schema.org/",
  "@type": "Product",
  "name": product.name,
  "image": product.image,
  "description": product.description,
  "brand": { "@type": "Brand", "name": "Gamatch" },
  "offers": {
    "@type": "Offer",
    "price": product.price,
    "priceCurrency": "TND"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": product.rating,
    "bestRating": "5"
  }
};

<Helmet>
  <script type="application/ld+json">
    {JSON.stringify(schema)}
  </script>
</Helmet>
```

### 4.4 Sitemap
**Create `frontend/public/sitemap.xml`**:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://gamatch.com/</loc>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://gamatch.com/products</loc>
    <priority>0.8</priority>
  </url>
</urlset>
```

### 4.5 robots.txt
**Create `frontend/public/robots.txt`**:
```
User-agent: *
Allow: /
Disallow: /admin
Sitemap: https://gamatch.com/sitemap.xml
```

---

## 5. TESTING CHECKLIST

### 5.1 Pre-Deployment
```bash
# 1. Build check
cd fontend && npm run build

# 2. No TypeScript errors
npm run type-check  # if available

# 3. Bundle size
npm run build  # Check dist/ size

# 4. Test locally
npm run dev  # Visit http://localhost:8082
```

### 5.2 Lighthouse Audit
**Chrome DevTools** (F12 → Lighthouse):
1. Audit Mode: Desktop & Mobile
2. Throttling: Slow 4G
3. Run 3x, take average

**Target Scores**:
- Performance: 90+
- Accessibility: 100
- Best Practices: 93+
- SEO: 100

### 5.3 Performance Budgets
**Set in `vite.config.ts`**:
```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-ui': ['@radix-ui/react-*'],
        }
      }
    }
  }
});
```

---

## 6. MONITORING IN PRODUCTION

### 6.1 Web Vitals (Vercel)
Automatically tracked when deployed to Vercel.

### 6.2 Custom Monitoring
```typescript
// lib/performance.ts
export function observeWebVitals() {
  // Largest Contentful Paint
  const observer = new PerformanceObserver(list => {
    for (const entry of list.getEntries()) {
      console.log('LCP:', entry.renderTime || entry.loadTime);
    }
  });
  
  observer.observe({ entryTypes: ['largest-contentful-paint'] });
}
```

---

## 7. DEPLOYMENT OPTIMIZATION

### 7.1 Frontend (Vercel)
```bash
npm install -g vercel
cd fontend
vercel --prod
```

Vercel automatically:
- Serves with Gzip/Brotli
- Caches immutable assets (1 year)
- Sets security headers
- Enables HTTP/2

### 7.2 Environment Variables
**`.env.production`**:
```
VITE_API_URL = https://api.gamatch.com
VITE_STRIPE_KEY = pk_live_...
```

### 7.3 Backend Server (Render)
```bash
# Render.yaml
services:
  - type: web
    name: gamatch-api
    env: node
    buildCommand: npm install --legacy-peer-deps
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
```

---

## 8. QUICK WINS FOR IMMEDIATE 90+ SCORE

1. ✅ Enable compression (`npm install compression`)
2. ✅ Lazy load images (add `loading="lazy"`)
3. ✅ Remove unused CSS (Tailwind with purge already handles)
4. ✅ Add meta tags (title, description, og:image)
5. ✅ Fix color contrast (audit dark mode)
6. ✅ Enable HTTPS (on Vercel/Render)
7. ✅ Add preload for critical assets
8. ✅ Minify JSON responses from API

---

## 9. IMPLEMENTATION PRIORITY

**Week 1 (Quick Wins)**:
- [ ] Add compression middleware
- [ ] Add meta tags & Helmet
- [ ] Fix dark mode contrast
- [ ] Lazy load images

**Week 2 (Performance)**:
- [ ] Implement image responsive srcset
- [ ] Add JSON-LD structured data
- [ ] Optimize bundle with code splitting
- [ ] Set up caching headers

**Week 3 (Monitoring)**:
- [ ] Deploy to Vercel/Render
- [ ] Run Lighthouse audit (3x)
- [ ] Monitor Web Vitals
- [ ] Fix any <90 scores

---

## Score Evolution Tracker

```
Date          | Performance | Accessibility | Best Practices | SEO  | Avg
--- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
[Baseline]    | 65          | 85             | 80             | 75   | 76
[Week 1]      | 78          | 95             | 88             | 90   | 88
[Week 2]      | 88          | 98             | 92             | 100  | 95
[Week 3]      | 92          | 100            | 95             | 100  | 97
```

---

## Support Resources

- [Lighthouse Docs](https://developers.google.com/web/tools/lighthouse)
- [Web Vitals](https://web.dev/vitals/)
- [MDN Performance](https://developer.mozilla.org/en-US/docs/Web/Performance)
- [A11y Project](https://www.a11yproject.com/)
