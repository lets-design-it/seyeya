import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

export type UserRole = 'admin' | 'manager' | 'agent';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roles?: string[];
  avatar: string;
  joinedDate: string;
  token?: string;
  refreshToken?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, passwordOrRole?: string, role?: UserRole) => Promise<boolean>;
  logout: () => void;
  updateUserRole: (role: UserRole) => void;
  updateUserProfile: (name: string, email: string) => void;
  refreshCurrentUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const MOCK_USERS: Record<UserRole, User> = {
  admin: {
    id: 'u-admin',
    name: 'Sarah Jenkins',
    email: 'admin@seyeya.com',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    joinedDate: '2025-01-15',
  },
  manager: {
    id: 'u-manager',
    name: 'Marcus Vance',
    email: 'manager@seyeya.com',
    role: 'manager',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    joinedDate: '2025-03-22',
  },
  agent: {
    id: 'u-agent',
    name: 'Elena Rostova',
    email: 'agent@seyeya.com',
    role: 'agent',
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
        setUser(JSON.parse(savedUser));
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
      const response = await api.post('/auth/login', {
        email: email,
        password: password
      });

      const data = response.data;
      const mappedRole = mapBackendRolesToUserRole(data.roles);
      const baseUser = MOCK_USERS[mappedRole];

      const loggedInUser: User = {
        id: String(data.user_id),
        name: data.full_name || 'User',
        email: data.email,
        role: mappedRole,
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
    if (user) {
      const updated: User = {
        ...user,
        role,
      };
      setUser(updated);
      localStorage.setItem('seyeya_crm_user', JSON.stringify(updated));
    } else {
      // If no user is logged in, log in as that role
      setUser(MOCK_USERS[role]);
      localStorage.setItem('seyeya_crm_user', JSON.stringify(MOCK_USERS[role]));
    }
  };

  const refreshCurrentUser = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data && user) {
        const mappedRole = mapBackendRolesToUserRole(res.data.roles);
        const updated: User = {
          ...user,
          name: res.data.full_name || user.name,
          email: res.data.email || user.email,
          role: mappedRole,
          roles: res.data.roles || user.roles,
        };
        setUser(updated);
        localStorage.setItem('seyeya_crm_user', JSON.stringify(updated));
      }
    } catch (e) {
      console.warn("Failed to refresh current user session:", e);
    }
  };

  // Listen for 401 unauthorized errors to clear user state
  useEffect(() => {
    const handleAuthRequired = () => {
      setUser(null);
      localStorage.removeItem('seyeya_crm_user');
    };
    window.addEventListener('seyeya_auth_required', handleAuthRequired);
    return () => {
      window.removeEventListener('seyeya_auth_required', handleAuthRequired);
    };
  }, []);

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

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout, updateUserRole, updateUserProfile, refreshCurrentUser }}>
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
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

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

  // Role authorization check
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex h-full w-full min-h-[70vh] flex-col items-center justify-center p-8 text-center">
        <div className="glass-panel glass-card-glow max-w-md rounded-2xl p-8 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-500">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-zinc-100">Access Restricted</h2>
          <p className="mt-2 text-sm text-zinc-550">
            Your current account role <span className="font-semibold text-indigo-400 uppercase">({user.role})</span> does not have permissions to view this resource.
          </p>
          <div className="mt-6 text-xs text-zinc-500 border-t border-zinc-800 pt-4">
            Contact your workspace administrator to upgrade your access credentials.
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


