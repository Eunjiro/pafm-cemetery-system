import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function FacilitiesServiceDashboard() {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }

  const userRole = session.user?.role || "USER"

  if (userRole === "ADMIN") {
    redirect("/services/facilities/admin-dashboard")
  } else if (userRole === "EMPLOYEE") {
    redirect("/services/facilities/employee-dashboard")
  } else {
    redirect("/services/facilities/user-dashboard")
  }
}
