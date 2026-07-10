import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

interface SiteHeaderProps {
  activeTab: string;
}

export function SiteHeader({ activeTab }: SiteHeaderProps) {
  const getTabLabel = (tab: string) => {
    switch (tab) {
      case 'overview': return 'Executive Hub'
      case 'orders': return 'Kitchen Queue'
      case 'rooms': return 'Rooms Grid'
      case 'conferences': return 'Event Planner'
      case 'clients': return 'Guests CRM'
      case 'menu-editor': return 'Restaurant Menu'
      case 'users': return 'User Provisioning'
      default: return 'Seyeya CRM'
    }
  }

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear bg-card">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1 cursor-pointer" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <div className="flex items-center gap-3">
          <h1 className="text-xs font-bold tracking-wider uppercase text-foreground">
            {getTabLabel(activeTab)}
          </h1>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-1.5 text-xs text-zinc-450">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live Console Node</span>
          </div>
        </div>
      </div>
    </header>
  )
}
