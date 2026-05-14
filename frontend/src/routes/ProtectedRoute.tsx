import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/api/authApi';

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();

  const getDefaultDashboard = (roles: UserRole[]) => {
    if (roles.includes('student')) {
      return '/student/dashboard';
    }

    if (roles.includes('teacher')) {
      return '/teacher/dashboard';
    }

    if (roles.includes('admin')) {
      return '/admin/dashboard';
    }

    return '/login';
  };

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

  const hasAccess = user.roles.some((role) => allowedRoles.includes(role));

  if (!hasAccess) {
    // Redirect to correct dashboard
    return <Navigate to={getDefaultDashboard(user.roles)} replace />;
  }

  return <Outlet />;
}
