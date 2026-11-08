"use client";

import React, { useState, useEffect } from "react";
import { BarChart3, Download, FileSpreadsheet, Eye, Printer, FileText, CheckCircle2 } from "lucide-react";
import { apiUrl } from "@/lib/api";

interface ReportsViewProps {
  initialReport?: string;
}

export function ReportsView({ initialReport = "asset_register" }: ReportsViewProps) {
  const [reportTypes, setReportTypes] = useState<any[]>([]);
  const [selectedReport, setSelectedReport] = useState<string>(initialReport);
  const [previewData, setPreviewData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(apiUrl("/api/v1/reports/types"))
      .then((res) => res.json())
      .then((data) => setReportTypes(data))
      .catch(() => {});
  }, []);

  const loadPreview = (reportId: string) => {
    setSelectedReport(reportId);
    setLoading(true);
    fetch(apiUrl(`/api/v1/reports/preview/${reportId}?limit=20`))
      .then((res) => res.json())
      .then((data) => {
        setPreviewData(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadPreview(initialReport || "asset_register");
  }, [initialReport]);

  const downloadFile = (format: "xlsx" | "csv") => {
    window.open(apiUrl(`/api/v1/reports/download/${selectedReport}?format=${format}`), "_blank");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Enterprise Reporting & Compliance Auditing
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Generate and export official financial, operational, and regulatory reports across the network asset estate.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2 self-start sm:self-auto">
          <button
            onClick={() => downloadFile("xlsx")}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export Excel</span>
          </button>
          <button
            onClick={() => downloadFile("csv")}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Print PDF</span>
          </button>
        </div>
      </div>

      {/* Main Grid: 12 Report Categories on Left, Live Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 12 Report Definitions List */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-1.5 max-h-[640px] overflow-y-auto">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider px-2 py-1 text-slate-400">
            Available Regulatory & Operations Reports (12)
          </h3>
          {reportTypes.map((rep) => {
            const isSel = selectedReport === rep.id;
            return (
              <button
                key={rep.id}
                onClick={() => loadPreview(rep.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  isSel
                    ? "bg-blue-50/70 border-blue-500 shadow-sm"
                    : "bg-white border-transparent hover:bg-slate-50 border-slate-100"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${isSel ? "text-blue-700" : "text-slate-800"}`}>
                    {rep.name}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    {rep.category}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {rep.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Live Report Preview Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold text-slate-800">
                  {previewData?.title || "Report Preview"}
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-slate-500">
                Sample preview showing top 20 rows
              </span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto min-h-[460px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-50">
                    {previewData?.headers?.map((h: string, idx: number) => (
                      <th key={idx} className="py-2 px-3 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400">
                        Generating preview report...
                      </td>
                    </tr>
                  ) : previewData?.rows?.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400">
                        No rows generated for this report.
                      </td>
                    </tr>
                  ) : (
                    previewData?.rows?.map((row: any[], rIdx: number) => (
                      <tr key={rIdx} className="hover:bg-slate-50">
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="py-2 px-3 text-slate-700 whitespace-nowrap">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Official report generated by Phillip Securities HK Asset Engine</span>
            <span className="font-semibold text-slate-700">Audit Reference: PSHK-REP-{selectedReport.toUpperCase()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

