import { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Star } from "lucide-react";
import { Product } from "@/data/products";
import { useCart } from "@/context/CartContext";
import { motion } from "framer-motion";

interface ProductCardProps {
  product: Product;
  index?: number;
}

const ProductCard = ({ product, index = 0 }: ProductCardProps) => {
  const { addToCart } = useCart();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="perspective-1000 group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        animate={{
          rotateX: isHovered ? 2 : 0,
          rotateY: isHovered ? -3 : 0,
          scale: isHovered ? 1.02 : 1,
        }}
        transition={{ duration: 0.3 }}
        className="preserve-3d rounded-2xl overflow-hidden bg-card border border-border gamatch-card-shadow hover:gamatch-card-shadow-hover transition-shadow duration-300"
      >
        <Link to={`/product/${product.id}`}>
          <div className="relative aspect-square overflow-hidden">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            {product.originalPrice && (
              <span className="absolute top-3 left-3 px-2 py-1 rounded-md gamatch-accent-gradient text-primary-foreground text-xs font-bold">
                -{Math.round((1 - product.price / product.originalPrice) * 100)}%
              </span>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        </Link>

        <div className="p-4 space-y-2">
          <span className="text-xs font-medium text-primary uppercase tracking-wider">{product.category}</span>
          <Link to={`/product/${product.id}`}>
            <h3 className="font-display font-semibold text-foreground line-clamp-1 hover:text-primary transition-colors">
              {product.name}
            </h3>
          </Link>
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 fill-primary text-primary" />
            <span className="text-xs font-medium text-muted-foreground">{product.rating}</span>
          </div>
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-foreground">${product.price.toFixed(2)}</span>
              {product.originalPrice && (
                <span className="text-sm text-muted-foreground line-through">${product.originalPrice.toFixed(2)}</span>
              )}
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => addToCart(product)}
              className="w-9 h-9 rounded-xl gamatch-accent-gradient flex items-center justify-center text-primary-foreground hover:opacity-90 transition-opacity"
            >
              <ShoppingCart className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ProductCard;
