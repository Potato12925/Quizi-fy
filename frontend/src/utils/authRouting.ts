import type { AuthUser, UserRole } from '@/api/authApi';

export const getPrimaryRole = (roles: UserRole[]): UserRole => {
  if (roles.includes('admin')) {
    return 'admin';
  }

  if (roles.includes('teacher')) {
    return 'teacher';
  }

  return 'student';
};

export const getDashboardByRoles = (roles: UserRole[]): string => {
  const role = getPrimaryRole(roles);
  return `/${role}/dashboard`;
};

export const getChangePasswordPathByRoles = (roles: UserRole[]): string => {
  const role = getPrimaryRole(roles);
  return `/${role}/change-password`;
};

export const isRoleAllowed = (roles: UserRole[], allowedRoles: UserRole[]): boolean => {
  return roles.some((role) => allowedRoles.includes(role));
};

export const getPostLoginPath = (user: AuthUser): string => {
  if (user.must_change_password) {
    return getChangePasswordPathByRoles(user.roles);
  }

  return getDashboardByRoles(user.roles);
};
