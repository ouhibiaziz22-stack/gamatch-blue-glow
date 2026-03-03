import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="relative bg-gamatch-black border-t border-primary/10 py-16 mt-20">
    {/* Top glow line */}
    <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg gamatch-accent-gradient flex items-center justify-center gamatch-glow">
              <span className="text-primary-foreground font-display font-bold text-sm">G</span>
            </div>
            <span className="font-display font-bold text-xl text-foreground">
              Ga<span className="text-primary">match</span>
            </span>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">Premium gaming gear for champions. Level up your setup with Gamatch.</p>
        </div>
        <div>
          <h4 className="font-display font-semibold text-foreground mb-4">Shop</h4>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <Link to="/products" className="hover:text-primary transition-colors">All Products</Link>
            <Link to="/products?category=Controllers" className="hover:text-primary transition-colors">Controllers</Link>
            <Link to="/products?category=Audio" className="hover:text-primary transition-colors">Audio</Link>
            <Link to="/products?category=Keyboards" className="hover:text-primary transition-colors">Keyboards</Link>
          </div>
        </div>
        <div>
          <h4 className="font-display font-semibold text-foreground mb-4">Support</h4>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <span className="hover:text-primary transition-colors cursor-pointer">Help Center</span>
            <span className="hover:text-primary transition-colors cursor-pointer">Shipping</span>
            <span className="hover:text-primary transition-colors cursor-pointer">Returns</span>
          </div>
        </div>
        <div>
          <h4 className="font-display font-semibold text-foreground mb-4">Company</h4>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <span className="hover:text-primary transition-colors cursor-pointer">About</span>
            <span className="hover:text-primary transition-colors cursor-pointer">Careers</span>
            <span className="hover:text-primary transition-colors cursor-pointer">Contact</span>
          </div>
        </div>
      </div>
      <div className="border-t border-border mt-12 pt-6 text-center text-sm text-muted-foreground">
        © 2026 Gamatch. All rights reserved.
      </div>
    </div>
  </footer>
);

export default Footer;
