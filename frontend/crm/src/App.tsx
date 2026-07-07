import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth, ProtectedRoute } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { DashboardLayout } from './layouts/DashboardLayout';
import { ClientLayout } from './layouts/ClientLayout';

// Staff Views
import { Overview } from './pages/dashboard/Overview';
import { Orders } from './pages/dashboard/Orders';
import { Rooms } from './pages/dashboard/Rooms';
import { Conferences } from './pages/dashboard/Conferences';
import { ClientsCRM } from './pages/dashboard/ClientsCRM';
import { MenuEditor } from './pages/dashboard/MenuEditor';
import { UserManagement } from './pages/dashboard/UserManagement';

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
      if (user.role === 'agent' && ['overview', 'conferences'].includes(activeStaffTab)) {
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
        return (
          <ProtectedRoute>
            <Orders />
          </ProtectedRoute>
        );
      case 'rooms':
        return (
          <ProtectedRoute>
            <Rooms />
          </ProtectedRoute>
        );
      case 'conferences':
        return (
          <ProtectedRoute allowedRoles={['admin', 'manager']}>
            <Conferences />
          </ProtectedRoute>
        );
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
    <NotificationProvider>
      <AuthProvider>
        <CRMApp />
      </AuthProvider>
    </NotificationProvider>
  );
}

export default App;


