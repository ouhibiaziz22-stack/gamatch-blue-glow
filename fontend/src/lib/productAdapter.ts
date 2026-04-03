import type { ApiProduct } from "@/lib/api";
import type { Product } from "@/data/products";

export const apiToProduct = (product: ApiProduct): Product => ({
  id: product._id,
  name: product.name,
  price: product.price,
  originalPrice: product.originalPrice ?? undefined,
  image: product.image,
  category: product.category,
  rating: product.rating,
  description: product.description,
  featured: product.featured,
});
