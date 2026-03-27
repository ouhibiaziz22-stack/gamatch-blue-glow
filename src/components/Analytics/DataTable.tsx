import React from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

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
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {title && (
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-6 py-3 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-${
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
                <tr
                  key={idx}
                  className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-6 py-4 text-sm text-gray-900 dark:text-gray-100 text-${
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
                  className="px-6 py-10 text-center text-gray-500 dark:text-gray-400"
                >
                  Aucune donnée disponible
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {data.length > maxRows && (
        <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400">
          Affichage de {displayData.length} sur {data.length} entrées
        </div>
      )}
    </div>
  );
};

// Component for showing top items (products, customers, etc)
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
    <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {title}
      </h3>

      <div className="space-y-3">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {item.name}
              </p>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {formatValue(item.value)}
              </span>
              {item.change !== undefined && (
                <>
                  {item.change >= 0 ? (
                    <div className="text-green-600 dark:text-green-400 flex items-center gap-0.5">
                      <ArrowUpRight size={14} />
                      <span className="text-xs font-medium">{item.change}%</span>
                    </div>
                  ) : (
                    <div className="text-red-600 dark:text-red-400 flex items-center gap-0.5">
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
