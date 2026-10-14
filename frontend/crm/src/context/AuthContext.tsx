import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

export type UserRole = 'admin' | 'manager' | 'agent';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roles?: string[];
  permissions?: string[];
  is_staff?: boolean;
  isStaff?: boolean;
  avatar: string;
  joinedDate: string;
  token?: string;
  refreshToken?: string;
}

export const PAGE_PERMISSION_MAP: Record<string, string> = {
  overview: 'overview.view',
  orders: 'restaurant.view',
  rooms: 'accommodation.view',
  conferences: 'conference.view',
  clients: 'crm.view',
  'menu-editor': 'menu.view',
  reports: 'reports.view',
  users: 'users.view',
  settings: 'roles.view',
};

export const DEFAULT_ROLE_PAGES: Record<string, string[]> = {
  admin: ['overview', 'orders', 'rooms', 'conferences', 'clients', 'menu-editor', 'reports', 'users', 'settings'],
  'Super Admin': ['overview', 'orders', 'rooms', 'conferences', 'clients', 'menu-editor', 'reports', 'users', 'settings'],
  manager: ['overview', 'orders', 'rooms', 'conferences', 'clients', 'menu-editor', 'reports', 'settings'],
  'Hotel Manager': ['overview', 'orders', 'rooms', 'conferences', 'clients', 'menu-editor', 'reports', 'settings'],
  'Restaurant Manager': ['orders', 'menu-editor', 'reports'],
  Receptionist: ['orders', 'rooms', 'conferences', 'clients'],
  Cashier: ['orders'],
  'Kitchen Staff': ['orders'],
  Waiter: ['orders'],
  agent: ['orders'],
};

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, passwordOrRole?: string, role?: UserRole) => Promise<boolean>;
  logout: () => void;
  updateUserRole: (role: UserRole) => void;
  updateUserProfile: (name: string, email: string) => void;
  refreshCurrentUser: () => Promise<void>;
  hasPermission: (permissionKey: string) => boolean;
  canAccessPage: (pageId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const MOCK_USERS: Record<UserRole, User> = {
  admin: {
    id: 'u-admin',
    name: 'Sarah Jenkins',
    email: 'admin@seyeya.com',
    role: 'admin',
    roles: ['Super Admin'],
    permissions: Object.values(PAGE_PERMISSION_MAP),
    is_staff: true,
    isStaff: true,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    joinedDate: '2025-01-15',
  },
  manager: {
    id: 'u-manager',
    name: 'Marcus Vance',
    email: 'manager@seyeya.com',
    role: 'manager',
    roles: ['Hotel Manager'],
    permissions: [
      'overview.view',
      'restaurant.view',
      'accommodation.view',
      'conference.view',
      'crm.view',
      'menu.view',
      'reports.view',
      'roles.view',
    ],
    is_staff: true,
    isStaff: true,
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    joinedDate: '2025-03-22',
  },
  agent: {
    id: 'u-agent',
    name: 'Elena Rostova',
    email: 'agent@seyeya.com',
    role: 'agent',
    roles: ['Waiter'],
    permissions: ['restaurant.view'],
    is_staff: true,
    isStaff: true,
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    joinedDate: '2025-05-10',
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if session is persisted in localStorage
    const savedUser = localStorage.getItem('seyeya_crm_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        const isStaff = parsed.is_staff ?? parsed.isStaff;
        const roles: string[] = Array.isArray(parsed.roles) ? parsed.roles : [];
        const isCustomerOrGuest =
          roles.length > 0 &&
          roles.every((r: string) => ['customer', 'guest'].includes(r.toLowerCase().trim()));

        // In the event the user does not have "is staff" checked, do not permit into CRM
        if (isStaff === false || isCustomerOrGuest) {
          localStorage.removeItem('seyeya_crm_user');
          setUser(null);
        } else {
          setUser(parsed);
          // Sync fresh live permissions from server immediately on boot
          if (parsed.token) {
            api.get('/auth/me', {
              headers: { Authorization: `Bearer ${parsed.token}` }
            })
              .then(res => {
                if (res.data) {
                  const mappedRole = mapBackendRolesToUserRole(res.data.roles);
                  const updated: User = {
                    ...parsed,
                    name: res.data.full_name || parsed.name,
                    email: res.data.email || parsed.email,
                    role: mappedRole,
                    roles: res.data.roles || parsed.roles,
                    permissions: res.data.permissions || [],
                    is_staff: Boolean(res.data.is_staff),
                    isStaff: Boolean(res.data.is_staff),
                  };
                  setUser(updated);
                  localStorage.setItem('seyeya_crm_user', JSON.stringify(updated));
                }
              })
              .catch(() => {});
          }
        }
      } catch (e) {
        localStorage.removeItem('seyeya_crm_user');
      }
    }
    setIsLoading(false);
  }, []);

const mapBackendRolesToUserRole = (roles: string[] | undefined): UserRole => {
  if (!roles || roles.length === 0) return 'agent';
  if (roles.includes('Super Admin')) return 'admin';
  if (roles.includes('Hotel Manager') || roles.includes('Restaurant Manager')) return 'manager';
  return 'agent';
};

  const login = async (email: string, passwordOrRole?: string, role?: UserRole): Promise<boolean> => {
    setIsLoading(true);
    
    let password = '';
    let targetRole: UserRole | undefined = undefined;

    if (passwordOrRole === 'admin' || passwordOrRole === 'manager' || passwordOrRole === 'agent') {
      targetRole = passwordOrRole;
      password = 'SecurePass123!';
    } else {
      password = passwordOrRole || '';
      targetRole = role;
    }

    try {
      const response = await api.post(
        '/auth/login',
        {
          email: email,
          password: password,
        },
        {
          headers: {
            'X-Portal': 'crm',
            'X-Require-Staff': 'true',
          },
        }
      );

      const data = response.data;

      // Strict staff verification: users without "is staff" checked (e.g. Customer, Guest) must NOT be permitted to log in
      const isStaff = Boolean(data.is_staff);
      const backendRoles: string[] = Array.isArray(data.roles) ? data.roles : [];
      const hasOnlyCustomerOrGuestRoles =
        backendRoles.length > 0 &&
        backendRoles.every((r: string) => {
          const lower = r.toLowerCase().trim();
          return lower === 'customer' || lower === 'guest';
        });

      if (!isStaff || hasOnlyCustomerOrGuestRoles) {
        // Invalidate backend session token immediately if created
        if (data.refresh_token) {
          api.post(
            '/auth/logout',
            { refresh_token: data.refresh_token },
            {
              headers: {
                Authorization: `Bearer ${data.access_token}`,
              },
            }
          ).catch(() => {});
        }
        setIsLoading(false);
        throw new Error('Access denied');
      }

      const mappedRole = mapBackendRolesToUserRole(data.roles);
      const baseUser = MOCK_USERS[mappedRole];

      const loggedInUser: User = {
        id: String(data.user_id),
        name: data.full_name || 'User',
        email: data.email,
        role: mappedRole,
        roles: data.roles || [],
        permissions: data.permissions || baseUser?.permissions || [],
        is_staff: true,
        isStaff: true,
        avatar: baseUser?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
        joinedDate: baseUser?.joinedDate || new Date().toISOString().split('T')[0],
        token: data.access_token,
        refreshToken: data.refresh_token,
      };

      setUser(loggedInUser);
      localStorage.setItem('seyeya_crm_user', JSON.stringify(loggedInUser));
      setIsLoading(false);
      return true;
    } catch (err: any) {
      setIsLoading(false);
      const errMsg = err.response?.data?.detail || err.message || 'Invalid login credentials';
      throw new Error(errMsg);
    }
  };

  const logout = () => {
    const savedUser = localStorage.getItem('seyeya_crm_user');
    let refreshToken = '';
    let accessToken = '';
    
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        refreshToken = parsed.refreshToken;
        accessToken = parsed.token;
      } catch (e) {
        // ignore
      }
    }

    setUser(null);
    localStorage.removeItem('seyeya_crm_user');

    if (refreshToken) {
      api.post('/auth/logout', 
        { refresh_token: refreshToken },
        {
          headers: {
            Authorization: `Bearer ${accessToken || 'mock-jwt-token'}`
          }
        }
      ).catch((err) => {
        console.error("API logout failed:", err);
      });
    }
  };

  const updateUserRole = (role: UserRole) => {
    // Dynamically change role of the current user
    const mock = MOCK_USERS[role];
    if (user) {
      const updated: User = {
        ...user,
        role,
        roles: mock.roles || [role],
        permissions: mock.permissions || [],
      };
      setUser(updated);
      localStorage.setItem('seyeya_crm_user', JSON.stringify(updated));
    } else {
      // If no user is logged in, log in as that role
      setUser(mock);
      localStorage.setItem('seyeya_crm_user', JSON.stringify(mock));
    }
  };

  const refreshCurrentUser = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data && user) {
        const isStaff = Boolean(res.data.is_staff);
        const backendRoles: string[] = Array.isArray(res.data.roles) ? res.data.roles : [];
        const hasOnlyCustomerOrGuestRoles =
          backendRoles.length > 0 &&
          backendRoles.every((r: string) => {
            const lower = r.toLowerCase().trim();
            return lower === 'customer' || lower === 'guest';
          });

        if (!isStaff || hasOnlyCustomerOrGuestRoles) {
          logout();
          return;
        }

        const mappedRole = mapBackendRolesToUserRole(res.data.roles);
        const updated: User = {
          ...user,
          name: res.data.full_name || user.name,
          email: res.data.email || user.email,
          role: mappedRole,
          roles: res.data.roles || user.roles,
          permissions: res.data.permissions || user.permissions || [],
          is_staff: isStaff,
          isStaff: isStaff,
        };
        setUser(updated);
        localStorage.setItem('seyeya_crm_user', JSON.stringify(updated));
      }
    } catch (e) {
      console.warn("Failed to refresh current user session:", e);
    }
  };

  // Listen for 401 unauthorized errors or permission matrix sync updates
  useEffect(() => {
    const handleAuthRequired = () => {
      setUser(null);
      localStorage.removeItem('seyeya_crm_user');
    };
    const handlePermissionsUpdated = () => {
      refreshCurrentUser();
    };

    window.addEventListener('seyeya_auth_required', handleAuthRequired);
    window.addEventListener('seyeya_permissions_updated', handlePermissionsUpdated);

    return () => {
      window.removeEventListener('seyeya_auth_required', handleAuthRequired);
      window.removeEventListener('seyeya_permissions_updated', handlePermissionsUpdated);
    };
  }, [user]);

  // Inactivity auto-logout hook: automatically logs the user out after 15 minutes of inactivity
  useEffect(() => {
    if (!user) return;

    let timeoutId: any;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        logout();
      }, 15 * 60 * 1000); // 15 minutes
    };

    const activityEvents = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

    activityEvents.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    // Initialize timer
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      activityEvents.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [user]);

  const updateUserProfile = (name: string, email: string) => {
    if (user) {
      const updated = {
        ...user,
        name,
        email,
      };
      setUser(updated);
      localStorage.setItem('seyeya_crm_user', JSON.stringify(updated));
    }
  };

  const hasPermission = (permissionKey: string): boolean => {
    if (!user) return false;
    if (user.role === 'admin' || user.roles?.includes('Super Admin')) {
      return true;
    }
    if (user.permissions && user.permissions.length > 0) {
      return user.permissions.includes(permissionKey);
    }
    return false;
  };

  const canAccessPage = (pageId: string): boolean => {
    if (!user) return false;
    if (user.role === 'admin' || user.roles?.includes('Super Admin')) {
      return true;
    }

    const rootPage = pageId.includes('-') && !pageId.startsWith('menu-editor')
      ? pageId.split('-')[0]
      : pageId;

    if (rootPage === 'settings') {
      if (pageId === 'settings-profile' || pageId === 'settings-theme' || pageId === 'settings-notifications') {
        return true;
      }
      if (pageId === 'settings-permissions') {
        return hasPermission('roles.manage');
      }
      if (pageId === 'settings-hotel') {
        return hasPermission('roles.view') || user.role === 'manager';
      }
      return true;
    }

    const reqPerm = PAGE_PERMISSION_MAP[rootPage];
    if (reqPerm) {
      if (user.permissions && user.permissions.length > 0) {
        return user.permissions.includes(reqPerm);
      }
      const userRoleNames = user.roles && user.roles.length > 0 ? user.roles : [user.role];
      return userRoleNames.some(r => {
        const allowed = DEFAULT_ROLE_PAGES[r] || DEFAULT_ROLE_PAGES[user.role] || [];
        return allowed.includes(rootPage);
      });
    }

    return true;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        updateUserRole,
        updateUserProfile,
        refreshCurrentUser,
        hasPermission,
        canAccessPage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requiredPermission?: string;
  pageId?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requiredPermission,
  pageId,
}) => {
  const { user, isAuthenticated, isLoading, hasPermission, canAccessPage } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#09090b]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
          <p className="text-sm text-zinc-550 font-medium tracking-wide">Syncing Workspace...</p>
        </div>
      </div>
    );
  }

  // Redirected to Login view if not authenticated
  if (!isAuthenticated || !user) {
    return <RedirectToLogin />;
  }

  // Strictly enforce staff status: customer and guest accounts cannot access CRM routes
  const isStaff = user.is_staff ?? user.isStaff;
  const roles = Array.isArray(user.roles) ? user.roles : [];
  const isOnlyCustomerOrGuest =
    roles.length > 0 &&
    roles.every((r: string) => ['customer', 'guest'].includes(r.toLowerCase().trim()));

  if (isStaff === false || isOnlyCustomerOrGuest) {
    return <RedirectToLogin />;
  }

  // Page / Permission / Role authorization check
  const isDenied =
    (pageId && !canAccessPage(pageId)) ||
    (requiredPermission && !hasPermission(requiredPermission)) ||
    (allowedRoles && !allowedRoles.includes(user.role));

  if (isDenied) {
    return (
      <div className="flex h-full w-full min-h-[70vh] flex-col items-center justify-center p-8 text-center animate-fade-in">
        <div className="max-w-md w-full rounded-2xl p-8 text-center shadow-xl border border-red-200/80 dark:border-red-900/40 bg-white dark:bg-zinc-900/90 backdrop-blur-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-7 w-7">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Permission Denied
          </h2>
          <p className="mt-2 text-sm text-red-600 dark:text-red-400 font-semibold">
            Permission denied. Contact your administrator.
          </p>
          <div className="mt-6 pt-4 border-t border-zinc-150 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
            Your current account credentials do not grant access to this page view. If you believe this is in error, contact your system administrator to update your role permissions.
          </div>
          <div className="mt-5">
            <button
              type="button"
              onClick={() => {
                const allPages = ['overview', 'orders', 'rooms', 'conferences', 'clients', 'menu-editor', 'reports', 'settings'];
                const firstAllowed = allPages.find(p => canAccessPage(p)) || 'overview';
                window.dispatchEvent(new CustomEvent('seyeya_navigate_tab', { detail: firstAllowed }));
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors shadow-xs cursor-pointer"
            >
              Return to Accessible Workspace
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// Helper component to handle local routing redirection without react-router
const RedirectToLogin: React.FC = () => {
  useEffect(() => {
    // Custom event to signal router we need to show login page
    const event = new CustomEvent('seyeya_auth_required');
    window.dispatchEvent(event);
  }, []);

  return null;
};


