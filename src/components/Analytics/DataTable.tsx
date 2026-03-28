import React from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

interface TableColumn {
  key: string;
  label: string;
  render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode;
  align?: "left" | "center" | "right";
}

interface DataTableProps {
  columns: TableColumn[];
  data: Record<string, unknown>[];
  title?: string;
  maxRows?: number;
}

export const DataTable: React.FC<DataTableProps> = ({
  columns,
  data,
  title,
  maxRows = 10,
}) => {
  const displayData = data.slice(0, maxRows);

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      {title && (
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-secondary border-b border-border">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-${
                    col.align || "left"
                  }`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayData.length > 0 ? (
              displayData.map((row, idx) => (
                <tr key={idx} className="border-b border-border hover:bg-secondary/60 transition-colors">
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-6 py-4 text-sm text-foreground text-${
                        col.align || "left"
                      }`}
                    >
                      {col.render
                        ? col.render(row[col.key], row)
                        : (() => {
                            const value = row[col.key];
                            if (
                              typeof value === "string" ||
                              typeof value === "number" ||
                              typeof value === "boolean"
                            ) {
                              return String(value);
                            }
                            return "";
                          })()}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-10 text-center text-muted-foreground"
                >
                  Aucune donnée disponible
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {data.length > maxRows && (
        <div className="px-6 py-3 bg-secondary border-t border-border text-xs text-muted-foreground">
          Affichage de {displayData.length} sur {data.length} entrées
        </div>
      )}
    </div>
  );
};

interface TopItemsProps {
  items: Array<{ name: string; value: number; change?: number }>;
  title: string;
  formatValue?: (value: number) => string;
}

export const TopItems: React.FC<TopItemsProps> = ({
  items,
  title,
  formatValue = (v) => v.toString(),
}) => {
  return (
    <div className="bg-card rounded-lg p-6 border border-border">
      <h3 className="text-lg font-semibold text-foreground mb-4">{title}</h3>

      <div className="space-y-3">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-3 rounded-lg bg-secondary hover:bg-secondary/70 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <span className="text-sm font-semibold text-foreground">
                {formatValue(item.value)}
              </span>
              {item.change !== undefined && (
                <>
                  {item.change >= 0 ? (
                    <div className="text-green-600 flex items-center gap-0.5">
                      <ArrowUpRight size={14} />
                      <span className="text-xs font-medium">{item.change}%</span>
                    </div>
                  ) : (
                    <div className="text-red-600 flex items-center gap-0.5">
                      <ArrowDownRight size={14} />
                      <span className="text-xs font-medium">{Math.abs(item.change)}%</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DataTable;
