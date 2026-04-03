import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronRight, Zap } from 'lucide-react';
import { recommendationEngine, type Recommendation, type ProductFeatures } from '@/lib/recommendationEngine';

interface YouMightAlsoBuyProps {
  currentProductId: string;
  userId?: string;
  products: ProductFeatures[];
  onProductSelect: (productId: string) => void;
}

export function YouMightAlsoBuy({ 
  currentProductId, 
  userId = 'guest',
  products,
  onProductSelect 
}: YouMightAlsoBuyProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [recommendedProducts, setRecommendedProducts] = useState<ProductFeatures[]>([]);

  useEffect(() => {
    // Initialize catalog
    recommendationEngine.initializeCatalog(products);
    
    // Load user history
    recommendationEngine.loadFromLocalStorage(userId);

    // Track current product view
    recommendationEngine.trackUserBehavior(userId, 'view', currentProductId);

    // Get recommendations
    const recs = recommendationEngine.getRecommendations(userId, [currentProductId], 4);
    setRecommendations(recs);

    // Map recommendations to products
    const mapped = recs
      .map(rec => products.find(p => p.id === rec.productId))
      .filter((p): p is ProductFeatures => !!p);
    
    setRecommendedProducts(mapped);
    setLoading(false);
  }, [currentProductId, userId, products]);

  if (loading) {
    return (
      <Card className="dark:bg-gray-900 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="dark:text-white">You Might Also Like</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-40 w-full rounded-lg dark:bg-gray-800" />
                <Skeleton className="h-4 w-full dark:bg-gray-800" />
                <Skeleton className="h-4 w-20 dark:bg-gray-800" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (recommendedProducts.length === 0) {
    return null;
  }

  return (
    <Card className="dark:bg-gray-900 dark:border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="dark:text-white">You Might Also Like</CardTitle>
            <CardDescription className="dark:text-gray-400">
              Curated recommendations based on your interests
            </CardDescription>
          </div>
          <Badge variant="secondary" className="dark:bg-gray-800 dark:text-gray-200">
            <Zap className="w-3 h-3 mr-1" />
            AI Powered
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {recommendedProducts.map((product, idx) => {
            const rec = recommendations[idx];
            return (
              <div 
                key={product.id}
                className="group cursor-pointer"
                onClick={() => onProductSelect(product.id)}
              >
                {/* Image Placeholder */}
                <div className="relative h-40 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-gray-800 dark:to-gray-700 rounded-lg overflow-hidden mb-3 group-hover:shadow-lg transition-shadow">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-4xl">
                      {product.name.charAt(0)}
                    </span>
                  </div>
                  
                  {/* Confidence Badge */}
                  {rec && (
                    <div className="absolute top-2 right-2">
                      <Badge variant="default" className="bg-green-500 text-white text-xs">
                        {Math.round(rec.confidence * 100)}% match
                      </Badge>
                    </div>
                  )}
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <ChevronRight className="w-6 h-6 text-white" />
                  </div>
                </div>

                {/* Product Info */}
                <h3 className="font-semibold text-sm mb-1 dark:text-white line-clamp-2">
                  {product.name}
                </h3>

                {/* Rating */}
                <div className="flex items-center mb-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <span 
                        key={i}
                        className={`text-xs ${i < product.rating ? '⭐' : '☆'}`}
                      >
                        {i < product.rating ? '⭐' : '☆'}
                      </span>
                    ))}
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                    {product.rating}
                  </span>
                </div>

                {/* Price */}
                <div className="mb-2">
                  <span className="font-bold text-sm dark:text-white">
                    ${product.price}
                  </span>
                </div>

                {/* Reason */}
                {rec && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    {rec.reason}
                  </p>
                )}

                {/* View Button */}
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full dark:border-gray-700 dark:hover:bg-gray-800"
                  onClick={(e) => {
                    e.stopPropagation();
                    onProductSelect(product.id);
                  }}
                >
                  View
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
