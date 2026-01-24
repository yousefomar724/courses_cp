import { Outlet, Link, useLocation } from "react-router-dom"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { useAuthStore } from "@/stores/auth-store"
import {
  Home,
  Users,
  ShieldCheck,
  Building,
  GraduationCap,
  Settings,
  LogOut,
  Book,
  BookOpen,
  Video,
  ClipboardCheck,
  BookText,
} from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  {
    name: "Admins",
    href: "/dashboard/admins",
    icon: ShieldCheck,
    permission: "read_admins",
  },
  {
    name: "Roles",
    href: "/dashboard/roles",
    icon: Settings,
    permission: "read_roles",
  },
  {
    name: "Users",
    href: "/dashboard/users",
    icon: Users,
    permission: "read_users",
  },
  {
    name: "Universities",
    href: "/dashboard/universities",
    icon: Building,
    permission: "read_universities",
  },
  {
    name: "Faculties",
    href: "/dashboard/faculties",
    icon: GraduationCap,
    permission: "read_faculties",
  },
  {
    name: "Courses",
    href: "/dashboard/courses",
    icon: Book,
    permission: "read_courses",
  },
  {
    name: "Free Courses",
    href: "/dashboard/free-courses",
    icon: BookText,
    permission: "read_courses",
  },
  {
    name: "Enrollments",
    href: "/dashboard/enrollments",
    icon: BookOpen,
    permission: "read_enrollments",
  },
  {
    name: "Quizzes",
    href: "/dashboard/quizzes",
    icon: ClipboardCheck,
    permission: "read_quizzes",
  },
  {
    name: "Videos Library",
    href: "/dashboard/videos-library",
    icon: Video,
    permission: "read_video_library",
  },
]

export function DashboardLayout() {
  const location = useLocation()
  const { admin, logout, hasPermission } = useAuthStore()

  const handleLogout = () => {
    logout()
  }

  const filteredNavigation = navigation.filter((item) => {
    // If no permission is required, always show (e.g., Dashboard)
    if (!item.permission) return true
    return hasPermission(item.permission)
  })

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gray-50 flex w-full">
        <Sidebar collapsible="icon">
          <SidebarHeader>
            <div className="flex items-center justify-center p-2 lg:px-4 lg:py-2 min-h-12">
              <img src="/logo-small.png" alt="logo" className="w-24" />
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {filteredNavigation.map((item) => {
                    const Icon = item.icon
                    const isActive = location.pathname === item.href

                    return (
                      <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          tooltip={item.name}
                        >
                          <Link to={item.href}>
                            <Icon className="h-4 w-4" />
                            <span>{item.name}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="flex items-center gap-2">
                      <SidebarMenuButton className="w-full">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback>
                            {admin?.userName?.substring(0, 2).toUpperCase() ||
                              "AD"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col items-start text-left">
                          <span className="text-sm font-medium">
                            {admin?.userName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {admin?.email}
                          </span>
                        </div>
                      </SidebarMenuButton>
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {admin?.userName}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {admin?.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>

          <SidebarRail />
        </Sidebar>

        <SidebarInset className="overflow-y-auto">
          {/* Header */}
          <header className="fixed top-0 z-50 bg-white shadow-sm border-b w-full">
            <div className="flex h-16 items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <div className="flex items-center flex-1">
                <h1 className="text-2xl font-semibold text-gray-900">
                  {navigation.find((nav) => nav.href === location.pathname)
                    ?.name || "Dashboard"}
                </h1>
              </div>
            </div>
          </header>
          {/* Page content */}
          <div className="p-6 mt-16 z-0">
            <Outlet />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
