import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        rememberMe: { label: "Remember Me", type: "text" }
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email as string
          }
        })

        if (!user) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          rememberMe: credentials.rememberMe === "true"
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // For Google OAuth, create/update user in database
      if (account?.provider === "google") {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! }
          })

          if (!existingUser) {
            // Create new user with Google info - profileComplete = false
            await prisma.user.create({
              data: {
                email: user.email!,
                name: user.name || "",
                password: "", // No password for OAuth users
                role: "USER",
                profileComplete: false,
              }
            })
          }
        } catch (error) {
          console.error("Error during sign in:", error)
          // Return false to show access denied
          return false
        }
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.rememberMe = (user as any).rememberMe || false
        token.loginAt = Math.floor(Date.now() / 1000)
      }

      // Expire non-remember-me sessions after 24 hours
      if (token.loginAt && !token.rememberMe) {
        const elapsed = Math.floor(Date.now() / 1000) - (token.loginAt as number)
        if (elapsed > 24 * 60 * 60) {
          return {} as any
        }
      }

      if (!user && token.email) {
        // Fetch user from database to get role and profile status
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email }
        })
        if (dbUser) {
          token.id = dbUser.id
          token.role = dbUser.role
          token.profileComplete = dbUser.profileComplete
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.profileComplete = token.profileComplete as boolean
      }
      return session
    }
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days for remember me
  },
})
