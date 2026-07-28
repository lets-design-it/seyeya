import * as React from "react"
import { useAuth } from "@/context/AuthContext"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar"
import {
  LayoutDashboard,
  ShoppingBag,
  Bed,
  CalendarRange,
  Users,
  Utensils,
  Shield
} from "lucide-react"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onSwitchPortal?: () => void;
}

export function AppSidebar({ activeTab, setActiveTab, onSwitchPortal, ...props }: AppSidebarProps) {
  const { user } = useAuth();

  if (!user) return null;

  const menuItems = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'manager'] },
    { id: 'orders', label: 'Orders', icon: ShoppingBag, roles: ['admin', 'manager', 'agent'] },
    { id: 'rooms', label: 'Rooms', icon: Bed, roles: ['admin', 'manager', 'agent'] },
    { id: 'conferences', label: 'Conferences', icon: CalendarRange, roles: ['admin', 'manager'] },
    { id: 'clients', label: 'Guests', icon: Users, roles: ['admin', 'manager', 'agent'] },
    { id: 'menu-editor', label: 'Menu', icon: Utensils, roles: ['admin', 'manager'] },
    { id: 'users', label: 'Staff', icon: Shield, roles: ['admin'] },
  ];

  const allowedMenuItems = menuItems.filter(item => item.roles.includes(user.role));

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="border-b border-sidebar-border/40 py-3.5 px-4 bg-sidebar">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-950 text-white shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-white">
                  <path fillRule="evenodd" d="M12.516 2.17a.75.75 0 0 0-1.032 0 11.209 11.209 0 0 1-7.877 3.08.75.75 0 0 0-.722.515A12.74 12.74 0 0 0 2.25 9.75c0 5.942 4.064 10.933 9.563 12.348a.749.749 0 0 0 .374 0c5.499-1.415 9.563-6.406 9.563-12.348 0-1.39-.223-2.73-.635-3.985a.75.75 0 0 0-.722-.516 11.21 11.21 0 0 1-7.877-3.08Z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-xs font-black tracking-widest text-zinc-900 uppercase">
                Seyeya <span className="text-zinc-500 font-medium">CRM</span>
              </span>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="py-4 bg-sidebar">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-wider text-zinc-450 px-3.5 mb-2">
            Workspaces
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2 px-2">
              {allowedMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      tooltip={item.label}
                      onClick={() => setActiveTab(item.id)}
                      isActive={isActive}
                      className={`w-full flex items-center gap-3 px-3.5 py-5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${isActive
                        ? "bg-black! text-white! hover:bg-black! hover:text-white! data-active:bg-black! data-active:text-white! data-active:hover:bg-black! data-active:hover:text-white! shadow-sm"
                        : "text-zinc-500 hover:bg-zinc-100/80 hover:text-zinc-900"
                        }`}
                    >
                      <Icon className="h-4.5 w-4.5 shrink-0" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/40 p-3 bg-sidebar">
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
