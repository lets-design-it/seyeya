import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useTheme } from "@/context/ThemeContext"
import { useCurrency } from "@/context/CurrencyContext"
import { Sun, Moon, Coins, ChevronDown } from "lucide-react"
import { useEffect, useState } from "react"
import { EATClock } from "./EATClock"
import { NotificationBell } from "./NotificationBell"

interface SiteHeaderProps {
  activeTab: string;
}

export function SiteHeader({ activeTab }: SiteHeaderProps) {
  const { theme, setTheme } = useTheme();
  const { currency, setCurrency, usdRate } = useCurrency();
  const [isMounted, setIsMounted] = useState(false);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const getTabLabel = (tab: string) => {
    if (tab.startsWith('orders-')) return 'Orders'
    if (tab.startsWith('rooms-')) return 'Rooms'
    if (tab.startsWith('conferences-')) return 'Conferences'
    if (tab.startsWith('settings-')) return 'Settings'
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

        {/* Right Section - Clock, Currency Switcher, Notification Bell & Theme Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          <EATClock />

          {/* Top Bar Currency Selector */}
          <div className="relative">
            <button
              onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
              title={`Display Currency (${currency}). Exchange Rate: 1 USD = ${usdRate.toLocaleString()} UGX`}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-xs transition-all duration-200 cursor-pointer shadow-xs"
            >
              <Coins className="h-3.5 w-3.5" />
              <span>{currency === 'UGX' ? '🇺🇬 UGX' : '🇺🇸 USD'}</span>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </button>

            {showCurrencyDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowCurrencyDropdown(false)} 
                />
                <div className="absolute right-0 mt-2 w-48 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl z-50 p-1 text-xs">
                  <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-100 dark:border-zinc-800">
                    Display Currency
                  </div>
                  <button
                    onClick={() => { setCurrency('UGX'); setShowCurrencyDropdown(false); }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg transition-colors text-left ${
                      currency === 'UGX' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold' : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-base">🇺🇬</span>
                      <span>UGX (Shillings)</span>
                    </span>
                    <span className="text-[10px] opacity-70">Base</span>
                  </button>
                  <button
                    onClick={() => { setCurrency('USD'); setShowCurrencyDropdown(false); }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg transition-colors text-left ${
                      currency === 'USD' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold' : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-base">🇺🇸</span>
                      <span>USD (Dollars)</span>
                    </span>
                    <span className="text-[10px] opacity-70">Converted</span>
                  </button>
                  <div className="mt-1 pt-1.5 px-2.5 pb-1 border-t border-zinc-100 dark:border-zinc-800 text-[10px] text-zinc-400">
                    Rate: 1 USD = {usdRate.toLocaleString()} UGX
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Header Notification Bell connected to backend */}
          <NotificationBell />

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

