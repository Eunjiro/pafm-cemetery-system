import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function ParksServiceDashboard() {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }

  const userRole = session.user?.role || "USER"

  if (userRole === "ADMIN") {
    redirect("/services/parks/admin-dashboard")
  } else if (userRole === "EMPLOYEE") {
    redirect("/services/parks/employee-dashboard")
  } else {
    redirect("/services/parks/user-dashboard")
  }
}
