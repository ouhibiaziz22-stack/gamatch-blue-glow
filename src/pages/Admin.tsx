import React, { useEffect, useMemo, useState } from "react";
import AnalyticsDashboard from "@/components/Analytics/AnalyticsDashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Settings, Users, Package } from "lucide-react";
import { api, type ApiOrder } from "@/lib/api";
import { formatTnd } from "@/lib/currency";

const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("analytics");
  const [settingsMessage, setSettingsMessage] = useState("");
  const [settings, setSettings] = useState({
    storeName: "Gamatech",
    supportEmail: "",
    supportPhone: "",
    currency: "TND",
    enableCod: true,
    enableCard: true,
    enableWallet: true,
    standardShipping: 12,
    expressShipping: 25,
    freeShippingThreshold: 99,
    loyaltyEnabled: true,
    loyaltyRate: 1,
    newsletter: true,
    orderNotifications: true,
  });
  const [adminOrders, setAdminOrders] = useState<ApiOrder[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersMessage, setOrdersMessage] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("admin_settings");
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as Partial<typeof settings>;
      setSettings((prev) => ({ ...prev, ...parsed }));
    } catch {
      // ignore corrupted settings
    }
  }, []);

  useEffect(() => {
    const loadOrders = async () => {
      setCustomersLoading(true);
      setOrdersLoading(true);
      try {
        let fetched: ApiOrder[] = [];
        try {
          fetched = await api.getAdminOrders();
        } catch {
          fetched = await api.getOrders();
        }
        setAdminOrders(fetched || []);
      } finally {
        setCustomersLoading(false);
        setOrdersLoading(false);
      }
    };
    loadOrders();
  }, []);

  const customers = useMemo(() => {
    const map = new Map<
      string,
      { name: string; email: string; phone: string; orders: number; total: number; lastOrder?: string }
    >();
    adminOrders.forEach((order) => {
      const name = order.shippingAddress?.fullName || "Client";
      const email = order.shippingAddress?.email || "";
      const phone = order.shippingAddress?.phone || "";
      const key = `${email}-${phone}-${name}`;
      const prev = map.get(key);
      const total = (prev?.total || 0) + (order.total || 0);
      const orders = (prev?.orders || 0) + 1;
      const lastOrder = prev?.lastOrder
        ? new Date(prev.lastOrder) > new Date(order.createdAt)
          ? prev.lastOrder
          : order.createdAt
        : order.createdAt;
      map.set(key, { name, email, phone, orders, total, lastOrder });
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [adminOrders]);

  const refreshOrders = async () => {
    setOrdersLoading(true);
    setOrdersMessage("");
    try {
      let fetched: ApiOrder[] = [];
      try {
        fetched = await api.getAdminOrders();
      } catch {
        fetched = await api.getOrders();
      }
      setAdminOrders(fetched || []);
    } finally {
      setOrdersLoading(false);
    }
  };

  const acceptOrder = async (orderId: string) => {
    setOrdersMessage("");
    try {
      const updated = await api.updateOrderStatus(orderId, { status: "confirmed" });
      setAdminOrders((prev) => prev.map((o) => (o._id === orderId ? updated : o)));
    } catch {
      setOrdersMessage("Impossible d'accepter la commande.");
    }
  };

  const cancelOrder = async (orderId: string) => {
    setOrdersMessage("");
    try {
      const res = await api.cancelOrder(orderId);
      setAdminOrders((prev) => prev.map((o) => (o._id === orderId ? res.order : o)));
    } catch {
      setOrdersMessage("Impossible de supprimer la commande.");
    }
  };

  const acceptAllOrders = async () => {
    const pending = adminOrders.filter((o) => o.status === "pending");
    if (pending.length === 0) return;
    setOrdersLoading(true);
    setOrdersMessage("");
    try {
      const updates = await Promise.all(
        pending.map((order) => api.updateOrderStatus(order._id, { status: "confirmed" }))
      );
      const map = new Map(updates.map((o) => [o._id, o]));
      setAdminOrders((prev) => prev.map((o) => map.get(o._id) || o));
      setOrdersMessage("Toutes les commandes en attente ont été acceptées.");
    } catch {
      setOrdersMessage("Impossible d'accepter toutes les commandes.");
    } finally {
      setOrdersLoading(false);
    }
  };

  const updateSetting = (key: keyof typeof settings, value: string | number | boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    if (settingsMessage) setSettingsMessage("");
  };

  const saveSettings = () => {
    localStorage.setItem("admin_settings", JSON.stringify(settings));
    setSettingsMessage("Paramètres enregistrés avec succès.");
  };

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
          <h1 className="text-3xl font-bold text-foreground">Tableau de Bord Admin</h1>
          <p className="text-muted-foreground mt-1">
            Gérez votre boutique, analytics et commandes
          </p>
        </div>
      </div>

      <div className="bg-card border-b border-border sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start bg-transparent border-b border-border rounded-none h-auto p-0">
              <TabsTrigger
                value="analytics"
                className="flex items-center gap-2 px-4 py-4 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none"
              >
                <BarChart3 size={18} />
                Analytics
              </TabsTrigger>
              <TabsTrigger
                value="orders"
                className="flex items-center gap-2 px-4 py-4 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none"
              >
                <Package size={18} />
                Commandes
              </TabsTrigger>
              <TabsTrigger
                value="customers"
                className="flex items-center gap-2 px-4 py-4 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none"
              >
                <Users size={18} />
                Clients
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="flex items-center gap-2 px-4 py-4 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none"
              >
                <Settings size={18} />
                Paramètres
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsContent value="analytics" className="w-full">
          <AnalyticsDashboard period="month" />
        </TabsContent>

        <TabsContent value="orders" className="w-full p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="bg-card rounded-lg p-6 border border-border">
              <div className="flex items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Package size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">Gestion des Commandes</h2>
                    <p className="text-muted-foreground text-sm">
                      Acceptez ou supprimez les commandes.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={acceptAllOrders}
                    className="h-10 rounded-lg px-4 font-semibold text-primary-foreground gamatch-accent-gradient"
                    disabled={ordersLoading}
                  >
                    Accepter tout
                  </button>
                  <button
                    type="button"
                    onClick={refreshOrders}
                    className="h-10 rounded-lg px-4 font-semibold text-foreground border border-border bg-background"
                    disabled={ordersLoading}
                  >
                    Actualiser
                  </button>
                </div>
              </div>

              {ordersMessage && <p className="text-sm text-muted-foreground mb-4">{ordersMessage}</p>}
              {ordersLoading && <p className="text-muted-foreground">Chargement...</p>}

              {!ordersLoading && adminOrders.length === 0 && (
                <p className="text-muted-foreground">Aucune commande trouvée.</p>
              )}

              {!ordersLoading && adminOrders.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-muted-foreground border-b border-border">
                        <th className="py-3 pr-3">Commande</th>
                        <th className="py-3 pr-3">Client</th>
                        <th className="py-3 pr-3">Total</th>
                        <th className="py-3 pr-3">Statut</th>
                        <th className="py-3 pr-3">Date</th>
                        <th className="py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminOrders.map((order) => (
                        <tr key={order._id} className="border-b border-border/60">
                          <td className="py-3 pr-3 text-foreground">
                            #{order._id.slice(-8).toUpperCase()}
                          </td>
                          <td className="py-3 pr-3 text-muted-foreground">
                            {order.shippingAddress?.fullName || "Client"}
                          </td>
                          <td className="py-3 pr-3 text-foreground">{formatTnd(order.total)}</td>
                          <td className="py-3 pr-3 text-muted-foreground">{order.status}</td>
                          <td className="py-3 pr-3 text-muted-foreground">
                            {new Date(order.createdAt).toLocaleDateString("fr-FR")}
                          </td>
                          <td className="py-3 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => acceptOrder(order._id)}
                              className="h-9 rounded-lg px-3 text-xs font-semibold text-primary-foreground gamatch-accent-gradient"
                              disabled={order.status !== "pending"}
                            >
                              Accepter
                            </button>
                            <button
                              type="button"
                              onClick={() => cancelOrder(order._id)}
                              className="h-9 rounded-lg px-3 text-xs font-semibold text-foreground border border-border bg-background"
                              disabled={order.status === "cancelled"}
                            >
                              Supprimer
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="customers" className="w-full p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="bg-card rounded-lg p-6 border border-border">
              <div className="flex items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Users size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">Gestion des Clients</h2>
                    <p className="text-muted-foreground text-sm">
                      Liste des clients basée sur les commandes.
                    </p>
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">
                  {customers.length} clients
                </span>
              </div>

              {customersLoading && <p className="text-muted-foreground">Chargement...</p>}

              {!customersLoading && customers.length === 0 && (
                <p className="text-muted-foreground">Aucun client trouvé.</p>
              )}

              {!customersLoading && customers.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-muted-foreground border-b border-border">
                        <th className="py-3 pr-3">Client</th>
                        <th className="py-3 pr-3">Email</th>
                        <th className="py-3 pr-3">Téléphone</th>
                        <th className="py-3 pr-3">Commandes</th>
                        <th className="py-3 pr-3">Total</th>
                        <th className="py-3">Dernière commande</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customers.map((customer, idx) => (
                        <tr key={`${customer.email}-${idx}`} className="border-b border-border/60">
                          <td className="py-3 pr-3 text-foreground">{customer.name}</td>
                          <td className="py-3 pr-3 text-muted-foreground">{customer.email || "-"}</td>
                          <td className="py-3 pr-3 text-muted-foreground">{customer.phone || "-"}</td>
                          <td className="py-3 pr-3 text-foreground">{customer.orders}</td>
                          <td className="py-3 pr-3 text-foreground">{formatTnd(customer.total)}</td>
                          <td className="py-3 text-muted-foreground">
                            {customer.lastOrder
                              ? new Date(customer.lastOrder).toLocaleDateString("fr-FR")
                              : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="w-full p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="bg-card rounded-lg p-6 border border-border">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Settings size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Paramètres de l'Admin</h2>
                  <p className="text-muted-foreground text-sm">
                    Configurez votre boutique ecommerce.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground">Boutique</h3>
                  <label className="grid gap-2 text-sm text-foreground">
                    Nom de la boutique
                    <input
                      className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
                      value={settings.storeName}
                      onChange={(e) => updateSetting("storeName", e.target.value)}
                    />
                  </label>
                  <label className="grid gap-2 text-sm text-foreground">
                    Email support
                    <input
                      className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
                      value={settings.supportEmail}
                      onChange={(e) => updateSetting("supportEmail", e.target.value)}
                    />
                  </label>
                  <label className="grid gap-2 text-sm text-foreground">
                    Téléphone support
                    <input
                      className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
                      value={settings.supportPhone}
                      onChange={(e) => updateSetting("supportPhone", e.target.value)}
                    />
                  </label>
                  <label className="grid gap-2 text-sm text-foreground">
                    Devise
                    <select
                      className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
                      value={settings.currency}
                      onChange={(e) => updateSetting("currency", e.target.value)}
                    >
                      <option value="TND">TND</option>
                      <option value="EUR">EUR</option>
                      <option value="USD">USD</option>
                    </select>
                  </label>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground">Paiement</h3>
                  <label className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-sm">
                    Paiement à la livraison (COD)
                    <input
                      type="checkbox"
                      checked={settings.enableCod}
                      onChange={(e) => updateSetting("enableCod", e.target.checked)}
                      className="accent-primary"
                    />
                  </label>
                  <label className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-sm">
                    Carte bancaire
                    <input
                      type="checkbox"
                      checked={settings.enableCard}
                      onChange={(e) => updateSetting("enableCard", e.target.checked)}
                      className="accent-primary"
                    />
                  </label>
                  <label className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-sm">
                    Wallet mobile
                    <input
                      type="checkbox"
                      checked={settings.enableWallet}
                      onChange={(e) => updateSetting("enableWallet", e.target.checked)}
                      className="accent-primary"
                    />
                  </label>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground">Livraison</h3>
                  <label className="grid gap-2 text-sm text-foreground">
                    Tarif Standard (TND)
                    <input
                      type="number"
                      className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
                      value={settings.standardShipping}
                      onChange={(e) => updateSetting("standardShipping", Number(e.target.value))}
                    />
                  </label>
                  <label className="grid gap-2 text-sm text-foreground">
                    Tarif Express (TND)
                    <input
                      type="number"
                      className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
                      value={settings.expressShipping}
                      onChange={(e) => updateSetting("expressShipping", Number(e.target.value))}
                    />
                  </label>
                  <label className="grid gap-2 text-sm text-foreground">
                    Livraison gratuite dès (TND)
                    <input
                      type="number"
                      className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
                      value={settings.freeShippingThreshold}
                      onChange={(e) => updateSetting("freeShippingThreshold", Number(e.target.value))}
                    />
                  </label>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground">Fidélité & Notifications</h3>
                  <label className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-sm">
                    Programme fidélité
                    <input
                      type="checkbox"
                      checked={settings.loyaltyEnabled}
                      onChange={(e) => updateSetting("loyaltyEnabled", e.target.checked)}
                      className="accent-primary"
                    />
                  </label>
                  <label className="grid gap-2 text-sm text-foreground">
                    Points par 1 TND
                    <input
                      type="number"
                      className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
                      value={settings.loyaltyRate}
                      onChange={(e) => updateSetting("loyaltyRate", Number(e.target.value))}
                    />
                  </label>
                  <label className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-sm">
                    Newsletter active
                    <input
                      type="checkbox"
                      checked={settings.newsletter}
                      onChange={(e) => updateSetting("newsletter", e.target.checked)}
                      className="accent-primary"
                    />
                  </label>
                  <label className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-sm">
                    Notifications commandes
                    <input
                      type="checkbox"
                      checked={settings.orderNotifications}
                      onChange={(e) => updateSetting("orderNotifications", e.target.checked)}
                      className="accent-primary"
                    />
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-6">
                <button
                  type="button"
                  onClick={saveSettings}
                  className="h-10 rounded-lg px-5 font-semibold text-primary-foreground gamatch-accent-gradient"
                >
                  Enregistrer
                </button>
                {settingsMessage && (
                  <span className="text-sm text-muted-foreground">{settingsMessage}</span>
                )}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPage;
