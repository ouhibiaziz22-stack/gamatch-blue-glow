import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Gamepad2, Headphones, Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroBg from "@/assets/hero-bg.jpg";

const FloatingIcon = ({ children, delay, x, y }: { children: React.ReactNode; delay: number; x: string; y: string }) => (
  <motion.div
    className="absolute w-14 h-14 rounded-2xl gamatch-accent-gradient gamatch-glow flex items-center justify-center text-primary-foreground"
    style={{ left: x, top: y }}
    animate={{
      y: [0, -15, 0],
      rotateZ: [0, 5, -5, 0],
    }}
    transition={{ duration: 4, delay, repeat: Infinity, ease: "easeInOut" }}
  >
    {children}
  </motion.div>
);

const HeroSection = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img src={heroBg} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-gamatch-navy/95 via-gamatch-navy/80 to-gamatch-navy/40" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </div>

      {/* Glow orbs */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-primary/10 blur-[120px] animate-glow-pulse" />
      <div className="absolute bottom-1/4 left-1/3 w-64 h-64 rounded-full bg-gamatch-sky/10 blur-[100px] animate-glow-pulse" style={{ animationDelay: "1.5s" }} />

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10 py-20">
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-primary animate-glow-pulse" />
              New Collection 2026
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-5xl md:text-7xl font-bold leading-tight mb-6"
          >
            <span className="text-primary-foreground">Level Up Your</span>
            <br />
            <span className="bg-clip-text text-transparent gamatch-accent-gradient">Gaming Setup</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-primary-foreground/70 mb-8 max-w-lg"
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
            <Button asChild variant="outline" className="h-12 px-8 text-base font-semibold rounded-xl border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 bg-transparent">
              <Link to="/products?category=Controllers">
                Explore Controllers
              </Link>
            </Button>
          </motion.div>
        </div>

        {/* Floating 3D icons - desktop only */}
        <div className="hidden lg:block">
          <FloatingIcon delay={0} x="65%" y="20%">
            <Gamepad2 className="w-6 h-6" />
          </FloatingIcon>
          <FloatingIcon delay={1} x="75%" y="50%">
            <Headphones className="w-6 h-6" />
          </FloatingIcon>
          <FloatingIcon delay={2} x="60%" y="70%">
            <Keyboard className="w-6 h-6" />
          </FloatingIcon>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
