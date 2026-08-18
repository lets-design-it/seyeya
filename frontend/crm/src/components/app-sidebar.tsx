import * as React from "react"
import { useAuth } from "@/context/AuthContext"
import { NavUser } from "@/components/nav-user"
import { NavMain } from "@/components/nav-main"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  LayoutDashboard,
  ShoppingBag,
  Bed,
  CalendarRange,
  Users,
  Utensils,
  Shield,
  Settings as SettingsIcon,
} from "lucide-react"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onSwitchPortal?: () => void;
}

export function AppSidebar({ activeTab, setActiveTab, onSwitchPortal, ...props }: AppSidebarProps) {
  const { user } = useAuth();

  if (!user) return null;

  const isSuperAdmin = user.role === 'admin' || (user as any).roles?.includes('Super Admin');

  // Define settings sub-items based on role
  const settingsSubItems = [
    { id: 'settings-profile', title: 'Profile' },
    ...(user.role === 'admin' ? [{ id: 'settings-hotel', title: 'Hotel Details' }] : []),
    ...(isSuperAdmin ? [{ id: 'settings-permissions', title: 'Role Permissions' }] : []),
    { id: 'settings-theme', title: 'Theme' },
    { id: 'settings-notifications', title: 'Notifications' },
  ];

  const menuItems = [
    {
      id: 'overview',
      title: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'manager']
    },
    {
      id: 'orders',
      title: 'Orders',
      icon: ShoppingBag,
      roles: ['admin', 'manager', 'agent'],
      items: [
        { id: 'orders-active', title: 'Active Orders' },
        { id: 'orders-history', title: 'Order History' }
      ]
    },
    {
      id: 'rooms',
      title: 'Rooms',
      icon: Bed,
      roles: ['admin', 'manager', 'agent'],
      items: [
        { id: 'rooms-reservations', title: 'Reservations' },
        { id: 'rooms-rooms', title: 'Rooms List' },
        { id: 'rooms-categories', title: 'Categories' }
      ]
    },
    {
      id: 'conferences',
      title: 'Conferences',
      icon: CalendarRange,
      roles: ['admin', 'manager'],
      items: [
        { id: 'conferences-quotes', title: 'Reservations' },
        { id: 'conferences-halls', title: 'Event Halls' }
      ]
    },
    {
      id: 'clients',
      title: 'Guests',
      icon: Users,
      roles: ['admin', 'manager', 'agent']
    },
    {
      id: 'menu-editor',
      title: 'Menu',
      icon: Utensils,
      roles: ['admin', 'manager']
    },
    {
      id: 'users',
      title: 'Staff',
      icon: Shield,
      roles: ['admin']
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: SettingsIcon,
      roles: ['admin', 'manager', 'agent'],
      items: settingsSubItems
    },
  ];

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
              <span className="text-xs font-black tracking-widest text-zinc-900 dark:text-zinc-50 uppercase">
                Seyeya <span className="text-zinc-500 font-medium">CRM</span>
              </span>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="py-4 bg-sidebar">
        <NavMain
          items={menuItems}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          userRole={user.role}
        />
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/40 p-3 bg-sidebar">
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
