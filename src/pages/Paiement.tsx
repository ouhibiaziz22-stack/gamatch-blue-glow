import { type ChangeEvent, type FormEvent, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { formatTnd } from "@/lib/currency";

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

const deliveryOptions = {
  standard: { label: "Livraison Standard (48h)", fee: 12 },
  express: { label: "Livraison Express (24h)", fee: 25 },
  pickup: { label: "Retrait en magasin", fee: 0 },
} as const;

type PaymentMethod = "card" | "cash" | "bank" | "wallet";
type DeliveryMethod = keyof typeof deliveryOptions;

type CheckoutForm = {
  fullName: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  postalCode: string;
  cardName: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvv: string;
  bankRef: string;
  walletPhone: string;
};

function Paiement() {
  const { items, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("standard");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<CheckoutForm>({
    fullName: "",
    phone: "",
    email: "",
    city: "",
    address: "",
    postalCode: "",
    cardName: "",
    cardNumber: "",
    cardExpiry: "",
    cardCvv: "",
    bankRef: "",
    walletPhone: "",
  });

  const cartItems = useMemo(
    () =>
      items.map((item) => ({
        id: item.product.id,
        title: item.product.name,
        total: item.product.price * item.quantity,
      })),
    [items]
  );

  const subtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.total, 0),
    [cartItems]
  );
  const deliveryFee = deliveryOptions[deliveryMethod].fee;
  const codFee = paymentMethod === "cash" ? 7 : 0;
  const total = subtotal + deliveryFee + codFee;

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name as keyof CheckoutForm]: value }));
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (cartItems.length === 0) {
      setMessage("Votre panier est vide.");
      return;
    }

    if (!form.fullName || !form.phone || !form.email) {
      setMessage("Merci de remplir vos informations de contact.");
      return;
    }

    if (deliveryMethod !== "pickup" && (!form.city || !form.address)) {
      setMessage("Merci de remplir votre adresse de livraison.");
      return;
    }

    if (paymentMethod === "card" && (!form.cardName || !form.cardNumber || !form.cardExpiry || !form.cardCvv)) {
      setMessage("Merci de remplir les informations de carte.");
      return;
    }

    if (paymentMethod === "bank" && !form.bankRef) {
      setMessage("Merci de saisir la reference du virement bancaire.");
      return;
    }

    if (paymentMethod === "wallet" && !form.walletPhone) {
      setMessage("Merci de saisir le numero du wallet mobile.");
      return;
    }

    // If user is logged in, create order via API
    if (user) {
      setLoading(true);
      try {
        await api.createOrder({
          shippingAddress: {
            fullName: form.fullName,
            phone: form.phone,
            email: form.email,
            city: form.city,
            address: form.address,
            postalCode: form.postalCode,
          },
          deliveryMethod,
          paymentMethod,
        });
        setMessage("Paiement valide. Votre commande est en cours de traitement.");
        clearCart();
        setTimeout(() => navigate("/mes-commandes"), 2000);
      } catch (err: unknown) {
        setMessage(getErrorMessage(err, "Erreur lors de la creation de la commande."));
      } finally {
        setLoading(false);
      }
    } else {
      setMessage("Paiement valide. Votre commande est en cours de traitement.");
      clearCart();
    }
  };

  return (
    <section className="paiement-page">
      <video
        className="paiement-video-bg"
        autoPlay
        muted
        loop
        playsInline
      >
        <source src="/thnd.mp4" type="video/mp4" />
      </video>
      <div className="paiement-video-overlay" />

      <div className="paiement-window">
        <div className="paiement-browser-bar">
          <div className="paiement-browser-dots">
            <span />
            <span />
            <span />
          </div>
          <div className="paiement-browser-address">gamatech-checkout.com</div>
        </div>

        <div className="paiement-shell">
          <div className="paiement-brand-row">
            <div className="paiement-logo">G</div>
            <h1>Gamatech Checkout</h1>
          </div>

          <div className="paiement-layout">
            <aside className="paiement-steps">
              <article className="paiement-step done">
                <span className="paiement-step-icon">&#10003;</span>
                <div>
                  <h3>Validation du panier</h3>
                  <div className="paiement-mini-items">
                    {cartItems.slice(0, 3).map((item) => (
                      <span key={item.id}>{item.title.slice(0, 12)}</span>
                    ))}
                    {cartItems.length === 0 && <span>Panier vide</span>}
                  </div>
                </div>
              </article>

              <article className="paiement-step done">
                <span className="paiement-step-icon">&#10003;</span>
                <div>
                  <h3>Livraison</h3>
                  <p>{deliveryOptions[deliveryMethod].label}</p>
                  <small>{deliveryFee > 0 ? formatTnd(deliveryFee) : "Gratuite"}</small>
                </div>
              </article>

              <article className="paiement-step active">
                <span className="paiement-step-icon">&#8226;</span>
                <div>
                  <h3>Paiement</h3>
                  <p>Total: {formatTnd(total)}</p>
                </div>
              </article>

              <div className="paiement-order-mini">
                <p>
                  <span>Sous-total</span>
                  <strong>{formatTnd(subtotal)}</strong>
                </p>
                <p>
                  <span>Livraison</span>
                  <strong>{deliveryFee > 0 ? formatTnd(deliveryFee) : "0 TND"}</strong>
                </p>
                <p>
                  <span>Frais COD</span>
                  <strong>{codFee > 0 ? formatTnd(codFee) : "0 TND"}</strong>
                </p>
                <p className="paiement-grand-total">
                  <span>Total</span>
                  <strong>{formatTnd(total)}</strong>
                </p>
              </div>
            </aside>

            <form className="paiement-form paiement-card-form" onSubmit={onSubmit}>
              <div className="paiement-method-tabs">
                <button type="button" className={paymentMethod === "card" ? "active" : ""} onClick={() => setPaymentMethod("card")}>
                  Carte
                </button>
                <button type="button" className={paymentMethod === "cash" ? "active" : ""} onClick={() => setPaymentMethod("cash")}>
                  Livraison
                </button>
                <button type="button" className={paymentMethod === "bank" ? "active" : ""} onClick={() => setPaymentMethod("bank")}>
                  Virement
                </button>
                <button type="button" className={paymentMethod === "wallet" ? "active" : ""} onClick={() => setPaymentMethod("wallet")}>
                  Wallet
                </button>
              </div>

              <h2>Coordonnees</h2>
              <div className="paiement-grid">
                <label>
                  Nom complet
                  <input type="text" name="fullName" value={form.fullName} onChange={onChange} />
                </label>
                <label>
                  Telephone
                  <input type="text" name="phone" value={form.phone} onChange={onChange} />
                </label>
                <label>
                  Email
                  <input type="email" name="email" value={form.email} onChange={onChange} />
                </label>
                <label>
                  Code postal
                  <input type="text" name="postalCode" value={form.postalCode} onChange={onChange} />
                </label>
              </div>

              <h2>Adresse de livraison</h2>
              <div className="paiement-choice-group">
                {(Object.entries(deliveryOptions) as [DeliveryMethod, (typeof deliveryOptions)[DeliveryMethod]][]).map(([key, option]) => (
                  <label key={key} className={`paiement-choice ${deliveryMethod === key ? "active" : ""}`}>
                    <input
                      type="radio"
                      name="deliveryMethod"
                      checked={deliveryMethod === key}
                      onChange={() => setDeliveryMethod(key)}
                    />
                    <span>{option.label}</span>
                    <strong>{option.fee > 0 ? formatTnd(option.fee) : "Gratuit"}</strong>
                  </label>
                ))}
              </div>

              {deliveryMethod !== "pickup" && (
                <div className="paiement-grid">
                  <label>
                    Ville
                    <input type="text" name="city" value={form.city} onChange={onChange} />
                  </label>
                  <label>
                    Adresse
                    <input type="text" name="address" value={form.address} onChange={onChange} />
                  </label>
                </div>
              )}

              {paymentMethod === "card" && (
                <>
                  <h2>Coordonnees de la carte</h2>
                  <label>
                    Numero
                    <div className="paiement-input-with-icon">
                      <input
                        type="text"
                        name="cardNumber"
                        value={form.cardNumber}
                        onChange={onChange}
                        placeholder="0000 0000 0000 0000"
                      />
                      <div className="paiement-card-icons" aria-hidden="true">
                        <span>VISA</span>
                        <span>MC</span>
                        <span>AE</span>
                      </div>
                    </div>
                  </label>
                  <div className="paiement-grid paiement-card-mini-grid">
                    <label>
                      MM/AA
                      <input type="text" name="cardExpiry" value={form.cardExpiry} onChange={onChange} />
                    </label>
                    <label>
                      CVV
                      <div className="paiement-input-with-icon">
                        <input type="password" name="cardCvv" value={form.cardCvv} onChange={onChange} />
                        <span className="paiement-inline-icon" aria-hidden="true">
                          &#128179;
                        </span>
                      </div>
                    </label>
                  </div>
                  <label>
                    Titulaire de la carte
                    <input type="text" name="cardName" value={form.cardName} onChange={onChange} placeholder="Prenom Nom" />
                  </label>
                </>
              )}

              {paymentMethod === "bank" && (
                <label>
                  Reference du virement
                  <input type="text" name="bankRef" value={form.bankRef} onChange={onChange} />
                </label>
              )}

              {paymentMethod === "wallet" && (
                <label>
                  Numero du wallet
                  <input type="text" name="walletPhone" value={form.walletPhone} onChange={onChange} />
                </label>
              )}

              {paymentMethod === "cash" && (
                <p className="paiement-empty">
                  Paiement a la livraison selectionne. Frais supplementaires: {formatTnd(codFee)}.
                </p>
              )}

              <button type="submit" className="paiement-submit-btn">
                Payer
              </button>
              {message && <p className="paiement-message">{message}</p>}
              {cartItems.length === 0 && (
                <p className="paiement-empty">
                  Votre panier est vide. <Link to="/products">Voir les produits</Link>
                </p>
              )}
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Paiement;
