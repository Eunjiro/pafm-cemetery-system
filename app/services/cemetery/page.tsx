import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function CemeteryDashboard() {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }

  const userRole = session.user?.role || "USER"

  // Redirect based on role
  if (userRole === "ADMIN") {
    redirect("/services/cemetery/admin-dashboard")
  } else if (userRole === "EMPLOYEE") {
    redirect("/services/cemetery/employee-dashboard")
  } else {
    redirect("/services/cemetery/user-dashboard")
  }
}
