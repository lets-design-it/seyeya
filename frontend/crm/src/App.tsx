import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth, ProtectedRoute } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeContext';
import { VatProvider } from './context/VatContext';
import { CurrencyProvider } from './context/CurrencyContext';
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
import { ReportsView } from './pages/dashboard/ReportsView';

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
      if (user.role === 'agent' && activeStaffTab === 'overview') {
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
      case 'rooms-categories':
      case 'rooms-amenities':
      case 'rooms-policies': {
        const subTab = activeStaffTab === 'rooms' 
          ? 'reservations' 
          : (activeStaffTab.split('-')[1] as 'reservations' | 'rooms' | 'categories' | 'amenities' | 'policies');
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
      case 'conferences-halls':
      case 'conferences-events':
      case 'conferences-facilities':
      case 'conferences-categories': {
        const subTab = activeStaffTab === 'conferences'
          ? 'quotes'
          : (activeStaffTab.split('-')[1] as 'quotes' | 'halls' | 'events' | 'facilities' | 'categories');
        return (
          <ProtectedRoute allowedRoles={['admin', 'manager', 'agent']}>
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
      case 'reports':
      case 'reports-executive':
      case 'reports-staff':
      case 'reports-guests':
      case 'reports-channels':
      case 'reports-vat': {
        const subTab = activeStaffTab === 'reports'
          ? 'executive'
          : (activeStaffTab.split('-')[1] as any);
        return (
          <ProtectedRoute allowedRoles={['admin', 'manager', 'agent']}>
            <ReportsView 
              activeSubTab={subTab}
              setActiveSubTab={(tab) => setActiveStaffTab(`reports-${tab}`)}
            />
          </ProtectedRoute>
        );
      }
      case 'settings':
      case 'settings-profile':
      case 'settings-hotel':
      case 'settings-permissions':
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
          <VatProvider>
            <CurrencyProvider>
              <AuthProvider>
                <CRMApp />
              </AuthProvider>
            </CurrencyProvider>
          </VatProvider>
        </NotificationProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}

export default App;


