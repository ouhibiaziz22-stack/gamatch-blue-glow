import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="bg-gamatch-navy text-primary-foreground/70 py-16 mt-20">
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg gamatch-accent-gradient flex items-center justify-center">
              <span className="text-primary-foreground font-display font-bold text-sm">G</span>
            </div>
            <span className="font-display font-bold text-xl text-primary-foreground">
              Ga<span className="text-primary">match</span>
            </span>
          </div>
          <p className="text-sm leading-relaxed">Premium gaming gear for champions. Level up your setup with Gamatch.</p>
        </div>
        <div>
          <h4 className="font-display font-semibold text-primary-foreground mb-4">Shop</h4>
          <div className="flex flex-col gap-2 text-sm">
            <Link to="/products" className="hover:text-primary transition-colors">All Products</Link>
            <Link to="/products?category=Controllers" className="hover:text-primary transition-colors">Controllers</Link>
            <Link to="/products?category=Audio" className="hover:text-primary transition-colors">Audio</Link>
            <Link to="/products?category=Keyboards" className="hover:text-primary transition-colors">Keyboards</Link>
          </div>
        </div>
        <div>
          <h4 className="font-display font-semibold text-primary-foreground mb-4">Support</h4>
          <div className="flex flex-col gap-2 text-sm">
            <span className="hover:text-primary transition-colors cursor-pointer">Help Center</span>
            <span className="hover:text-primary transition-colors cursor-pointer">Shipping</span>
            <span className="hover:text-primary transition-colors cursor-pointer">Returns</span>
          </div>
        </div>
        <div>
          <h4 className="font-display font-semibold text-primary-foreground mb-4">Company</h4>
          <div className="flex flex-col gap-2 text-sm">
            <span className="hover:text-primary transition-colors cursor-pointer">About</span>
            <span className="hover:text-primary transition-colors cursor-pointer">Careers</span>
            <span className="hover:text-primary transition-colors cursor-pointer">Contact</span>
          </div>
        </div>
      </div>
      <div className="border-t border-primary-foreground/10 mt-12 pt-6 text-center text-sm">
        © 2026 Gamatch. All rights reserved.
      </div>
    </div>
  </footer>
);

export default Footer;
