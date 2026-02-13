"use client"

import Link from "next/link"
import Image from "next/image"
import { useState, useEffect, useCallback, memo } from "react"
import { useSession } from "next-auth/react"

export default function Navbar() {
  const [currentTime, setCurrentTime] = useState("")
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const { data: session, status } = useSession()

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const timeString = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
      const dateString = now.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
      setCurrentTime(`${timeString} | ${dateString}`)
    }

    updateTime()
    const interval = setInterval(updateTime, 60000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // Fetch notifications if user is logged in
    if (status === "authenticated") {
      fetchNotifications()
      
      // Refresh notifications every 60 seconds
      const notificationInterval = setInterval(fetchNotifications, 60000)
      return () => clearInterval(notificationInterval)
    }
  }, [status])

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.notifications-menu')) {
        setShowNotifications(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchNotifications = useCallback(async () => {
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
  }, [])

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        // Remove notification from state
        setNotifications(prev => prev.filter(n => n.id !== notificationId))
        // Update unread count if notification was unread
        const deletedNotif = notifications.find(n => n.id === notificationId)
        if (deletedNotif && !deletedNotif.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1))
        }
      }
    } catch (error) {
      console.error("Failed to delete notification:", error)
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
      })
      
      if (response.ok) {
        // Update notification state
        setNotifications(prev => prev.map(n => 
          n.id === notificationId ? { ...n, isRead: true } : n
        ))
        // Decrease unread count
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error)
    }
  }

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20 lg:h-24">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2 sm:space-x-3">
              <Image 
                src="/logo.png" 
                alt="GoServePh Logo" 
                width={40} 
                height={40}
                className="rounded-lg sm:w-[50px] sm:h-[50px]"
              />
              <span className="text-lg sm:text-xl lg:text-2xl font-bold">
                <span className="text-blue-600">Go</span>
                <span className="text-green-600">Serve</span>
                <span className="text-blue-600">Ph</span>
              </span>
            </Link>
          </div>

          {/* Right side with notifications and time */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Profile link - only show if user is logged in */}
            {status === "authenticated" && (
              <Link
                href="/profile"
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                title="Account Settings"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </Link>
            )}

            {/* Notifications - only show if user is logged in */}
            {status === "authenticated" && (
              <div className="relative notifications-menu">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
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

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-lg border border-gray-200 py-2 max-h-96 overflow-y-auto z-50">
                    <div className="px-4 py-2 border-b border-gray-200 flex justify-between items-center">
                      <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                      {unreadCount > 0 && (
                        <span className="text-xs text-gray-500">{unreadCount} unread</span>
                      )}
                    </div>
                    {notifications.length > 0 ? (
                      notifications.map((notif) => (
                        <div 
                          key={notif.id} 
                          className={`px-4 py-3 hover:bg-gray-50 border-b border-gray-100 transition-colors ${!notif.isRead ? 'bg-blue-50' : ''}`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1 pr-2">
                              <p className="text-sm text-gray-900 font-medium">{notif.title}</p>
                              <p className="text-xs text-gray-600 mt-1">{notif.message}</p>
                              <p className="text-xs text-gray-400 mt-1">{notif.time}</p>
                            </div>
                            <div className="flex items-center space-x-1">
                              {!notif.isRead && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleMarkAsRead(notif.id)
                                  }}
                                  className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded transition-colors"
                                  title="Mark as read"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteNotification(notif.id)
                                }}
                                className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors"
                                title="Delete notification"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-8 text-center text-gray-500 text-sm">
                        No notifications yet
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Time Display */}
            <div className="text-gray-700 font-medium text-xs sm:text-sm lg:text-lg text-right">
              {currentTime || "Loading..."}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
