import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Gamepad2, Headphones, Keyboard, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroBg from "@/assets/hero-bg.jpg";

const FloatingIcon = ({ children, delay, x, y }: { children: React.ReactNode; delay: number; x: string; y: string }) => (
  <motion.div
    className="absolute w-16 h-16 rounded-2xl gamatch-accent-gradient gamatch-glow-intense flex items-center justify-center text-primary-foreground"
    style={{ left: x, top: y }}
    animate={{
      y: [0, -20, 0],
      rotateZ: [0, 8, -8, 0],
      rotateY: [0, 15, -15, 0],
    }}
    transition={{ duration: 5, delay, repeat: Infinity, ease: "easeInOut" }}
  >
    {children}
  </motion.div>
);

const HeroSection = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img src={heroBg} alt="" className="w-full h-full object-cover opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-r from-gamatch-black/95 via-gamatch-black/80 to-gamatch-black/50" />
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background to-transparent" />
      </div>

      {/* Glow orbs */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-primary/8 blur-[150px] animate-glow-pulse" />
      <div className="absolute bottom-1/4 left-1/3 w-64 h-64 rounded-full bg-gamatch-amber/8 blur-[120px] animate-glow-pulse" style={{ animationDelay: "1.5s" }} />

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10 py-20">
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-sm font-medium mb-6">
              <Zap className="w-3.5 h-3.5 fill-primary" />
              New Collection 2026
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-5xl md:text-7xl font-bold leading-tight mb-6"
          >
            <span className="text-foreground">Level Up Your</span>
            <br />
            <span className="bg-clip-text text-transparent gamatch-accent-gradient gamatch-text-glow">Gaming Setup</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-foreground/60 mb-8 max-w-lg"
          >
            Premium gaming gear designed for champions. Discover controllers, headsets, keyboards and more at unbeatable prices.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap gap-4"
          >
            <Button asChild className="gamatch-accent-gradient text-primary-foreground h-12 px-8 text-base font-semibold rounded-xl hover:opacity-90 transition-opacity gamatch-glow">
              <Link to="/products">
                Shop Now <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-12 px-8 text-base font-semibold rounded-xl border-primary/30 text-primary hover:bg-primary/10 bg-transparent">
              <Link to="/products?category=Controllers">
                Explore Controllers
              </Link>
            </Button>
          </motion.div>
        </div>

        {/* Floating 3D icons */}
        <div className="hidden lg:block">
          <FloatingIcon delay={0} x="65%" y="15%">
            <Gamepad2 className="w-7 h-7" />
          </FloatingIcon>
          <FloatingIcon delay={1.2} x="78%" y="45%">
            <Headphones className="w-7 h-7" />
          </FloatingIcon>
          <FloatingIcon delay={2.4} x="62%" y="70%">
            <Keyboard className="w-7 h-7" />
          </FloatingIcon>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
