import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Menu, X, CircleUserRound, Moon, Sun } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import PredictiveSearch from "@/components/PredictiveSearch";
import { motion, AnimatePresence } from "framer-motion";

const Navbar = () => {
  const { totalItems, setIsOpen } = useCart();
  const { user } = useAuth();
  const { isDark, toggle: toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAdmin =
    user?.role?.toLowerCase() === "admin" ||
    user?.email?.toLowerCase() === "ouhibiaziz22@gmail.com";

  const navLinks = [
    { to: "/", label: "Accueil" },
    { to: "/products", label: "Produits" },
    { to: "/custom-build", label: "Custom Build" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg gamatch-accent-gradient flex items-center justify-center group-hover:scale-110 transition-transform">
            <span className="text-primary-foreground font-bold text-sm">G</span>
          </div>
          <span className="font-bold text-lg text-foreground hidden sm:inline">
            Gama<span className="text-primary">tech</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              {link.label}
            </Link>
          ))}
          {isAdmin && (
            <>
              <Link
                to="/admin"
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                Dashboard
              </Link>
              <Link
                to="/admin/add-product"
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                Admin
              </Link>
            </>
          )}
        </div>

        {/* SearchBar - Desktop */}
        <div className="hidden lg:flex flex-1 max-w-xs mx-8">
          <PredictiveSearch />
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-muted-foreground hover:bg-secondary transition-colors"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* User Menu */}
          {user ? (
            <Link
              to="/connexion"
              className="p-2 rounded-lg text-muted-foreground hover:bg-secondary transition-colors"
              title={user.email}
            >
              <CircleUserRound size={18} />
            </Link>
          ) : (
            <Link
              to="/connexion"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Connexion
            </Link>
          )}

          {/* Cart */}
          <button
            onClick={() => setIsOpen(true)}
            className="relative p-2 rounded-lg text-muted-foreground hover:bg-secondary transition-colors"
          >
            <ShoppingCart size={18} />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {totalItems}
              </span>
            )}
          </button>

          {/* Mobile Menu */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-lg md:hidden text-muted-foreground hover:bg-secondary transition-colors"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden bg-background border-b border-border overflow-hidden"
          >
            <div className="px-4 py-4 space-y-3">
              {/* Mobile Search */}
              <PredictiveSearch />

              {/* Mobile Links */}
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className="block text-sm font-medium text-muted-foreground hover:text-primary transition-colors py-2"
                >
                  {link.label}
                </Link>
              ))}
              {isAdmin && (
                <>
                  <Link
                    to="/admin"
                    onClick={() => setMobileOpen(false)}
                    className="block text-sm font-medium text-muted-foreground hover:text-primary transition-colors py-2"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/admin/add-product"
                    onClick={() => setMobileOpen(false)}
                    className="block text-sm font-medium text-muted-foreground hover:text-primary transition-colors py-2"
                  >
                    Ajouter Produit
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
