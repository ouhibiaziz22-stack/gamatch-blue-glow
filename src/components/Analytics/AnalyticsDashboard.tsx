import React, { useEffect, useMemo, useState } from "react";
import { Calendar, Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MetricsGrid } from "@/components/Analytics/MetricCard";
import SalesChart from "@/components/Analytics/SalesChart";
import OrderStats from "@/components/Analytics/OrderStats";
import { DataTable, TopItems } from "@/components/Analytics/DataTable";
import { api, type ApiOrder, type ApiProduct } from "@/lib/api";
import { formatTnd } from "@/lib/currency";

interface AnalyticsDashboardProps {
  period?: "week" | "month" | "year";
}

type PeriodKey = "week" | "month" | "year";

const getPeriodStart = (period: PeriodKey, end: Date) => {
  const start = new Date(end);
  if (period === "week") {
    start.setDate(end.getDate() - 6);
  } else if (period === "month") {
    start.setDate(end.getDate() - 29);
  } else {
    start.setMonth(end.getMonth() - 11);
    start.setDate(1);
  }
  start.setHours(0, 0, 0, 0);
  return start;
};

const normalizeStatus = (status: string) => status.toLowerCase();

const isCancelled = (status: string) => {
  const normalized = normalizeStatus(status);
  return normalized.includes("cancel") || normalized.includes("annul");
};

const isDelivered = (status: string) => {
  const normalized = normalizeStatus(status);
  return normalized.includes("livr") || normalized.includes("deliv");
};

const percentChange = (current: number, previous: number) => {
  if (previous === 0) return undefined;
  return Number((((current - previous) / previous) * 100).toFixed(1));
};

const buildDailySeries = (orders: ApiOrder[], start: Date, end: Date) => {
  const days: Array<{ date: string; sales: number; revenue: number; orders: number }> = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    const label = cursor.toLocaleDateString("fr-FR", { month: "short", day: "numeric" });
    days.push({ date: label, sales: 0, revenue: 0, orders: 0 });
    cursor.setDate(cursor.getDate() + 1);
  }

  orders.forEach((order) => {
    const created = new Date(order.createdAt);
    if (created < start || created > end || isCancelled(order.status)) return;
    const label = created.toLocaleDateString("fr-FR", { month: "short", day: "numeric" });
    const bucket = days.find((d) => d.date === label);
    if (!bucket) return;
    bucket.revenue += order.total || 0;
    bucket.orders += 1;
    bucket.sales += order.items.reduce((sum, item) => sum + item.quantity, 0);
  });

  return days;
};

const buildMonthlySeries = (orders: ApiOrder[], start: Date, end: Date) => {
  const months: Array<{ date: string; sales: number; revenue: number; orders: number }> = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    const label = cursor.toLocaleDateString("fr-FR", { month: "short" });
    months.push({ date: label, sales: 0, revenue: 0, orders: 0 });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  orders.forEach((order) => {
    const created = new Date(order.createdAt);
    if (created < start || created > end || isCancelled(order.status)) return;
    const label = created.toLocaleDateString("fr-FR", { month: "short" });
    const bucket = months.find((d) => d.date === label);
    if (!bucket) return;
    bucket.revenue += order.total || 0;
    bucket.orders += 1;
    bucket.sales += order.items.reduce((sum, item) => sum + item.quantity, 0);
  });

  return months;
};

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  period = "month",
}) => {
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodKey>(period);
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [error, setError] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      let fetchedOrders: ApiOrder[] = [];
      try {
        fetchedOrders = await api.getAdminOrders();
      } catch {
        fetchedOrders = await api.getOrders();
      }
      setOrders(fetchedOrders || []);
      const productData = await api.getProducts({});
      setProducts(productData.products || []);
    } catch (err) {
      setError("Impossible de charger les données.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const now = new Date();
  const periodStart = getPeriodStart(selectedPeriod, now);
  const prevEnd = new Date(periodStart.getTime() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setTime(prevEnd.getTime() - (now.getTime() - periodStart.getTime()));

  const periodOrders = useMemo(
    () =>
      orders.filter((order) => {
        const created = new Date(order.createdAt);
        return created >= periodStart && created <= now;
      }),
    [orders, periodStart, now]
  );

  const prevOrders = useMemo(
    () =>
      orders.filter((order) => {
        const created = new Date(order.createdAt);
        return created >= prevStart && created <= prevEnd;
      }),
    [orders, prevStart, prevEnd]
  );

  const metrics = useMemo(() => {
    const currentRevenue = periodOrders
      .filter((order) => !isCancelled(order.status))
      .reduce((sum, order) => sum + (order.total || 0), 0);
    const currentOrders = periodOrders.filter((order) => !isCancelled(order.status)).length;
    const currentAverage = currentOrders ? currentRevenue / currentOrders : 0;
    const delivered = periodOrders.filter((order) => isDelivered(order.status)).length;
    const deliveryRate = currentOrders ? (delivered / currentOrders) * 100 : 0;

    const prevRevenue = prevOrders
      .filter((order) => !isCancelled(order.status))
      .reduce((sum, order) => sum + (order.total || 0), 0);
    const prevOrdersCount = prevOrders.filter((order) => !isCancelled(order.status)).length;
    const prevAverage = prevOrdersCount ? prevRevenue / prevOrdersCount : 0;
    const prevDelivered = prevOrders.filter((order) => isDelivered(order.status)).length;
    const prevDeliveryRate = prevOrdersCount ? (prevDelivered / prevOrdersCount) * 100 : 0;

    return [
      {
        title: "Revenu Total",
        value: formatTnd(currentRevenue),
        change: percentChange(currentRevenue, prevRevenue),
        icon: <span className="text-2xl">💰</span>,
        description: "Cette période vs précédente",
      },
      {
        title: "Commandes",
        value: currentOrders,
        change: percentChange(currentOrders, prevOrdersCount),
        icon: <span className="text-2xl">📦</span>,
        description: "Commandes complétées",
      },
      {
        title: "Prix Moyen",
        value: formatTnd(currentAverage),
        change: percentChange(currentAverage, prevAverage),
        icon: <span className="text-2xl">💳</span>,
        description: "Par commande",
      },
      {
        title: "Taux Livraison",
        value: deliveryRate.toFixed(1),
        unit: "%",
        change: percentChange(deliveryRate, prevDeliveryRate),
        icon: <span className="text-2xl">📈</span>,
        description: "Commandes livrées",
      },
    ];
  }, [periodOrders, prevOrders]);

  const salesData = useMemo(() => {
    if (selectedPeriod === "year") {
      return buildMonthlySeries(periodOrders, periodStart, now);
    }
    return buildDailySeries(periodOrders, periodStart, now);
  }, [periodOrders, selectedPeriod, periodStart, now]);

  const orderStatusData = useMemo(() => {
    const statusMap: Record<string, number> = {};
    periodOrders.forEach((order) => {
      const key = normalizeStatus(order.status || "pending");
      statusMap[key] = (statusMap[key] || 0) + 1;
    });
    const total = periodOrders.length || 1;
    const labelMap: Record<string, string> = {
      pending: "En attente",
      confirmed: "Confirmées",
      processing: "Traitées",
      shipped: "Expédiées",
      delivered: "Livrées",
      cancelled: "Annulées",
    };
    return Object.entries(statusMap).map(([key, value]) => ({
      name: labelMap[key] || key,
      value,
      percentage: Math.round((value / total) * 100),
    }));
  }, [periodOrders]);

  const topProducts = useMemo(() => {
    const totals: Record<string, number> = {};
    periodOrders.forEach((order) => {
      if (isCancelled(order.status)) return;
      order.items.forEach((item) => {
        totals[item.name] = (totals[item.name] || 0) + item.price * item.quantity;
      });
    });
    const ranked = Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));
    if (ranked.length > 0) return ranked;
    return products
      .slice(0, 5)
      .map((product) => ({ name: product.name, value: product.price || 0 }));
  }, [periodOrders, products]);

  const topCustomers = useMemo(() => {
    const totals: Record<string, number> = {};
    periodOrders.forEach((order) => {
      if (isCancelled(order.status)) return;
      const name =
        order.shippingAddress?.fullName ||
        (typeof order.user === "string" ? order.user : "Client");
      totals[name] = (totals[name] || 0) + order.total;
    });
    return Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));
  }, [periodOrders]);

  const recentOrders = useMemo(() => {
    return [...orders]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map((order) => ({
        orderId: `#${order._id.slice(-8).toUpperCase()}`,
        customer: order.shippingAddress?.fullName || "Client",
        total: order.total,
        status: (() => {
          const key = normalizeStatus(order.status || "pending");
          const labelMap: Record<string, string> = {
            pending: "En attente",
            confirmed: "Confirmée",
            processing: "Traitée",
            shipped: "Expédiée",
            delivered: "Livrée",
            cancelled: "Annulée",
          };
          return labelMap[key] || order.status;
        })(),
        date: new Date(order.createdAt),
      }));
  }, [orders]);

  const handleRefresh = () => {
    loadData();
  };

  const handleExport = () => {
    const safe = (value: string | number | undefined | null) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const rows: string[] = [];
    rows.push(["Section", "Champ", "Valeur"].map(safe).join(","));
    rows.push([ "Résumé", "Période", selectedPeriod ].map(safe).join(","));
    rows.push([ "Résumé", "Du", periodStart.toISOString().slice(0, 10) ].map(safe).join(","));
    rows.push([ "Résumé", "Au", now.toISOString().slice(0, 10) ].map(safe).join(","));
    rows.push([ "Résumé", "Revenu Total", metrics[0]?.value ?? "" ].map(safe).join(","));
    rows.push([ "Résumé", "Commandes", metrics[1]?.value ?? "" ].map(safe).join(","));
    rows.push([ "Résumé", "Prix Moyen", metrics[2]?.value ?? "" ].map(safe).join(","));
    rows.push([ "Résumé", "Taux Livraison", `${metrics[3]?.value ?? ""}%` ].map(safe).join(","));
    rows.push("");

    rows.push(["Top Produits", "Produit", "Valeur"].map(safe).join(","));
    topProducts.forEach((item) => {
      rows.push([ "Top Produits", item.name, formatTnd(item.value) ].map(safe).join(","));
    });
    rows.push("");

    rows.push(["Top Clients", "Client", "Valeur"].map(safe).join(","));
    topCustomers.forEach((item) => {
      rows.push([ "Top Clients", item.name, formatTnd(item.value) ].map(safe).join(","));
    });
    rows.push("");

    rows.push(["Commandes", "ID", "Client", "Total", "Statut", "Date"].map(safe).join(","));
    orders.forEach((order) => {
      rows.push([
        "Commande",
        `#${order._id.slice(-8).toUpperCase()}`,
        order.shippingAddress?.fullName || "Client",
        formatTnd(order.total),
        order.status,
        new Date(order.createdAt).toLocaleDateString("fr-FR"),
      ].map(safe).join(","));
    });

    const csv = rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `finance-export-${selectedPeriod}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard Analytics</h1>
            <p className="text-muted-foreground mt-1">
              Vue d'ensemble des performances de votre boutique
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-card border border-border rounded-lg p-2">
              <Calendar size={18} className="text-muted-foreground" />
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as PeriodKey)}
                className="bg-transparent text-sm font-medium text-foreground outline-none"
              >
                <option value="week">Cette semaine</option>
                <option value="month">Ce mois</option>
                <option value="year">Cette année</option>
              </select>
            </div>

            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={loading}
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              {loading ? "Actualisation..." : "Actualiser"}
            </Button>

            <Button onClick={handleExport} variant="outline" size="sm" className="gap-2">
              <Download size={16} />
              Exporter
            </Button>
          </div>
        </div>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        <div className="mb-8">
          <MetricsGrid metrics={metrics} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <SalesChart
              data={salesData}
              type="area"
              title="Revenus & Ventes"
              height={350}
            />
          </div>
          <div>
            <OrderStats data={orderStatusData} height={350} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <TopItems
            items={topProducts}
            title="Top 5 Produits"
            formatValue={(v) => formatTnd(v)}
          />
          <TopItems
            items={topCustomers}
            title="Top 5 Clients"
            formatValue={(v) => formatTnd(v)}
          />
        </div>

        <div className="mb-8">
          <DataTable
            title="Commandes Récentes"
            columns={[
              { key: "orderId", label: "N° Commande" },
              { key: "customer", label: "Client" },
              {
                key: "total",
                label: "Montant",
                align: "right",
                render: (v) => formatTnd(Number(v)),
              },
              {
                key: "status",
                label: "Statut",
                render: (v) => (
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      String(v).includes("Livr")
                        ? "bg-green-100 text-green-700"
                        : String(v).includes("Trait")
                          ? "bg-blue-100 text-blue-700"
                          : String(v).includes("Annul")
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {String(v)}
                  </span>
                ),
              },
              {
                key: "date",
                label: "Date",
                render: (v) =>
                  (v instanceof Date ? v : new Date(String(v))).toLocaleDateString("fr-FR"),
              },
            ]}
            data={recentOrders}
            maxRows={5}
          />
        </div>

        <div className="text-center text-sm text-muted-foreground">
          <p>
            Les données sont actualisées chaque heure. Dernière mise à jour:{" "}
            {new Date().toLocaleTimeString("fr-FR")}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
