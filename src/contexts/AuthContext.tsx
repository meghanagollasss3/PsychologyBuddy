"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';

interface User {
  adminProfile: any;
  id: string;
  email?: string;
  studentId?: string;
  firstName: string;
  lastName: string;
  role: {
    name: string;
  };
  school?: {
    id: string;
    name: string;
  };
  classRef?: {
    id: string;
    name: string;
    grade: number;
    section: string;
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!user;

  const login = (userData: User) => {
    setUser(userData);
    // Store studentId in localStorage for easy access
    if (userData.studentId) {
      localStorage.setItem('studentId', userData.studentId);
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      // Clear studentId from localStorage
      localStorage.removeItem('studentId');
    }
  };

  const refreshUser = async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();
      
      if (data.success && data.data?.user) {
        setUser(data.data.user);
        // Store studentId in localStorage for easy access
        if (data.data.user.studentId) {
          localStorage.setItem('studentId', data.data.user.studentId);
        }
      } else {
        setUser(null);
        // Clear studentId from localStorage if no user
        localStorage.removeItem('studentId');
      }
    } catch (error) {
      console.error('Refresh user error:', error);
      setUser(null);
      // Clear studentId from localStorage on error
      localStorage.removeItem('studentId');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
