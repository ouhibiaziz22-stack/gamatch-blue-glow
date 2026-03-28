import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import Animated3DBackground from "@/components/Animated3DBackground";
import Navbar from "@/components/Navbar";
import CartDrawer from "@/components/CartDrawer";
import Footer from "@/components/Footer";
import Index from "./pages/Index";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import NotFound from "./pages/NotFound";
import CustomBuild from "./pages/CustomBuild";
import CustomBuildIntro from "./pages/CustomBuildIntro";
import Connexion from "./pages/Connexion";
import Paiement from "./pages/Paiement";
import MesCommandes from "./pages/MesCommandes";
import AdminAddProduct from "./pages/AdminAddProduct";
import Admin from "./pages/Admin";
import About from "./pages/About";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Animated3DBackground />
              <div className="relative z-10">
                <Navbar />
                <CartDrawer />
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/product/:id" element={<ProductDetail />} />
                  <Route path="/custom-build" element={<CustomBuildIntro />} />
                  <Route path="/custom-build/builder" element={<CustomBuild />} />
                  <Route path="/connexion" element={<Connexion />} />
                  <Route path="/paiement" element={<Paiement />} />
                  <Route path="/mes-commandes" element={<MesCommandes />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/admin/add-product" element={<AdminAddProduct />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <Footer />
              </div>
            </BrowserRouter>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
