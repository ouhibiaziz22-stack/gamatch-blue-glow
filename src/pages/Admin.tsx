import React, { useState } from "react";
import AnalyticsDashboard from "@/components/Analytics/AnalyticsDashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Settings, Users, Package } from "lucide-react";

const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("analytics");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pt-20">
      {/* Admin Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Tableau de Bord Admin
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gérez votre boutique, analytics et commandes
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-gray-700 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="w-full justify-start bg-transparent border-b border-gray-200 dark:border-gray-700 rounded-none h-auto p-0">
              <TabsTrigger
                value="analytics"
                className="flex items-center gap-2 px-4 py-4 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent rounded-none"
              >
                <BarChart3 size={18} />
                Analytics
              </TabsTrigger>
              <TabsTrigger
                value="orders"
                className="flex items-center gap-2 px-4 py-4 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent rounded-none"
              >
                <Package size={18} />
                Commandes
              </TabsTrigger>
              <TabsTrigger
                value="customers"
                className="flex items-center gap-2 px-4 py-4 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent rounded-none"
              >
                <Users size={18} />
                Clients
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="flex items-center gap-2 px-4 py-4 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent rounded-none"
              >
                <Settings size={18} />
                Paramètres
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Tab Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsContent value="analytics" className="w-full">
          <AnalyticsDashboard period="month" />
        </TabsContent>

        <TabsContent value="orders" className="w-full p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-8 text-center border border-gray-200 dark:border-gray-700">
              <Package size={48} className="mx-auto text-gray-400 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Gestion des Commandes
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Section en développement - Prochainement disponible
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="customers" className="w-full p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-8 text-center border border-gray-200 dark:border-gray-700">
              <Users size={48} className="mx-auto text-gray-400 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Gestion des Clients
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Section en développement - Prochainement disponible
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="w-full p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-8 text-center border border-gray-200 dark:border-gray-700">
              <Settings size={48} className="mx-auto text-gray-400 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Paramètres de l'Admin
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Section en développement - Prochainement disponible
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPage;
