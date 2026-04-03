import { useEffect, useMemo, useState } from "react";
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
  const [redeemed, setRedeemed] = useState(0);
  const [loyaltyMessage, setLoyaltyMessage] = useState("");

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

  useEffect(() => {
    if (!user) return;
    const key = user._id ? `loyalty_redeemed_${user._id}` : `loyalty_redeemed_${user.email}`;
    const stored = localStorage.getItem(key);
    setRedeemed(stored ? Number(stored) || 0 : 0);
  }, [user]);

  const loyalty = useMemo(() => {
    const earnedPoints = Math.floor(
      orders
        .filter((order) => order.status !== "cancelled")
        .reduce((sum, order) => sum + order.total, 0)
    );
    const availablePoints = Math.max(earnedPoints - redeemed * 1000, 0);
    const giftCards = Math.floor(availablePoints / 1000);
    const nextTarget = giftCards > 0 ? 0 : 1000 - (availablePoints % 1000 || 1000);
    return { earnedPoints, availablePoints, giftCards, nextTarget };
  }, [orders, redeemed]);

  const redeemGiftCard = () => {
    if (!user) return;
    if (loyalty.giftCards <= 0) return;
    const key = user._id ? `loyalty_redeemed_${user._id}` : `loyalty_redeemed_${user.email}`;
    const next = redeemed + 1;
    localStorage.setItem(key, String(next));
    setRedeemed(next);
    setLoyaltyMessage("Carte cadeau de 100 DT generee. Utilisez-la lors du paiement.");
  };

  if (!user) {
    return (
      <section className="orders-page">
        <div className="orders-empty">
          <h2>Please sign in to view your orders</h2>
          <Link to="/connexion">Sign In</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="orders-page">
      <div className="orders-header">
        <div>
          <h1>Mes Commandes</h1>
          <p>Consultez vos achats et vos points fidelite.</p>
        </div>
        <Link className="orders-link" to="/products">
          Continuer mes achats
        </Link>
      </div>

      <div className="orders-loyalty">
        <div>
          <h2>Points fidelite</h2>
          <p>
            Points disponibles: <strong>{loyalty.availablePoints}</strong> | Total accumule:{" "}
            <strong>{loyalty.earnedPoints}</strong>
          </p>
          {loyalty.nextTarget > 0 && (
            <p className="orders-subtle">
              Plus que {loyalty.nextTarget} points pour obtenir une carte cadeau de 100 DT.
            </p>
          )}
        </div>
        <div className="orders-loyalty-actions">
          <div className="orders-reward">
            <span>Carte cadeau</span>
            <strong>100 DT</strong>
          </div>
          <button
            type="button"
            onClick={redeemGiftCard}
            disabled={loyalty.giftCards <= 0}
          >
            Convertir 1000 pts
          </button>
        </div>
        {loyaltyMessage && <p className="orders-message">{loyaltyMessage}</p>}
      </div>

      {loading && <p className="orders-subtle">Loading...</p>}

      {!loading && orders.length === 0 && (
        <p className="orders-subtle">
          Aucune commande.{" "}
          <Link className="orders-link" to="/products">
            Browse products
          </Link>
        </p>
      )}

      {orders.map((order) => (
        <article key={order._id} className="orders-card">
          <div className="orders-card-header">
            <span className="orders-id">#{order._id.slice(-8).toUpperCase()}</span>
            <span className="orders-date">
              {new Date(order.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
            </span>
          </div>

          <div className="orders-items">
            {order.items.map((item, i) => (
              <div key={i} className="orders-item">
                {item.name} x{item.quantity} — {formatTnd(item.price * item.quantity)}
              </div>
            ))}
          </div>

          <div className="orders-card-footer">
            <span className={`orders-status orders-status-${order.status}`}>
              {statusLabels[order.status] || order.status}
            </span>
            <span className="orders-total">{formatTnd(order.total)}</span>
          </div>
        </article>
      ))}
    </section>
  );
}

export default MesCommandes;
