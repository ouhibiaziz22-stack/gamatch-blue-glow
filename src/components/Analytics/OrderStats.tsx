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

const DEFAULT_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export const OrderStats: React.FC<OrderStatsProps> = ({
  data,
  title = "Statut des Commandes",
  height = 300,
  colors = DEFAULT_COLORS,
}) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {title}
        </h3>
      )}

      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percentage }) => `${name}: ${percentage}%`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number | string) => {
              return `${value}`;
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend Table */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
        {data.map((item, idx) => (
          <div key={idx} className="flex items-center gap-3 p-2 rounded bg-gray-50 dark:bg-gray-700/50">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: colors[idx % colors.length] }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {item.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
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
