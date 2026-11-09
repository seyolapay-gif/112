import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { api, getStoredToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasRole: (roles: UserRole[]) => boolean;
  canManageUsers: boolean;
  canManageLines: boolean;
  canCreateTransfer: boolean;
  canCancelTransfer: boolean;
  canViewReports: boolean;
  canManageSettings: boolean;
  updateProfile: (data: { fullName?: string; username?: string; phone?: string; email?: string; avatarUrl?: string; currentPassword?: string; newPassword?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const token = getStoredToken();
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      const me = await api.getMe();
      setUser(me);
    } catch (err) {
      console.error('Failed to restore session:', err);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.login(username, password);
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await api.logout();
    } catch {
      // Ignore network errors on logout
    } finally {
      setUser(null);
      setIsLoading(false);
    }
  };

  const hasRole = (roles: UserRole[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const updateProfile = async (data: { fullName?: string; username?: string; phone?: string; email?: string; avatarUrl?: string; currentPassword?: string; newPassword?: string }) => {
    setIsLoading(true);
    try {
      const updated = await api.updateProfile(data);
      setUser(updated);
    } finally {
      setIsLoading(false);
    }
  };

  const role = user?.role;
  const canManageUsers = role === 'admin';
  const canManageLines = role === 'admin' || role === 'operations';
  const canCreateTransfer = role === 'admin' || role === 'operations' || role === 'accountant' || role === 'agent';
  const canCancelTransfer = role === 'admin' || role === 'operations';
  const canViewReports = true; // All authenticated users can view, accountant & admin see detailed financial breakdown
  const canManageSettings = role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshUser,
        updateProfile,
        hasRole,
        canManageUsers,
        canManageLines,
        canCreateTransfer,
        canCancelTransfer,
        canViewReports,
        canManageSettings,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
