"use client"
import Navbar from "./components/Navbar"
import ServiceCard from "./components/ServiceCard"
import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function Home() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      })

      if (result?.error) {
        setError("Invalid email or password")
      } else {
        router.push("/dashboard")
        router.refresh()
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const services = [
    {
      title: "Cemetery and Burial Management",
      description: "Manage cemetery plots, burial records, and memorial services efficiently.",
      icon: "🪦",
      href: "/services/cemetery"
    },
    {
      title: "Water Supply and Drainage Requests",
      description: "Submit and track water supply connections and drainage system requests.",
      icon: "💧",
      href: "/services/water"
    },
    {
      title: "Assets Inventory Tracker",
      description: "Track and manage municipal assets, equipment, and infrastructure inventory.",
      icon: "📦",
      href: "/services/inventory"
    },
    {
      title: "Parks and Recreation Scheduling",
      description: "Book and schedule public parks, sports facilities, and recreation activities.",
      icon: "🌳",
      href: "/services/parks"
    },
    {
      title: "Facility Management",
      description: "Manage public facilities, maintenance requests, and resource allocation.",
      icon: "🏢",
      href: "/services/facilities"
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Hero Section */}
      <section className="py-10 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-green-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Tagline */}
            <div>
              <h1 className="text-5xl font-bold mb-6 text-gray-900">
                Your Gateway to
                <br />
                <span className="text-blue-600">Go</span>
                <span className="text-green-600">Serve</span>
                <span className="text-blue-600">Ph</span>
              </h1>
              <p className="text-xl text-gray-700 mb-8">
                Streamlined municipal services at your fingertips. Fast, efficient, and accessible for all citizens.
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2 text-gray-700">
                  <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>24/7 Online Access</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Fast Processing</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Secure & Reliable</span>
                </div>
              </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="bg-white rounded-2xl w-100 shadow-2xl p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Welcome Back</h2>
              <form onSubmit={handleLogin} className="space-y-6">
                {error && (
                  <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? "Signing in..." : "Sign In"}
                </button>

                <div className="text-center text-sm text-gray-600">
                  Don't have an account?{" "}
                  <a href="/register" className="text-green-600 hover:text-green-700 font-semibold">
                    Register here
                  </a>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Services</h2>
            <p className="text-lg text-gray-600">
              Choose from our range of municipal services designed to serve you better
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <ServiceCard
                key={index}
                title={service.title}
                description={service.description}
                icon={service.icon}
                href={service.href}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">
            © 2026 Public Assets & Facilities Management. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
