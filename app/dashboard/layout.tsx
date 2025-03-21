"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Home, User, Calendar, MessageSquare, Bell, Settings, LogOut, Menu, PawPrint, Users } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ThemeToggle } from "@/components/theme-toggle"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
      }

      setLoading(false)
    }

    checkUser()
  }, [router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  const getInitials = (name: string) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  const farmerNavItems = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/dashboard/profile", label: "Profile", icon: User },
    { href: "/dashboard/farmer/animals", label: "My Animals", icon: PawPrint },
    { href: "/dashboard/appointments", label: "Appointments", icon: Calendar },
    { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
    { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
  ]

  const vetNavItems = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/dashboard/profile", label: "Profile", icon: User },
    { href: "/dashboard/vet/patients", label: "Patients", icon: PawPrint },
    { href: "/dashboard/appointments", label: "Appointments", icon: Calendar },
    { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
    { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
  ]

  const adminNavItems = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/dashboard/profile", label: "Profile", icon: User },
    { href: "/dashboard/admin/users", label: "Users", icon: Users },
    { href: "/dashboard/admin/animals", label: "Animals", icon: PawPrint },
    { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
  ]

  const navItems = userRole === "farmer" ? farmerNavItems : userRole === "vet" ? vetNavItems : adminNavItems

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        {/* Desktop Sidebar */}
        <Sidebar className="hidden md:flex">
          <SidebarHeader className="p-4">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <PawPrint className="h-6 w-6" />
              <span className="text-xl font-bold">MyVet</span>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href}>
                    <Link href={item.href}>
                      <item.icon className="h-5 w-5 mr-3" />
                      {item.label}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Avatar>
                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                  <AvatarFallback>{getInitials(user?.user_metadata?.full_name || user?.email)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{user?.user_metadata?.full_name || user?.email}</p>
                  <p className="text-xs text-muted-foreground capitalize">{userRole}</p>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings">Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </SidebarFooter>
        </Sidebar>

        {/* Mobile Header */}
        <div className="flex flex-col flex-1">
          <header className="sticky top-0 z-10 flex items-center justify-between p-4 border-b bg-background md:hidden">
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                <Menu className="h-6 w-6" />
              </Button>
              <Link href="/dashboard" className="flex items-center space-x-2">
                <PawPrint className="h-6 w-6" />
                <span className="text-xl font-bold">MyVet</span>
              </Link>
            </div>
            <div className="flex items-center space-x-2">
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.user_metadata?.avatar_url} />
                      <AvatarFallback>{getInitials(user?.user_metadata?.full_name || user?.email)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings">Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="fixed inset-0 z-50 bg-background md:hidden">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-4 border-b">
                  <div className="flex items-center space-x-2">
                    <PawPrint className="h-6 w-6" />
                    <span className="text-xl font-bold">MyVet</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                    <span className="sr-only">Close menu</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </Button>
                </div>
                <div className="flex-1 overflow-auto py-4">
                  <nav className="space-y-1 px-2">
                    {navItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                          pathname === item.href
                            ? "bg-primary text-primary-foreground"
                            : "text-foreground hover:bg-muted"
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <item.icon className="h-5 w-5 mr-3" />
                        {item.label}
                      </Link>
                    ))}
                  </nav>
                </div>
                <div className="border-t p-4">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={user?.user_metadata?.avatar_url} />
                      <AvatarFallback>{getInitials(user?.user_metadata?.full_name || user?.email)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{user?.user_metadata?.full_name || user?.email}</p>
                      <p className="text-xs text-muted-foreground capitalize">{userRole}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full mt-4 flex items-center justify-center"
                    onClick={handleSignOut}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Log out
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}

