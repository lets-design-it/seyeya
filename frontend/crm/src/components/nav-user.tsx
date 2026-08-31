import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useAuth } from "@/context/AuthContext"
import {
  EllipsisVerticalIcon,
  LogOutIcon,
  Shield,
  Users,
  Briefcase,
  UserCircle
} from "lucide-react"

export function NavUser() {
  const { isMobile } = useSidebar()
  const { user, logout, updateUserRole } = useAuth()

  if (!user) return null

  // Get initials for fallback
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrator'
      case 'manager': return 'Manager'
      case 'agent': return 'Agent'
      default: return role
    }
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`} alt={user.name} />
                <AvatarFallback className="rounded-lg">{getInitials(user.name)}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {getRoleLabel(user.role)}
                </span>
              </div>
              <EllipsisVerticalIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`} alt={user.name} />
                  <AvatarFallback className="rounded-lg">{getInitials(user.name)}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            {/* <DropdownMenuSeparator /> */}

            {/* <DropdownMenuGroup>
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Switch Identity
              </div>
              <DropdownMenuItem className="cursor-pointer" onClick={() => updateUserRole('admin')}>
                <Shield className="mr-2 h-4 w-4 text-violet-550" />
                <span>Sarah Jenkins (Admin)</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={() => updateUserRole('manager')}>
                <Users className="mr-2 h-4 w-4 text-indigo-500" />
                <span>Marcus Vance (Manager)</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={() => updateUserRole('agent')}>
                <Briefcase className="mr-2 h-4 w-4 text-rose-500" />
                <span>Elena Rostova (Agent)</span>
              </DropdownMenuItem>
            </DropdownMenuGroup> */}

            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer text-red-500 focus:text-red-600 focus:bg-red-50" onClick={logout}>
              <LogOutIcon className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
