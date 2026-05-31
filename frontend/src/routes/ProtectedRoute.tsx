import { Navigate, Outlet, useLocation } from 'react-router-dom';

import type { UserRole } from '@/api/authApi';
import { useAuth } from '@/contexts/AuthContext';
import { getChangePasswordPathByRoles, getDashboardByRoles, isRoleAllowed } from '@/utils/authRouting';

export default function ProtectedRoute({ allowedRoles }: { allowedRoles: UserRole[] }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!isRoleAllowed(user.roles, allowedRoles)) {
    return <Navigate to={getDashboardByRoles(user.roles)} replace />;
  }

  if (user.must_change_password) {
    const requiredPath = getChangePasswordPathByRoles(user.roles);
    if (location.pathname !== requiredPath) {
      return <Navigate to={requiredPath} replace />;
    }
  }

  return <Outlet />;
}
