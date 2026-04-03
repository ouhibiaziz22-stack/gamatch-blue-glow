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
import { useAuth } from "@/hooks/useAuth";

const roulettePrizes = [
  "10% Discount",
  "Free Mouse Pad",
  "Gaming Headset",
  "5% Discount",
  "Gaming PC",
  "Free Shipping",
];

const Index = () => {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [wonPrize, setWonPrize] = useState<string | null>(null);
  const { user } = useAuth();

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

  const spinRoulette = () => {
    if (isSpinning) return;

    const segmentAngle = 360 / roulettePrizes.length;
    const winnerIndex = Math.floor(Math.random() * roulettePrizes.length);
    const winnerCenterAngle = winnerIndex * segmentAngle + segmentAngle / 2;
    const finalAngle = 360 - winnerCenterAngle;
    const extraTurns = 5 + Math.floor(Math.random() * 3);
    const normalizedDelta = (finalAngle - (rotation % 360) + 360) % 360;
    const targetRotation = rotation + extraTurns * 360 + normalizedDelta;

    setIsSpinning(true);
    setWonPrize(null);
    setRotation(targetRotation);

    window.setTimeout(() => {
      setIsSpinning(false);
      setWonPrize(roulettePrizes[winnerIndex]);
    }, 4200);
  };

  const rouletteGradient = "conic-gradient(from -90deg, #f59e0b 0deg 60deg, #ef4444 60deg 120deg, #10b981 120deg 180deg, #3b82f6 180deg 240deg, #8b5cf6 240deg 300deg, #f97316 300deg 360deg)";

  return (
    <div className="min-h-screen">
      <HeroSection />

      {user && (
        <section className="container mx-auto px-4 pt-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl border border-primary/20 bg-card/70 backdrop-blur-md p-6 md:p-8"
          >
            <div className="flex flex-col lg:flex-row items-center gap-8">
              <div className="relative">
                <div className="absolute left-1/2 -translate-x-1/2 -top-4 w-0 h-0 border-l-[14px] border-r-[14px] border-b-[22px] border-l-transparent border-r-transparent border-b-primary z-20" />
                <div
                  className="w-52 h-52 rounded-full border-4 border-primary/40 shadow-xl relative overflow-hidden"
                  style={{
                    transform: `rotate(${rotation}deg)`,
                    transition: isSpinning ? "transform 4s cubic-bezier(0.17, 0.67, 0.2, 1)" : "none",
                    background: rouletteGradient,
                  }}
                >
                  <div className="absolute inset-[38%] rounded-full bg-background border border-primary/30" />
                </div>
              </div>

              <div className="flex-1 text-center lg:text-left">
                <p className="text-sm uppercase tracking-wider text-primary font-semibold mb-2">Giveaway Roulette</p>
                <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-3">Spin & Win a Surprise</h2>
                <p className="text-foreground/70 mb-5">
                  Try your luck for instant gifts like discounts, accessories, or even a gaming PC.
                </p>
                <div className="flex flex-wrap gap-2 justify-center lg:justify-start mb-5">
                  {roulettePrizes.map((prize) => (
                    <span key={prize} className="text-xs px-2.5 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary">
                      {prize}
                    </span>
                  ))}
                </div>
                <Button onClick={spinRoulette} disabled={isSpinning} className="h-11 px-6 gamatch-accent-gradient text-primary-foreground font-semibold rounded-xl">
                  {isSpinning ? "Spinning..." : "Spin The Wheel"}
                </Button>
                {wonPrize && (
                  <p className="mt-4 text-sm md:text-base text-primary font-semibold">
                    Congratulations! You won: {wonPrize}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </section>
      )}

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
