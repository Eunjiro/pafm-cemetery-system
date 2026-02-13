"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"

interface UserData {
  id: string
  name: string
  email: string
  role: string
  mobile: string | null
  barangay: string | null
  profileComplete: boolean
  createdAt: string
  _count: {
    deathRegistrations: number
    burialPermits: number
    waterConnections: number
    drainageRequests: number
    waterIssues: number
  }
}

interface UserDetail {
  id: string
  name: string
  email: string
  role: string
  mobile: string | null
  birthdate: string | null
  address: string | null
  houseNumber: string | null
  street: string | null
  barangay: string | null
  profileComplete: boolean
  createdAt: string
  updatedAt: string
  _count: {
    deathRegistrations: number
    burialPermits: number
    exhumationPermits: number
    cremationPermits: number
    deathCertificateRequests: number
    waterConnections: number
    drainageRequests: number
    waterIssues: number
    auditLogs: number
  }
}

interface Stats {
  total: number
  admins: number
  employees: number
  users: number
}

interface Pagination {
  total: number
  page: number
  limit: number
  totalPages: number
}

const roleColors: Record<string, string> = {
  ADMIN: "bg-red-100 text-red-800 border-red-200",
  EMPLOYEE: "bg-orange-100 text-orange-800 border-orange-200",
  USER: "bg-blue-100 text-blue-800 border-blue-200",
}

const RoleIcon = ({ role, className = "w-4 h-4" }: { role: string; className?: string }) => {
  if (role === "ADMIN") return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
  )
  if (role === "EMPLOYEE") return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
  )
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
  )
}

export default function UserManagementPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<UserData[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, admins: 0, employees: 0, users: 0 })
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 10, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)

  // Modal states
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [roleChangeUser, setRoleChangeUser] = useState<UserData | null>(null)
  const [newRole, setNewRole] = useState("")
  const [updating, setUpdating] = useState(false)
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (status === "authenticated") {
      if (session?.user?.role !== "ADMIN") {
        router.push("/dashboard")
        return
      }
    }
  }, [status, session, router])

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.set("search", searchTerm)
      if (roleFilter !== "all") params.set("role", roleFilter)
      params.set("page", currentPage.toString())
      params.set("limit", "10")

      const res = await fetch(`/api/admin/users?${params.toString()}`)
      const data = await res.json()
      if (data.users) {
        setUsers(data.users)
        setPagination(data.pagination)
        setStats(data.stats)
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setLoading(false)
    }
  }, [searchTerm, roleFilter, currentPage])

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "ADMIN") {
      fetchUsers()
    }
  }, [status, session, fetchUsers])

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, roleFilter])

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  const handleViewUser = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`)
      const data = await res.json()
      if (data.user) {
        setSelectedUser(data.user)
        setShowDetailModal(true)
      }
    } catch (error) {
      console.error("Error fetching user details:", error)
      showToast("error", "Failed to load user details")
    }
  }

  const openRoleModal = (user: UserData) => {
    setRoleChangeUser(user)
    setNewRole(user.role)
    setShowRoleModal(true)
  }

  const handleRoleChange = async () => {
    if (!roleChangeUser || !newRole || newRole === roleChangeUser.role) return
    setUpdating(true)
    try {
      const res = await fetch(`/api/admin/users/${roleChangeUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      })
      const data = await res.json()
      if (res.ok) {
        showToast("success", `${roleChangeUser.name}'s role changed to ${newRole}`)
        setShowRoleModal(false)
        setRoleChangeUser(null)
        fetchUsers()
      } else {
        showToast("error", data.error || "Failed to update role")
      }
    } catch (error) {
      showToast("error", "Failed to update role")
    } finally {
      setUpdating(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading user management...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] px-6 py-3 rounded-lg shadow-lg text-white font-medium transition-all ${
          toast.type === "success" ? "bg-green-600" : "bg-red-600"
        }`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white py-6 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/services" className="text-sm text-red-200 hover:text-white mb-2 inline-block">
                ← Back to Services
              </Link>
              <h1 className="text-3xl font-bold">User Management</h1>
              <p className="text-red-100 mt-1">Manage user accounts, roles, and permissions</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-red-200">System Administrator</p>
              <p className="font-semibold">{session?.user?.name}</p>
              <span className="inline-block mt-1 px-2 py-1 bg-red-800 text-red-100 text-xs font-medium rounded">
                ADMIN
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-gray-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Administrators</p>
                <p className="text-3xl font-bold text-red-600">{stats.admins}</p>
              </div>
              <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Employees</p>
                <p className="text-3xl font-bold text-orange-600">{stats.employees}</p>
              </div>
              <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Citizens</p>
                <p className="text-3xl font-bold text-blue-600">{stats.users}</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Users</label>
              <div className="relative">
                <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Role</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900"
              >
                <option value="all">All Roles</option>
                <option value="ADMIN">Administrators</option>
                <option value="EMPLOYEE">Employees</option>
                <option value="USER">Citizens</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Users ({pagination.total})
            </h2>
            <p className="text-sm text-gray-500">
              Page {pagination.page} of {pagination.totalPages}
            </p>
          </div>

          {users.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Users Found</h3>
              <p className="text-gray-600">No users match your search criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => {
                    const totalActivity =
                      user._count.deathRegistrations +
                      user._count.burialPermits +
                      user._count.waterConnections +
                      user._count.drainageRequests +
                      user._count.waterIssues
                    const isSelf = user.id === session?.user?.id

                    return (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ${
                              user.role === "ADMIN" ? "bg-gradient-to-br from-red-400 to-red-600" :
                              user.role === "EMPLOYEE" ? "bg-gradient-to-br from-orange-400 to-orange-600" :
                              "bg-gradient-to-br from-blue-400 to-blue-600"
                            }`}>
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                {user.name}
                                {isSelf && (
                                  <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">You</span>
                                )}
                              </div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${roleColors[user.role]}`}>
                            <RoleIcon role={user.role} /> {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{user.mobile || "—"}</div>
                          <div className="text-xs text-gray-500">{user.barangay || "No barangay"}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{totalActivity} actions</div>
                          <div className="text-xs text-gray-500">
                            {user.profileComplete ? (
                              <span className="text-green-600">Profile complete</span>
                            ) : (
                              <span className="text-amber-600">Incomplete profile</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewUser(user.id)}
                              className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                              View
                            </button>
                            {!isSelf && (
                              <button
                                onClick={() => openRoleModal(user)}
                                className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                              >
                                Change Role
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  First
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  ← Prev
                </button>
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === pagination.totalPages || Math.abs(p - currentPage) <= 1)
                  .reduce<(number | string)[]>((acc, p, idx, arr) => {
                    if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...")
                    acc.push(p)
                    return acc
                  }, [])
                  .map((p, idx) =>
                    typeof p === "string" ? (
                      <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p)}
                        className={`px-3 py-1.5 text-sm rounded-lg border ${
                          currentPage === p
                            ? "bg-red-600 text-white border-red-600"
                            : "border-gray-300 hover:bg-gray-100"
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={currentPage === pagination.totalPages}
                  className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
                <button
                  onClick={() => setCurrentPage(pagination.totalPages)}
                  disabled={currentPage === pagination.totalPages}
                  className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Last
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Detail Modal */}
      {showDetailModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">User Details</h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* User Info Header */}
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold ${
                  selectedUser.role === "ADMIN" ? "bg-gradient-to-br from-red-400 to-red-600" :
                  selectedUser.role === "EMPLOYEE" ? "bg-gradient-to-br from-orange-400 to-orange-600" :
                  "bg-gradient-to-br from-blue-400 to-blue-600"
                }`}>
                  {selectedUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{selectedUser.name}</h3>
                  <p className="text-sm text-gray-500">{selectedUser.email}</p>
                  <span className={`inline-flex items-center gap-1 mt-1 px-2.5 py-1 rounded-full text-xs font-medium border ${roleColors[selectedUser.role]}`}>
                    <RoleIcon role={selectedUser.role} /> {selectedUser.role}
                  </span>
                </div>
              </div>

              {/* Personal Info */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Personal Information</h4>
                <div className="grid grid-cols-2 gap-3">
                  <InfoItem label="Mobile" value={selectedUser.mobile || "—"} />
                  <InfoItem label="Birthdate" value={selectedUser.birthdate ? new Date(selectedUser.birthdate).toLocaleDateString() : "—"} />
                  <InfoItem label="House No." value={selectedUser.houseNumber || "—"} />
                  <InfoItem label="Street" value={selectedUser.street || "—"} />
                  <InfoItem label="Barangay" value={selectedUser.barangay || "—"} />
                  <InfoItem label="Address" value={selectedUser.address || "—"} />
                </div>
              </div>

              {/* Account Info */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Account</h4>
                <div className="grid grid-cols-2 gap-3">
                  <InfoItem label="Joined" value={new Date(selectedUser.createdAt).toLocaleDateString()} />
                  <InfoItem label="Updated" value={new Date(selectedUser.updatedAt).toLocaleDateString()} />
                  <InfoItem label="Profile" value={selectedUser.profileComplete ? "Complete" : "Incomplete"} />
                  <InfoItem label="Audit Logs" value={selectedUser._count.auditLogs.toString()} />
                </div>
              </div>

              {/* Activity */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Service Activity</h4>
                <div className="grid grid-cols-2 gap-2">
                  <ActivityItem label="Death Registrations" count={selectedUser._count.deathRegistrations} color="green" />
                  <ActivityItem label="Burial Permits" count={selectedUser._count.burialPermits} color="green" />
                  <ActivityItem label="Exhumation Permits" count={selectedUser._count.exhumationPermits} color="green" />
                  <ActivityItem label="Cremation Permits" count={selectedUser._count.cremationPermits} color="green" />
                  <ActivityItem label="Death Certificates" count={selectedUser._count.deathCertificateRequests} color="green" />
                  <ActivityItem label="Water Connections" count={selectedUser._count.waterConnections} color="blue" />
                  <ActivityItem label="Drainage Requests" count={selectedUser._count.drainageRequests} color="cyan" />
                  <ActivityItem label="Water Issues" count={selectedUser._count.waterIssues} color="red" />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setShowDetailModal(false)}
                className="w-full px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Change Modal */}
      {showRoleModal && roleChangeUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Change User Role</h2>
                <button
                  onClick={() => { setShowRoleModal(false); setRoleChangeUser(null) }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-3 mb-6 p-3 bg-gray-50 rounded-lg">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                  roleChangeUser.role === "ADMIN" ? "bg-gradient-to-br from-red-400 to-red-600" :
                  roleChangeUser.role === "EMPLOYEE" ? "bg-gradient-to-br from-orange-400 to-orange-600" :
                  "bg-gradient-to-br from-blue-400 to-blue-600"
                }`}>
                  {roleChangeUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{roleChangeUser.name}</p>
                  <p className="text-sm text-gray-500">{roleChangeUser.email}</p>
                </div>
              </div>

              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Role</label>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${roleColors[roleChangeUser.role]}`}>
                  <RoleIcon role={roleChangeUser.role} /> {roleChangeUser.role}
                </span>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">New Role</label>
                <div className="space-y-2">
                  {(["USER", "EMPLOYEE", "ADMIN"] as const).map((role) => (
                    <label
                      key={role}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                        newRole === role
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={role}
                        checked={newRole === role}
                        onChange={() => setNewRole(role)}
                        className="text-red-600 focus:ring-red-500"
                      />
                      <RoleIcon role={role} className="w-5 h-5" />
                      <div>
                        <p className="font-medium text-gray-900">{role}</p>
                        <p className="text-xs text-gray-500">
                          {role === "ADMIN" && "Full system access and management controls"}
                          {role === "EMPLOYEE" && "Process requests and manage municipal services"}
                          {role === "USER" && "Standard citizen account with service access"}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {newRole === "ADMIN" && roleChangeUser.role !== "ADMIN" && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800 font-medium flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                    Warning
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    Granting admin access gives this user full control over the system, including user management.
                  </p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => { setShowRoleModal(false); setRoleChangeUser(null) }}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleRoleChange}
                disabled={updating || newRole === roleChangeUser.role}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? "Updating..." : "Confirm Change"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-2.5">
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className="text-sm text-gray-900 font-medium mt-0.5">{value}</p>
    </div>
  )
}

function ActivityItem({ label, count, color }: { label: string; count: number; color: string }) {
  const colorMap: Record<string, string> = {
    green: "text-green-700 bg-green-50",
    blue: "text-blue-700 bg-blue-50",
    cyan: "text-cyan-700 bg-cyan-50",
    red: "text-red-700 bg-red-50",
  }
  return (
    <div className={`flex items-center justify-between rounded-lg p-2.5 ${colorMap[color] || "bg-gray-50"}`}>
      <span className="text-xs font-medium">{label}</span>
      <span className="text-sm font-bold">{count}</span>
    </div>
  )
}
