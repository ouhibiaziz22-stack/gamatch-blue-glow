import ProductCard from "@/components/ProductCard";
import HeroSection from "@/components/HeroSection";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import SupportBot from "@/components/SupportBot";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { apiToProduct } from "@/lib/productAdapter";
import type { Product } from "@/data/products";

const Index = () => {
  const [featured, setFeatured] = useState<Product[]>([]);

  useEffect(() => {
    let mounted = true;
    api.getProducts({ featured: "true" })
      .then((data) => {
        if (mounted) setFeatured(data.products.map(apiToProduct));
      })
      .catch(() => {
        if (mounted) setFeatured([]);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen">
      <HeroSection />

      {/* Featured Products */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-end justify-between mb-10"
        >
          <div>
            <span className="text-sm font-medium text-primary uppercase tracking-wider">Curated Selection</span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mt-2">Featured Gear</h2>
          </div>
          <Button asChild variant="ghost" className="text-primary hover:text-primary">
            <Link to="/products">
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="container mx-auto px-4 pb-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative rounded-3xl overflow-hidden gamatch-hero-bg p-12 md:p-16"
        >
          <div className="absolute top-1/2 right-1/4 w-64 h-64 rounded-full bg-primary/20 blur-[80px] animate-glow-pulse" />
          <div className="relative z-10 max-w-lg">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-primary mb-4">
              Ready to Dominate?
            </h2>
            <p className="text-primary/80 mb-6">
              Join thousands of gamers who trust Gamatch for their competitive edge. Free shipping on orders over 99 TND.
            </p>
            <Button asChild className="gamatch-accent-gradient h-12 px-8 font-semibold rounded-xl hover:scale-105 hover:-translate-y-1 transition-all duration-300 gamatch-glow perspective-1000">
              <Link to="/products" className="text-primary font-bold gamatch-text-glow inline-flex items-center justify-center">
                <span className="inline-block hover:rotate-y-6 transition-transform duration-300 preserve-3d">
                  Shop the Collection
                </span>
              </Link>
            </Button>
          </div>
        </motion.div>
      </section>

      <SupportBot />
    </div>
  );
};

export default Index;
