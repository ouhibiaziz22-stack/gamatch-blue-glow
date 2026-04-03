import React from "react";
import { TrendingDown, TrendingUp } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
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
  const isPositive = change !== undefined && change >= 0;
  const isNegative = change !== undefined && change < 0;

  return (
    <div className="bg-card rounded-lg p-6 border border-border hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground font-medium mb-1">{title}</p>
          <p className="text-2xl font-bold text-foreground">
            {value}
            {unit && <span className="text-lg text-muted-foreground">{unit}</span>}
          </p>
          {description && (
            <p className="text-xs text-muted-foreground mt-2">{description}</p>
          )}
        </div>
        <div className="ml-4">
          <div className="p-3 rounded-lg bg-primary/10 text-primary">{icon}</div>
        </div>
      </div>

      {change !== undefined && (
        <div className="mt-4 flex items-center gap-1">
          {isPositive && <TrendingUp size={16} className="text-green-500" />}
          {isNegative && <TrendingDown size={16} className="text-red-500" />}
          <span
            className={`text-sm font-medium ${
              isPositive
                ? "text-green-600"
                : isNegative
                  ? "text-red-600"
                  : "text-muted-foreground"
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
