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
    totalReservations: number; completedReservations: number; pendingReservations: number
    rejectedReservations: number; completionRate: number; avgProcessingDays: number
    totalRevenue: number; lguCount: number; privateCount: number; damagesCount: number
    noShowCount: number; exemptedCount: number; avgParticipants: number
    thisMonthRequests: number; lastMonthRequests: number
  }
  volumeTrends: Array<{ month: string; Reservations: number }>
  statusDistribution: Array<{ status: string; count: number; percentage: number }>
  facilityTypeBreakdown: Array<{ type: string; count: number; color: string }>
  activityTypeBreakdown: Array<{ type: string; count: number }>
  revenueByMonth: Array<{ month: string; revenue: number }>
  processingByFacility: Array<{ type: string; avgDays: number; count: number }>
  bottlenecks: Array<{ status: string; count: number; avgWaitDays: number }>
}

const COLORS = ["#f97316", "#3b82f6", "#10b981", "#8b5cf6", "#ef4444", "#06b6d4", "#ec4899", "#f59e0b"]

export default function FacilitiesAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/facilities/analytics")
      .then((res) => res.json())
      .then((d) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const exportToCSV = useCallback(() => {
    if (!data) return
    const rows = [
      ["Facility Management Analytics Report"],
      ["Generated", new Date().toLocaleDateString()],
      [], ["KPI", "Value"],
      ["Total Reservations", data.kpis.totalReservations],
      ["Completed", data.kpis.completedReservations],
      ["Pending", data.kpis.pendingReservations],
      ["Completion Rate", `${data.kpis.completionRate}%`],
      ["Avg Processing Days", data.kpis.avgProcessingDays],
      ["Total Revenue", `₱${data.kpis.totalRevenue.toLocaleString()}`],
      ["LGU Events", data.kpis.lguCount], ["No Shows", data.kpis.noShowCount],
      ["Damages Reported", data.kpis.damagesCount],
      [], ["Volume Trends"], ["Month", "Reservations"],
      ...data.volumeTrends.map((v) => [v.month, v.Reservations]),
      [], ["Status Distribution"], ["Status", "Count", "Percentage"],
      ...data.statusDistribution.map((s) => [s.status, s.count, `${s.percentage}%`]),
      [], ["Facility Types"], ["Type", "Count"],
      ...data.facilityTypeBreakdown.map((f) => [f.type, f.count]),
      [], ["Activity Types"], ["Type", "Count"],
      ...data.activityTypeBreakdown.map((a) => [a.type, a.count]),
      [], ["Bottlenecks"], ["Status", "Count", "Avg Wait Days"],
      ...data.bottlenecks.map((b) => [b.status, b.count, b.avgWaitDays]),
    ]
    const csv = rows.map((r) => r.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a"); a.href = url
    a.download = `facilities-analytics-${new Date().toISOString().slice(0, 10)}.csv`; a.click()
  }, [data])

  const exportToExcel = useCallback(() => {
    if (!data) return
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
      ["KPI", "Value"], ["Total Reservations", data.kpis.totalReservations],
      ["Completed", data.kpis.completedReservations], ["Pending", data.kpis.pendingReservations],
      ["Completion Rate (%)", data.kpis.completionRate], ["Avg Processing (Days)", data.kpis.avgProcessingDays],
      ["Total Revenue (₱)", data.kpis.totalRevenue], ["LGU Events", data.kpis.lguCount],
      ["No Shows", data.kpis.noShowCount], ["Damages", data.kpis.damagesCount],
    ]), "KPIs")
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
      ["Month", "Reservations"], ...data.volumeTrends.map((v) => [v.month, v.Reservations]),
    ]), "Volume Trends")
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
      ["Status", "Count", "Percentage (%)"], ...data.statusDistribution.map((s) => [s.status, s.count, s.percentage]),
    ]), "Status Distribution")
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
      ["Facility Type", "Count"], ...data.facilityTypeBreakdown.map((f) => [f.type, f.count]),
    ]), "Facility Types")
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
      ["Activity Type", "Count"], ...data.activityTypeBreakdown.map((a) => [a.type, a.count]),
    ]), "Activity Types")
    XLSX.writeFile(wb, `facilities-analytics-${new Date().toISOString().slice(0, 10)}.xlsx`)
  }, [data])

  const exportToPDF = useCallback(() => {
    if (!data) return
    const doc = new jsPDF()
    doc.setFontSize(18); doc.text("Facility Management Analytics", 14, 22)
    doc.setFontSize(10); doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30)
    autoTable(doc, {
      startY: 36, head: [["KPI", "Value"]],
      body: [
        ["Total Reservations", String(data.kpis.totalReservations)],
        ["Completed", String(data.kpis.completedReservations)],
        ["Pending", String(data.kpis.pendingReservations)],
        ["Completion Rate", `${data.kpis.completionRate}%`],
        ["Avg Processing", `${data.kpis.avgProcessingDays} days`],
        ["Total Revenue", `₱${data.kpis.totalRevenue.toLocaleString()}`],
        ["LGU Events", String(data.kpis.lguCount)],
        ["Damages", String(data.kpis.damagesCount)],
      ],
      theme: "grid", headStyles: { fillColor: [234, 88, 12] },
    })
    const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || 130
    autoTable(doc, {
      startY: finalY + 10, head: [["Facility Type", "Count"]],
      body: data.facilityTypeBreakdown.map((f) => [f.type, String(f.count)]),
      theme: "grid", headStyles: { fillColor: [234, 88, 12] },
    })
    doc.save(`facilities-analytics-${new Date().toISOString().slice(0, 10)}.pdf`)
  }, [data])

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
        <p className="mt-4 text-gray-500">Loading analytics...</p>
      </div>
    </div>
  )

  if (!data) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-500">Failed to load analytics data.</p>
    </div>
  )

  const growthRate = data.kpis.lastMonthRequests > 0
    ? Math.round(((data.kpis.thisMonthRequests - data.kpis.lastMonthRequests) / data.kpis.lastMonthRequests) * 100) : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-orange-600 text-white py-6 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/services/facilities/admin-dashboard" className="text-sm text-orange-100 hover:text-white mb-2 inline-block">← Back to Dashboard</Link>
              <h1 className="text-3xl font-bold">Facility Management Analytics</h1>
              <p className="text-orange-100 mt-1">Comprehensive data analysis and insights</p>
            </div>
            <div className="flex gap-2">
              <button onClick={exportToCSV} className="px-4 py-2 bg-orange-700 hover:bg-orange-800 rounded-lg text-sm font-medium transition-colors">CSV</button>
              <button onClick={exportToExcel} className="px-4 py-2 bg-orange-700 hover:bg-orange-800 rounded-lg text-sm font-medium transition-colors">Excel</button>
              <button onClick={exportToPDF} className="px-4 py-2 bg-orange-700 hover:bg-orange-800 rounded-lg text-sm font-medium transition-colors">PDF</button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-500">
            <p className="text-xs text-gray-500 uppercase font-semibold">Total</p>
            <p className="text-2xl font-bold text-gray-800">{data.kpis.totalReservations}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
            <p className="text-xs text-gray-500 uppercase font-semibold">Completed</p>
            <p className="text-2xl font-bold text-gray-800">{data.kpis.completedReservations}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
            <p className="text-xs text-gray-500 uppercase font-semibold">Pending</p>
            <p className="text-2xl font-bold text-gray-800">{data.kpis.pendingReservations}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-emerald-500">
            <p className="text-xs text-gray-500 uppercase font-semibold">Completion</p>
            <p className="text-2xl font-bold text-gray-800">{data.kpis.completionRate}%</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
            <p className="text-xs text-gray-500 uppercase font-semibold">Avg Processing</p>
            <p className="text-2xl font-bold text-gray-800">{data.kpis.avgProcessingDays}d</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
            <p className="text-xs text-gray-500 uppercase font-semibold">Avg Participants</p>
            <p className="text-2xl font-bold text-gray-800">{data.kpis.avgParticipants}</p>
          </div>
        </div>

        {/* Revenue & Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg shadow-md p-6">
            <p className="text-sm text-orange-100">Total Revenue</p>
            <p className="text-3xl font-bold mt-1">₱{data.kpis.totalRevenue.toLocaleString()}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow-md p-6">
            <p className="text-sm text-blue-100">LGU Events</p>
            <p className="text-3xl font-bold mt-1">{data.kpis.lguCount}</p>
            <p className="text-xs text-blue-200 mt-1">vs {data.kpis.privateCount} private</p>
          </div>
          <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-lg shadow-md p-6">
            <p className="text-sm text-red-100">No Shows / Damages</p>
            <p className="text-3xl font-bold mt-1">{data.kpis.noShowCount} / {data.kpis.damagesCount}</p>
          </div>
          <div className={`bg-gradient-to-br ${growthRate >= 0 ? 'from-emerald-500 to-emerald-600' : 'from-red-500 to-red-600'} text-white rounded-lg shadow-md p-6`}>
            <p className="text-sm opacity-80">Growth</p>
            <p className="text-3xl font-bold mt-1">{growthRate > 0 ? '+' : ''}{growthRate}%</p>
          </div>
        </div>

        {/* Volume Trends */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Reservation Volume (Last 6 Months)</h2>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data.volumeTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" /><YAxis /><Tooltip />
              <Bar dataKey="Reservations" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Facility & Activity Types */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">By Facility Type</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={data.facilityTypeBreakdown} dataKey="count" nameKey="type" cx="50%" cy="50%" outerRadius={100}
                  label={(props: any) => { const c = props.count as number; return c > 0 ? `${(props.type as string).split(' ')[0]}: ${c}` : ''; }}>
                  {data.facilityTypeBreakdown.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {data.facilityTypeBreakdown.map((t) => (
                <div key={t.type} className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color }}></div>
                  <span className="text-gray-600">{t.type}: <strong>{t.count}</strong></span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">By Activity Type</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.activityTypeBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={60} /><YAxis /><Tooltip />
                <Bar dataKey="count" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue & Processing */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Revenue Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.revenueByMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" /><YAxis tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: unknown) => [`₱${Number(value).toLocaleString()}`, 'Revenue']} />
                <Line type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2} dot={{ fill: '#f97316' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Processing Time by Facility</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.processingByFacility}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" tick={{ fontSize: 9 }} angle={-15} textAnchor="end" height={60} />
                <YAxis label={{ value: "Days", angle: -90, position: "insideLeft" }} />
                <Tooltip formatter={(value: unknown) => [`${value} days`, "Avg Processing"]} />
                <Bar dataKey="avgDays" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution & Bottlenecks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Status Distribution</h2>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={data.statusDistribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="status" width={170} tick={{ fontSize: 11 }} />
                <Tooltip /><Bar dataKey="count" fill="#f97316" radius={[0, 4, 4, 0]} />
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
      </div>
    </div>
  )
}
