'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { api } from './api';

export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT';

export interface UserSession {
  id: string;
  username?: string | null;
  email?: string | null;
  role: UserRole;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  phone?: string | null;
  profileImage?: string | null;
  mustChangePassword?: boolean;
  teacherId?: string;
  studentId?: string;
  studentNumber?: string;
  employeeNumber?: string;
  teacherProfile?: any;
  studentProfile?: any;
}

interface AuthContextType {
  user: UserSession | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<{ user: UserSession; mustChangePassword?: boolean }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const refreshUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      const res = await api.get('/auth/me');
      if (res.data) {
        setUser({
          ...res.data,
          teacherId: res.data.teacherProfile?.id,
          studentId: res.data.studentProfile?.id,
          studentNumber: res.data.studentProfile?.studentNumber,
          employeeNumber: res.data.teacherProfile?.employeeNumber,
        });
      } else {
        setUser(null);
      }
    } catch (error) {
      console.warn('Session expired or invalid:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  // Enforce role-based redirects and protections
  useEffect(() => {
    if (loading) return;

    const isAuthRoute = pathname === '/login' || pathname === '/';

    if (!user) {
      if (!isAuthRoute) {
        router.push('/login');
      }
      return;
    }

    // First Login enforcement: if mustChangePassword is true, force change-password
    if (user.mustChangePassword && pathname !== '/change-password') {
      router.push('/change-password');
      return;
    }

    // Role Route Gates (Sections 10, 20, 44, 64)
    if (pathname.startsWith('/admin') && user.role !== 'ADMIN') {
      router.push(user.role === 'TEACHER' ? '/teacher/dashboard' : '/student/dashboard');
    } else if (pathname.startsWith('/teacher') && user.role !== 'TEACHER') {
      router.push(user.role === 'ADMIN' ? '/admin/dashboard' : '/student/dashboard');
    } else if (pathname.startsWith('/student') && user.role !== 'STUDENT') {
      router.push(user.role === 'ADMIN' ? '/admin/dashboard' : '/teacher/dashboard');
    } else if (isAuthRoute) {
      if (user.mustChangePassword) {
        router.push('/change-password');
      } else if (user.role === 'ADMIN') {
        router.push('/admin/dashboard');
      } else if (user.role === 'TEACHER') {
        router.push('/teacher/dashboard');
      } else if (user.role === 'STUDENT') {
        router.push('/student/dashboard');
      }
    }
  }, [user, loading, pathname, router]);

  const login = async (identifier: string, password: string): Promise<{ user: UserSession; mustChangePassword?: boolean }> => {
    const res = await api.post('/auth/login', { identifier, password });
    const { token, user: userData, mustChangePassword } = res.data;

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);

    // If first login requires password change, redirect to change-password
    if (mustChangePassword) {
      router.push('/change-password');
    } else {
      if (userData.role === 'ADMIN') router.push('/admin/dashboard');
      else if (userData.role === 'TEACHER') router.push('/teacher/dashboard');
      else if (userData.role === 'STUDENT') router.push('/student/dashboard');
    }

    return { user: userData, mustChangePassword };
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Ignore error on logout
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
