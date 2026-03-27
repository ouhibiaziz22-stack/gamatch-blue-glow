import { useMemo, useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { api, type ApiProduct, type ApiOrder } from "@/lib/api";
import { formatTnd } from "@/lib/currency";

const UNSPLASH_API_BASE = "https://api.unsplash.com";
const UNSPLASH_ACCESS_KEY = (import.meta.env.VITE_UNSPLASH_ACCESS_KEY as string | undefined)?.trim();

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

const AdminAddProduct = () => {
  const { user, loading } = useAuth();
  const isAdmin = useMemo(
    () =>
      user?.role?.toLowerCase() === "admin" ||
      user?.email?.toLowerCase() === "ouhibiaziz22@gmail.com",
    [user?.role, user?.email]
  );
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [busy, setBusy] = useState(false);
  const [imageBusy, setImageBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [imageMessage, setImageMessage] = useState("");
  const [form, setForm] = useState({
    name: "",
    category: "",
    price: "",
    originalPrice: "",
    stock: "",
    image: "",
    description: "",
    featured: false,
  });
  const [stockEdits, setStockEdits] = useState<Record<string, string>>({});

  const fetchUnsplashImage = async (query: string) => {
    if (!UNSPLASH_ACCESS_KEY) {
      throw new Error("Missing Unsplash access key. Set VITE_UNSPLASH_ACCESS_KEY in .env.");
    }
    const url =
      `${UNSPLASH_API_BASE}/search/photos?` +
      new URLSearchParams({
        query,
        per_page: "1",
        orientation: "squarish",
        content_filter: "high",
      }).toString();
    const res = await fetch(url, {
      headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` },
    });
    if (!res.ok) {
      throw new Error(`Unsplash request failed (${res.status})`);
    }
    const data = (await res.json()) as {
      results?: Array<{
        urls?: { regular?: string };
        links?: { download_location?: string };
      }>;
    };
    const first = data.results?.[0];
    const imageUrl = first?.urls?.regular;
    if (!imageUrl) {
      throw new Error("No image found for this product.");
    }
    if (first?.links?.download_location) {
      fetch(first.links.download_location, {
        headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` },
      }).catch(() => undefined);
    }
    return imageUrl;
  };

  const handleGenerateImage = async () => {
    setImageMessage("");
    const base = form.name.trim();
    const extra = form.category.trim();
    const query = [base, extra].filter(Boolean).join(" ");
    if (!query) {
      setImageMessage("Add a product name or category first.");
      return;
    }
    setImageBusy(true);
    try {
      const imageUrl = await fetchUnsplashImage(query);
      setForm((prev) => ({ ...prev, image: imageUrl }));
      setImageMessage("Image added from Unsplash.");
    } catch (err) {
      setImageMessage(getErrorMessage(err, "Failed to load image."));
    } finally {
      setImageBusy(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    api.getProducts()
      .then((data) => setProducts(data.products))
      .catch((err) => setMessage(err.message || "Failed to load products"));
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    api.getAdminOrders()
      .then((data) => setOrders(data))
      .catch(() => setOrders([]));
  }, [isAdmin]);

  if (loading) {
    return (
      <section className="container mx-auto px-4 pt-28 pb-16">
        <h1 className="text-2xl font-display font-bold text-foreground">Loading...</h1>
      </section>
    );
  }

  if (!isAdmin) {
    return (
      <section className="container mx-auto px-4 pt-28 pb-16">
        <h1 className="text-2xl font-display font-bold text-foreground">Access denied</h1>
        <p className="mt-3 text-muted-foreground">Admin access required.</p>
      </section>
    );
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const payload = {
        name: form.name.trim(),
        category: form.category.trim(),
        price: Number(form.price),
        originalPrice: form.originalPrice ? Number(form.originalPrice) : null,
        stock: form.stock ? Number(form.stock) : undefined,
        image: form.image.trim(),
        description: form.description.trim(),
        featured: form.featured,
      };

      const created = await api.createProduct(payload);
      setProducts((prev) => [created, ...prev]);
      setForm({
        name: "",
        category: "",
        price: "",
        originalPrice: "",
        stock: "",
        image: "",
        description: "",
        featured: false,
      });
      setMessage("Product added.");
    } catch (err: unknown) {
      setMessage(getErrorMessage(err, "Failed to add product"));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: string) => {
    setBusy(true);
    setMessage("");
    try {
      await api.deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p._id !== id));
      setMessage("Product deleted.");
    } catch (err: unknown) {
      setMessage(getErrorMessage(err, "Failed to delete product"));
    } finally {
      setBusy(false);
    }
  };

  const handleStockUpdate = async (id: string) => {
    const value = stockEdits[id];
    if (value === undefined || value === "") return;
    setBusy(true);
    setMessage("");
    try {
      const updated = await api.updateProduct(id, { stock: Number(value) });
      setProducts((prev) => prev.map((p) => (p._id === id ? updated : p)));
      setMessage("Stock updated.");
    } catch (err: unknown) {
      setMessage(getErrorMessage(err, "Failed to update stock"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="container mx-auto px-4 pt-28 pb-16">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-display font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground">Create products, manage stock, and track delivery performance.</p>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-primary/10 bg-gamatch-black/50 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-display font-semibold text-foreground">Add product</h2>
            {message && <span className="text-xs text-muted-foreground">{message}</span>}
          </div>
          <form onSubmit={onSubmit} className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="text-sm text-muted-foreground">
              Name
              <input
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                className="mt-2 w-full h-10 rounded-lg bg-secondary px-3 text-foreground outline-none focus:ring-2 focus:ring-primary"
              />
            </label>
            <label className="text-sm text-muted-foreground">
              Category
              <input
                value={form.category}
                onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                className="mt-2 w-full h-10 rounded-lg bg-secondary px-3 text-foreground outline-none focus:ring-2 focus:ring-primary"
              />
            </label>
            <label className="text-sm text-muted-foreground">
              Price
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                className="mt-2 w-full h-10 rounded-lg bg-secondary px-3 text-foreground outline-none focus:ring-2 focus:ring-primary"
              />
            </label>
            <label className="text-sm text-muted-foreground">
              Original price
              <input
                type="number"
                value={form.originalPrice}
                onChange={(e) => setForm((prev) => ({ ...prev, originalPrice: e.target.value }))}
                className="mt-2 w-full h-10 rounded-lg bg-secondary px-3 text-foreground outline-none focus:ring-2 focus:ring-primary"
              />
            </label>
            <label className="text-sm text-muted-foreground">
              Stock
              <input
                type="number"
                value={form.stock}
                onChange={(e) => setForm((prev) => ({ ...prev, stock: e.target.value }))}
                className="mt-2 w-full h-10 rounded-lg bg-secondary px-3 text-foreground outline-none focus:ring-2 focus:ring-primary"
              />
            </label>
            <label className="md:col-span-2 text-sm text-muted-foreground">
              Image URL
              <input
                value={form.image}
                onChange={(e) => setForm((prev) => ({ ...prev, image: e.target.value }))}
                className="mt-2 w-full h-10 rounded-lg bg-secondary px-3 text-foreground outline-none focus:ring-2 focus:ring-primary"
              />
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleGenerateImage}
                  disabled={imageBusy}
                  className="h-9 rounded-lg bg-secondary px-3 text-xs font-semibold text-foreground disabled:opacity-60"
                >
                  {imageBusy ? "Finding image..." : "Find image"}
                </button>
                {imageMessage && <span className="text-xs text-muted-foreground">{imageMessage}</span>}
              </div>
              {form.image && (
                <div className="mt-3 overflow-hidden rounded-lg border border-primary/10 bg-secondary/60">
                  <img
                    src={form.image}
                    alt="Product preview"
                    className="h-40 w-full object-cover"
                    loading="lazy"
                  />
                </div>
              )}
            </label>
            <label className="md:col-span-2 text-sm text-muted-foreground">
              Description
              <textarea
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                className="mt-2 w-full min-h-[120px] rounded-lg bg-secondary p-3 text-foreground outline-none focus:ring-2 focus:ring-primary"
              />
            </label>
            <div className="md:col-span-2 flex flex-wrap items-center gap-3">
              <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => setForm((prev) => ({ ...prev, featured: e.target.checked }))}
                />
                Featured
              </label>
              <button
                type="submit"
                disabled={busy}
                className="h-10 rounded-lg gamatch-accent-gradient px-5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
              >
                {busy ? "Working..." : "Add product"}
              </button>
            </div>
          </form>
        </div>

        <div className="rounded-2xl border border-primary/10 bg-gamatch-black/50 p-6">
          <h2 className="text-xl font-display font-semibold text-foreground">Finance (monthly)</h2>
          <div className="mt-5 grid grid-cols-1 gap-4">
            {orders.length === 0 ? (
              <div className="text-sm text-muted-foreground">No orders yet.</div>
            ) : (
              Object.entries(
                orders.reduce<Record<string, { total: number; count: number }>>((acc, order) => {
                  const key = new Date(order.createdAt).toISOString().slice(0, 7);
                  acc[key] = acc[key] || { total: 0, count: 0 };
                  acc[key].total += order.total || 0;
                  acc[key].count += 1;
                  return acc;
                }, {})
              )
                .sort((a, b) => (a[0] < b[0] ? 1 : -1))
                .slice(0, 6)
                .map(([month, data]) => (
                  <div key={month} className="rounded-xl border border-primary/10 bg-secondary/60 p-4">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">{month}</div>
                    <div className="mt-2 text-lg font-semibold text-foreground">{formatTnd(data.total)}</div>
                    <div className="text-sm text-muted-foreground">{data.count} orders</div>
                  </div>
                ))
            )}
          </div>
        </div>

        <div className="lg:col-span-4 rounded-2xl border border-primary/10 bg-gamatch-black/50 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-display font-semibold text-foreground">Inventory and delivery</h2>
            <span className="text-xs text-muted-foreground">{products.length} products</span>
          </div>

          <div className="mt-5 grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="rounded-xl border border-primary/10 bg-secondary/40 p-4">
              <h3 className="text-sm font-semibold text-foreground">Stock management</h3>
              <div className="mt-4 grid grid-cols-1 gap-3 max-h-[360px] overflow-y-auto pr-1">
                {products.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No products yet.</div>
                ) : (
                  products.map((p) => (
                    <div key={p._id} className="rounded-lg border border-primary/10 bg-secondary/60 p-3">
                      <div className="text-sm font-semibold text-foreground">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{p.category} • Stock: {p.stock}</div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <input
                          type="number"
                          value={stockEdits[p._id] ?? ""}
                          onChange={(e) => setStockEdits((prev) => ({ ...prev, [p._id]: e.target.value }))}
                          placeholder="New stock"
                          className="h-9 w-28 rounded-lg bg-secondary px-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
                        />
                        <button
                          type="button"
                          onClick={() => handleStockUpdate(p._id)}
                          disabled={busy}
                          className="h-9 rounded-lg bg-secondary px-3 text-xs font-semibold text-foreground disabled:opacity-60"
                        >
                          Update stock
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(p._id)}
                          disabled={busy}
                          className="h-9 rounded-lg bg-destructive/80 px-3 text-xs font-semibold text-destructive-foreground disabled:opacity-60"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-xl border border-primary/10 bg-secondary/40 p-4">
              <h3 className="text-sm font-semibold text-foreground">Livraison par achat</h3>
              <div className="mt-4 grid grid-cols-1 gap-3 max-h-[360px] overflow-y-auto pr-1">
                {orders.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No deliveries yet.</div>
                ) : (
                  orders.slice(0, 12).map((order) => (
                    <div key={order._id} className="rounded-lg border border-primary/10 bg-secondary/60 p-3">
                      <div className="text-sm font-semibold text-foreground">
                        {order.shippingAddress?.fullName || "Client"} • {formatTnd(order.total)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString()} • {order.deliveryMethod}
                      </div>
                      <div className="mt-2 inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs text-primary">
                        Etat: {order.status}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AdminAddProduct;
