"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import * as XLSX from "xlsx"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

interface AnalyticsData {
  kpis: {
    totalRequests: number; completedRequests: number; pendingRequests: number
    rejectedRequests: number; completionRate: number; avgProcessingDays: number
  }
  typeBreakdown: Array<{ type: string; count: number }>
  statusDistribution: Array<{ status: string; count: number }>
  volumeTrends: Array<{ month: string; count: number }>
  bottlenecks: Array<{ status: string; count: number; avgWaitDays: number }>
}

export default function CemeteryAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/cemetery/analytics")
      .then((res) => res.json())
      .then((d) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const exportToCSV = useCallback(() => {
    if (!data) return
    const rows = [
      ["Cemetery Services Analytics"],
      ["Generated", new Date().toLocaleDateString()],
      [], ["Metric", "Value"],
      ["Total Requests", data.kpis.totalRequests],
      ["Completed", data.kpis.completedRequests],
      ["Pending", data.kpis.pendingRequests],
      ["Rejected", data.kpis.rejectedRequests],
      ["Completion Rate", `${data.kpis.completionRate}%`],
      ["Avg Processing Days", data.kpis.avgProcessingDays],
      [], ["Service Type", "Count"],
      ...data.typeBreakdown.map((t) => [t.type, t.count]),
      [], ["Status", "Count"],
      ...data.statusDistribution.map((s) => [s.status, s.count]),
      [], ["Month", "Requests"],
      ...data.volumeTrends.map((v) => [v.month, v.count]),
      [], ["Bottleneck", "Count", "Avg Wait Days"],
      ...data.bottlenecks.map((b) => [b.status, b.count, b.avgWaitDays]),
    ]
    const csv = rows.map((r) => r.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a"); a.href = url
    a.download = `cemetery-analytics-${new Date().toISOString().slice(0, 10)}.csv`; a.click()
  }, [data])

  const exportToExcel = useCallback(() => {
    if (!data) return
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
      ["Metric", "Value"],
      ["Total Requests", data.kpis.totalRequests],
      ["Completed", data.kpis.completedRequests],
      ["Pending", data.kpis.pendingRequests],
      ["Rejected", data.kpis.rejectedRequests],
      ["Completion Rate (%)", data.kpis.completionRate],
      ["Avg Processing (Days)", data.kpis.avgProcessingDays],
    ]), "Summary")
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
      ["Service Type", "Count"], ...data.typeBreakdown.map((t) => [t.type, t.count]),
    ]), "By Type")
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
      ["Status", "Count"], ...data.statusDistribution.map((s) => [s.status, s.count]),
    ]), "By Status")
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
      ["Month", "Requests"], ...data.volumeTrends.map((v) => [v.month, v.count]),
    ]), "Volume Trends")
    XLSX.writeFile(wb, `cemetery-analytics-${new Date().toISOString().slice(0, 10)}.xlsx`)
  }, [data])

  const exportToPDF = useCallback(() => {
    if (!data) return
    const doc = new jsPDF()
    doc.setFontSize(18); doc.text("Cemetery Services Analytics", 14, 22)
    doc.setFontSize(10); doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30)
    autoTable(doc, {
      startY: 36, head: [["Metric", "Value"]],
      body: [
        ["Total Requests", String(data.kpis.totalRequests)],
        ["Completed", String(data.kpis.completedRequests)],
        ["Pending", String(data.kpis.pendingRequests)],
        ["Rejected", String(data.kpis.rejectedRequests)],
        ["Completion Rate", `${data.kpis.completionRate}%`],
        ["Avg Processing", `${data.kpis.avgProcessingDays} days`],
      ],
      theme: "grid", headStyles: { fillColor: [22, 101, 52] },
    })
    const y1 = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || 100
    autoTable(doc, {
      startY: y1 + 10, head: [["Service Type", "Count"]],
      body: data.typeBreakdown.map((t) => [t.type, String(t.count)]),
      theme: "grid", headStyles: { fillColor: [22, 101, 52] },
    })
    doc.save(`cemetery-analytics-${new Date().toISOString().slice(0, 10)}.pdf`)
  }, [data])

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700 mx-auto"></div>
        <p className="mt-4 text-gray-500">Loading analytics...</p>
      </div>
    </div>
  )

  if (!data) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-500">Failed to load analytics data.</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-green-800 text-white py-6 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/services/cemetery/admin-dashboard" className="text-sm text-green-200 hover:text-white mb-2 inline-block">← Back to Dashboard</Link>
              <h1 className="text-2xl font-bold">Cemetery Services Analytics</h1>
            </div>
            <div className="flex gap-2">
              <button onClick={exportToCSV} className="px-3 py-1.5 bg-green-700 hover:bg-green-900 rounded text-sm font-medium transition-colors">CSV</button>
              <button onClick={exportToExcel} className="px-3 py-1.5 bg-green-700 hover:bg-green-900 rounded text-sm font-medium transition-colors">Excel</button>
              <button onClick={exportToPDF} className="px-3 py-1.5 bg-green-700 hover:bg-green-900 rounded text-sm font-medium transition-colors">PDF</button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {[
            { label: "Total Requests", value: data.kpis.totalRequests, border: "border-green-600" },
            { label: "Completed", value: data.kpis.completedRequests, border: "border-emerald-500" },
            { label: "Pending", value: data.kpis.pendingRequests, border: "border-yellow-500" },
            { label: "Rejected", value: data.kpis.rejectedRequests, border: "border-red-500" },
            { label: "Completion Rate", value: `${data.kpis.completionRate}%`, border: "border-blue-500" },
            { label: "Avg Processing", value: `${data.kpis.avgProcessingDays}d`, border: "border-purple-500" },
          ].map((kpi) => (
            <div key={kpi.label} className={`bg-white rounded-lg shadow p-4 border-l-4 ${kpi.border}`}>
              <p className="text-xs text-gray-500 uppercase font-semibold">{kpi.label}</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{kpi.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Service Type Breakdown - Table */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Requests by Service Type</h2>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 text-sm font-semibold text-gray-600">Service Type</th>
                  <th className="text-right py-2 text-sm font-semibold text-gray-600">Count</th>
                </tr>
              </thead>
              <tbody>
                {data.typeBreakdown.map((t) => (
                  <tr key={t.type} className="border-b border-gray-100">
                    <td className="py-2.5 text-sm text-gray-700">{t.type}</td>
                    <td className="py-2.5 text-sm font-semibold text-gray-800 text-right">{t.count}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-gray-300">
                  <td className="py-2.5 text-sm font-bold text-gray-800">Total</td>
                  <td className="py-2.5 text-sm font-bold text-gray-800 text-right">{data.kpis.totalRequests}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Status Distribution - Table */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Status Distribution</h2>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 text-sm font-semibold text-gray-600">Status</th>
                  <th className="text-right py-2 text-sm font-semibold text-gray-600">Count</th>
                  <th className="text-right py-2 text-sm font-semibold text-gray-600">%</th>
                </tr>
              </thead>
              <tbody>
                {data.statusDistribution.map((s) => (
                  <tr key={s.status} className="border-b border-gray-100">
                    <td className="py-2.5 text-sm text-gray-700">{s.status}</td>
                    <td className="py-2.5 text-sm font-semibold text-gray-800 text-right">{s.count}</td>
                    <td className="py-2.5 text-sm text-gray-500 text-right">
                      {data.kpis.totalRequests > 0 ? Math.round((s.count / data.kpis.totalRequests) * 100) : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Volume Trends - Bar Chart (6 data points) */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Monthly Volume (Last 6 Months)</h2>
          {data.volumeTrends.every((v) => v.count === 0) ? (
            <p className="text-gray-500 text-center py-8">No data for this period</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.volumeTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" name="Requests" fill="#16a34a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bottleneck Analysis */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Bottleneck Analysis</h2>
          {data.bottlenecks.length === 0 ? (
            <p className="text-gray-500 text-center py-6">No bottlenecks detected — all requests are progressing normally.</p>
          ) : (
            <div className="space-y-3">
              {data.bottlenecks.map((b, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm text-gray-700">{b.status}</p>
                    <p className="text-xs text-gray-500">{b.count} items waiting</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-sm ${b.avgWaitDays > 7 ? "text-red-600" : b.avgWaitDays > 3 ? "text-yellow-600" : "text-green-600"}`}>
                      {b.avgWaitDays} days
                    </p>
                    <p className="text-xs text-gray-500">avg wait</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
