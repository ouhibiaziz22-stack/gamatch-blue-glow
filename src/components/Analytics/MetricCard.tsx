import React from "react";
import { TrendingUp, TrendingDown, Users, ShoppingCart, DollarSign, AlertCircle } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number; // percentage change
  icon: React.ReactNode;
  description?: string;
  unit?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  icon,
  description,
  unit = "",
}) => {
  const isPositive = change && change >= 0;
  const isNegative = change && change < 0;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-1">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {value}
            {unit && <span className="text-lg text-gray-500">{unit}</span>}
          </p>
          {description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {description}
            </p>
          )}
        </div>
        <div className="ml-4">
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
            {icon}
          </div>
        </div>
      </div>

      {change !== undefined && (
        <div className="mt-4 flex items-center gap-1">
          {isPositive && <TrendingUp size={16} className="text-green-500" />}
          {isNegative && <TrendingDown size={16} className="text-red-500" />}
          <span
            className={`text-sm font-medium ${
              isPositive
                ? "text-green-600 dark:text-green-400"
                : isNegative
                  ? "text-red-600 dark:text-red-400"
                  : "text-gray-600 dark:text-gray-400"
            }`}
          >
            {change > 0 && "+"}
            {change}% vs dernière période
          </span>
        </div>
      )}
    </div>
  );
};

// Metrics Grid Component
interface MetricsGridProps {
  metrics: MetricCardProps[];
}

export const MetricsGrid: React.FC<MetricsGridProps> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, idx) => (
        <MetricCard key={idx} {...metric} />
      ))}
    </div>
  );
};

export default MetricCard;
