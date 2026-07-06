import React, { useState } from 'react';
import { useAuth, UserRole } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  ShieldAlert, 
  ChevronLeft, 
  ChevronRight,
  Sun,
  Moon,
  Sparkles
} from 'lucide-react';

interface DashboardLayoutProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ 
  activeTab, 
  setActiveTab, 
  children 
}) => {
  const { user, logout, updateUserRole } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

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

  // Navigation config based on role
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Executive Hub',
      icon: LayoutDashboard,
      roles: ['admin', 'manager'],
    },
    {
      id: 'leads',
      label: 'Leads Directory',
      icon: Users,
      roles: ['admin', 'manager', 'agent'],
    },
    {
      id: 'pipeline',
      label: 'Deals Pipeline',
      icon: Briefcase,
      roles: ['admin', 'manager', 'agent'],
    },
    {
      id: 'uac',
      label: 'UAC Control Panel',
      icon: Settings,
      roles: ['admin'],
    },
  ];

  const allowedMenuItems = menuItems.filter(item => item.roles.includes(user.role));

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'bg-violet-500/10 text-violet-400 border-violet-500/20';
      case 'manager': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'agent': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    }
  };

  return (
    <div className="flex min-h-screen bg-card font-sans text-zinc-100 dark:bg-card light:bg-white light:text-zinc-900 transition-colors duration-250">
      {/* Sidebar */}
      <aside 
        className={`relative z-20 flex flex-col  light:border-zinc-200 bg-card/80 light:bg-zinc-50/80 backdrop-blur-xl transition-all duration-300 ${
          isSidebarCollapsed ? 'w-[78px]' : 'w-[260px]'
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between px-4  light:border-zinc-200/60">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 shadow-lg shadow-indigo-500/15">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-white">
                <path fillRule="evenodd" d="M12.516 2.17a.75.75 0 0 0-1.032 0 11.209 11.209 0 0 1-7.877 3.08.75.75 0 0 0-.722.515A12.74 12.74 0 0 0 2.25 9.75c0 5.942 4.064 10.933 9.563 12.348a.749.749 0 0 0 .374 0c5.499-1.415 9.563-6.406 9.563-12.348 0-1.39-.223-2.73-.635-3.985a.75.75 0 0 0-.722-.516 11.21 11.21 0 0 1-7.877-3.08Z" clipRule="evenodd" />
              </svg>
            </div>
            {!isSidebarCollapsed && (
              <span className="text-md font-bold tracking-tight text-white dark:text-white light:text-zinc-900 uppercase">
                Seyeya <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">CRM</span>
              </span>
            )}
          </div>

          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="hidden md:flex h-6 w-6 items-center justify-center rounded-md  light:border-zinc-300 hover:bg-zinc-100 light:hover:bg-zinc-150 text-zinc-550 hover:text-foreground transition-colors"
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
                className={`flex w-full items-center gap-3.5 rounded-xl px-3.5 py-3 text-sm font-medium transition-all duration-200 group relative ${
                  isActive 
                    ? 'bg-violet-600/10 text-violet-400 border-l-[3px] border-violet-500 pl-[11px]' 
                    : 'text-zinc-550 hover:bg-zinc-100 hover:text-foreground light:text-zinc-600 light:hover:bg-zinc-100'
                }`}
              >
                <Icon className={`h-4.5 w-4.5 shrink-0 transition-transform duration-200 group-hover:scale-105 ${isActive ? 'text-violet-400' : 'text-zinc-500 light:text-zinc-550'}`} />
                {!isSidebarCollapsed && <span>{item.label}</span>}
                
                {/* Collapsed Tooltip */}
                {isSidebarCollapsed && (
                  <div className="pointer-events-none absolute left-16 z-30 rounded-md bg-zinc-100  px-2 py-1 text-xs text-zinc-100 opacity-0 shadow-md group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {item.label}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer (User Account & Role Switcher) */}
        <div className=" light:border-zinc-200 p-3.5">
          {/* Quick Role Switch Panel */}
          {!isSidebarCollapsed && showRoleSwitcher && (
            <div className="mb-3 rounded-2xl  light:border-zinc-200 bg-card/90 light:bg-white p-2.5 shadow-xl animate-fade-in space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 px-2 mb-1.5">Switch Identity</p>
              <button 
                onClick={() => { updateUserRole('admin'); setShowRoleSwitcher(false); }}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-foreground light:text-zinc-700 hover:bg-zinc-100 light:hover:bg-zinc-100 transition-colors"
              >
                <div className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                Sarah Jenkins (Admin)
              </button>
              <button 
                onClick={() => { updateUserRole('manager'); setShowRoleSwitcher(false); }}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-foreground light:text-zinc-700 hover:bg-zinc-100 light:hover:bg-zinc-100 transition-colors"
              >
                <div className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                Marcus Vance (Manager)
              </button>
              <button 
                onClick={() => { updateUserRole('agent'); setShowRoleSwitcher(false); }}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-foreground light:text-zinc-700 hover:bg-zinc-100 light:hover:bg-zinc-100 transition-colors"
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
                className="h-9 w-9 rounded-xl  object-cover shadow-sm group-hover:border-violet-500 transition-colors" 
              />
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-zinc-950" />
            </button>

            {!isSidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 justify-between">
                  <p className="text-xs font-semibold text-foreground dark:text-foreground light:text-zinc-800 truncate leading-none">{user.name}</p>
                </div>
                <button
                  onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
                  className={`mt-1 border px-1.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wide inline-flex leading-none ${getRoleBadgeColor(user.role)}`}
                >
                  {user.role} ✦
                </button>
              </div>
            )}

            {!isSidebarCollapsed && (
              <button 
                onClick={logout}
                className="text-zinc-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-zinc-100 light:hover:bg-zinc-100 transition-colors focus:outline-none"
                title="Logout Session"
              >
                <LogOut className="h-4.5 w-4.5" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-16  light:border-zinc-200 flex items-center justify-between px-6 bg-zinc-50 light:bg-zinc-50/40 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <h2 className="text-md font-bold tracking-wide uppercase text-zinc-100 dark:text-zinc-100 light:text-zinc-900">
              {allowedMenuItems.find(i => i.id === activeTab)?.label || 'Workspace'}
            </h2>
            <div className="h-4 w-px bg-zinc-800 light:bg-zinc-350" />
            <div className="flex items-center gap-1 text-xs text-zinc-550">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
              <span>Live Node Connected</span>
            </div>
          </div>

          {/* Quick Actions Header */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className="h-9 w-9 rounded-xl  light:border-zinc-250 flex items-center justify-center text-zinc-550 hover:text-foreground light:hover:bg-zinc-100 transition-colors focus:outline-none"
              title="Toggle Light/Dark Theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Quick switcher explanation alert */}
            <div className="hidden lg:flex items-center gap-1.5 rounded-xl border border-indigo-500/10 bg-indigo-500/5 px-3.5 py-1.5 text-xs text-indigo-400 font-medium">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Click avatar to switch roles dynamically</span>
            </div>

            {/* User Identity Display */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-100 light:bg-zinc-100/50  light:border-zinc-200">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-semibold text-foreground light:text-zinc-700 capitalize">{user.role} view</span>
            </div>
          </div>
        </header>

        {/* Main View Area */}
        <main className="flex-1 overflow-y-auto bg-card dark:bg-card light:bg-zinc-50 radial-bg p-6">
          <div className="mx-auto max-w-7xl h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};


