/**
 * Collaborative & Content-Based Recommendation Engine
 * Combines user behavior analysis with product similarity
 */

export interface UserBehavior {
  userId: string;
  viewedProducts: string[];
  cartItems: string[];
  purchasedProducts: string[];
  ratings: Record<string, number>;
  searchQueries: string[];
}

export interface ProductFeatures {
  id: string;
  name: string;
  category: string;
  price: number;
  rating: number;
  tags: string[];
  specs?: string[];
}

export interface Recommendation {
  productId: string;
  score: number;
  reason: string;
  confidence: number;
}

class RecommendationEngine {
  private userBehaviorHistory: Map<string, UserBehavior> = new Map();
  private productCatalog: Map<string, ProductFeatures> = new Map();

  /**
   * Initialize with product catalog
   */
  initializeCatalog(products: ProductFeatures[]): void {
    products.forEach(product => {
      this.productCatalog.set(product.id, product);
    });
  }

  /**
   * Update user behavior (view, add to cart, purchase, rate)
   */
  trackUserBehavior(userId: string, action: 'view' | 'cart' | 'purchase' | 'rate', productId: string, rating?: number): void {
    const behavior = this.userBehaviorHistory.get(userId) || {
      userId,
      viewedProducts: [],
      cartItems: [],
      purchasedProducts: [],
      ratings: {},
      searchQueries: [],
    };

    switch (action) {
      case 'view':
        if (!behavior.viewedProducts.includes(productId)) {
          behavior.viewedProducts.push(productId);
        }
        break;
      case 'cart':
        if (!behavior.cartItems.includes(productId)) {
          behavior.cartItems.push(productId);
        }
        break;
      case 'purchase':
        if (!behavior.purchasedProducts.includes(productId)) {
          behavior.purchasedProducts.push(productId);
        }
        break;
      case 'rate':
        if (rating) {
          behavior.ratings[productId] = rating;
        }
        break;
    }

    this.userBehaviorHistory.set(userId, behavior);
    this.saveToLocalStorage(userId, behavior);
  }

  /**
   * Calculate cosine similarity between two products
   */
  private calculateSimilarity(product1: ProductFeatures, product2: ProductFeatures): number {
    if (product1.id === product2.id) return 0;

    let similarity = 0;

    // Category match (40% weight)
    if (product1.category === product2.category) similarity += 0.4;

    // Price range similarity (20% weight)
    const priceDiff = Math.abs(product1.price - product2.price) / Math.max(product1.price, product2.price);
    similarity += (1 - priceDiff) * 0.2;

    // Tags overlap (20% weight)
    const commonTags = product1.tags.filter(tag => product2.tags.includes(tag)).length;
    const maxTags = Math.max(product1.tags.length, product2.tags.length);
    if (maxTags > 0) {
      similarity += (commonTags / maxTags) * 0.2;
    }

    // Rating similarity (20% weight)
    const ratingDiff = Math.abs(product1.rating - product2.rating) / 5;
    similarity += (1 - ratingDiff) * 0.2;

    return Math.min(1, similarity);
  }

  /**
   * Collaborative filtering: Find users with similar purchase history
   */
  private findSimilarUsers(userId: string): string[] {
    const targetBehavior = this.userBehaviorHistory.get(userId);
    if (!targetBehavior) return [];

    const targetSet = new Set([...targetBehavior.purchasedProducts, ...targetBehavior.viewedProducts]);
    const similarUsers: Array<[string, number]> = [];

    this.userBehaviorHistory.forEach((behavior, otherUserId) => {
      if (otherUserId === userId) return;

      const otherSet = new Set([...behavior.purchasedProducts, ...behavior.viewedProducts]);
      const intersection = new Set([...targetSet].filter(x => otherSet.has(x)));
      const union = new Set([...targetSet, ...otherSet]);

      const similarity = intersection.size / union.size;
      if (similarity > 0.2) {
        similarUsers.push([otherUserId, similarity]);
      }
    });

    return similarUsers.sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id]) => id);
  }

  /**
   * Get content-based recommendations (similar to viewed/purchased products)
   */
  private getContentBasedRecommendations(userId: string, limit: number = 5): Recommendation[] {
    const behavior = this.userBehaviorHistory.get(userId);
    if (!behavior) return [];

    const userProducts = [...new Set([...behavior.purchasedProducts, ...behavior.viewedProducts])];
    const recommendations = new Map<string, number>();

    // Score all products based on similarity to user's viewed/purchased items
    this.productCatalog.forEach((candidate, productId) => {
      if (userProducts.includes(productId)) return; // Skip already viewed

      let totalSimilarity = 0;
      let count = 0;

      userProducts.forEach(userProductId => {
        const userProduct = this.productCatalog.get(userProductId);
        if (userProduct) {
          totalSimilarity += this.calculateSimilarity(userProduct, candidate);
          count++;
        }
      });

      if (count > 0) {
        const avgSimilarity = totalSimilarity / count;
        const ratingBoost = candidate.rating / 5 * 0.2;
        recommendations.set(productId, avgSimilarity + ratingBoost);
      }
    });

    return Array.from(recommendations.entries())
      .map(([productId, score]) => ({
        productId,
        score,
        reason: 'Similar to products you viewed',
        confidence: Math.min(1, score + 0.1),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Get collaborative filtering recommendations
   */
  private getCollaborativeRecommendations(userId: string, limit: number = 5): Recommendation[] {
    const similarUsers = this.findSimilarUsers(userId);
    const userBehavior = this.userBehaviorHistory.get(userId) || {
      userId,
      viewedProducts: [],
      cartItems: [],
      purchasedProducts: [],
      ratings: {},
      searchQueries: [],
    };

    const userProducts = new Set([...userBehavior.purchasedProducts, ...userBehavior.viewedProducts]);
    const recommendations = new Map<string, number>();

    similarUsers.forEach(similarUserId => {
      const similarBehavior = this.userBehaviorHistory.get(similarUserId);
      if (!similarBehavior) return;

      similarBehavior.purchasedProducts.forEach(productId => {
        if (!userProducts.has(productId)) {
          recommendations.set(productId, (recommendations.get(productId) || 0) + 1);
        }
      });
    });

    return Array.from(recommendations.entries())
      .map(([productId, count]) => ({
        productId,
        score: count / Math.max(1, similarUsers.length),
        reason: 'Recommended by similar shoppers',
        confidence: Math.min(0.8, (count / Math.max(1, similarUsers.length)) * 1.2),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Get personalized recommendations (hybrid approach)
   */
  getRecommendations(userId: string, excludeProductIds: string[] = [], limit: number = 5): Recommendation[] {
    // 60% content-based, 40% collaborative
    const contentBased = this.getContentBasedRecommendations(userId, Math.ceil(limit * 0.6));
    const collaborative = this.getCollaborativeRecommendations(userId, Math.ceil(limit * 0.4));

    // Merge and deduplicate
    const merged = new Map<string, Recommendation>();

    contentBased.forEach(rec => {
      merged.set(rec.productId, rec);
    });

    collaborative.forEach(rec => {
      const existing = merged.get(rec.productId);
      if (existing) {
        merged.set(rec.productId, {
          productId: rec.productId,
          score: (existing.score + rec.score) / 2,
          reason: existing.reason,
          confidence: Math.max(existing.confidence, rec.confidence),
        });
      } else {
        merged.set(rec.productId, rec);
      }
    });

    return Array.from(merged.values())
      .filter(rec => !excludeProductIds.includes(rec.productId))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Get trending products (based on collective views)
   */
  getTrendingProducts(limit: number = 5): Recommendation[] {
    const viewCounts = new Map<string, number>();

    this.userBehaviorHistory.forEach(behavior => {
      behavior.viewedProducts.forEach(productId => {
        viewCounts.set(productId, (viewCounts.get(productId) || 0) + 1);
      });
    });

    return Array.from(viewCounts.entries())
      .map(([productId, count]) => ({
        productId,
        score: count,
        reason: 'Trending now',
        confidence: Math.min(1, count / 100),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Persist user behavior to localStorage
   */
  private saveToLocalStorage(userId: string, behavior: UserBehavior): void {
    try {
      const key = `user_behavior_${userId}`;
      localStorage.setItem(key, JSON.stringify(behavior));
    } catch (e) {
      console.warn('Failed to save user behavior:', e);
    }
  }

  /**
   * Load user behavior from localStorage
   */
  loadFromLocalStorage(userId: string): void {
    try {
      const key = `user_behavior_${userId}`;
      const data = localStorage.getItem(key);
      if (data) {
        const behavior = JSON.parse(data);
        this.userBehaviorHistory.set(userId, behavior);
      }
    } catch (e) {
      console.warn('Failed to load user behavior:', e);
    }
  }
}

// Create singleton instance
export const recommendationEngine = new RecommendationEngine();
