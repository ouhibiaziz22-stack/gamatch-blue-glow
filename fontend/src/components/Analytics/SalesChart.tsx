import React from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { formatTnd } from "@/lib/currency";

interface SalesData {
  date: string;
  sales: number;
  revenue: number;
  orders?: number;
}

interface SalesChartProps {
  data: SalesData[];
  type?: "line" | "area" | "bar";
  title?: string;
  height?: number;
}

export const SalesChart: React.FC<SalesChartProps> = ({
  data,
  type = "line",
  title = "Ventes",
  height = 300,
}) => {
  const chartProps = {
    data,
    margin: { top: 5, right: 30, left: 0, bottom: 5 },
  };

  const tooltipFormatter = (value: number, name: string) =>
    name === "revenue" ? formatTnd(Number(value)) : Number(value).toLocaleString();

  const renderChart = () => {
    switch (type) {
      case "area":
        return (
          <AreaChart {...chartProps}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
            <YAxis stroke="hsl(var(--muted-foreground))" />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              formatter={tooltipFormatter}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="hsl(var(--primary))"
              fillOpacity={1}
              fill="url(#colorRevenue)"
            />
          </AreaChart>
        );

      case "bar":
        return (
          <BarChart {...chartProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
            <YAxis stroke="hsl(var(--muted-foreground))" />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              formatter={tooltipFormatter}
            />
            <Legend />
            <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
            <Bar dataKey="orders" fill="hsl(var(--accent))" radius={[8, 8, 0, 0]} />
          </BarChart>
        );

      default:
        return (
          <LineChart {...chartProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
            <YAxis stroke="hsl(var(--muted-foreground))" />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              formatter={tooltipFormatter}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="sales"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ fill: "hsl(var(--primary))", r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="hsl(var(--accent))"
              strokeWidth={2}
              dot={{ fill: "hsl(var(--accent))", r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        );
    }
  };

  return (
    <div className="bg-card rounded-lg p-6 border border-border">
      {title && <h3 className="text-lg font-semibold text-foreground mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
};

export default SalesChart;
