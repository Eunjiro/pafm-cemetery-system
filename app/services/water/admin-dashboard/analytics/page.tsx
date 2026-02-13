"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts"
import * as XLSX from "xlsx"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

interface AnalyticsData {
  kpis: {
    totalRequests: number
    completedRequests: number
    pendingRequests: number
    rejectedRequests: number
    completionRate: number
    avgProcessingDays: number
    thisMonthRequests: number
    lastMonthRequests: number
  }
  volumeTrends: Array<{ month: string; Drainage: number; Connection: number; Issue: number; Total: number }>
  statusDistribution: Array<{ status: string; count: number; percentage: number }>
  typeBreakdown: Array<{ type: string; count: number; color: string }>
  drainageTypeBreakdown: Array<{ type: string; count: number }>
  issueTypeBreakdown: Array<{ type: string; count: number }>
  barangayDistribution: Array<{ barangay: string; count: number }>
  urgencyDistribution: Array<{ urgency: string; count: number }>
  structureTypeBreakdown: Array<{ type: string; count: number }>
  processingByType: Array<{ type: string; avgDays: number; count: number }>
  bottlenecks: Array<{ status: string; count: number; avgWaitDays: number }>
}

const COLORS = ["#06b6d4", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#10b981", "#ec4899", "#f97316"]

export default function WaterAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/water/analytics")
      .then((res) => res.json())
      .then((d) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const exportToCSV = useCallback(() => {
    if (!data) return
    const rows = [
      ["Water & Drainage Analytics Report"],
      ["Generated", new Date().toLocaleDateString()],
      [],
      ["KPI", "Value"],
      ["Total Requests", data.kpis.totalRequests],
      ["Completed", data.kpis.completedRequests],
      ["Pending", data.kpis.pendingRequests],
      ["Completion Rate", `${data.kpis.completionRate}%`],
      ["Avg Processing Days", data.kpis.avgProcessingDays],
      [],
      ["Volume Trends"],
      ["Month", "Drainage", "Connection", "Issue", "Total"],
      ...data.volumeTrends.map((v) => [v.month, v.Drainage, v.Connection, v.Issue, v.Total]),
      [],
      ["Status Distribution"],
      ["Status", "Count", "Percentage"],
      ...data.statusDistribution.map((s) => [s.status, s.count, `${s.percentage}%`]),
      [],
      ["Barangay Distribution"],
      ["Barangay", "Count"],
      ...data.barangayDistribution.map((b) => [b.barangay, b.count]),
      [],
      ["Bottlenecks"],
      ["Status", "Count", "Avg Wait Days"],
      ...data.bottlenecks.map((b) => [b.status, b.count, b.avgWaitDays]),
    ]
    const csv = rows.map((r) => r.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `water-analytics-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
  }, [data])

  const exportToExcel = useCallback(() => {
    if (!data) return
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
      ["KPI", "Value"],
      ["Total Requests", data.kpis.totalRequests],
      ["Completed", data.kpis.completedRequests],
      ["Pending", data.kpis.pendingRequests],
      ["Completion Rate (%)", data.kpis.completionRate],
      ["Avg Processing (Days)", data.kpis.avgProcessingDays],
    ]), "KPIs")
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
      ["Month", "Drainage", "Connection", "Issue", "Total"],
      ...data.volumeTrends.map((v) => [v.month, v.Drainage, v.Connection, v.Issue, v.Total]),
    ]), "Volume Trends")
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
      ["Status", "Count", "Percentage (%)"],
      ...data.statusDistribution.map((s) => [s.status, s.count, s.percentage]),
    ]), "Status Distribution")
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
      ["Barangay", "Count"],
      ...data.barangayDistribution.map((b) => [b.barangay, b.count]),
    ]), "Barangay Distribution")
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
      ["Status", "Count", "Avg Wait Days"],
      ...data.bottlenecks.map((b) => [b.status, b.count, b.avgWaitDays]),
    ]), "Bottlenecks")
    XLSX.writeFile(wb, `water-analytics-${new Date().toISOString().slice(0, 10)}.xlsx`)
  }, [data])

  const exportToPDF = useCallback(() => {
    if (!data) return
    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.text("Water & Drainage Analytics", 14, 22)
    doc.setFontSize(10)
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30)
    autoTable(doc, {
      startY: 36,
      head: [["KPI", "Value"]],
      body: [
        ["Total Requests", String(data.kpis.totalRequests)],
        ["Completed", String(data.kpis.completedRequests)],
        ["Pending", String(data.kpis.pendingRequests)],
        ["Completion Rate", `${data.kpis.completionRate}%`],
        ["Avg Processing", `${data.kpis.avgProcessingDays} days`],
      ],
      theme: "grid",
      headStyles: { fillColor: [37, 99, 235] },
    })
    const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || 100
    autoTable(doc, {
      startY: finalY + 10,
      head: [["Service Type", "Count"]],
      body: data.typeBreakdown.map((t) => [t.type, String(t.count)]),
      theme: "grid",
      headStyles: { fillColor: [37, 99, 235] },
    })
    doc.save(`water-analytics-${new Date().toISOString().slice(0, 10)}.pdf`)
  }, [data])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Failed to load analytics data.</p>
      </div>
    )
  }

  const growthRate = data.kpis.lastMonthRequests > 0
    ? Math.round(((data.kpis.thisMonthRequests - data.kpis.lastMonthRequests) / data.kpis.lastMonthRequests) * 100)
    : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-600 text-white py-6 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/services/water/admin-dashboard" className="text-sm text-blue-100 hover:text-white mb-2 inline-block">
                ← Back to Dashboard
              </Link>
              <h1 className="text-3xl font-bold">Water & Drainage Analytics</h1>
              <p className="text-blue-100 mt-1">Comprehensive data analysis and insights</p>
            </div>
            <div className="flex gap-2">
              <button onClick={exportToCSV} className="px-4 py-2 bg-blue-700 hover:bg-blue-800 rounded-lg text-sm font-medium transition-colors">CSV</button>
              <button onClick={exportToExcel} className="px-4 py-2 bg-blue-700 hover:bg-blue-800 rounded-lg text-sm font-medium transition-colors">Excel</button>
              <button onClick={exportToPDF} className="px-4 py-2 bg-blue-700 hover:bg-blue-800 rounded-lg text-sm font-medium transition-colors">PDF</button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
            <p className="text-xs text-gray-500 uppercase font-semibold">Total Requests</p>
            <p className="text-2xl font-bold text-gray-800">{data.kpis.totalRequests}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
            <p className="text-xs text-gray-500 uppercase font-semibold">Completed</p>
            <p className="text-2xl font-bold text-gray-800">{data.kpis.completedRequests}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
            <p className="text-xs text-gray-500 uppercase font-semibold">Pending</p>
            <p className="text-2xl font-bold text-gray-800">{data.kpis.pendingRequests}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
            <p className="text-xs text-gray-500 uppercase font-semibold">Rejected</p>
            <p className="text-2xl font-bold text-gray-800">{data.kpis.rejectedRequests}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-emerald-500">
            <p className="text-xs text-gray-500 uppercase font-semibold">Completion Rate</p>
            <p className="text-2xl font-bold text-gray-800">{data.kpis.completionRate}%</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
            <p className="text-xs text-gray-500 uppercase font-semibold">Avg Processing</p>
            <p className="text-2xl font-bold text-gray-800">{data.kpis.avgProcessingDays}d</p>
          </div>
        </div>

        {/* Growth Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow-md p-6">
            <p className="text-sm text-blue-100">This Month</p>
            <p className="text-3xl font-bold mt-1">{data.kpis.thisMonthRequests} requests</p>
          </div>
          <div className={`bg-gradient-to-br ${growthRate >= 0 ? 'from-emerald-500 to-emerald-600' : 'from-red-500 to-red-600'} text-white rounded-lg shadow-md p-6`}>
            <p className="text-sm opacity-80">Month-over-Month</p>
            <p className="text-3xl font-bold mt-1">{growthRate > 0 ? '+' : ''}{growthRate}%</p>
          </div>
          <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 text-white rounded-lg shadow-md p-6">
            <p className="text-sm text-cyan-100">Drainage Requests</p>
            <p className="text-3xl font-bold mt-1">{data.typeBreakdown[0]?.count || 0}</p>
          </div>
        </div>

        {/* Volume Trends */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Volume Trends (Last 6 Months)</h2>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={data.volumeTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="Drainage" stroke="#06b6d4" strokeWidth={2} />
              <Line type="monotone" dataKey="Connection" stroke="#3b82f6" strokeWidth={2} />
              <Line type="monotone" dataKey="Issue" stroke="#f59e0b" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Type Breakdown & Barangay Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Service Type Breakdown</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={data.typeBreakdown} dataKey="count" nameKey="type" cx="50%" cy="50%" outerRadius={100}
                  label={(props: any) => { const c = props.count as number; return c > 0 ? `${props.type}: ${c}` : ''; }}>
                  {data.typeBreakdown.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 flex justify-center gap-6">
              {data.typeBreakdown.map((t) => (
                <div key={t.type} className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color }}></div>
                  <span className="text-gray-600">{t.type}: <strong>{t.count}</strong></span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Top Barangays</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.barangayDistribution.slice(0, 10)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="barangay" width={120} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Drainage & Issue Type Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Drainage Issue Types</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.drainageTypeBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Water Issue Types</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.issueTypeBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Urgency & Structure Type */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Drainage Urgency Distribution</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={data.urgencyDistribution} dataKey="count" nameKey="urgency" cx="50%" cy="50%" outerRadius={80}
                  label={(props: any) => `${props.urgency}: ${props.count}`}>
                  {data.urgencyDistribution.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Connection Structure Types</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={data.structureTypeBreakdown} dataKey="count" nameKey="type" cx="50%" cy="50%" outerRadius={80}
                  label={(props: any) => `${props.type}: ${props.count}`}>
                  {data.structureTypeBreakdown.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Processing Efficiency & Bottlenecks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Avg Processing Time by Service</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.processingByType}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis label={{ value: "Days", angle: -90, position: "insideLeft" }} />
                <Tooltip formatter={(value: unknown) => [`${value} days`, "Avg Processing"]} />
                <Bar dataKey="avgDays" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Bottleneck Analysis</h2>
            {data.bottlenecks.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No bottlenecks detected</p>
            ) : (
              <div className="space-y-3">
                {data.bottlenecks.slice(0, 8).map((b, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm text-gray-700">{b.status}</p>
                      <p className="text-xs text-gray-500">{b.count} items stuck</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-sm ${b.avgWaitDays > 7 ? 'text-red-600' : b.avgWaitDays > 3 ? 'text-yellow-600' : 'text-green-600'}`}>
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

        {/* Status Distribution */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Status Distribution</h2>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data.statusDistribution} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="status" width={180} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
