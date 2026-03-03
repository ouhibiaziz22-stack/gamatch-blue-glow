export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  rating: number;
  description: string;
  featured?: boolean;
}

export const products: Product[] = [
  {
    id: "1",
    name: "Phantom X Pro Controller",
    price: 79.99,
    originalPrice: 99.99,
    image: "https://images.unsplash.com/photo-1592840496694-26d035b52b48?w=600&q=80",
    category: "Controllers",
    rating: 4.8,
    description: "Precision gaming controller with haptic feedback and adaptive triggers for the ultimate gaming experience.",
    featured: true,
  },
  {
    id: "2",
    name: "HyperSound Elite Headset",
    price: 149.99,
    image: "https://images.unsplash.com/photo-1599669454699-248893623440?w=600&q=80",
    category: "Audio",
    rating: 4.9,
    description: "7.1 surround sound gaming headset with noise-cancelling microphone and memory foam ear cushions.",
    featured: true,
  },
  {
    id: "3",
    name: "Vortex RGB Mechanical Keyboard",
    price: 129.99,
    originalPrice: 159.99,
    image: "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=600&q=80",
    category: "Keyboards",
    rating: 4.7,
    description: "Cherry MX switches with per-key RGB lighting and aircraft-grade aluminum frame.",
    featured: true,
  },
  {
    id: "4",
    name: "NightHawk Gaming Mouse",
    price: 69.99,
    image: "https://images.unsplash.com/photo-1527814050087-3793815479db?w=600&q=80",
    category: "Mice",
    rating: 4.6,
    description: "25,600 DPI sensor with 8 programmable buttons and ultra-lightweight design.",
  },
  {
    id: "5",
    name: "UltraWide Curved Monitor 34\"",
    price: 499.99,
    originalPrice: 599.99,
    image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&q=80",
    category: "Monitors",
    rating: 4.9,
    description: "WQHD 165Hz curved gaming monitor with 1ms response time and HDR600.",
  },
  {
    id: "6",
    name: "StreamDeck Pro",
    price: 199.99,
    image: "https://images.unsplash.com/photo-1625842268584-8f3296236761?w=600&q=80",
    category: "Accessories",
    rating: 4.5,
    description: "15-key LCD streaming controller for content creators and gamers.",
  },
  {
    id: "7",
    name: "Titan Gaming Chair",
    price: 349.99,
    originalPrice: 449.99,
    image: "https://images.unsplash.com/photo-1598550476439-6847785fcea6?w=600&q=80",
    category: "Furniture",
    rating: 4.4,
    description: "Ergonomic gaming chair with 4D armrests, lumbar support, and premium PU leather.",
  },
  {
    id: "8",
    name: "RGB Mouse Pad XXL",
    price: 39.99,
    image: "https://images.unsplash.com/photo-1616788494672-ec7ca25fdda9?w=600&q=80",
    category: "Accessories",
    rating: 4.3,
    description: "Extended mouse pad with 12 RGB lighting modes and micro-textured surface.",
  },
];

export const categories = ["All", "Controllers", "Audio", "Keyboards", "Mice", "Monitors", "Accessories", "Furniture"];
