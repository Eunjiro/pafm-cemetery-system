"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useDialog } from "@/app/components/DialogProvider"


interface InventoryReport {
  id: string
  reportType: string
  reportPeriod: string
  periodStart: string
  periodEnd: string
  generatedBy: string
  generatedByName: string | null
  submittedTo: string | null
  notes: string | null
  data: any
  createdAt: string
}

export default function ReportsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const dialog = useDialog()
  const [loading, setLoading] = useState(true)
  const [reports, setReports] = useState<InventoryReport[]>([])
  const [filterType, setFilterType] = useState("")
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const [showGenerate, setShowGenerate] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [selectedReport, setSelectedReport] = useState<InventoryReport | null>(null)
  const [processing, setProcessing] = useState(false)

  const [genForm, setGenForm] = useState({
    reportType: "MONTHLY",
    reportPeriod: "",
    periodStart: "",
    periodEnd: "",
    submittedTo: "",
    notes: "",
  })

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
    else if (status === "authenticated" && session?.user?.role !== "ADMIN") router.push("/dashboard")
  }, [status, session, router])

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filterType) params.set("type", filterType)
      const res = await fetch(`/api/admin/inventory/reports?${params}`)
      const data = await res.json()
      setReports(data.reports || [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [filterType])

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "ADMIN") fetchReports()
  }, [status, session, fetchReports])

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!genForm.reportPeriod || !genForm.periodStart || !genForm.periodEnd) {
      showToast("error", "Report period, start date, and end date are required"); return
    }
    setProcessing(true)
    try {
      const res = await fetch("/api/admin/inventory/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(genForm),
      })
      const data = await res.json()
      if (res.ok) {
        showToast("success", "Report generated successfully")
        setShowGenerate(false)
        setGenForm({ reportType: "MONTHLY", reportPeriod: "", periodStart: "", periodEnd: "", submittedTo: "", notes: "" })
        fetchReports()
      } else {
        showToast("error", data.error || "Failed to generate report")
      }
    } catch (error) {
      showToast("error", "Failed to generate report")
    } finally {
      setProcessing(false)
    }
  }

  const openDetail = (report: InventoryReport) => {
    setSelectedReport(report)
    setShowDetail(true)
  }

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (!(await dialog.confirm({ message: "Are you sure you want to delete this report? This action cannot be undone.", title: "Delete Report", confirmText: "Delete", confirmColor: "red" }))) return
    try {
      const res = await fetch(`/api/admin/inventory/reports?id=${id}`, { method: "DELETE" })
      if (res.ok) {
        showToast("success", "Report deleted successfully")
        if (showDetail && selectedReport?.id === id) setShowDetail(false)
        fetchReports()
      } else {
        const data = await res.json()
        showToast("error", data.error || "Failed to delete report")
      }
    } catch { showToast("error", "Failed to delete report") }
  }

  // ─── Export helpers ────────────────────────────────────────────
  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = filename; document.body.appendChild(a); a.click()
    document.body.removeChild(a); URL.revokeObjectURL(url)
  }

  const exportJSON = (report: InventoryReport) => {
    const payload = {
      reportType: report.reportType,
      reportPeriod: report.reportPeriod,
      periodStart: report.periodStart,
      periodEnd: report.periodEnd,
      generatedBy: report.generatedByName,
      submittedTo: report.submittedTo,
      notes: report.notes,
      createdAt: report.createdAt,
      ...report.data,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
    downloadBlob(blob, `report-${report.reportPeriod.replace(/\s+/g, "_")}.json`)
  }

  const exportCSV = (report: InventoryReport) => {
    const rows: string[][] = []
    // Header info
    rows.push(["Inventory Report"])
    rows.push(["Type", report.reportType])
    rows.push(["Period", report.reportPeriod])
    rows.push(["Start Date", formatDate(report.periodStart)])
    rows.push(["End Date", formatDate(report.periodEnd)])
    rows.push(["Generated By", report.generatedByName || "System"])
    rows.push(["Submitted To", report.submittedTo || "N/A"])
    rows.push(["Generated On", new Date(report.createdAt).toLocaleString()])
    rows.push([])
    // Summary
    if (report.data?.summary) {
      const s = report.data.summary
      rows.push(["SUMMARY"])
      rows.push(["Total Items", String(s.totalItems || 0)])
      rows.push(["Total Stock", String(s.totalStock || 0)])
      rows.push(["Total Reserved", String(s.totalReserved || 0)])
      rows.push(["Low Stock Items", String(s.lowStockItems || 0)])
      rows.push(["Deliveries Received", String(s.deliveriesReceived || 0)])
      rows.push(["Items Received", String(s.totalItemsReceived || 0)])
      rows.push(["Requisitions Processed", String(s.requisitionsProcessed || 0)])
      rows.push(["Items Issued", String(s.totalItemsIssued || 0)])
      rows.push(["Stock Adjustments", String(s.stockAdjustments || 0)])
      rows.push([])
    }
    // Inventory snapshot
    if (report.data?.inventorySnapshot?.length) {
      rows.push(["INVENTORY SNAPSHOT"])
      rows.push(["Code", "Item", "Category", "Unit", "Stock", "Reserved", "Reorder Level", "Zone", "Rack"])
      report.data.inventorySnapshot.forEach((i: any) => {
        rows.push([i.itemCode, i.name, i.category?.replace(/_/g, " "), i.unit, String(i.currentStock), String(i.reservedStock), String(i.reorderLevel || 0), i.storageZone || "", i.storageRack || ""])
      })
      rows.push([])
    }
    // Deliveries
    if (report.data?.deliveries?.recent?.length) {
      rows.push(["DELIVERIES"])
      rows.push(["Delivery No.", "Supplier", "Status", "Date", "Items"])
      report.data.deliveries.recent.forEach((d: any) => {
        rows.push([d.deliveryNumber, d.supplier, d.status, d.date ? formatDate(d.date) : "", String(d.itemCount || 0)])
      })
      rows.push([])
    }
    // Requisitions
    if (report.data?.requisitions?.recent?.length) {
      rows.push(["REQUISITIONS"])
      rows.push(["RIS No.", "Office", "Status", "Date", "Items"])
      report.data.requisitions.recent.forEach((r: any) => {
        rows.push([r.risNumber, r.requestingOffice, r.status, r.date ? formatDate(r.date) : "", String(r.itemCount || 0)])
      })
      rows.push([])
    }
    // Adjustments
    if (report.data?.adjustments?.byType) {
      rows.push(["STOCK ADJUSTMENTS BY TYPE"])
      rows.push(["Type", "Count"])
      Object.entries(report.data.adjustments.byType).forEach(([type, count]) => {
        rows.push([type.replace(/_/g, " "), String(count)])
      })
    }
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n")
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    downloadBlob(blob, `report-${report.reportPeriod.replace(/\s+/g, "_")}.csv`)
  }

  const exportPDF = (report: InventoryReport) => {
    const s = report.data?.summary
    const snap = report.data?.inventorySnapshot || []
    const dels = report.data?.deliveries?.recent || []
    const reqs = report.data?.requisitions?.recent || []
    const adjs = report.data?.adjustments?.byType || {}

    let inventoryRows = ""
    snap.forEach((i: any) => {
      inventoryRows += `<tr>
        <td style="padding:4px 8px;border:1px solid #ddd;font-family:monospace;font-size:11px">${i.itemCode}</td>
        <td style="padding:4px 8px;border:1px solid #ddd">${i.name}</td>
        <td style="padding:4px 8px;border:1px solid #ddd">${(i.category || "").replace(/_/g, " ")}</td>
        <td style="padding:4px 8px;border:1px solid #ddd;text-align:right">${i.currentStock} ${i.unit}</td>
        <td style="padding:4px 8px;border:1px solid #ddd;text-align:right">${i.reservedStock}</td>
        <td style="padding:4px 8px;border:1px solid #ddd">${i.storageZone || "-"}</td>
      </tr>`
    })

    let deliveryRows = ""
    dels.forEach((d: any) => {
      deliveryRows += `<tr>
        <td style="padding:4px 8px;border:1px solid #ddd">${d.deliveryNumber}</td>
        <td style="padding:4px 8px;border:1px solid #ddd">${d.supplier}</td>
        <td style="padding:4px 8px;border:1px solid #ddd">${d.status}</td>
        <td style="padding:4px 8px;border:1px solid #ddd">${d.date ? formatDate(d.date) : ""}</td>
      </tr>`
    })

    let reqRows = ""
    reqs.forEach((r: any) => {
      reqRows += `<tr>
        <td style="padding:4px 8px;border:1px solid #ddd">${r.risNumber}</td>
        <td style="padding:4px 8px;border:1px solid #ddd">${r.requestingOffice}</td>
        <td style="padding:4px 8px;border:1px solid #ddd">${r.status}</td>
      </tr>`
    })

    let adjRows = ""
    Object.entries(adjs).forEach(([type, count]) => {
      adjRows += `<tr>
        <td style="padding:4px 8px;border:1px solid #ddd">${type.replace(/_/g, " ")}</td>
        <td style="padding:4px 8px;border:1px solid #ddd;text-align:right">${count}</td>
      </tr>`
    })

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Inventory Report - ${report.reportPeriod}</title>
      <style>
        @page { size: A4 landscape; margin: 15mm; }
        body { font-family: Arial, sans-serif; font-size: 12px; color: #333; }
        h1 { font-size: 18px; margin-bottom: 4px; }
        h2 { font-size: 14px; color: #555; margin-top: 20px; margin-bottom: 8px; border-bottom: 2px solid #7c3aed; padding-bottom: 4px; }
        .meta { color: #666; font-size: 11px; margin-bottom: 16px; }
        .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px; }
        .stat-card { background: #f3f4f6; border-radius: 8px; padding: 10px; text-align: center; }
        .stat-card .label { font-size: 10px; text-transform: uppercase; color: #6b7280; }
        .stat-card .value { font-size: 20px; font-weight: bold; color: #1f2937; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 16px; }
        th { background: #f3f4f6; padding: 6px 8px; border: 1px solid #ddd; text-align: left; font-weight: 600; }
        .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #ddd; font-size: 10px; color: #999; display: flex; justify-content: space-between; }
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
      </style></head><body>
      <h1>Inventory Report — ${report.reportPeriod}</h1>
      <div class="meta">
        <strong>Type:</strong> ${report.reportType} &nbsp;|&nbsp;
        <strong>Period:</strong> ${formatDate(report.periodStart)} — ${formatDate(report.periodEnd)}
        ${report.submittedTo ? `&nbsp;|&nbsp; <strong>Submitted to:</strong> ${report.submittedTo}` : ""}
        ${report.notes ? `<br/><strong>Notes:</strong> ${report.notes}` : ""}
      </div>

      ${s ? `<h2>Summary</h2>
      <div class="summary-grid">
        <div class="stat-card"><div class="label">Total Items</div><div class="value">${s.totalItems || 0}</div></div>
        <div class="stat-card"><div class="label">Total Stock</div><div class="value">${s.totalStock || 0}</div></div>
        <div class="stat-card"><div class="label">Low Stock</div><div class="value">${s.lowStockItems || 0}</div></div>
        <div class="stat-card"><div class="label">Reserved</div><div class="value">${s.totalReserved || 0}</div></div>
        <div class="stat-card"><div class="label">Deliveries</div><div class="value">${s.deliveriesReceived || 0}</div></div>
        <div class="stat-card"><div class="label">Items Received</div><div class="value">${s.totalItemsReceived || 0}</div></div>
        <div class="stat-card"><div class="label">Requisitions</div><div class="value">${s.requisitionsProcessed || 0}</div></div>
        <div class="stat-card"><div class="label">Adjustments</div><div class="value">${s.stockAdjustments || 0}</div></div>
      </div>` : ""}

      ${snap.length ? `<h2>Inventory Snapshot (${snap.length} items)</h2>
      <table><thead><tr>
        <th>Code</th><th>Item</th><th>Category</th><th style="text-align:right">Stock</th><th style="text-align:right">Reserved</th><th>Location</th>
      </tr></thead><tbody>${inventoryRows}</tbody></table>` : ""}

      ${dels.length ? `<h2>Deliveries (${report.data?.deliveries?.total || dels.length})</h2>
      <table><thead><tr><th>Delivery No.</th><th>Supplier</th><th>Status</th><th>Date</th></tr></thead><tbody>${deliveryRows}</tbody></table>` : ""}

      ${reqs.length ? `<h2>Requisitions (${report.data?.requisitions?.total || reqs.length})</h2>
      <table><thead><tr><th>RIS No.</th><th>Office</th><th>Status</th></tr></thead><tbody>${reqRows}</tbody></table>` : ""}

      ${Object.keys(adjs).length ? `<h2>Stock Adjustments (${report.data?.adjustments?.total || 0})</h2>
      <table><thead><tr><th>Type</th><th style="text-align:right">Count</th></tr></thead><tbody>${adjRows}</tbody></table>` : ""}

      <div class="footer">
        <span>Generated by: ${report.generatedByName || "System"}</span>
        <span>Generated on: ${new Date(report.createdAt).toLocaleString()}</span>
      </div>
    </body></html>`

    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(html)
      printWindow.document.close()
      setTimeout(() => { printWindow.print() }, 500)
    }
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })

  const typeColors: Record<string, string> = {
    WEEKLY: "bg-blue-100 text-blue-800",
    MONTHLY: "bg-green-100 text-green-800",
    QUARTERLY: "bg-purple-100 text-purple-800",
    ANNUAL: "bg-orange-100 text-orange-800",
  }

  return (
    <>
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white ${toast.type === "success" ? "bg-green-600" : "bg-red-600"}`}>
          {toast.message}
        </div>
      )}

        {/* Controls */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="flex gap-2">
              <select value={filterType} onChange={e => setFilterType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500">
                <option value="">All Types</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="QUARTERLY">Quarterly</option>
                <option value="ANNUAL">Annual</option>
              </select>
            </div>
            <button onClick={() => setShowGenerate(true)}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium text-sm whitespace-nowrap">
              📄 Generate Report
            </button>
          </div>
        </div>

        {/* Reporting Guide */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[
            { type: "Weekly", desc: "Internal inventory logs, checked by Supply Officer", color: "border-blue-400 bg-blue-50" },
            { type: "Monthly", desc: "Consolidated inventory report submitted to City Accounting", color: "border-green-400 bg-green-50" },
            { type: "Quarterly", desc: "Physical inventory validation with discrepancy report", color: "border-purple-400 bg-purple-50" },
            { type: "Annual", desc: "Year-end comprehensive report for COA audit", color: "border-orange-400 bg-orange-50" },
          ].map(g => (
            <div key={g.type} className={`rounded-xl border-l-4 p-4 ${g.color}`}>
              <h3 className="text-sm font-bold text-gray-800">{g.type}</h3>
              <p className="text-xs text-gray-600 mt-1">{g.desc}</p>
            </div>
          ))}
        </div>

        {/* Reports List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : reports.length > 0 ? (
          <div className="space-y-3">
            {reports.map(report => (
              <div key={report.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => openDetail(report)}>
                <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${typeColors[report.reportType]}`}>
                        {report.reportType}
                      </span>
                      <h3 className="text-sm font-bold text-gray-900">{report.reportPeriod}</h3>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mt-1">
                      <span>Period: {formatDate(report.periodStart)} — {formatDate(report.periodEnd)}</span>
                      <span>Generated: {formatDate(report.createdAt)}</span>
                      {report.generatedByName && <span>By: {report.generatedByName}</span>}
                      {report.submittedTo && <span>To: {report.submittedTo}</span>}
                    </div>
                    {report.notes && <p className="text-xs text-gray-400 mt-1">{report.notes}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); exportPDF(report) }}
                      className="px-2.5 py-1.5 text-xs bg-red-50 text-red-700 rounded-lg hover:bg-red-100 font-medium" title="Export PDF">
                      <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                      PDF
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); exportCSV(report) }}
                      className="px-2.5 py-1.5 text-xs bg-green-50 text-green-700 rounded-lg hover:bg-green-100 font-medium" title="Export CSV">
                      <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      CSV
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); exportJSON(report) }}
                      className="px-2.5 py-1.5 text-xs bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 font-medium" title="Export JSON">
                      { "{}" }
                    </button>
                    <button onClick={(e) => handleDelete(report.id, e)}
                      className="px-2.5 py-1.5 text-xs bg-gray-50 text-red-600 rounded-lg hover:bg-red-50 font-medium" title="Delete">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                    <button className="px-3 py-1.5 text-xs bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 font-medium">
                      View Details →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="text-5xl mb-4">📈</div>
            <h3 className="text-lg font-semibold text-gray-800">No Reports Yet</h3>
            <p className="text-sm text-gray-500 mt-2">Generate your first inventory report</p>
            <button onClick={() => setShowGenerate(true)} className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700">Generate Report</button>
          </div>
        )}

      {/* Generate Report Modal */}
      {showGenerate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold text-gray-900">Generate Inventory Report</h2>
              <button onClick={() => setShowGenerate(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleGenerate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Report Type *</label>
                <select value={genForm.reportType} onChange={e => setGenForm({...genForm, reportType: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <option value="WEEKLY">Weekly — Internal Inventory Log</option>
                  <option value="MONTHLY">Monthly — Consolidated Inventory Report</option>
                  <option value="QUARTERLY">Quarterly — Physical Inventory Validation</option>
                  <option value="ANNUAL">Annual — Year-End Comprehensive Report</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Report Period *</label>
                <input type="text" value={genForm.reportPeriod} onChange={e => setGenForm({...genForm, reportPeriod: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required
                  placeholder="e.g., January 2026, Week 6 2026, Q1 2026" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Period Start *</label>
                  <input type="date" value={genForm.periodStart} onChange={e => setGenForm({...genForm, periodStart: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Period End *</label>
                  <input type="date" value={genForm.periodEnd} onChange={e => setGenForm({...genForm, periodEnd: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Submitted To</label>
                <select value={genForm.submittedTo} onChange={e => setGenForm({...genForm, submittedTo: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <option value="">— Select —</option>
                  <option value="City Accounting Office">City Accounting Office</option>
                  <option value="Commission on Audit (COA)">Commission on Audit (COA)</option>
                  <option value="City Mayor's Office">City Mayor&apos;s Office</option>
                  <option value="Internal - Supply Officer">Internal — Supply Officer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea value={genForm.notes} onChange={e => setGenForm({...genForm, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" rows={3}
                  placeholder="Optional notes..." />
              </div>
              <div className="bg-yellow-50 rounded-lg p-3 text-xs text-yellow-700">
                <strong>Note:</strong> The report will automatically aggregate data from all deliveries, requisitions, stock adjustments, and current inventory within the selected period.
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button type="button" onClick={() => setShowGenerate(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={processing} className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm font-medium">
                  {processing ? "Generating..." : "Generate Report"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Detail Modal */}
      {showDetail && selectedReport && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-6 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 mb-10">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10 rounded-t-2xl">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${typeColors[selectedReport.reportType]}`}>
                    {selectedReport.reportType}
                  </span>
                  <h2 className="text-lg font-bold text-gray-900">{selectedReport.reportPeriod}</h2>
                </div>
                <p className="text-sm text-gray-500">
                  Period: {formatDate(selectedReport.periodStart)} — {formatDate(selectedReport.periodEnd)}
                  {selectedReport.submittedTo && <span className="ml-3">• Submitted to: {selectedReport.submittedTo}</span>}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => exportPDF(selectedReport)}
                  className="px-3 py-1.5 text-xs bg-red-50 text-red-700 rounded-lg hover:bg-red-100 font-medium">
                  <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                  PDF
                </button>
                <button onClick={() => exportCSV(selectedReport)}
                  className="px-3 py-1.5 text-xs bg-green-50 text-green-700 rounded-lg hover:bg-green-100 font-medium">
                  <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  CSV
                </button>
                <button onClick={() => exportJSON(selectedReport)}
                  className="px-3 py-1.5 text-xs bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 font-medium">
                  { "{}" } JSON
                </button>
                <button onClick={() => handleDelete(selectedReport.id)}
                  className="px-3 py-1.5 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium">
                  <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  Delete
                </button>
                <button onClick={() => setShowDetail(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {selectedReport.notes && (
                <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">{selectedReport.notes}</div>
              )}

              {/* Summary Cards */}
              {selectedReport.data?.summary && (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 rounded-xl p-4 text-center">
                      <p className="text-xs text-blue-600 uppercase">Total Items</p>
                      <p className="text-2xl font-bold text-blue-800">{selectedReport.data.summary.totalItems || 0}</p>
                    </div>
                    <div className="bg-green-50 rounded-xl p-4 text-center">
                      <p className="text-xs text-green-600 uppercase">Total Stock</p>
                      <p className="text-2xl font-bold text-green-800">{selectedReport.data.summary.totalStock || 0}</p>
                    </div>
                    <div className="bg-yellow-50 rounded-xl p-4 text-center">
                      <p className="text-xs text-yellow-600 uppercase">Low Stock Items</p>
                      <p className="text-2xl font-bold text-yellow-800">{selectedReport.data.summary.lowStockItems || 0}</p>
                    </div>
                    <div className="bg-purple-50 rounded-xl p-4 text-center">
                      <p className="text-xs text-purple-600 uppercase">Reserved</p>
                      <p className="text-2xl font-bold text-purple-800">{selectedReport.data.summary.totalReserved || 0}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-indigo-50 rounded-xl p-4 text-center">
                      <p className="text-xs text-indigo-600 uppercase">Deliveries Received</p>
                      <p className="text-2xl font-bold text-indigo-800">{selectedReport.data.summary.deliveriesReceived || 0}</p>
                    </div>
                    <div className="bg-teal-50 rounded-xl p-4 text-center">
                      <p className="text-xs text-teal-600 uppercase">Items Received</p>
                      <p className="text-2xl font-bold text-teal-800">{selectedReport.data.summary.totalItemsReceived || 0}</p>
                    </div>
                    <div className="bg-orange-50 rounded-xl p-4 text-center">
                      <p className="text-xs text-orange-600 uppercase">Requisitions</p>
                      <p className="text-2xl font-bold text-orange-800">{selectedReport.data.summary.requisitionsProcessed || 0}</p>
                    </div>
                    <div className="bg-red-50 rounded-xl p-4 text-center">
                      <p className="text-xs text-red-600 uppercase">Adjustments</p>
                      <p className="text-2xl font-bold text-red-800">{selectedReport.data.summary.stockAdjustments || 0}</p>
                    </div>
                  </div>
                </>
              )}

              {/* Category Breakdown */}
              {selectedReport.data?.inventorySnapshot && selectedReport.data.inventorySnapshot.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-gray-700 mb-3">Inventory Snapshot</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border border-gray-200 rounded-lg">
                      <thead><tr className="bg-gray-50">
                        <th className="text-left py-2 px-3 font-medium text-gray-500">Code</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-500">Item</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-500">Category</th>
                        <th className="text-right py-2 px-3 font-medium text-gray-500">Stock</th>
                        <th className="text-right py-2 px-3 font-medium text-gray-500">Reserved</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-500">Location</th>
                      </tr></thead>
                      <tbody>
                        {selectedReport.data.inventorySnapshot.map((item: any, idx: number) => (
                          <tr key={idx} className="border-t border-gray-100">
                            <td className="py-1.5 px-3 font-mono text-xs">{item.itemCode}</td>
                            <td className="py-1.5 px-3">{item.name}</td>
                            <td className="py-1.5 px-3 text-xs">{item.category?.replace(/_/g, " ")}</td>
                            <td className="py-1.5 px-3 text-right font-medium">{item.currentStock} {item.unit}</td>
                            <td className="py-1.5 px-3 text-right">{item.reservedStock}</td>
                            <td className="py-1.5 px-3 text-xs">{item.storageZone || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Deliveries Summary */}
              {selectedReport.data?.deliveries && (
                <div>
                  <h3 className="text-sm font-bold text-gray-700 mb-3">
                    Deliveries ({selectedReport.data.deliveries.total || 0} total)
                  </h3>
                  {selectedReport.data.deliveries.recent && selectedReport.data.deliveries.recent.length > 0 ? (
                    <div className="space-y-2">
                      {selectedReport.data.deliveries.recent.map((d: any, idx: number) => (
                        <div key={idx} className="bg-gray-50 rounded-lg p-3 flex justify-between items-center text-sm">
                          <div>
                            <span className="font-medium">{d.deliveryNumber}</span>
                            <span className="text-gray-500 ml-2">from {d.supplier}</span>
                          </div>
                          <span className="text-xs px-2 py-0.5 rounded bg-gray-200">{d.status}</span>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-sm text-gray-500">No deliveries in this period</p>}
                </div>
              )}

              {/* Requisitions Summary */}
              {selectedReport.data?.requisitions && (
                <div>
                  <h3 className="text-sm font-bold text-gray-700 mb-3">
                    Requisitions ({selectedReport.data.requisitions.total || 0} total)
                  </h3>
                  {selectedReport.data.requisitions.recent && selectedReport.data.requisitions.recent.length > 0 ? (
                    <div className="space-y-2">
                      {selectedReport.data.requisitions.recent.map((r: any, idx: number) => (
                        <div key={idx} className="bg-gray-50 rounded-lg p-3 flex justify-between items-center text-sm">
                          <div>
                            <span className="font-medium">{r.risNumber}</span>
                            <span className="text-gray-500 ml-2">by {r.requestingOffice}</span>
                          </div>
                          <span className="text-xs px-2 py-0.5 rounded bg-gray-200">{r.status}</span>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-sm text-gray-500">No requisitions in this period</p>}
                </div>
              )}

              {/* Stock Adjustments Summary */}
              {selectedReport.data?.adjustments && (
                <div>
                  <h3 className="text-sm font-bold text-gray-700 mb-3">
                    Stock Adjustments ({selectedReport.data.adjustments.total || 0} total)
                  </h3>
                  {selectedReport.data.adjustments.byType && Object.keys(selectedReport.data.adjustments.byType).length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                      {Object.entries(selectedReport.data.adjustments.byType).map(([type, count]: [string, any]) => (
                        <div key={type} className="bg-gray-50 rounded-lg px-4 py-2">
                          <p className="text-xs text-gray-500">{type.replace(/_/g, " ")}</p>
                          <p className="text-lg font-bold text-gray-800">{count}</p>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-sm text-gray-500">No adjustments in this period</p>}
                </div>
              )}

              {/* Footer */}
              <div className="border-t pt-4 text-xs text-gray-400 flex justify-between">
                <span>Generated by: {selectedReport.generatedByName || "System"}</span>
                <span>Generated on: {new Date(selectedReport.createdAt).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
