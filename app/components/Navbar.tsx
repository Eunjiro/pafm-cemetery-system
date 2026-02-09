"use client"

import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"

export default function Navbar() {
  const [currentTime, setCurrentTime] = useState("")

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const timeString = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
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
    const interval = setInterval(updateTime, 1000)

    return () => clearInterval(interval)
  }, [])

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

          {/* Time Display */}
          <div className="flex items-center">
            <div className="text-gray-700 font-medium text-xs sm:text-sm lg:text-lg text-right">
              {currentTime || "Loading..."}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
