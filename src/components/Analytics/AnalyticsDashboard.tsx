import React, { useState, useEffect } from "react";
import { Calendar, Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MetricCard, MetricsGrid } from "@/components/Analytics/MetricCard";
import SalesChart from "@/components/Analytics/SalesChart";
import OrderStats from "@/components/Analytics/OrderStats";
import { DataTable, TopItems } from "@/components/Analytics/DataTable";

// Mock data generator
const generateMockSalesData = () => {
  const data = [];
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    data.push({
      date: date.toLocaleDateString("fr-FR", { month: "short", day: "numeric" }),
      sales: Math.floor(Math.random() * 100) + 50,
      revenue: Math.floor(Math.random() * 5000) + 2000,
      orders: Math.floor(Math.random() * 30) + 10,
    });
  }
  return data;
};

interface AnalyticsDashboardProps {
  period?: "week" | "month" | "year";
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  period = "month",
}) => {
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(period);
  const salesData = generateMockSalesData();

  // Mock KPI data
  const metrics = [
    {
      title: "Revenu Total",
      value: "125,450",
      unit: "€",
      change: 12.5,
      icon: <span className="text-2xl">💰</span>,
      description: "Cette période vs précédente",
    },
    {
      title: "Commandes",
      value: "428",
      change: 8.3,
      icon: <span className="text-2xl">📦</span>,
      description: "Commandes complétées",
    },
    {
      title: "Prix Moyen",
      value: "293",
      unit: "€",
      change: 2.1,
      icon: <span className="text-2xl">💳</span>,
      description: "Par commande",
    },
    {
      title: "Taux Conversion",
      value: "3.2",
      unit: "%",
      change: -0.5,
      icon: <span className="text-2xl">📈</span>,
      description: "Visiteurs → Acheteurs",
    },
  ];

  // Mock order status data
  const orderStatusData = [
    { name: "Confirmées", value: 185, percentage: 43 },
    { name: "Traitées", value: 120, percentage: 28 },
    { name: "Livrées", value: 98, percentage: 23 },
    { name: "Annulées", value: 25, percentage: 6 },
  ];

  // Mock top products
  const topProducts = [
    { name: "RTX 4090", value: 2450, change: 15 },
    { name: "AMD Ryzen 9", value: 1890, change: 8 },
    { name: "DDR5 64GB Kit", value: 1567, change: -3 },
    { name: "SSD Samsung 990 Pro", value: 1234, change: 12 },
    { name: "Refroid Noctua NH-D15", value: 987, change: 5 },
  ];

  // Mock top customers
  const topCustomers = [
    { name: "Client A (Entreprise)", value: 15450, change: 25 },
    { name: "Client B", value: 12300, change: 10 },
    { name: "Client C", value: 9800, change: -5 },
    { name: "Client D", value: 8500, change: 18 },
    { name: "Client E", value: 7200, change: 3 },
  ];

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1500);
  };

  const handleExport = () => {
    // TODO: Implement CSV/PDF export
    console.log("Export data for period:", selectedPeriod);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Dashboard Analytics
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Vue d'ensemble des performances de votre boutique
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2">
              <Calendar size={18} className="text-gray-500 dark:text-gray-400" />
              <select
                value={selectedPeriod}
                onChange={(e) =>
                  setSelectedPeriod(e.target.value as "week" | "month" | "year")
                }
                className="bg-transparent text-sm font-medium text-gray-700 dark:text-gray-300 outline-none"
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

            <Button
              onClick={handleExport}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Download size={16} />
              Exporter
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="mb-8">
          <MetricsGrid metrics={metrics} />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <SalesChart
              data={salesData}
              type="area"
              title="Revenus & Ventes - 30 derniers jours"
              height={350}
            />
          </div>
          <div>
            <OrderStats data={orderStatusData} height={350} />
          </div>
        </div>

        {/* Top Products & Customers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <TopItems
            items={topProducts}
            title="Top 5 Produits"
            formatValue={(v) => `${v.toLocaleString()} ventes`}
          />
          <TopItems
            items={topCustomers}
            title="Top 5 Clients"
            formatValue={(v) => `${(v / 1000).toFixed(1)}K€`}
          />
        </div>

        {/* Orders Table */}
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
                render: (v) => `${String(v)}€`,
              },
              {
                key: "status",
                label: "Statut",
                render: (v) => (
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      String(v) === "Livrée"
                        ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100"
                        : String(v) === "Traitée"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100"
                          : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-100"
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
            data={[
              {
                orderId: "#ORD-001",
                customer: "Client A",
                total: 2450,
                status: "Livrée",
                date: new Date(Date.now() - 86400000),
              },
              {
                orderId: "#ORD-002",
                customer: "Client B",
                total: 1890,
                status: "Traitée",
                date: new Date(Date.now() - 172800000),
              },
              {
                orderId: "#ORD-003",
                customer: "Client C",
                total: 3210,
                status: "Confirmée",
                date: new Date(Date.now() - 259200000),
              },
              {
                orderId: "#ORD-004",
                customer: "Client D",
                total: 1567,
                status: "Livrée",
                date: new Date(Date.now() - 345600000),
              },
              {
                orderId: "#ORD-005",
                customer: "Client E",
                total: 2890,
                status: "Traitée",
                date: new Date(Date.now() - 432000000),
              },
            ]}
            maxRows={5}
          />
        </div>

        {/* Footer Info */}
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          <p>Les données sont actualisées chaque heure. Dernière mise à jour: {new Date().toLocaleTimeString("fr-FR")}</p>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
