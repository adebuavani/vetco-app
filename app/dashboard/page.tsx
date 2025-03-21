"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    animals: 0,
    appointments: 0,
    messages: 0,
    notifications: 0,
  })

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.push("/login")
        return
      }

      setUser(session.user)

      // Fetch user role from the database
      const { data, error } = await supabase.from("users").select("role").eq("id", session.user.id).single()

      if (error) {
        console.error("Error fetching user role:", error)
      } else if (data) {
        setUserRole(data.role)

        // Redirect to role-specific dashboard
        if (data.role === "farmer") {
          router.push("/dashboard/farmer")
        } else if (data.role === "vet") {
          router.push("/dashboard/vet")
        } else if (data.role === "admin") {
          router.push("/dashboard/admin")
        }
      }

      setLoading(false)
    }

    checkUser()
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <p className="text-muted-foreground mb-8">Redirecting to your role-specific dashboard...</p>

      <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Redirecting...</h2>
        <p className="text-muted-foreground mb-6">
          If you are not redirected automatically, please click one of the buttons below.
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          <Button asChild>
            <Link href="/dashboard/farmer">Farmer Dashboard</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/vet">Vet Dashboard</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/admin">Admin Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

