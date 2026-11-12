"use client";

import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { BarChart2 } from "lucide-react";

interface DistributionItem {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

interface AssetDistributionChartProps {
  data?: DistributionItem[];
  distribution?: DistributionItem[];
  totalAssets?: number;
  onCategoryClick?: (category: string) => void;
}

export function AssetDistributionChart({
  data,
  distribution,
  totalAssets = 0,
  onCategoryClick,
}: AssetDistributionChartProps) {
  const chartData = (distribution && distribution.length > 0)
    ? distribution
    : (data && data.length > 0)
    ? data
    : [];

  const displaySlices = chartData.length > 0
    ? chartData
    : [{ name: "No Assets", value: 1, color: "#f1f5f9", percentage: 0 }];

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between h-[280px]">
      {/* Card Header */}
      <div className="flex items-center space-x-2">
        <BarChart2 className="w-4 h-4 text-blue-600" />
        <h3 className="text-xs font-bold text-slate-800 tracking-tight">
          Asset Distribution
        </h3>
      </div>

      {/* Donut Chart + Legend */}
      <div className="flex items-center justify-between mt-2">
        {/* Donut Chart with Center Text */}
        <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              {chartData.length > 0 && (
                <Tooltip
                  formatter={(val: any, name: any) => [`${val} devices`, name]}
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderRadius: "8px",
                    fontSize: "12px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                />
              )}
              <Pie
                data={displaySlices}
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={74}
                paddingAngle={chartData.length > 0 ? 2 : 0}
                dataKey="value"
                strokeWidth={0}
              >
                {displaySlices.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          {/* Centered Total Label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xl font-bold text-slate-900 leading-tight">
              {totalAssets.toLocaleString()}
            </span>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Total
            </span>
          </div>
        </div>

        {/* Legend on Right */}
        <div className="flex-1 pl-4 space-y-2">
          {chartData.length > 0 ? (
            chartData.map((item) => (
              <div
                key={item.name}
                onClick={() => onCategoryClick && onCategoryClick(item.name)}
                className="flex items-center justify-between text-xs cursor-pointer hover:bg-slate-50 px-1.5 py-1 rounded-lg transition-colors group"
                title={`View ${item.name} in Asset Inventory`}
              >
                <div className="flex items-center space-x-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 group-hover:scale-125 transition-transform"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-slate-600 font-medium group-hover:text-blue-700 transition-colors">
                    {item.name}
                  </span>
                </div>
                <span className="font-bold text-slate-900 group-hover:text-blue-700">{item.percentage}%</span>
              </div>
            ))
          ) : (
            <div className="text-left py-2">
              <p className="text-xs font-semibold text-slate-600">No assets recorded</p>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Add devices to track hardware category distribution
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

