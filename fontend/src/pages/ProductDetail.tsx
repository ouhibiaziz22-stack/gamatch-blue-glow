import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Star, ArrowLeft, Truck, Shield, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";
import ProductCard from "@/components/ProductCard";
import { YouMightAlsoBuy } from "@/components/YouMightAlsoBuy";
import { formatTnd } from "@/lib/currency";
import { useEffect, useMemo, useState } from "react";
import { api, type ApiProduct } from "@/lib/api";
import { apiToProduct } from "@/lib/productAdapter";
import { useRecommendations } from "@/hooks/useRecommendations";
import { useAuth } from "@/hooks/useAuth";
import type { Product } from "@/data/products";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [productApi, setProductApi] = useState<ApiProduct | null>(null);
  const [allProducts, setAllProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [productFromState, setProductFromState] = useState<Product | null>(
    () => (location.state as { product?: Product } | null)?.product ?? null
  );

  // Convert API products to format needed by recommendation engine
  const recommendableProducts = useMemo(() => 
    allProducts.map(p => ({
      id: p._id || '',
      name: p.name,
      category: p.category || '',
      price: p.price || 0,
      rating: p.rating || 0,
      tags: [p.category || '', ...(p.tags || [])],
      specs: [],
    })), 
    [allProducts]
  );

  const { recommendations, trackInteraction } = useRecommendations(
    recommendableProducts,
    4,
    id ? [id] : []
  );

  useEffect(() => {
    let mounted = true;
    if (!id) return;
    const load = async () => {
      if (!productFromState) {
        setLoading(true);
      }
      try {
        const prod = await api.getProduct(id);
        if (!mounted) return;
        setProductApi(prod);
        
        // Track product view
        trackInteraction(id, 'view');
        
        // Fetch all products for recommendations
        const allProds = await api.getProducts({});
        if (mounted) {
          setAllProducts(allProds.products || []);
        }
      } catch {
        if (mounted) setProductApi(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [id, trackInteraction, productFromState]);

  const product = useMemo(() => {
    if (productApi) return apiToProduct(productApi);
    if (productFromState) return productFromState;
    return null;
  }, [productApi, productFromState]);

  const handleProductSelect = (productId: string) => {
    trackInteraction(productId, 'view');
    navigate(`/product/${productId}`);
  };

  const handleAddToCart = () => {
    if (!user) {
      navigate("/connexion", { state: { redirectTo: location.pathname } });
      return;
    }
    addToCart(product);
  };

  if (loading && !product) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="relative h-14 w-14">
            <div className="absolute inset-0 rounded-full border-2 border-border/60" />
            <div className="absolute inset-0 rounded-full border-2 border-t-primary border-l-primary border-r-transparent border-b-transparent animate-spin" />
            <div className="absolute inset-2 rounded-full bg-muted/40" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Loading</p>
            <h1 className="font-display text-2xl font-bold text-foreground">Loading product...</h1>
            <p className="text-sm text-muted-foreground mt-2">Fetching details and recommendations</p>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold text-foreground mb-4">Product not found</h1>
          <Button asChild variant="outline"><Link to="/products">Back to Products</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="container mx-auto px-4">
        <Link to="/products" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Products
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="perspective-1000"
          >
            <motion.div
              whileHover={{ rotateY: 5, rotateX: -3, scale: 1.02 }}
              transition={{ duration: 0.4 }}
              className="preserve-3d rounded-3xl overflow-hidden gamatch-card-shadow aspect-square"
            >
              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
            </motion.div>
          </motion.div>

          {/* Info */}
          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col justify-center">
            <span className="text-sm font-medium text-primary uppercase tracking-wider">{product.category}</span>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mt-2 mb-4">{product.name}</h1>

            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < Math.floor(product.rating) ? "fill-primary text-primary" : "text-border"}`} />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">{product.rating} / 5</span>
            </div>

            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-3xl font-bold text-foreground">{formatTnd(product.price)}</span>
              {product.originalPrice && (
                <>
                  <span className="text-lg text-muted-foreground line-through">{formatTnd(product.originalPrice)}</span>
                  <span className="px-2 py-0.5 rounded-md gamatch-accent-gradient text-primary-foreground text-xs font-bold">
                    Save {formatTnd(product.originalPrice - product.price)}
                  </span>
                </>
              )}
            </div>

            <p className="text-muted-foreground leading-relaxed mb-8">{product.description}</p>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={handleAddToCart}
                className="gamatch-accent-gradient text-primary-foreground h-14 px-10 text-lg font-semibold rounded-xl hover:opacity-90 transition-opacity gamatch-glow w-full sm:w-auto"
              >
                <ShoppingCart className="w-5 h-5 mr-2" /> Add to Cart
              </Button>
            </motion.div>

            {/* Perks */}
            <div className="grid grid-cols-3 gap-4 mt-10 pt-8 border-t border-border">
              {[
                { icon: Truck, label: "Free Shipping", sub: "Orders 99 TND+" },
                { icon: Shield, label: "2 Year Warranty", sub: "Full coverage" },
                { icon: RotateCcw, label: "30 Day Returns", sub: "No hassle" },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="text-center">
                  <Icon className="w-5 h-5 text-primary mx-auto mb-2" />
                  <p className="text-xs font-semibold text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{sub}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Related */}
        {recommendableProducts.length > 0 && (
          <section className="mt-20">
            <YouMightAlsoBuy
              currentProductId={id || ''}
              userId={user?._id}
              products={recommendableProducts}
              onProductSelect={handleProductSelect}
            />
          </section>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
