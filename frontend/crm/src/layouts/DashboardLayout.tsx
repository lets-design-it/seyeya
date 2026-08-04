import React from 'react';
import { useAuth } from '../context/AuthContext';
import { OrderPopup } from '../components/OrderPopup';
import { AppSidebar } from "../components/app-sidebar"
import { SiteHeader } from "../components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "../components/ui/sidebar"

interface DashboardLayoutProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onSwitchPortal?: () => void;
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ 
  activeTab, 
  setActiveTab, 
  onSwitchPortal,
  children 
}) => {
  const { user } = useAuth();



  if (!user) return null;

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "16rem",
          "--header-height": "4rem",
        } as React.CSSProperties
      }
    >
      {/* Real-time Order Toasts */}
      <OrderPopup />

      <AppSidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onSwitchPortal={onSwitchPortal}
      />
      
      <SidebarInset className="bg-background">
        <SiteHeader activeTab={activeTab} />
        
        <div className="flex flex-1 flex-col">
          <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-zinc-50/50 dark:bg-transparent">
            <div className="mx-auto max-w-7xl h-full">
              {children}
            </div>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default DashboardLayout;
