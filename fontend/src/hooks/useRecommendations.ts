import { useEffect, useState } from 'react';
import { recommendationEngine, type Recommendation, type ProductFeatures } from '@/lib/recommendationEngine';
import { useAuth } from './useAuth';

export function useRecommendations(
  products: ProductFeatures[],
  limit: number = 5,
  excludeProductIds: string[] = []
) {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [trending, setTrending] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize catalog
    recommendationEngine.initializeCatalog(products);

    // Load user behavior
    const userId = user?._id || 'guest';
    recommendationEngine.loadFromLocalStorage(userId);

    // Get personalized recommendations
    const recs = recommendationEngine.getRecommendations(userId, excludeProductIds, limit);
    setRecommendations(recs);

    // Get trending products
    const trending = recommendationEngine.getTrendingProducts(limit);
    setTrending(trending);

    setLoading(false);
  }, [products, limit, user?._id, excludeProductIds]);

  const trackInteraction = (productId: string, action: 'view' | 'cart' | 'purchase' | 'rate', rating?: number) => {
    const userId = user?._id || 'guest';
    recommendationEngine.trackUserBehavior(userId, action, productId, rating);
  };

  return {
    recommendations,
    trending,
    loading,
    trackInteraction,
  };
}
