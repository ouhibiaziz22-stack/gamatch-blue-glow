const configuredBase = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
const API_BASE = (configuredBase && configuredBase.length > 0 ? configuredBase : "/api").replace(/\/$/, "");

export interface ApiUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export interface ApiProduct {
  _id: string;
  name: string;
  price: number;
  originalPrice: number | null;
  image: string;
  category: string;
  rating: number;
  description: string;
  featured: boolean;
  stock: number;
}

export interface ApiCartItem {
  product: ApiProduct;
  quantity: number;
  _id: string;
}

export interface ApiCart {
  _id: string;
  user: string;
  items: ApiCartItem[];
}

export interface ApiOrderItem {
  product: string | ApiProduct;
  name: string;
  price: number;
  quantity: number;
}

export interface ApiOrder {
  _id: string;
  user: string;
  items: ApiOrderItem[];
  shippingAddress: {
    fullName: string;
    phone: string;
    email: string;
    city?: string;
    address?: string;
    postalCode?: string;
  };
  deliveryMethod: string;
  paymentMethod: string;
  subtotal: number;
  deliveryFee: number;
  codFee: number;
  total: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

interface AdminOrdersResponse {
  orders: ApiOrder[];
  total: number;
  page: number;
  pages: number;
}

interface OrdersResponse {
  orders: ApiOrder[];
  total?: number;
  page?: number;
  pages?: number;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = { ...((options.headers as Record<string, string>) || {}) };
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

  if (!isFormData && !headers["Content-Type"] && options.body) {
    headers["Content-Type"] = "application/json";
  }
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const res = await fetch(`${API_BASE}${normalizedEndpoint}`, { ...options, headers });

  const contentType = res.headers.get("content-type") || "";
  let data: unknown = null;
  if (contentType.includes("application/json")) {
    data = await res.json();
  } else {
    const text = await res.text();
    data = text ? { message: text } : null;
  }

  if (!res.ok) {
    const errorData = data as { message?: string; errors?: Array<{ msg?: string }> } | null;
    throw new Error(errorData?.message || errorData?.errors?.[0]?.msg || `Request failed (${res.status})`);
  }
  return data as T;
}

export const api = {
  // Auth
  register: (body: { firstName: string; lastName: string; email: string; password: string }) =>
    request<{ token: string; user: ApiUser }>("/auth/register", { method: "POST", body: JSON.stringify(body) }),

  login: (body: { email: string; password: string }) =>
    request<{ token: string; user: ApiUser }>("/auth/login", { method: "POST", body: JSON.stringify(body) }),

  getMe: () => request<{ user: ApiUser }>("/auth/me"),

  forgotPassword: (email: string) =>
    request<{ message: string }>("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) }),

  verifyCode: (email: string, code: string) =>
    request<{ message: string }>("/auth/verify-code", { method: "POST", body: JSON.stringify({ email, code }) }),

  resetPassword: (email: string, code: string, newPassword: string) =>
    request<{ message: string }>("/auth/reset-password", { method: "POST", body: JSON.stringify({ email, code, newPassword }) }),

  // Products
  getProducts: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return request<{ products: ApiProduct[]; total: number; page: number; pages: number }>(`/products${qs}`);
  },

  getProduct: (id: string) => request<ApiProduct>(`/products/${id}`),

  createProduct: (body: {
    name: string;
    price: number;
    image: string;
    category: string;
    description: string;
    stock?: number;
    originalPrice?: number | null;
    featured?: boolean;
  }) => request<ApiProduct>("/products", { method: "POST", body: JSON.stringify(body) }),

  updateProduct: (id: string, body: Partial<ApiProduct>) =>
    request<ApiProduct>(`/products/${id}`, { method: "PUT", body: JSON.stringify(body) }),

  deleteProduct: (id: string) =>
    request<{ message: string }>(`/products/${id}`, { method: "DELETE" }),

  // Cart
  getCart: () => request<ApiCart>("/cart"),
  addToCart: (productId: string, quantity = 1) =>
    request<ApiCart>("/cart", { method: "POST", body: JSON.stringify({ productId, quantity }) }),
  updateCartItem: (productId: string, quantity: number) =>
    request<ApiCart>(`/cart/${productId}`, { method: "PUT", body: JSON.stringify({ quantity }) }),
  removeCartItem: (productId: string) => request<ApiCart>(`/cart/${productId}`, { method: "DELETE" }),
  clearCart: () => request<{ message: string }>("/cart", { method: "DELETE" }),

  // Orders
  createOrder: (body: {
    shippingAddress: {
      fullName: string;
      phone: string;
      email: string;
      city?: string;
      address?: string;
      postalCode?: string;
    };
    deliveryMethod: string;
    paymentMethod: string;
  }) => request<ApiOrder>("/orders", { method: "POST", body: JSON.stringify(body) }),

  getOrders: async () => {
    const data = await request<ApiOrder[] | OrdersResponse>("/orders");
    if (Array.isArray(data)) return data;
    return Array.isArray(data.orders) ? data.orders : [];
  },
  getOrder: (id: string) => request<ApiOrder>(`/orders/${id}`),
  getAdminOrders: async () => {
    const data = await request<ApiOrder[] | AdminOrdersResponse>("/orders/admin/all");
    if (Array.isArray(data)) return data;
    return Array.isArray(data.orders) ? data.orders : [];
  },
  updateOrderStatus: (id: string, body: { status?: string; paymentStatus?: string }) =>
    request<ApiOrder>(`/orders/${id}/status`, { method: "PUT", body: JSON.stringify(body) }),
  cancelOrder: (id: string) =>
    request<{ message: string; order: ApiOrder }>(`/orders/${id}/cancel`, { method: "POST" }),
};
