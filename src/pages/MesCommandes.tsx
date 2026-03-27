import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { formatTnd } from "@/lib/currency";

interface Order {
  _id: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  status: string;
  paymentStatus: string;
  deliveryMethod: string;
  createdAt: string;
}

const statusLabels: Record<string, string> = {
  pending: "En attente",
  confirmed: "Confirmee",
  processing: "En preparation",
  shipped: "Expediee",
  delivered: "Livree",
  cancelled: "Annulee",
};

function MesCommandes() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      api.getOrders()
        .then((data) => setOrders(data))
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user]);

  if (!user) {
    return (
      <section style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
        <div style={{ textAlign: "center" }}>
          <h2 style={{ color: "#fff", marginBottom: 16 }}>Please sign in to view your orders</h2>
          <Link to="/connexion" style={{ color: "#8b5cf6", textDecoration: "underline" }}>
            Sign In
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section style={{ minHeight: "60vh", padding: "120px 20px 40px", maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ color: "#fff", fontSize: 28, marginBottom: 24 }}>Mes Commandes</h1>

      {loading && <p style={{ color: "#aaa" }}>Loading...</p>}

      {!loading && orders.length === 0 && (
        <p style={{ color: "#aaa" }}>
          Aucune commande.{" "}
          <Link to="/products" style={{ color: "#8b5cf6" }}>
            Browse products
          </Link>
        </p>
      )}

      {orders.map((order) => (
        <div
          key={order._id}
          style={{
            background: "rgba(255,255,255,0.05)",
            borderRadius: 12,
            padding: 20,
            marginBottom: 16,
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
            <span style={{ color: "#8b5cf6", fontWeight: 600 }}>
              #{order._id.slice(-8).toUpperCase()}
            </span>
            <span style={{ color: "#aaa", fontSize: 14 }}>
              {new Date(order.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
            </span>
          </div>

          <div style={{ marginBottom: 8 }}>
            {order.items.map((item, i) => (
              <div key={i} style={{ color: "#ddd", fontSize: 14, marginBottom: 4 }}>
                {item.name} x{item.quantity} — {formatTnd(item.price * item.quantity)}
              </div>
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <span
              style={{
                padding: "4px 12px",
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 600,
                background: order.status === "delivered" ? "#22c55e33" : order.status === "cancelled" ? "#ef444433" : "#8b5cf633",
                color: order.status === "delivered" ? "#22c55e" : order.status === "cancelled" ? "#ef4444" : "#8b5cf6",
              }}
            >
              {statusLabels[order.status] || order.status}
            </span>
            <span style={{ color: "#fff", fontWeight: 700, fontSize: 18 }}>{formatTnd(order.total)}</span>
          </div>
        </div>
      ))}
    </section>
  );
}

export default MesCommandes;
