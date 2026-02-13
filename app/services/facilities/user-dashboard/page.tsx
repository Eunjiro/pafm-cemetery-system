"use client"

import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import Link from "next/link"
import { useEffect, useState } from "react"

export default function FacilitiesUserDashboard() {
  const { data: session, status } = useSession()
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (status === "authenticated") {
      fetchNotifications()
    }
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.notifications-menu')) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [status])

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/notifications")
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error)
    }
  }

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, { method: 'DELETE' })
      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId))
        const deletedNotif = notifications.find(n => n.id === notificationId)
        if (deletedNotif && !deletedNotif.isRead) setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) { console.error("Failed to delete notification:", error) }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, { method: 'PATCH' })
      if (response.ok) {
        setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n))
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) { console.error("Failed to mark notification as read:", error) }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    redirect("/login")
  }

  const userRole = session?.user?.role || "USER"
  if (userRole !== "USER") {
    redirect("/services/facilities")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-orange-600 text-white py-6 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/services" className="text-sm text-orange-100 hover:text-white mb-2 inline-block">
                ← Back to Services
              </Link>
              <h1 className="text-3xl font-bold">Facility Management</h1>
              <p className="text-orange-100 mt-1">Reserve conference halls, gymnasiums, training rooms, and more</p>
            </div>
            <div className="flex items-center gap-4">
              {/* Notifications */}
              <div className="relative notifications-menu">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-orange-100 hover:text-white hover:bg-orange-700 rounded-full transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2 max-h-96 overflow-y-auto z-50">
                    <div className="px-4 py-2 border-b border-gray-200 flex justify-between items-center">
                      <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                      {unreadCount > 0 && <span className="text-xs text-gray-500">{unreadCount} unread</span>}
                    </div>
                    {notifications.length > 0 ? (
                      notifications.map((notif) => (
                        <div key={notif.id} className={`px-4 py-3 hover:bg-gray-50 border-b border-gray-100 ${!notif.isRead ? 'bg-orange-50' : ''}`}>
                          <div className="flex justify-between items-start">
                            <div className="flex-1 pr-2">
                              <p className="text-sm text-gray-900 font-medium">{notif.title}</p>
                              <p className="text-xs text-gray-600 mt-1">{notif.message}</p>
                              <p className="text-xs text-gray-400 mt-1">{notif.time}</p>
                            </div>
                            <div className="flex items-center space-x-1">
                              {!notif.isRead && (
                                <button onClick={(e) => { e.stopPropagation(); handleMarkAsRead(notif.id) }} className="p-1 text-orange-600 hover:text-orange-800 hover:bg-orange-100 rounded" title="Mark as read">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                </button>
                              )}
                              <button onClick={(e) => { e.stopPropagation(); handleDeleteNotification(notif.id) }} className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded" title="Delete">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-8 text-center text-gray-500 text-sm">No notifications yet</div>
                    )}
                  </div>
                )}
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold">{session?.user?.name}</p>
                <Link href="/services/facilities/my-reservations">
                  <button className="text-sm text-orange-100 hover:text-white hover:bg-orange-700 px-4 py-1 rounded-md transition-colors">
                    My Reservations →
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Service Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Facility Reservation */}
          <Link href="/services/facilities/reserve">
            <div className="group bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100">
              <div className="flex items-start space-x-4">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-orange-600">Facility Reservation / Usage Request</h3>
                  <p className="text-sm text-gray-600 mt-1">Conference halls, gymnasiums, training rooms, auditoriums & more</p>
                  <p className="text-xs text-orange-600 font-medium mt-2">Fee varies by facility type</p>
                </div>
              </div>
            </div>
          </Link>

          {/* My Reservations */}
          <Link href="/services/facilities/my-reservations">
            <div className="group bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100">
              <div className="flex items-start space-x-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600">My Reservations</h3>
                  <p className="text-sm text-gray-600 mt-1">Track your reservation status, gate passes, and history</p>
                  <p className="text-xs text-blue-600 font-medium mt-2">View all submissions</p>
                </div>
              </div>
            </div>
          </Link>

        </div>

        {/* Info Section */}
        <div className="mt-10 bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Available Facilities</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: "Conference Hall", icon: "🏛️" },
              { name: "Gymnasium", icon: "🏋️" },
              { name: "Training Room", icon: "📋" },
              { name: "Auditorium", icon: "🎭" },
              { name: "Cultural Center", icon: "🎨" },
              { name: "Multipurpose Hall", icon: "🏢" },
              { name: "Covered Court", icon: "🏀" },
              { name: "Other Facilities", icon: "🏗️" },
            ].map((facility) => (
              <div key={facility.name} className="flex items-center space-x-2 p-3 bg-orange-50 rounded-lg">
                <span className="text-2xl">{facility.icon}</span>
                <span className="text-sm font-medium text-gray-700">{facility.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Process Info */}
        <div className="mt-6 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl shadow-md p-6 border border-orange-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Reservation Process</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              { step: "1", title: "Submit Request", desc: "Fill out reservation form" },
              { step: "2", title: "Under Review", desc: "Staff checks schedule & requirements" },
              { step: "3", title: "Payment", desc: "Process payment (if applicable)" },
              { step: "4", title: "Approved", desc: "Gate pass / access code issued" },
              { step: "5", title: "Event Day", desc: "Use facility & post-event inspection" },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-10 h-10 bg-orange-600 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-lg font-bold">{item.step}</div>
                <h3 className="text-sm font-bold text-gray-900">{item.title}</h3>
                <p className="text-xs text-gray-600 mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Cancellation Policy */}
        <div className="mt-6 bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Cancellation Policy</h2>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start space-x-2">
              <span className="text-orange-500 mt-0.5">•</span>
              <span>You may cancel while the request is <strong>Pending Review</strong> or <strong>Awaiting Payment</strong></span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-orange-500 mt-0.5">•</span>
              <span>If no requirements or payment within <strong>48 hours</strong>, the reservation is <strong>auto-cancelled</strong> and the slot is released</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-orange-500 mt-0.5">•</span>
              <span>Once <strong>Approved</strong>, cancellation must be requested and processed by staff</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
