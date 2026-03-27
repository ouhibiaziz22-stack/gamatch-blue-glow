import React from "react";
import { Shield, Truck, RotateCcw, Headphones } from "lucide-react";

interface TrustBadgetProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
}

const TrustBadget: React.FC<TrustBadgetProps> = ({ icon, title, description }) => (
  <div className="flex flex-col items-center text-center p-4">
    <div className="mb-3 text-blue-600 dark:text-blue-400">{icon}</div>
    <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">{title}</h3>
    <p className="text-xs text-gray-600 dark:text-gray-400">{description}</p>
  </div>
);

export const TrustBadges: React.FC<{ variant?: "minimal" | "full" }> = ({ variant = "full" }) => {
  const badges = [
    {
      icon: <Shield size={28} />,
      title: "Sécurisé",
      description: "Paiements SSL cryptés et données protégées",
    },
    {
      icon: <Truck size={28} />,
      title: "Livraison Rapide",
      description: "Expédition rapide dans le MENA et international",
    },
    {
      icon: <RotateCcw size={28} />,
      title: "Retours Simples",
      description: "30 jours pour retourner sans questions",
    },
    {
      icon: <Headphones size={28} />,
      title: "Support 24/7",
      description: "Équipe support disponible en permanent",
    },
  ];

  if (variant === "minimal") {
    return (
      <div className="grid grid-cols-2 gap-4 py-4">
        {badges.slice(0, 2).map((badge, idx) => (
          <TrustBadget key={idx} {...badge} />
        ))}
      </div>
    );
  }

  return (
    <section className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {badges.map((badge, idx) => (
            <TrustBadget key={idx} {...badge} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustBadges;
