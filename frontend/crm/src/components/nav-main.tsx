import * as React from "react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { ChevronRightIcon, type LucideIcon } from "lucide-react"

interface NavItem {
  id: string
  title: string
  icon?: LucideIcon
  roles: string[]
  items?: {
    id: string
    title: string
  }[]
}

interface NavMainProps {
  items: NavItem[]
  activeTab: string
  setActiveTab: (tab: string) => void
  userRole: string
}

export function NavMain({ items, activeTab, setActiveTab, userRole }: NavMainProps) {
  // Filter items by user role
  const allowedItems = items.filter(item => item.roles.includes(userRole))

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-3.5 mb-2">
        Workspaces
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu className="space-y-1.5 px-2">
          {allowedItems.map((item) => {
            const Icon = item.icon
            const hasSubmenu = item.items && item.items.length > 0
            const isParentActive = activeTab.startsWith(item.id)

            if (hasSubmenu) {
              return (
                <Collapsible
                  key={item.id}
                  asChild
                  defaultOpen={isParentActive}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        tooltip={item.title}
                        className={`w-full flex items-center gap-3 px-3.5 py-5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                          isParentActive
                            ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                            : "text-zinc-500 hover:bg-zinc-100/80 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                        }`}
                      >
                        {Icon && <Icon className="h-4.5 w-4.5 shrink-0" />}
                        <span>{item.title}</span>
                        <ChevronRightIcon className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 text-zinc-400" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub className="mt-1 ml-4 border-l border-zinc-200 dark:border-zinc-800 pl-2 space-y-1">
                        {item.items?.map((subItem) => {
                          const isSubActive = activeTab === subItem.id
                          return (
                            <SidebarMenuSubItem key={subItem.id}>
                              <SidebarMenuSubButton
                                onClick={() => setActiveTab(subItem.id)}
                                isActive={isSubActive}
                                className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                                  isSubActive
                                    ? "bg-black! text-white! hover:bg-black! hover:text-white! dark:bg-zinc-800! dark:text-white!"
                                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                                }`}
                              >
                                <span>{subItem.title}</span>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          )
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )
            }

            // Normal menu item without submenu
            const isActive = activeTab === item.id
            return (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton
                  tooltip={item.title}
                  onClick={() => setActiveTab(item.id)}
                  isActive={isActive}
                  className={`w-full flex items-center gap-3 px-3.5 py-5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-black! text-white! hover:bg-black! hover:text-white! shadow-sm dark:bg-zinc-800! dark:text-white!"
                      : "text-zinc-500 hover:bg-zinc-100/80 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                  }`}
                >
                  {Icon && <Icon className="h-4.5 w-4.5 shrink-0" />}
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
