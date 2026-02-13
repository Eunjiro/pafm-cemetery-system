"use client"

import { useEffect, useState, useCallback } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import * as XLSX from "xlsx"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

interface AnalyticsData {
  kpis: {
    totalItems: number; totalStock: number; lowStockItems: number; outOfStockItems: number
    totalDeliveries: number; pendingDeliveries: number; completedDeliveries: number; avgDeliveryDays: number
    totalRequisitions: number; issuedRequisitions: number; pendingRequisitions: number
    rejectedRequisitions: number; fulfillmentRate: number
  }
  categoryBreakdown: Array<{ category: string; count: number }>
  deliveryStatusDistribution: Array<{ status: string; count: number }>
  requisitionStatusDistribution: Array<{ status: string; count: number }>
  deliveryTrends: Array<{ month: string; deliveries: number; requisitions: number }>
  topOffices: Array<{ office: string; count: number }>
  adjustmentSummary: Array<{ type: string; count: number; netChange: number }>
  bottlenecks: Array<{ area: string; status: string; count: number; avgWaitDays: number }>
}

export default function InventoryAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/inventory/analytics")
      .then((res) => res.json())
      .then((d) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const exportToCSV = useCallback(() => {
    if (!data) return
    const rows = [
      ["Assets Inventory Analytics"],
      ["Generated", new Date().toLocaleDateString()],
      [], ["── Inventory KPIs ──"],
      ["Metric", "Value"],
      ["Total Items", data.kpis.totalItems],
      ["Total Stock Units", data.kpis.totalStock],
      ["Low Stock Items", data.kpis.lowStockItems],
      ["Out of Stock", data.kpis.outOfStockItems],
      [], ["── Delivery KPIs ──"],
      ["Total Deliveries", data.kpis.totalDeliveries],
      ["Completed", data.kpis.completedDeliveries],
      ["Pending", data.kpis.pendingDeliveries],
      ["Avg Processing Days", data.kpis.avgDeliveryDays],
      [], ["── Requisition KPIs ──"],
      ["Total Requisitions", data.kpis.totalRequisitions],
      ["Issued", data.kpis.issuedRequisitions],
      ["Pending", data.kpis.pendingRequisitions],
      ["Rejected", data.kpis.rejectedRequisitions],
      ["Fulfillment Rate", `${data.kpis.fulfillmentRate}%`],
      [], ["Category", "Items"],
      ...data.categoryBreakdown.map((c) => [c.category, c.count]),
      [], ["Month", "Deliveries", "Requisitions"],
      ...data.deliveryTrends.map((t) => [t.month, t.deliveries, t.requisitions]),
      [], ["Office", "Requisitions"],
      ...data.topOffices.map((o) => [o.office, o.count]),
      [], ["Adjustment Type", "Count", "Net Change"],
      ...data.adjustmentSummary.map((a) => [a.type, a.count, a.netChange]),
      [], ["Bottleneck", "Area", "Count", "Avg Wait Days"],
      ...data.bottlenecks.map((b) => [b.status, b.area, b.count, b.avgWaitDays]),
    ]
    const csv = rows.map((r) => r.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a"); a.href = url
    a.download = `inventory-analytics-${new Date().toISOString().slice(0, 10)}.csv`; a.click()
  }, [data])

  const exportToExcel = useCallback(() => {
    if (!data) return
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
      ["Metric", "Value"],
      ["Total Items", data.kpis.totalItems],
      ["Total Stock Units", data.kpis.totalStock],
      ["Low Stock Items", data.kpis.lowStockItems],
      ["Out of Stock", data.kpis.outOfStockItems],
      ["Total Deliveries", data.kpis.totalDeliveries],
      ["Completed Deliveries", data.kpis.completedDeliveries],
      ["Pending Deliveries", data.kpis.pendingDeliveries],
      ["Avg Delivery Days", data.kpis.avgDeliveryDays],
      ["Total Requisitions", data.kpis.totalRequisitions],
      ["Issued", data.kpis.issuedRequisitions],
      ["Pending Requisitions", data.kpis.pendingRequisitions],
      ["Rejected", data.kpis.rejectedRequisitions],
      ["Fulfillment Rate (%)", data.kpis.fulfillmentRate],
    ]), "Summary")
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
      ["Category", "Items"], ...data.categoryBreakdown.map((c) => [c.category, c.count]),
    ]), "By Category")
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
      ["Month", "Deliveries", "Requisitions"], ...data.deliveryTrends.map((t) => [t.month, t.deliveries, t.requisitions]),
    ]), "Monthly Trends")
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
      ["Office", "Requisitions"], ...data.topOffices.map((o) => [o.office, o.count]),
    ]), "Top Offices")
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
      ["Type", "Count", "Net Change"], ...data.adjustmentSummary.map((a) => [a.type, a.count, a.netChange]),
    ]), "Adjustments")
    XLSX.writeFile(wb, `inventory-analytics-${new Date().toISOString().slice(0, 10)}.xlsx`)
  }, [data])

  const exportToPDF = useCallback(() => {
    if (!data) return
    const doc = new jsPDF()
    doc.setFontSize(18); doc.text("Assets Inventory Analytics", 14, 22)
    doc.setFontSize(10); doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30)
    autoTable(doc, {
      startY: 36, head: [["Metric", "Value"]],
      body: [
        ["Total Items", String(data.kpis.totalItems)],
        ["Total Stock Units", String(data.kpis.totalStock)],
        ["Low Stock Items", String(data.kpis.lowStockItems)],
        ["Out of Stock", String(data.kpis.outOfStockItems)],
        ["Total Deliveries", String(data.kpis.totalDeliveries)],
        ["Avg Delivery Processing", `${data.kpis.avgDeliveryDays} days`],
        ["Total Requisitions", String(data.kpis.totalRequisitions)],
        ["Issued Requisitions", String(data.kpis.issuedRequisitions)],
        ["Fulfillment Rate", `${data.kpis.fulfillmentRate}%`],
      ],
      theme: "grid", headStyles: { fillColor: [147, 51, 234] },
    })
    const y1 = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || 100
    autoTable(doc, {
      startY: y1 + 10, head: [["Category", "Items"]],
      body: data.categoryBreakdown.map((c) => [c.category, String(c.count)]),
      theme: "grid", headStyles: { fillColor: [147, 51, 234] },
    })
    const y2 = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || 160
    autoTable(doc, {
      startY: y2 + 10, head: [["Office", "Requisitions"]],
      body: data.topOffices.map((o) => [o.office, String(o.count)]),
      theme: "grid", headStyles: { fillColor: [147, 51, 234] },
    })
    doc.save(`inventory-analytics-${new Date().toISOString().slice(0, 10)}.pdf`)
  }, [data])

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
        <p className="mt-4 text-gray-500">Loading analytics...</p>
      </div>
    </div>
  )

  if (!data) return (
    <div className="flex items-center justify-center py-20">
      <p className="text-gray-500">Failed to load analytics data.</p>
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Inventory Analytics</h2>
          <p className="text-sm text-gray-500 mt-1">Overview of inventory, deliveries, and requisitions</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportToCSV} className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm font-medium transition-colors">CSV</button>
          <button onClick={exportToExcel} className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm font-medium transition-colors">Excel</button>
          <button onClick={exportToPDF} className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm font-medium transition-colors">PDF</button>
        </div>
      </div>

      {/* Inventory KPI Cards */}
      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Inventory</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Items", value: data.kpis.totalItems, border: "border-purple-500" },
          { label: "Total Stock", value: data.kpis.totalStock.toLocaleString(), border: "border-blue-500" },
          { label: "Low Stock", value: data.kpis.lowStockItems, border: "border-amber-500" },
          { label: "Out of Stock", value: data.kpis.outOfStockItems, border: "border-red-500" },
        ].map((kpi) => (
          <div key={kpi.label} className={`bg-white rounded-lg shadow p-4 border-l-4 ${kpi.border}`}>
            <p className="text-xs text-gray-500 uppercase font-semibold">{kpi.label}</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Delivery KPI Cards */}
      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Deliveries</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Deliveries", value: data.kpis.totalDeliveries, border: "border-purple-500" },
          { label: "Completed", value: data.kpis.completedDeliveries, border: "border-emerald-500" },
          { label: "Pending", value: data.kpis.pendingDeliveries, border: "border-yellow-500" },
          { label: "Avg Processing", value: `${data.kpis.avgDeliveryDays}d`, border: "border-cyan-500" },
        ].map((kpi) => (
          <div key={kpi.label} className={`bg-white rounded-lg shadow p-4 border-l-4 ${kpi.border}`}>
            <p className="text-xs text-gray-500 uppercase font-semibold">{kpi.label}</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Requisition KPI Cards */}
      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Requisitions</h3>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {[
          { label: "Total", value: data.kpis.totalRequisitions, border: "border-purple-500" },
          { label: "Issued", value: data.kpis.issuedRequisitions, border: "border-emerald-500" },
          { label: "Pending", value: data.kpis.pendingRequisitions, border: "border-yellow-500" },
          { label: "Rejected", value: data.kpis.rejectedRequisitions, border: "border-red-500" },
          { label: "Fulfillment Rate", value: `${data.kpis.fulfillmentRate}%`, border: "border-indigo-500" },
        ].map((kpi) => (
          <div key={kpi.label} className={`bg-white rounded-lg shadow p-4 border-l-4 ${kpi.border}`}>
            <p className="text-xs text-gray-500 uppercase font-semibold">{kpi.label}</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Category Breakdown */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Items by Category</h2>
          {data.categoryBreakdown.length < 6 ? (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 text-sm font-semibold text-gray-600">Category</th>
                  <th className="text-right py-2 text-sm font-semibold text-gray-600">Items</th>
                </tr>
              </thead>
              <tbody>
                {data.categoryBreakdown.map((c) => (
                  <tr key={c.category} className="border-b border-gray-100">
                    <td className="py-2.5 text-sm text-gray-700">{c.category}</td>
                    <td className="py-2.5 text-sm font-semibold text-gray-800 text-right">{c.count}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-gray-300">
                  <td className="py-2.5 text-sm font-bold text-gray-800">Total</td>
                  <td className="py-2.5 text-sm font-bold text-gray-800 text-right">{data.kpis.totalItems}</td>
                </tr>
              </tbody>
            </table>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.categoryBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" name="Items" fill="#9333ea" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Delivery Status Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Delivery Status</h2>
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 text-sm font-semibold text-gray-600">Status</th>
                <th className="text-right py-2 text-sm font-semibold text-gray-600">Count</th>
                <th className="text-right py-2 text-sm font-semibold text-gray-600">%</th>
              </tr>
            </thead>
            <tbody>
              {data.deliveryStatusDistribution.map((s) => (
                <tr key={s.status} className="border-b border-gray-100">
                  <td className="py-2.5 text-sm text-gray-700">{s.status}</td>
                  <td className="py-2.5 text-sm font-semibold text-gray-800 text-right">{s.count}</td>
                  <td className="py-2.5 text-sm text-gray-500 text-right">
                    {data.kpis.totalDeliveries > 0 ? Math.round((s.count / data.kpis.totalDeliveries) * 100) : 0}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Requisition Status Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Requisition Status</h2>
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 text-sm font-semibold text-gray-600">Status</th>
                <th className="text-right py-2 text-sm font-semibold text-gray-600">Count</th>
                <th className="text-right py-2 text-sm font-semibold text-gray-600">%</th>
              </tr>
            </thead>
            <tbody>
              {data.requisitionStatusDistribution.map((s) => (
                <tr key={s.status} className="border-b border-gray-100">
                  <td className="py-2.5 text-sm text-gray-700">{s.status}</td>
                  <td className="py-2.5 text-sm font-semibold text-gray-800 text-right">{s.count}</td>
                  <td className="py-2.5 text-sm text-gray-500 text-right">
                    {data.kpis.totalRequisitions > 0 ? Math.round((s.count / data.kpis.totalRequisitions) * 100) : 0}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Top Requesting Offices */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Top Requesting Offices</h2>
          {data.topOffices.length === 0 ? (
            <p className="text-gray-500 text-center py-6">No requisitions yet</p>
          ) : data.topOffices.length < 6 ? (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 text-sm font-semibold text-gray-600">Office</th>
                  <th className="text-right py-2 text-sm font-semibold text-gray-600">Requisitions</th>
                </tr>
              </thead>
              <tbody>
                {data.topOffices.map((o) => (
                  <tr key={o.office} className="border-b border-gray-100">
                    <td className="py-2.5 text-sm text-gray-700">{o.office}</td>
                    <td className="py-2.5 text-sm font-semibold text-gray-800 text-right">{o.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.topOffices}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="office" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" name="Requisitions" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Volume Trends - Bar Chart (6 data points) */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Monthly Volume (Last 6 Months)</h2>
        {data.deliveryTrends.every((t) => t.deliveries === 0 && t.requisitions === 0) ? (
          <p className="text-gray-500 text-center py-8">No data for this period</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.deliveryTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="deliveries" name="Deliveries" fill="#9333ea" radius={[4, 4, 0, 0]} />
              <Bar dataKey="requisitions" name="Requisitions" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Stock Adjustments Summary */}
      {data.adjustmentSummary.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Stock Adjustments Summary</h2>
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 text-sm font-semibold text-gray-600">Type</th>
                <th className="text-right py-2 text-sm font-semibold text-gray-600">Count</th>
                <th className="text-right py-2 text-sm font-semibold text-gray-600">Net Change</th>
              </tr>
            </thead>
            <tbody>
              {data.adjustmentSummary.map((a) => (
                <tr key={a.type} className="border-b border-gray-100">
                  <td className="py-2.5 text-sm text-gray-700">{a.type}</td>
                  <td className="py-2.5 text-sm font-semibold text-gray-800 text-right">{a.count}</td>
                  <td className={`py-2.5 text-sm font-semibold text-right ${a.netChange >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {a.netChange >= 0 ? "+" : ""}{a.netChange}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Bottleneck Analysis */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Bottleneck Analysis</h2>
        {data.bottlenecks.length === 0 ? (
          <p className="text-gray-500 text-center py-6">No bottlenecks detected — all deliveries and requisitions are progressing normally.</p>
        ) : (
          <div className="space-y-3">
            {data.bottlenecks.map((b, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-sm text-gray-700">{b.status}</p>
                  <p className="text-xs text-gray-500">{b.area} — {b.count} items waiting</p>
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
  )
}
