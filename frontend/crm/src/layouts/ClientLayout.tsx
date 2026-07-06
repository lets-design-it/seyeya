import React from 'react';
import { Utensils, Bed, CalendarRange, Monitor } from 'lucide-react';

interface ClientLayoutProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onSwitchPortal: () => void;
  children: React.ReactNode;
}

export const ClientLayout: React.FC<ClientLayoutProps> = ({ 
  activeTab, 
  setActiveTab, 
  onSwitchPortal,
  children 
}) => {
  const tabs = [
    { id: 'restaurant', label: 'Nile Eatery', icon: Utensils },
    { id: 'accommodation', label: 'Book Cottages', icon: Bed },
    { id: 'conference', label: 'Event Quotes', icon: CalendarRange },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-start p-0 sm:p-4 transition-colors">
      {/* Mobile Frame Wrapper for Desktop/Tablet displays */}
      <div className="w-full sm:max-w-md bg-card sm:border sm:border-border sm:rounded-[32px] sm:shadow-2xl flex flex-col h-screen sm:h-[840px] overflow-hidden relative">
        
        {/* Top Branding Header */}
        <header className="h-16 border-b border-border bg-background px-5 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-[#212121] flex items-center justify-center shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4.5 w-4.5 text-white">
                <path fillRule="evenodd" d="M12.516 2.17a.75.75 0 0 0-1.032 0 11.209 11.209 0 0 1-7.877 3.08.75.75 0 0 0-.722.515A12.74 12.74 0 0 0 2.25 9.75c0 5.942 4.064 10.933 9.563 12.348a.749.749 0 0 0 .374 0c5.499-1.415 9.563-6.406 9.563-12.348 0-1.39-.223-2.73-.635-3.985a.75.75 0 0 0-.722-.516 11.21 11.21 0 0 1-7.877-3.08Z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-sm font-bold tracking-wider uppercase text-foreground">
              Seyeya <span className="text-zinc-650">Lodge</span>
            </span>
          </div>
 
          {/* Quick link back to staff panel */}
          <button
            onClick={onSwitchPortal}
            className="flex items-center gap-1  bg-muted hover:bg-zinc-200/50 rounded-xl px-2.5 py-1.5 text-xs font-bold text-zinc-650 transition-colors"
            title="Switch to Staff Workspace"
          >
            <Monitor className="h-3 w-3" />
            Staff Portal
          </button>
        </header>

        {/* Dynamic Mobile View Area */}
        <main className="flex-1 overflow-y-auto p-4 pb-20 relative bg-background">
          <div className="relative z-10">
            {children}
          </div>
        </main>

        {/* Bottom Tab Bar Navigation */}
        <nav className="absolute bottom-0 inset-x-0 h-16 border-t border-border bg-background flex items-center justify-around px-2 shrink-0 z-10">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center gap-1 w-16 py-1 transition-all duration-150 relative ${
                  isActive ? 'text-[#212121] font-semibold' : 'text-zinc-500 hover:text-zinc-700'
                }`}
              >
                <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-[#212121] scale-105' : 'text-zinc-550'}`} />
                <span className="text-xs uppercase tracking-wide leading-none">{tab.label}</span>
                {isActive && (
                  <span className="absolute top-0 h-0.5 w-8 bg-[#212121] rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

      </div>
    </div>
  );
};
export default ClientLayout;


