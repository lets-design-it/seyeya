import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useTheme } from "@/context/ThemeContext"
import { Sun, Moon } from "lucide-react"
import { useEffect, useState } from "react"

interface SiteHeaderProps {
  activeTab: string;
}

export function SiteHeader({ activeTab }: SiteHeaderProps) {
  const { theme, setTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const getTabLabel = (tab: string) => {
    switch (tab) {
      case 'overview': return 'Dashboard'
      case 'orders': return 'Orders'
      case 'rooms': return 'Rooms'
      case 'conferences': return 'Conferences'
      case 'clients': return 'Guests'
      case 'menu-editor': return 'Menu'
      case 'users': return 'Staff'
      case 'settings': return 'Settings'
      default: return 'Seyeya CRM'
    }
  }

  const toggleTheme = () => {
    if (theme === 'system') {
      const isDarkSystem = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(isDarkSystem ? 'light' : 'dark');
    } else {
      setTheme(theme === 'dark' ? 'light' : 'dark');
    }
  };

  const isDark = isMounted && (
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  );

  return (
    <header className="flex h-16 shrink-0 items-center border-b transition-[width,height] ease-linear bg-card text-card-foreground">
      <div className="flex w-full items-center justify-between px-4 lg:px-6">
        {/* Left Section */}
        <div className="flex items-center gap-1 lg:gap-2">
          <SidebarTrigger className="-ml-1 cursor-pointer text-muted-foreground hover:text-foreground" />
          <Separator
            orientation="vertical"
            className="mx-2 data-[orientation=vertical]:h-4"
          />
          <div className="flex items-center gap-3">
            <h1 className="text-xs font-bold tracking-wider uppercase text-foreground">
              {getTabLabel(activeTab)}
            </h1>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Console Node</span>
            </div>
          </div>
        </div>

        {/* Right Section - Theme Switcher */}
        <div>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-all duration-200 cursor-pointer shadow-xs"
            aria-label="Toggle Theme"
          >
            {isDark ? (
              <Sun className="h-4 w-4 transition-transform duration-300 rotate-0 scale-100" />
            ) : (
              <Moon className="h-4 w-4 transition-transform duration-300 rotate-0 scale-100" />
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
