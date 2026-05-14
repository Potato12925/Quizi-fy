import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/api/authApi';

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-sm font-black text-slate-500 animate-pulse uppercase tracking-widest flex items-center gap-2">
          <span className="material-symbols-outlined animate-spin text-[#b20112]">refresh</span>
          Đang kiểm tra đăng nhập...
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    // Redirect to correct dashboard
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }

  return <Outlet />;
}
