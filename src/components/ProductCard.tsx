import { useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Star, Eye } from "lucide-react";
import { Product } from "@/data/products";
import { useCart } from "@/context/CartContext";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { formatTnd } from "@/lib/currency";

interface ProductCardProps {
  product: Product;
  index?: number;
}

const ProductCard = ({ product, index = 0 }: ProductCardProps) => {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 200, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 200, damping: 20 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["12deg", "-12deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-12deg", "12deg"]);
  const glowX = useTransform(mouseXSpring, [-0.5, 0.5], ["0%", "100%"]);
  const glowY = useTransform(mouseYSpring, [-0.5, 0.5], ["0%", "100%"]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width - 0.5;
    const yPct = (e.clientY - rect.top) / rect.height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const handleCardClick = () => {
    navigate(`/product/${product.id}`, { state: { product } });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="perspective-1000 group"
    >
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleCardClick}
        style={{ rotateX, rotateY }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleCardClick();
          }
        }}
        className="preserve-3d relative rounded-2xl overflow-hidden bg-card border border-border gamatch-card-shadow transition-shadow duration-500 group-hover:gamatch-card-shadow-hover group-hover:border-primary/30 cursor-pointer"
      >
        {/* Dynamic glow overlay following mouse */}
        <motion.div
          className="absolute inset-0 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: useTransform(
              [glowX, glowY],
              ([gx, gy]) => `radial-gradient(circle at ${gx} ${gy}, hsl(48 100% 50% / 0.12), transparent 60%)`
            ),
          }}
        />

        <Link to={`/product/${product.id}`} state={{ product }} onClick={(e) => e.stopPropagation()}>
          <div className="relative aspect-square overflow-hidden">
            <motion.img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
              whileHover={{ scale: 1.15 }}
              transition={{ duration: 0.6 }}
            />
            {product.originalPrice && (
              <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg gamatch-accent-gradient text-primary-foreground text-xs font-bold z-20">
                -{Math.round((1 - product.price / product.originalPrice) * 100)}%
              </span>
            )}
            {/* Hover overlay with action */}
            <div className="absolute inset-0 bg-gradient-to-t from-gamatch-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 z-10 flex items-end justify-center pb-6">
              <motion.span
                initial={{ y: 20, opacity: 0 }}
                whileHover={{ scale: 1.05 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold opacity-0 group-hover:opacity-100 transition-all duration-300 delay-100 translate-y-4 group-hover:translate-y-0"
              >
                <Eye className="w-4 h-4" /> Quick View
              </motion.span>
            </div>
          </div>
        </Link>

        <div className="p-4 space-y-2 relative z-20">
          <span className="text-xs font-medium text-primary uppercase tracking-wider">{product.category}</span>
          <Link to={`/product/${product.id}`} state={{ product }} onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors duration-300">
              {product.name}
            </h3>
          </Link>
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 fill-primary text-primary" />
            <span className="text-xs font-medium text-muted-foreground">{product.rating}</span>
          </div>
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-foreground">{formatTnd(product.price)}</span>
              {product.originalPrice && (
                <span className="text-sm text-muted-foreground line-through">{formatTnd(product.originalPrice)}</span>
              )}
            </div>
            <motion.button
              whileHover={{ scale: 1.15, rotate: 5 }}
              whileTap={{ scale: 0.85 }}
              onClick={(e) => {
                e.stopPropagation();
                addToCart(product);
              }}
              className="w-10 h-10 rounded-xl gamatch-accent-gradient flex items-center justify-center text-primary-foreground transition-all duration-300 group-hover:gamatch-glow"
            >
              <ShoppingCart className="w-4 h-4" />
            </motion.button>
          </div>
        </div>

        {/* Bottom glow line */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/0 to-transparent group-hover:via-primary/60 transition-all duration-700" />
      </motion.div>
    </motion.div>
  );
};

export default ProductCard;
