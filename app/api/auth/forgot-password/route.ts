import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"
import { rateLimit, getClientIp } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 5 reset requests per 15 minutes per IP
    const ip = getClientIp(request)
    const { limited, retryAfter } = rateLimit(`forgot:${ip}`, 5, 15 * 60 * 1000)
    if (limited) {
      return NextResponse.json(
        { error: "Too many password reset attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      )
    }

    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email }
    })

    // Always return success to prevent email enumeration attacks
    // But only send email if user exists
    if (user) {
      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString("hex")
      const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hour from now

      // Save reset token to database
      await prisma.user.update({
        where: { email },
        data: {
          resetToken,
          resetTokenExpiry
        }
      })

      // TODO: Send email with reset link
      // For now, we'll just log it (in production, integrate with email service)
      const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`
      console.log(`Password reset link for ${email}: ${resetUrl}`)
      
      // In production, you would send an email here:
      // await sendEmail({
      //   to: email,
      //   subject: "Password Reset Request",
      //   html: `Click here to reset your password: <a href="${resetUrl}">${resetUrl}</a>`
      // })
    }

    // Always return success message
    return NextResponse.json(
      { message: "If an account exists with that email, a reset link has been sent." },
      { status: 200 }
    )

  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json(
      { error: "An error occurred. Please try again later." },
      { status: 500 }
    )
  }
}
