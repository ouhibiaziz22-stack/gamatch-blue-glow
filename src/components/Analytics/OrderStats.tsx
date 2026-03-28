import React from "react";
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";

interface OrderStatusData {
  name: string;
  value: number;
  percentage: number;
}

interface OrderStatsProps {
  data: OrderStatusData[];
  title?: string;
  height?: number;
  colors?: string[];
}

const DEFAULT_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(36 100% 55%)",
  "hsl(0 84% 50%)",
  "hsl(134 70% 48%)",
];

export const OrderStats: React.FC<OrderStatsProps> = ({
  data,
  title = "Statut des Commandes",
  height = 300,
  colors = DEFAULT_COLORS,
}) => {
  return (
    <div className="bg-card rounded-lg p-6 border border-border">
      {title && <h3 className="text-lg font-semibold text-foreground mb-4">{title}</h3>}

      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percentage }) => `${name}: ${percentage}%`}
            outerRadius={100}
            fill="hsl(var(--primary))"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number | string) => `${value}`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
        {data.map((item, idx) => (
          <div key={idx} className="flex items-center gap-3 p-2 rounded bg-secondary">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: colors[idx % colors.length] }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{item.name}</p>
              <p className="text-xs text-muted-foreground">
                {item.value} commandes ({item.percentage}%)
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderStats;
