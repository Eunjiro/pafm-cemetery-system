"use client"
import Navbar from "./components/Navbar"
import ServiceCard from "./components/ServiceCard"
import { useState, useEffect } from "react"
import { signIn, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useDialog } from "@/app/components/DialogProvider"

export default function Home() {
  const { data: session, status } = useSession()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false)
  const [showGoogleTermsModal, setShowGoogleTermsModal] = useState(false)
  const [googleTermsAccepted, setGoogleTermsAccepted] = useState(false)
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("")
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState("")
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false)
  const [registerData, setRegisterData] = useState({
    firstName: "",
    lastName: "",
    middleName: "",
    noMiddleName: false,
    suffix: "",
    birthdate: "",
    email: "",
    mobile: "",
    address: "",
    houseNumber: "",
    street: "",
    barangay: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false
  })
  const [registerError, setRegisterError] = useState("")
  const [registerLoading, setRegisterLoading] = useState(false)
  const router = useRouter()
  const dialog = useDialog()

  // Redirect authenticated users to services page
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/services")
    }
  }, [status, router])

  // Check if user has already accepted Google terms
  useEffect(() => {
    const accepted = localStorage.getItem("googleTermsAccepted")
    if (accepted === "true") {
      setGoogleTermsAccepted(true)
    }
  }, [])

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotPasswordMessage("")
    setForgotPasswordLoading(true)

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotPasswordEmail }),
      })

      const data = await response.json()

      if (response.ok) {
        setForgotPasswordMessage("Password reset instructions have been sent to your email.")
        setForgotPasswordEmail("")
      } else {
        setForgotPasswordMessage(data.error || "Failed to send reset email.")
      }
    } catch (error) {
      setForgotPasswordMessage("An error occurred. Please try again.")
    } finally {
      setForgotPasswordLoading(false)
    }
  }

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
        router.push("/services")
        router.refresh()
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = () => {
    if (!googleTermsAccepted) {
      setShowGoogleTermsModal(true)
    } else {
      signIn("google", { callbackUrl: "/services" })
    }
  }

  const handleGoogleTermsAccept = () => {
    // Save acceptance to localStorage so it persists
    localStorage.setItem("googleTermsAccepted", "true")
    setGoogleTermsAccepted(true)
    setShowGoogleTermsModal(false)
    signIn("google", { callbackUrl: "/services" })
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setRegisterError("")

    // Validation
    if (!registerData.agreeToTerms) {
      setRegisterError("You must read and accept both Terms of Use and Data Privacy")
      return
    }

    if (registerData.password !== registerData.confirmPassword) {
      setRegisterError("Passwords do not match")
      return
    }

    if (registerData.password.length < 10) {
      setRegisterError("Password must be at least 10 characters")
      return
    }

    if (!registerData.mobile.match(/^09\d{9}$/)) {
      setRegisterError("Mobile number must be in format 09XXXXXXXXX (11 digits)")
      return
    }

    setRegisterLoading(true)

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: registerData.email,
          password: registerData.password,
          name: `${registerData.firstName} ${registerData.middleName ? registerData.middleName + ' ' : ''}${registerData.lastName}${registerData.suffix ? ' ' + registerData.suffix : ''}`,
          mobile: registerData.mobile,
          birthdate: registerData.birthdate,
          address: registerData.address,
          houseNumber: registerData.houseNumber,
          street: registerData.street,
          barangay: registerData.barangay,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        await dialog.success("Registration successful! Please login.")
        setShowRegisterModal(false)
        setEmail(registerData.email)
        // Reset form
        setRegisterData({
          firstName: "",
          lastName: "",
          middleName: "",
          noMiddleName: false,
          suffix: "",
          birthdate: "",
          email: "",
          mobile: "",
          address: "",
          houseNumber: "",
          street: "",
          barangay: "",
          password: "",
          confirmPassword: "",
          agreeToTerms: false
        })
      } else {
        setRegisterError(data.error || "Registration failed")
      }
    } catch (err) {
      setRegisterError("An error occurred. Please try again.")
    } finally {
      setRegisterLoading(false)
    }
  }

  const getPasswordStrength = () => {
    const pwd = registerData.password
    let strength = 0
    if (pwd.length >= 10) strength++
    if (/[A-Z]/.test(pwd)) strength++
    if (/[a-z]/.test(pwd)) strength++
    if (/[0-9]/.test(pwd)) strength++
    if (/[^A-Za-z0-9]/.test(pwd)) strength++
    
    if (strength <= 1) return { label: "Very Weak", color: "text-red-600" }
    if (strength === 2) return { label: "Weak", color: "text-orange-600" }
    if (strength === 3) return { label: "Fair", color: "text-yellow-600" }
    if (strength === 4) return { label: "Good", color: "text-blue-600" }
    return { label: "Strong", color: "text-green-600" }
  }

  const passwordStrength = getPasswordStrength()

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

  // Show loading while checking auth, or redirect if authenticated
  if (status === "loading" || status === "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Hero Section */}
      <section className="py-6 sm:py-10 bg-gradient-to-br from-blue-50 to-green-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center">
            {/* Left Side - Tagline */}
            <div className="text-center lg:text-left order-2 lg:order-1">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 text-gray-900">
                <span className="text-green-500">Abot-Kamay mo ang</span>
                <br />
                <span className="text-blue-500">Serbisyong Publiko!</span>
                
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-gray-700 mb-4 sm:mb-8">
                Access government services with ease. Your gateway to efficient and transparent public service delivery.              </p>
            </div>

            {/* Right Side - Login Form */}
            <div className="flex justify-center lg:justify-end order-1 lg:order-2">
              <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 lg:p-10 w-full max-w-xl">
              <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
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
                    className="w-full px-5 py-4 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                    className="w-full px-5 py-4 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="••••••••"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="rememberMe"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-700">
                      Remember me
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowForgotPasswordModal(true)}
                    className="text-sm text-green-600 hover:text-green-700 font-medium"
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-600 text-white py-4 text-base rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? "Signing in..." : "Sign In"}
                </button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or continue with</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Sign in with Google
                </button>

                <div className="text-center text-sm text-gray-600">
                  Don't have an account?{" "}
                  <button 
                    type="button"
                    onClick={() => setShowRegisterModal(true)}
                    className="text-green-600 hover:text-green-700 font-semibold"
                  >
                    Register here
                  </button>
                </div>
              </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-green-600 text-white py-6 sm:py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
            {/* Left Side - Contact Info */}
            <div className="text-center sm:text-left">
              <h3 className="text-base sm:text-lg font-semibold mb-2">Government Services Management System</h3>
              <p className="text-sm sm:text-base text-green-100">
                For any inquiries, please call <span className="font-semibold">122</span> or email{" "}
                <a href="mailto:helpdesk@gov.ph" className="underline hover:text-white">
                  helpdesk@gov.ph
                </a>
              </p>
            </div>

            {/* Right Side - Policy Links */}
            <div className="flex items-center gap-2 sm:gap-4 text-sm sm:text-base">
              <button
                onClick={() => setShowTermsModal(true)}
                className="text-white hover:underline font-medium"
              >
                TERMS OF SERVICE
              </button>
              <span className="text-green-200">|</span>
              <button
                onClick={() => setShowPrivacyModal(true)}
                className="text-white hover:underline font-medium"
              >
                PRIVACY POLICY
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Registration Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 overflow-y-auto" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="bg-white rounded-lg max-w-3xl w-full my-4 sm:my-8">
            <div className="bg-green-600 text-white px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center rounded-t-lg">
              <h2 className="text-xl sm:text-2xl font-bold">Create Account</h2>
              <button
                onClick={() => setShowRegisterModal(false)}
                className="text-white hover:text-gray-200 text-2xl sm:text-3xl"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleRegister} className="p-4 sm:p-6 max-h-[calc(90vh-100px)] overflow-y-auto">
              {registerError && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">
                  {registerError}
                </div>
              )}

              {/* Personal Information */}
              <h3 className="text-lg font-bold text-gray-900 mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={registerData.firstName}
                    onChange={(e) => setRegisterData({...registerData, firstName: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter your first name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={registerData.lastName}
                    onChange={(e) => setRegisterData({...registerData, lastName: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter your last name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Middle Name {!registerData.noMiddleName && '*'}
                  </label>
                  <input
                    type="text"
                    required={!registerData.noMiddleName}
                    disabled={registerData.noMiddleName}
                    value={registerData.middleName}
                    onChange={(e) => setRegisterData({...registerData, middleName: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100"
                    placeholder="Enter your middle name"
                  />
                  <label className="flex items-center mt-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={registerData.noMiddleName}
                      onChange={(e) => setRegisterData({...registerData, noMiddleName: e.target.checked, middleName: e.target.checked ? '' : registerData.middleName})}
                      className="mr-2"
                    />
                    I don't have a middle name
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Suffix
                  </label>
                  <input
                    type="text"
                    value={registerData.suffix}
                    onChange={(e) => setRegisterData({...registerData, suffix: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Jr., Sr., III (optional)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Birthdate *
                  </label>
                  <input
                    type="date"
                    required
                    value={registerData.birthdate}
                    onChange={(e) => setRegisterData({...registerData, birthdate: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={registerData.email}
                    onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="your.email@example.com"
                  />
                  <p className="text-xs text-gray-500 mt-1">✓ Accepts all email providers</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={registerData.mobile}
                    onChange={(e) => setRegisterData({...registerData, mobile: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="09XXXXXXXXX"
                    pattern="09[0-9]{9}"
                  />
                  <p className="text-xs text-gray-500 mt-1">Format: 09XXXXXXXXX (11 digits)</p>
                </div>
              </div>

              {/* Address Information */}
              <h3 className="text-lg font-bold text-gray-900 mb-4 mt-6">Address Information</h3>
              <div className="grid grid-cols-1 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Complete Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={registerData.address}
                    onChange={(e) => setRegisterData({...registerData, address: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Lot/Unit, Building, Subdivision"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      House Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={registerData.houseNumber}
                      onChange={(e) => setRegisterData({...registerData, houseNumber: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="123"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Street *
                    </label>
                    <input
                      type="text"
                      required
                      value={registerData.street}
                      onChange={(e) => setRegisterData({...registerData, street: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Main Street"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Barangay *
                    </label>
                    <input
                      type="text"
                      required
                      value={registerData.barangay}
                      onChange={(e) => setRegisterData({...registerData, barangay: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Barangay Name"
                    />
                  </div>
                </div>
              </div>

              {/* Security Information */}
              <h3 className="text-lg font-bold text-gray-900 mb-4 mt-6">Security Information</h3>
              <div className="grid grid-cols-1 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={registerData.password}
                    onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Create a strong password"
                  />
                  <div className="mt-2">
                    <p className={`text-sm font-medium ${passwordStrength.color}`}>{passwordStrength.label}</p>
                    <ul className="text-xs text-gray-600 mt-1 space-y-1">
                      <li className={registerData.password.length >= 10 ? 'text-green-600' : ''}>✓ At least 10 characters</li>
                      <li className={/[A-Z]/.test(registerData.password) ? 'text-green-600' : ''}>✓ Has uppercase letter</li>
                      <li className={/[a-z]/.test(registerData.password) ? 'text-green-600' : ''}>✓ Has lowercase letter</li>
                      <li className={/[0-9]/.test(registerData.password) ? 'text-green-600' : ''}>✓ Has a number</li>
                      <li className={/[^A-Za-z0-9]/.test(registerData.password) ? 'text-green-600' : ''}>✓ Has a special character</li>
                    </ul>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={registerData.confirmPassword}
                    onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Confirm your password"
                  />
                </div>
              </div>

              {/* Terms & Privacy */}
              <div className="mb-6">
                <label className="flex items-start">
                  <input
                    type="checkbox"
                    checked={registerData.agreeToTerms}
                    onChange={(e) => setRegisterData({...registerData, agreeToTerms: e.target.checked})}
                    className="mt-1 mr-3"
                  />
                  <span className="text-sm text-gray-700">
                    I agree to the{" "}
                    <button type="button" onClick={() => setShowTermsModal(true)} className="text-green-600 hover:underline">
                      Terms of Use
                    </button>{" "}
                    and{" "}
                    <button type="button" onClick={() => setShowPrivacyModal(true)} className="text-green-600 hover:underline">
                      Privacy Policy
                    </button>
                  </span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={registerLoading}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {registerLoading ? "Creating Account..." : "Create Account"}
                </button>
              </div>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or sign up with</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign up with Google
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Terms of Service Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-green-600 text-white px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold">GoServePH Terms of Service</h2>
              <button
                onClick={() => setShowTermsModal(false)}
                className="text-white hover:text-gray-200 text-3xl"
              >
                ×
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              <p className="mb-4">Welcome to GoServePH! These Terms of Service ("Terms") govern your use of the Government Services Management System and all related services provided by GoServePH.</p>
              
              <h3 className="text-xl font-bold mt-6 mb-3">1. Acceptance of Terms</h3>
              <p className="mb-4">By accessing or using GoServePH, you agree to be bound by these Terms and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.</p>
              
              <h3 className="text-xl font-bold mt-6 mb-3">2. Description of Service</h3>
              <p className="mb-2">GoServePH is a comprehensive government services management platform that provides:</p>
              <ul className="list-disc ml-6 mb-4">
                <li>Student registration and scholarship management</li>
                <li>Document processing and verification</li>
                <li>Payment processing for government services</li>
                <li>Administrative dashboard for government personnel</li>
                <li>Secure data management and reporting</li>
              </ul>

              <h3 className="text-xl font-bold mt-6 mb-3">3. User Accounts and Registration</h3>
              <p className="mb-2"><strong>Account Creation:</strong> To access certain features, you must create an account by providing accurate, current, and complete information.</p>
              <p className="mb-2"><strong>Account Security:</strong> You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>
              <p className="mb-4"><strong>Account Types:</strong> GoServePH supports different user types including students, government personnel, and administrators, each with specific access levels and permissions.</p>

              <h3 className="text-xl font-bold mt-6 mb-3">4. Acceptable Use Policy</h3>
              <p className="mb-2">You agree to use GoServePH only for lawful purposes and in accordance with these Terms. You agree NOT to:</p>
              <ul className="list-disc ml-6 mb-4">
                <li>Use the service for any illegal or unauthorized purpose</li>
                <li>Attempt to gain unauthorized access to any part of the system</li>
                <li>Interfere with or disrupt the service or servers</li>
                <li>Submit false, misleading, or fraudulent information</li>
                <li>Violate any applicable local, national, or international law</li>
                <li>Harass, abuse, or harm other users</li>
              </ul>

              <h3 className="text-xl font-bold mt-6 mb-3">5. Privacy and Data Protection</h3>
              <p className="mb-4">Your privacy is important to us. Our collection and use of personal information is governed by our Data Privacy Policy, which is incorporated into these Terms by reference. By using GoServePH, you consent to the collection and use of information as described in our Privacy Policy.</p>

              <h3 className="text-xl font-bold mt-6 mb-3">6. Intellectual Property Rights</h3>
              <p className="mb-2"><strong>Our Rights:</strong> GoServePH and its original content, features, and functionality are owned by the Government of the Philippines and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.</p>
              <p className="mb-4"><strong>Your Content:</strong> You retain ownership of any content you submit to GoServePH, but grant us a license to use, modify, and display such content as necessary to provide our services.</p>

              <h3 className="text-xl font-bold mt-6 mb-3">7. Service Availability and Modifications</h3>
              <p className="mb-2">We strive to maintain high service availability but cannot guarantee uninterrupted access. We reserve the right to:</p>
              <ul className="list-disc ml-6 mb-4">
                <li>Modify or discontinue the service with reasonable notice</li>
                <li>Perform maintenance that may temporarily affect service availability</li>
                <li>Update features and functionality to improve user experience</li>
              </ul>

              <h3 className="text-xl font-bold mt-6 mb-3">8. Payment Terms</h3>
              <p className="mb-4">Certain services may require payment of fees. All fees are non-refundable unless otherwise specified. Payment processing is handled securely through authorized payment gateways.</p>

              <h3 className="text-xl font-bold mt-6 mb-3">9. Limitation of Liability</h3>
              <p className="mb-4">To the maximum extent permitted by law, GoServePH shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses resulting from your use of the service.</p>

              <h3 className="text-xl font-bold mt-6 mb-3">10. Indemnification</h3>
              <p className="mb-4">You agree to defend, indemnify, and hold harmless GoServePH and its officers, directors, employees, and agents from and against any claims, damages, obligations, losses, liabilities, costs, or debt arising from your use of the service or violation of these Terms.</p>

              <h3 className="text-xl font-bold mt-6 mb-3">11. Termination</h3>
              <p className="mb-4">We may terminate or suspend your account and access to the service immediately, without prior notice, for any reason, including breach of these Terms. Upon termination, your right to use the service will cease immediately.</p>

              <h3 className="text-xl font-bold mt-6 mb-3">12. Governing Law and Dispute Resolution</h3>
              <p className="mb-4">These Terms shall be governed by and construed in accordance with the laws of the Republic of the Philippines. Any disputes arising from these Terms or your use of GoServePH shall be resolved through the appropriate Philippine courts.</p>

              <h3 className="text-xl font-bold mt-6 mb-3">13. Changes to Terms</h3>
              <p className="mb-4">We reserve the right to modify these Terms at any time. We will notify users of any material changes through the service or via email. Your continued use of GoServePH after such modifications constitutes acceptance of the updated Terms.</p>

              <h3 className="text-xl font-bold mt-6 mb-3">14. Contact Information</h3>
              <p className="mb-2">For questions about these Terms of Service, please contact us at:</p>
              <ul className="list-none ml-6 mb-4">
                <li><strong>Email:</strong> helpdesk@gov.ph</li>
                <li><strong>Phone:</strong> 122</li>
                <li><strong>Address:</strong> Government Services Management System, Philippines</li>
              </ul>

              <p className="text-sm text-gray-600 mt-6">Last Updated: February 9, 2026</p>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Policy Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-green-600 text-white px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold">GoServePH Data Privacy Policy</h2>
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="text-white hover:text-gray-200 text-3xl"
              >
                ×
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              <p className="mb-4">Protecting the information you and your users handle through our system is our highest priority. This policy outlines how GoServePH manages, secures, and uses your data.</p>
              
              <h3 className="text-xl font-bold mt-6 mb-3">1. How We Define and Use Data</h3>
              <p className="mb-2">In this policy, we define the types of data that flow through the GoServePH system:</p>
              <div className="mb-4 border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold">Term</th>
                      <th className="px-4 py-2 text-left font-semibold">Definition</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t">
                      <td className="px-4 py-2 font-medium">Personal Data</td>
                      <td className="px-4 py-2">Any information that can identify a specific person, whether directly or indirectly, shared or accessible through the Services.</td>
                    </tr>
                    <tr className="border-t">
                      <td className="px-4 py-2 font-medium">User Data</td>
                      <td className="px-4 py-2">Information that describes your business operations, services, or internal activities.</td>
                    </tr>
                    <tr className="border-t">
                      <td className="px-4 py-2 font-medium">GoServePH Data</td>
                      <td className="px-4 py-2">Details about transactions and activity on our platform, information used for fraud detection, aggregated data, and any non-personal information generated by our system.</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h4 className="text-lg font-semibold mt-4 mb-2">Our Commitment to Data Use</h4>
              <p className="mb-2">We analyze and manage data only for the following critical purposes:</p>
              <ul className="list-disc ml-6 mb-4">
                <li>To provide, maintain, and improve the GoServePH Services for you and all other users.</li>
                <li>To detect and mitigate fraud, financial loss, or other harm to you or other users.</li>
                <li>To develop and enhance our products, systems, and tools.</li>
              </ul>
              <p className="mb-4">We will not sell or share Personal Data with unaffiliated parties for their marketing purposes. By using our system, you consent to our use of your Data in this manner.</p>

              <h3 className="text-xl font-bold mt-6 mb-3">2. Data Protection and Compliance</h3>
              <h4 className="text-lg font-semibold mt-4 mb-2">Confidentiality</h4>
              <p className="mb-4">We commit to using Data only as permitted by our agreement or as specifically directed by you. You, in turn, must protect all Data you access through GoServePH and use it only in connection with our Services. Neither party may use Personal Data to market to third parties without explicit consent.</p>
              <p className="mb-4">We will only disclose Data when legally required to do so, such as through a subpoena, court order, or search warrant.</p>

              <h4 className="text-lg font-semibold mt-4 mb-2">Privacy Compliance and Responsibilities</h4>
              <p className="mb-2"><strong>Your Legal Duty:</strong> You affirm that you are, and will remain, compliant with all applicable Philippine laws (including the Data Privacy Act of 2012) governing the collection, protection, and use of the Data you provide to us.</p>
              <p className="mb-2"><strong>Consent:</strong> You are responsible for obtaining all necessary rights and consents from your End-Users to allow us to collect, use, and store their Personal Data.</p>
              <p className="mb-4"><strong>End-User Disclosure:</strong> You must clearly inform your End-Users that GoServePH processes transactions for you and may receive their Personal Data as part of that process.</p>

              <h4 className="text-lg font-semibold mt-4 mb-2">Data Processing Roles</h4>
              <p className="mb-2">When we process Personal Data on your behalf, we operate under the following legal roles:</p>
              <ul className="list-disc ml-6 mb-4">
                <li>You are the Data Controller (you determine why and how the data is processed).</li>
                <li>We are the Data Intermediary (we process data strictly according to your instructions).</li>
              </ul>
              <p className="mb-2">As the Data Intermediary, we commit to:</p>
              <ul className="list-disc ml-6 mb-4">
                <li>Implementing appropriate security measures to protect the Personal Data we process.</li>
                <li>Not retaining Personal Data longer than necessary to fulfill the purposes set out in our agreement.</li>
              </ul>

              <h4 className="text-lg font-semibold mt-4 mb-2">Prohibited Activities</h4>
              <p className="mb-4">You are strictly prohibited from data mining the GoServePH database or any portion of it without our express written permission.</p>

              <h4 className="text-lg font-semibold mt-4 mb-2">Breach Notification</h4>
              <p className="mb-4">If we become aware of an unauthorized acquisition, disclosure, change, or loss of Personal Data on our systems (a "Breach"), we will notify you and provide sufficient information to help you mitigate any negative impact, consistent with our legal obligations.</p>

              <h3 className="text-xl font-bold mt-6 mb-3">3. Account Deactivation and Data Deletion</h3>
              <h4 className="text-lg font-semibold mt-4 mb-2">Initiating Deactivation</h4>
              <p className="mb-4">If you wish to remove your personal information from our systems, you must go to your Edit Profile page and click the 'Deactivate Account' button. This action initiates the data deletion and account deactivation process.</p>

              <h4 className="text-lg font-semibold mt-4 mb-2">Data Retention</h4>
              <p className="mb-4">Upon deactivation, all of your Personal Identifying Information will be deleted from our systems.</p>
              <p className="mb-4"><strong>Important Note:</strong> Due to the nature of our role as a Government Services Management System, and for legal, accounting, and audit purposes, we are required to retain some of your non-personal account activity history and transactional records. You will receive a confirmation email once your request has been fully processed.</p>

              <h3 className="text-xl font-bold mt-6 mb-3">4. Security Controls and Responsibilities</h3>
              <h4 className="text-lg font-semibold mt-4 mb-2">Our Security</h4>
              <p className="mb-4">We are responsible for implementing commercially reasonable administrative, technical, and physical procedures to protect Data from unauthorized access, loss, or modification. We comply with all applicable Laws in handling Data.</p>

              <h4 className="text-lg font-semibold mt-4 mb-2">Your Security Controls</h4>
              <p className="mb-2">You acknowledge that no security system is perfect. You agree to implement your own necessary security measures ("Security Controls"), which must include:</p>
              <ul className="list-disc ml-6 mb-4">
                <li>Firewall and anti-virus systems.</li>
                <li>Anti-phishing systems.</li>
                <li>End-User and device management policies.</li>
                <li>Data handling protocols.</li>
              </ul>
              <p className="mb-4">We reserve the right to suspend your Account or the Services if necessary to maintain system integrity and security, or to prevent harm. You waive any right to claim losses that result from a Breach or any action we take to prevent harm.</p>
            </div>
          </div>
        </div>
      )}

      {/* Google Terms Acceptance Modal */}
      {showGoogleTermsModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="bg-green-600 text-white px-6 py-4 flex justify-between items-center rounded-t-lg">
              <h2 className="text-2xl font-bold">Terms & Privacy</h2>
              <button
                onClick={() => setShowGoogleTermsModal(false)}
                className="text-white hover:text-gray-200 text-3xl"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-4">
                Before continuing with Google sign-in, please review and accept our terms and privacy policy.
              </p>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <p className="text-sm text-gray-600 mb-3">
                  By signing in with Google, you agree to:
                </p>
                <ul className="list-disc ml-6 text-sm text-gray-700 space-y-1">
                  <li>Our Terms of Service</li>
                  <li>Our Privacy Policy</li>
                  <li>Collection of required profile information</li>
                </ul>
              </div>

              <div className="mb-6">
                <label className="flex items-start cursor-pointer">
                  <input
                    type="checkbox"
                    checked={googleTermsAccepted}
                    onChange={(e) => setGoogleTermsAccepted(e.target.checked)}
                    className="mt-1 mr-3 w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">
                    I have read and agree to the{" "}
                    <button 
                      type="button" 
                      onClick={() => {
                        setShowGoogleTermsModal(false)
                        setShowTermsModal(true)
                      }} 
                      className="text-green-600 hover:underline"
                    >
                      Terms of Service
                    </button>{" "}
                    and{" "}
                    <button 
                      type="button" 
                      onClick={() => {
                        setShowGoogleTermsModal(false)
                        setShowPrivacyModal(true)
                      }} 
                      className="text-green-600 hover:underline"
                    >
                      Privacy Policy
                    </button>
                  </span>
                </label>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowGoogleTermsModal(false)
                    setGoogleTermsAccepted(false)
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleGoogleTermsAccept}
                  disabled={!googleTermsAccepted}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Continue with Google
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="bg-green-600 text-white px-6 py-4 flex justify-between items-center rounded-t-lg">
              <h2 className="text-2xl font-bold">Forgot Password</h2>
              <button
                onClick={() => {
                  setShowForgotPasswordModal(false)
                  setForgotPasswordEmail("")
                  setForgotPasswordMessage("")
                }}
                className="text-white hover:text-gray-200 text-3xl"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleForgotPassword} className="p-6">
              <p className="text-gray-700 mb-4">
                Enter your email address and we'll send you instructions to reset your password.
              </p>
              
              {forgotPasswordMessage && (
                <div className={`px-4 py-3 rounded-lg text-sm mb-4 ${
                  forgotPasswordMessage.includes("sent") 
                    ? "bg-green-50 text-green-600" 
                    : "bg-red-50 text-red-600"
                }`}>
                  {forgotPasswordMessage}
                </div>
              )}

              <div className="mb-6">
                <label htmlFor="forgotEmail" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  id="forgotEmail"
                  type="email"
                  required
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="your@email.com"
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPasswordModal(false)
                    setForgotPasswordEmail("")
                    setForgotPasswordMessage("")
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={forgotPasswordLoading}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {forgotPasswordLoading ? "Sending..." : "Send Reset Link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
