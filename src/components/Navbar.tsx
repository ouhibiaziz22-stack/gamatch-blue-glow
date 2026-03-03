import { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Search, Menu, X } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { motion, AnimatePresence } from "framer-motion";

const Navbar = () => {
  const { totalItems, setIsOpen } = useCart();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/products?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl gamatch-nav-shadow border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg gamatch-accent-gradient flex items-center justify-center gamatch-glow group-hover:scale-110 transition-transform">
            <span className="text-primary-foreground font-display font-bold text-sm">G</span>
          </div>
          <span className="font-display font-bold text-xl text-foreground">
            Ga<span className="text-primary">match</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            Home
          </Link>
          <Link to="/products" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            Products
          </Link>
          <Link to="/products?category=Controllers" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            Controllers
          </Link>
          <Link to="/products?category=Audio" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            Audio
          </Link>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <AnimatePresence>
            {searchOpen && (
              <motion.form
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 220, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                onSubmit={handleSearch}
                className="overflow-hidden"
              >
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="w-full h-9 px-3 rounded-lg bg-secondary text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary"
                />
              </motion.form>
            )}
          </AnimatePresence>
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-secondary transition-colors"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Cart */}
          <button
            onClick={() => setIsOpen(true)}
            className="relative p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-secondary transition-colors"
          >
            <ShoppingCart className="w-5 h-5" />
            {totalItems > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full gamatch-accent-gradient text-primary-foreground text-xs flex items-center justify-center font-bold"
              >
                {totalItems}
              </motion.span>
            )}
          </button>

          {/* Mobile menu */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-secondary transition-colors"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden bg-card border-b border-border"
          >
            <div className="container mx-auto px-4 py-4 flex flex-col gap-3">
              <Link to="/" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-muted-foreground hover:text-primary py-2">Home</Link>
              <Link to="/products" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-muted-foreground hover:text-primary py-2">Products</Link>
              <Link to="/products?category=Controllers" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-muted-foreground hover:text-primary py-2">Controllers</Link>
              <Link to="/products?category=Audio" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-muted-foreground hover:text-primary py-2">Audio</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
