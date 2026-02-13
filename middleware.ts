import { auth } from "@/auth"
import { NextResponse } from "next/server"

/**
 * Centralized route protection middleware
 * Runs before every request to enforce authentication and role-based access
 */
export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth
  const userRole = req.auth?.user?.role

  // Public routes that don't require authentication
  const publicRoutes = [
    "/",
    "/login",
    "/register",
    "/reset-password",
    "/terms",
    "/privacy",
    "/help",
  ]

  // API routes that are public
  const publicApiRoutes = [
    "/api/auth",
    "/api/register",
    "/api/public",
    "/api/payment/callback",
    "/api/payment/test-payment",
    "/api/payment/manual-callback",
  ]

  // Check if current path matches any public route
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  )
  const isPublicApi = publicApiRoutes.some((route) =>
    pathname.startsWith(route)
  )

  // Allow public routes and static assets
  if (isPublicRoute || isPublicApi || pathname.startsWith("/_next") || pathname.startsWith("/favicon")) {
    return NextResponse.next()
  }

  // Redirect unauthenticated users to login
  if (!isLoggedIn) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.redirect(new URL("/login", req.url))
  }

  // Admin-only routes
  const adminRoutes = ["/admin"]
  const isAdminRoute = adminRoutes.some((route) =>
    pathname.startsWith(route)
  )
  if (isAdminRoute && userRole !== "ADMIN") {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  // Admin dashboard routes within services (admin-dashboard paths)
  if (pathname.includes("/admin-dashboard") && userRole !== "ADMIN" && userRole !== "EMPLOYEE") {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  // Employee dashboard routes
  if (pathname.includes("/employee-dashboard") && userRole !== "ADMIN" && userRole !== "EMPLOYEE") {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  // Verification routes (employee/admin only)
  if (pathname.includes("/verification") && userRole !== "ADMIN" && userRole !== "EMPLOYEE") {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon)
     * - public files (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
}
