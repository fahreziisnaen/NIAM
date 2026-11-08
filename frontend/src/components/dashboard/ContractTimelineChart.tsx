"use client";

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Calendar, ArrowRight } from "lucide-react";

interface TimelinePoint {
  month: string;
  contracts: number;
  warranties: number;
}

interface ContractTimelineChartProps {
  data?: TimelinePoint[];
  timelineData?: TimelinePoint[];
  onViewCalendar?: () => void;
}

export function ContractTimelineChart({
  data,
  timelineData,
  onViewCalendar,
}: ContractTimelineChartProps) {
  const chartData = timelineData || data || [
    { month: "Nov", contracts: 8, warranties: 6 },
    { month: "Dec", contracts: 9, warranties: 7 },
    { month: "Jan", contracts: 12, warranties: 10 },
    { month: "Feb", contracts: 9, warranties: 7 },
    { month: "Mar", contracts: 7, warranties: 5 },
  ];
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between h-[280px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-blue-600" />
          <h3 className="text-xs font-bold text-slate-800 tracking-tight">
            Contract Timeline
          </h3>
        </div>
        <button
          onClick={onViewCalendar}
          className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center space-x-1 transition-colors"
        >
          <span>View Calendar</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end space-x-4 text-xs mt-1">
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
          <span className="text-slate-600 font-medium text-[11px]">Contracts</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="text-slate-600 font-medium text-[11px]">Warranties</span>
        </div>
      </div>

      {/* Line Chart */}
      <div className="w-full h-44 mt-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "#64748b" }}
            />
            <YAxis
              domain={[0, 15]}
              ticks={[0, 5, 10, 15]}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "#64748b" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                borderRadius: "8px",
                fontSize: "12px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
            />
            <Line
              type="monotone"
              dataKey="contracts"
              stroke="#2563EB"
              strokeWidth={2}
              dot={{ r: 4, fill: "#2563EB" }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="warranties"
              stroke="#10B981"
              strokeWidth={2}
              dot={{ r: 4, fill: "#10B981" }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

