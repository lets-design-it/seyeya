import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth, ProtectedRoute } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeContext';
import { DashboardLayout } from './layouts/DashboardLayout';
import { ClientLayout } from './layouts/ClientLayout';
import { TooltipProvider } from './components/ui/tooltip';

// Staff Views
import { Overview } from './pages/dashboard/Overview';
import { Orders } from './pages/dashboard/Orders';
import { Rooms } from './pages/dashboard/Rooms';
import { Conferences } from './pages/dashboard/Conferences';
import { ClientsCRM } from './pages/dashboard/ClientsCRM';
import { MenuEditor } from './pages/dashboard/MenuEditor';
import { UserManagement } from './pages/dashboard/UserManagement';
import { Settings } from './pages/dashboard/Settings';

// Client Views
import { Restaurant } from './pages/client/Restaurant';
import { Accommodation } from './pages/client/Accommodation';
import { Conference } from './pages/client/Conference';

// Auth View
import { Login } from './pages/auth/Login';

const CRMApp: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  
  // Portals: 'staff' (management dashboard) vs 'client' (guest booking menu)
  const [portal, setPortal] = useState<'staff' | 'client'>('staff');
  
  // Active states per portal
  const [activeStaffTab, setActiveStaffTab] = useState<string>('overview');
  const [activeClientTab, setActiveClientTab] = useState<string>('restaurant');

  // Adjust staff tabs when role shifts
  useEffect(() => {
    if (user) {
      if (user.role === 'agent' && (activeStaffTab === 'overview' || activeStaffTab.startsWith('conferences'))) {
        // Sales agents don't see overview/conferences, default to orders
        setActiveStaffTab('orders');
      }
    }
  }, [user?.role, activeStaffTab]);

  // Auth routing helper
  useEffect(() => {
    const handleAuthRequired = () => {
      setPortal('staff');
      setActiveStaffTab('overview');
    };
    window.addEventListener('seyeya_auth_required', handleAuthRequired);
    return () => {
      window.removeEventListener('seyeya_auth_required', handleAuthRequired);
    };
  }, []);

  // Client Portal Router (No Login Required)
  if (portal === 'client') {
    const renderClientView = () => {
      switch (activeClientTab) {
        case 'restaurant':
          return <Restaurant />;
        case 'accommodation':
          return <Accommodation />;
        case 'conference':
          return <Conference />;
        default:
          return <Restaurant />;
      }
    };

    return (
      <ClientLayout 
        activeTab={activeClientTab} 
        setActiveTab={setActiveClientTab}
        onSwitchPortal={() => setPortal('staff')}
      >
        {renderClientView()}
      </ClientLayout>
    );
  }

  // Staff Portal Router (Requires Login)
  if (!isAuthenticated) {
    return <Login />;
  }

  const renderStaffView = () => {
    switch (activeStaffTab) {
      case 'overview':
        return (
          <ProtectedRoute allowedRoles={['admin', 'manager']}>
            <Overview />
          </ProtectedRoute>
        );
      case 'orders':
      case 'orders-active':
      case 'orders-history': {
        const subTab = activeStaffTab === 'orders'
          ? 'active'
          : (activeStaffTab.split('-')[1] as 'active' | 'history');
        return (
          <ProtectedRoute>
            <Orders 
              activeTab={subTab}
              setActiveTab={(tab) => setActiveStaffTab(`orders-${tab}`)}
            />
          </ProtectedRoute>
        );
      }
      case 'rooms':
      case 'rooms-reservations':
      case 'rooms-rooms':
      case 'rooms-categories': {
        const subTab = activeStaffTab === 'rooms' 
          ? 'reservations' 
          : (activeStaffTab.split('-')[1] as 'reservations' | 'rooms' | 'categories');
        return (
          <ProtectedRoute>
            <Rooms 
              activeTab={subTab} 
              setActiveTab={(tab) => setActiveStaffTab(`rooms-${tab}`)} 
            />
          </ProtectedRoute>
        );
      }
      case 'conferences':
      case 'conferences-quotes':
      case 'conferences-halls': {
        const subTab = activeStaffTab === 'conferences'
          ? 'quotes'
          : (activeStaffTab.split('-')[1] as 'quotes' | 'halls');
        return (
          <ProtectedRoute allowedRoles={['admin', 'manager']}>
            <Conferences 
              activeTab={subTab}
              setActiveTab={(tab) => setActiveStaffTab(`conferences-${tab}`)}
            />
          </ProtectedRoute>
        );
      }
      case 'clients':
        return (
          <ProtectedRoute>
            <ClientsCRM />
          </ProtectedRoute>
        );
      case 'menu-editor':
        return (
          <ProtectedRoute allowedRoles={['admin', 'manager']}>
            <MenuEditor />
          </ProtectedRoute>
        );
      case 'users':
        return (
          <ProtectedRoute allowedRoles={['admin']}>
            <UserManagement />
          </ProtectedRoute>
        );
      case 'settings':
      case 'settings-profile':
      case 'settings-hotel':
      case 'settings-theme':
      case 'settings-notifications': {
        const subTab = activeStaffTab === 'settings'
          ? 'profile'
          : (activeStaffTab.split('-')[1] as any);
        return (
          <ProtectedRoute>
            <Settings 
              activeTab={subTab}
              setActiveTab={(tab) => setActiveStaffTab(`settings-${tab}`)}
            />
          </ProtectedRoute>
        );
      }
      default:
        return (
          <ProtectedRoute>
            <Overview />
          </ProtectedRoute>
        );
    }
  };

  return (
    <DashboardLayout 
      activeTab={activeStaffTab} 
      setActiveTab={setActiveStaffTab}
      onSwitchPortal={() => setPortal('client')}
    >
      {renderStaffView()}
    </DashboardLayout>
  );
};

function App() {
  return (
    <ThemeProvider>
      <TooltipProvider>
        <NotificationProvider>
          <AuthProvider>
            <CRMApp />
          </AuthProvider>
        </NotificationProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}

export default App;


