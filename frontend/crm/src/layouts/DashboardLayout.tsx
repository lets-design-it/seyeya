import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Bed, 
  CalendarRange, 
  Users, 
  LogOut, 
  Menu, 
  ChevronLeft, 
  ChevronRight,
  Sun,
  Moon,
  Sparkles,
  Phone,
  Monitor,
  Utensils
} from 'lucide-react';
import { OrderPopup } from '../components/OrderPopup';

interface DashboardLayoutProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onSwitchPortal: () => void;
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ 
  activeTab, 
  setActiveTab, 
  onSwitchPortal,
  children 
}) => {
  const { user, logout, updateUserRole } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('light');

  React.useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('dark');
    root.classList.add('light');
  }, []);

  const toggleTheme = () => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.remove('dark');
      root.classList.add('light');
      setTheme('light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
      setTheme('dark');
    }
  };

  if (!user) return null;

  // Sidebar links representing departments
  const menuItems = [
    { id: 'overview', label: 'Executive Hub', icon: LayoutDashboard, roles: ['admin', 'manager'] },
    { id: 'orders', label: 'Kitchen Queue', icon: ShoppingBag, roles: ['admin', 'manager', 'agent'] },
    { id: 'rooms', label: 'Rooms Grid', icon: Bed, roles: ['admin', 'manager', 'agent'] },
    { id: 'conferences', label: 'Event Planner', icon: CalendarRange, roles: ['admin', 'manager'] },
    { id: 'clients', label: 'Guests CRM', icon: Users, roles: ['admin', 'manager', 'agent'] },
    { id: 'menu-editor', label: 'Restaurant Menu', icon: Utensils, roles: ['admin', 'manager'] },
  ];

  const allowedMenuItems = menuItems.filter(item => item.roles.includes(user.role));

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-violet-550/10 text-violet-600 border-violet-500/20';
      case 'manager': return 'bg-indigo-550/10 text-indigo-600 border-indigo-500/20';
      case 'agent': return 'bg-rose-550/10 text-rose-600 border-rose-500/20';
      default: return 'bg-zinc-500/10 text-zinc-650 border-zinc-500/20';
    }
  };

  return (
    <div className="flex min-h-screen bg-background font-sans text-foreground transition-colors duration-250">
      {/* Real-time Order Toasts */}
      <OrderPopup />

      {/* Sidebar */}
      <aside 
        className={`relative z-20 flex flex-col my-4 ml-4 rounded-[24px] bg-card  shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition-all duration-300 ${
          isSidebarCollapsed ? 'w-[78px]' : 'w-[260px]'
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-border/40">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-primary shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-primary">
                <path fillRule="evenodd" d="M12.516 2.17a.75.75 0 0 0-1.032 0 11.209 11.209 0 0 1-7.877 3.08.75.75 0 0 0-.722.515A12.74 12.74 0 0 0 2.25 9.75c0 5.942 4.064 10.933 9.563 12.348a.749.749 0 0 0 .374 0c5.499-1.415 9.563-6.406 9.563-12.348 0-1.39-.223-2.73-.635-3.985a.75.75 0 0 0-.722-.516 11.21 11.21 0 0 1-7.877-3.08Z" clipRule="evenodd" />
              </svg>
            </div>
            {!isSidebarCollapsed && (
              <span className="text-sm font-bold tracking-tight text-foreground uppercase">
                Seyeya <span className="text-zinc-650">Staff</span>
              </span>
            )}
          </div>

          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="hidden md:flex h-6 w-6 items-center justify-center rounded-md  hover:bg-muted text-zinc-500 hover:text-zinc-800 transition-colors"
          >
            {isSidebarCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1.5 px-3 py-4">
          {allowedMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex w-full items-center gap-3.5 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-200 group relative ${
                  isActive 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'text-zinc-500 hover:bg-zinc-100 hover:text-foreground'
                }`}
              >
                <Icon className={`h-4.5 w-4.5 shrink-0 transition-transform duration-200 group-hover:scale-105 ${isActive ? 'text-primary-foreground' : 'text-zinc-550'}`} />
                {!isSidebarCollapsed && <span>{item.label}</span>}
                
                {isSidebarCollapsed && (
                  <div className="pointer-events-none absolute left-16 z-30 rounded-md bg-card  px-2 py-1 text-xs text-foreground opacity-0 shadow-md group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {item.label}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-border p-3.5">
          {/* Quick Role Switch Panel */}
          {!isSidebarCollapsed && showRoleSwitcher && (
            <div className="mb-3 rounded-2xl  bg-card p-2.5 shadow-xl animate-fade-in space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 px-2 mb-1.5">Switch Identity</p>
              <button 
                onClick={() => { updateUserRole('admin'); setShowRoleSwitcher(false); }}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-zinc-650 hover:bg-muted transition-colors"
              >
                <div className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                Sarah Jenkins (Admin)
              </button>
              <button 
                onClick={() => { updateUserRole('manager'); setShowRoleSwitcher(false); }}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-zinc-650 hover:bg-muted transition-colors"
              >
                <div className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                Marcus Vance (Manager)
              </button>
              <button 
                onClick={() => { updateUserRole('agent'); setShowRoleSwitcher(false); }}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-zinc-650 hover:bg-muted transition-colors"
              >
                <div className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                Elena Rostova (Agent)
              </button>
            </div>
          )}

          {/* User Card */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => !isSidebarCollapsed && setShowRoleSwitcher(!showRoleSwitcher)}
              className="relative shrink-0 group focus:outline-none"
              title="Click to Switch Roles"
            >
              <img 
                src={user.avatar} 
                alt={user.name} 
                className="h-9 w-9 rounded-xl  object-cover shadow-sm group-hover:border-zinc-500 transition-colors" 
              />
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-zinc-50" />
            </button>

            {!isSidebarCollapsed && (
              <div className="flex-1 min-w-0 font-sans">
                <p className="text-sm font-semibold text-foreground truncate leading-none">{user.name}</p>
                <button
                  onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
                  className={`mt-1.5 border px-1.5 py-0.5 rounded text-xs font-bold uppercase tracking-wide inline-flex leading-none ${getRoleBadgeColor(user.role)}`}
                >
                  {user.role}
                </button>
              </div>
            )}

            {!isSidebarCollapsed && (
              <button 
                onClick={logout}
                className="text-zinc-450 hover:text-red-500 p-1.5 rounded-lg hover:bg-muted transition-colors focus:outline-none"
                title="Logout Session"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header */}
        <header className="bg-card rounded-[24px]  shadow-[0_8px_30px_rgb(0,0,0,0.02)] mx-4 mt-4 px-6 h-16 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold tracking-wider uppercase text-foreground animate-pulse">
              Staff Portal Overview
            </h2>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-1.5 text-xs text-zinc-550">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
              <span>Live Console Node</span>
            </div>
          </div>
 
          {/* Quick Actions Header */}
          <div className="flex items-center gap-3.5">
            {/* Switch to Client Booking Interface */}
            <button
              onClick={onSwitchPortal}
              className="flex items-center gap-2 rounded-full bg-primary hover:bg-zinc-800 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-all duration-200"
            >
              <Monitor className="h-3.5 w-3.5 text-white" />
              Client Booking Portal
            </button>

            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className="h-9 w-9 rounded-full  flex items-center justify-center text-zinc-500 hover:text-zinc-850 hover:bg-muted transition-colors focus:outline-none"
              title="Toggle Light/Dark Theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </header>

        {/* Main View Area */}
        <main className="flex-1 overflow-y-auto p-4 relative bg-background">
          <div className="mx-auto max-w-7xl h-full relative z-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
export default DashboardLayout;


