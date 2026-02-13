import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function WaterServiceDashboard() {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }

  const userRole = session.user?.role || "USER"

  if (userRole === "ADMIN") {
    redirect("/services/water/admin-dashboard")
  } else if (userRole === "EMPLOYEE") {
    redirect("/services/water/employee-dashboard")
  } else {
    redirect("/services/water/user-dashboard")
  }
}
