"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Navbar from "@/app/components/Navbar"
import { useDialog } from "@/app/components/DialogProvider"

interface ProfileData {
  id: string
  email: string
  name: string
  role: string
  mobile: string | null
  birthdate: string | null
  address: string | null
  houseNumber: string | null
  street: string | null
  barangay: string | null
  profileComplete: boolean
  createdAt: string
  hasPassword: boolean
}

type ActiveTab = "profile" | "password"

export default function ProfilePage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const dialog = useDialog()

  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<ActiveTab>("profile")

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    mobile: "",
    birthdate: "",
    address: "",
    houseNumber: "",
    street: "",
    barangay: "",
    currentPassword: "",
  })
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileError, setProfileError] = useState("")

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordError, setPasswordError] = useState("")

  // Set-password form state (for OAuth users)
  const [oauthPasswordForm, setOauthPasswordForm] = useState({
    newPassword: "",
    confirmPassword: "",
  })
  const [oauthPasswordSaving, setOauthPasswordSaving] = useState(false)
  const [oauthPasswordError, setOauthPasswordError] = useState("")

  // Password visibility toggles
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showVerifyPassword, setShowVerifyPassword] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }
    if (status === "authenticated") {
      fetchProfile()
    }
  }, [status, router])

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/user/profile")
      if (res.ok) {
        const data = await res.json()
        setProfile(data)
        setProfileForm({
          name: data.name || "",
          email: data.email || "",
          mobile: data.mobile || "",
          birthdate: data.birthdate ? new Date(data.birthdate).toISOString().split("T")[0] : "",
          address: data.address || "",
          houseNumber: data.houseNumber || "",
          street: data.street || "",
          barangay: data.barangay || "",
          currentPassword: "",
        })
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileError("")

    // Require password verification if user has a password
    if (profile?.hasPassword && !profileForm.currentPassword) {
      setProfileError("Enter your current password to verify your identity")
      return
    }

    setProfileSaving(true)
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileForm),
      })

      const data = await res.json()
      if (res.ok) {
        await update() // Refresh session
        setProfile((prev) =>
          prev ? { ...prev, ...data.user, hasPassword: prev.hasPassword } : prev
        )
        setProfileForm((prev) => ({ ...prev, currentPassword: "" }))
        await dialog.success("Your profile has been updated successfully.", "Profile Updated")
      } else {
        setProfileError(data.error || "Failed to update profile")
      }
    } catch {
      setProfileError("An error occurred. Please try again.")
    } finally {
      setProfileSaving(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError("")

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New passwords do not match")
      return
    }

    if (passwordForm.newPassword.length < 10) {
      setPasswordError("New password must be at least 10 characters")
      return
    }

    setPasswordSaving(true)
    try {
      const res = await fetch("/api/user/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwordForm),
      })

      const data = await res.json()
      if (res.ok) {
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
        await dialog.success("Your password has been changed successfully.", "Password Changed")
      } else {
        setPasswordError(data.error || "Failed to change password")
      }
    } catch {
      setPasswordError("An error occurred. Please try again.")
    } finally {
      setPasswordSaving(false)
    }
  }

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setOauthPasswordError("")

    if (oauthPasswordForm.newPassword !== oauthPasswordForm.confirmPassword) {
      setOauthPasswordError("Passwords do not match")
      return
    }

    if (oauthPasswordForm.newPassword.length < 10) {
      setOauthPasswordError("Password must be at least 10 characters")
      return
    }

    setOauthPasswordSaving(true)
    try {
      const res = await fetch("/api/user/set-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(oauthPasswordForm),
      })

      const data = await res.json()
      if (res.ok) {
        setOauthPasswordForm({ newPassword: "", confirmPassword: "" })
        setProfile((prev) => (prev ? { ...prev, hasPassword: true } : prev))
        await dialog.success(
          "Password set successfully. You can now sign in with your email and password.",
          "Password Created"
        )
      } else {
        setOauthPasswordError(data.error || "Failed to set password")
      }
    } catch {
      setOauthPasswordError("An error occurred. Please try again.")
    } finally {
      setOauthPasswordSaving(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-24">
          <p className="text-red-600">Failed to load profile data.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Account Settings</h1>
          <p className="text-gray-600 mt-1">
            Manage your personal information and security settings
          </p>
        </div>

        {/* Account overview card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold uppercase">
              {profile.name.charAt(0)}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">{profile.name}</h2>
              <p className="text-gray-600">{profile.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    profile.role === "ADMIN"
                      ? "bg-red-100 text-red-700"
                      : profile.role === "EMPLOYEE"
                      ? "bg-orange-100 text-orange-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {profile.role}
                </span>
                <span className="text-xs text-gray-400">
                  Member since {new Date(profile.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "profile"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Personal Info
            </span>
          </button>
          <button
            onClick={() => setActiveTab("password")}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "password"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Password &amp; Security
            </span>
          </button>
        </div>

        {/* ────── Profile Tab ────── */}
        {activeTab === "profile" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              {profileError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {profileError}
                </div>
              )}

              {/* Name & Email */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                    <input
                      type="text"
                      required
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                    <input
                      type="email"
                      required
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                    />
                    {profileForm.email !== profile.email && (
                      <p className="mt-1 text-xs text-amber-600">
                        Changing your email will update your login credentials
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact & Personal */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Mobile Number</label>
                    <input
                      type="tel"
                      value={profileForm.mobile}
                      onChange={(e) => setProfileForm({ ...profileForm, mobile: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                      placeholder="09XXXXXXXXX"
                    />
                    <p className="mt-1 text-xs text-gray-500">Format: 09XXXXXXXXX (11 digits)</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Birthdate</label>
                    <input
                      type="date"
                      value={profileForm.birthdate}
                      onChange={(e) => setProfileForm({ ...profileForm, birthdate: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                    />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Address</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">House Number</label>
                    <input
                      type="text"
                      value={profileForm.houseNumber}
                      onChange={(e) => setProfileForm({ ...profileForm, houseNumber: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                      placeholder="123"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Street</label>
                    <input
                      type="text"
                      value={profileForm.street}
                      onChange={(e) => setProfileForm({ ...profileForm, street: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                      placeholder="Main Street"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Barangay</label>
                    <input
                      type="text"
                      value={profileForm.barangay}
                      onChange={(e) => setProfileForm({ ...profileForm, barangay: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                      placeholder="Barangay Name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Complete Address</label>
                    <input
                      type="text"
                      value={profileForm.address}
                      onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                      placeholder="Full address"
                    />
                  </div>
                </div>
              </div>

              {/* Identity verification */}
              {profile.hasPassword && (
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Verify Your Identity</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Enter your current password to confirm these changes are made by you
                  </p>
                  <div className="max-w-sm relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Current Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showVerifyPassword ? "text" : "password"}
                        value={profileForm.currentPassword}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, currentPassword: e.target.value })
                        }
                        className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowVerifyPassword(!showVerifyPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showVerifyPassword ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {profileSaving ? (
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" /><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75" /></svg>
                      Saving...
                    </span>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ────── Password Tab ────── */}
        {activeTab === "password" && (
          <div className="space-y-6">
            {/* Change Password (for users who have a password) */}
            {profile.hasPassword && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Change Password</h3>
                <p className="text-sm text-gray-500 mb-5">
                  Enter your current password and choose a new one (minimum 10 characters)
                </p>

                <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                  {passwordError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                      {passwordError}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Password</label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        required
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showCurrentPassword ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        required
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                        minLength={10}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showNewPassword ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        )}
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Minimum 10 characters</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm New Password</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                        minLength={10}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        )}
                      </button>
                    </div>
                    {passwordForm.confirmPassword &&
                      passwordForm.newPassword !== passwordForm.confirmPassword && (
                        <p className="mt-1 text-xs text-red-500">Passwords do not match</p>
                      )}
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={passwordSaving}
                      className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {passwordSaving ? (
                        <span className="flex items-center gap-2">
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" /><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75" /></svg>
                          Changing...
                        </span>
                      ) : (
                        "Change Password"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Set Password (for OAuth users without a password) */}
            {!profile.hasPassword && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-start gap-3 mb-5">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Set a Password</h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Your account was created with Google sign-in. Set a password so you can also sign in with your email and password.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSetPassword} className="space-y-4 max-w-md">
                  {oauthPasswordError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                      {oauthPasswordError}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
                    <input
                      type="password"
                      required
                      value={oauthPasswordForm.newPassword}
                      onChange={(e) => setOauthPasswordForm({ ...oauthPasswordForm, newPassword: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                      minLength={10}
                    />
                    <p className="mt-1 text-xs text-gray-500">Minimum 10 characters</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
                    <input
                      type="password"
                      required
                      value={oauthPasswordForm.confirmPassword}
                      onChange={(e) => setOauthPasswordForm({ ...oauthPasswordForm, confirmPassword: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                      minLength={10}
                    />
                    {oauthPasswordForm.confirmPassword &&
                      oauthPasswordForm.newPassword !== oauthPasswordForm.confirmPassword && (
                        <p className="mt-1 text-xs text-red-500">Passwords do not match</p>
                      )}
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={oauthPasswordSaving}
                      className="px-6 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {oauthPasswordSaving ? (
                        <span className="flex items-center gap-2">
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" /><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75" /></svg>
                          Setting Password...
                        </span>
                      ) : (
                        "Set Password"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Security info */}
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Security Tips</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Use at least 10 characters with a mix of letters, numbers, and symbols
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Don&apos;t reuse passwords from other websites or services
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Never share your password with anyone, including government employees
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
