import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'admin' | 'manager' | 'agent';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  joinedDate: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, role?: UserRole) => Promise<boolean>;
  logout: () => void;
  updateUserRole: (role: UserRole) => void;
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

  const login = async (email: string, selectedRole?: UserRole): Promise<boolean> => {
    setIsLoading(true);
    // Simulate brief network delay for realism
    await new Promise((resolve) => setTimeout(resolve, 600));

    // Simple matching:
    // If selectedRole is directly provided (from quick-select), log in as that role
    // Otherwise, match email string.
    let targetRole: UserRole | null = null;
    
    if (selectedRole) {
      targetRole = selectedRole;
    } else {
      const emailLower = email.toLowerCase().trim();
      if (emailLower.includes('admin')) targetRole = 'admin';
      else if (emailLower.includes('manager')) targetRole = 'manager';
      else if (emailLower.includes('agent')) targetRole = 'agent';
      else {
        // Fallback default
        targetRole = 'agent';
      }
    }

    const matchedUser = MOCK_USERS[targetRole];
    setUser(matchedUser);
    localStorage.setItem('seyeya_crm_user', JSON.stringify(matchedUser));
    setIsLoading(false);
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('seyeya_crm_user');
  };

  const updateUserRole = (role: UserRole) => {
    // Dynamically change role of the current user
    if (user) {
      const baseUser = MOCK_USERS[role];
      const updated = {
        ...user,
        role,
        name: baseUser.name,
        email: baseUser.email,
        avatar: baseUser.avatar,
      };
      setUser(updated);
      localStorage.setItem('seyeya_crm_user', JSON.stringify(updated));
    } else {
      // If no user is logged in, log in as that role
      setUser(MOCK_USERS[role]);
      localStorage.setItem('seyeya_crm_user', JSON.stringify(MOCK_USERS[role]));
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout, updateUserRole }}>
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


