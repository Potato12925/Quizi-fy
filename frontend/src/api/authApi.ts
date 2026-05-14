import { api, type ApiResponse } from './client';
export type UserRole = 'admin' | 'teacher' | 'student';

// Database Schema Model
export interface DbUser {
  user_id: number;
  google_id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  is_active: boolean;
  role_code?: string; // Often joined from roles table
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

// UI/Frontend Model (keeping compatible with existing UI)
export interface AuthUser {
  user_id: number;
  email: string;
  roles: UserRole[];
}

// Mapper: DB -> UI
export const mapDbUserToAuthUser = (dbUser: DbUser): AuthUser => {
  return {
    id: dbUser.user_id.toString(),
    name: dbUser.full_name,
    email: dbUser.email,
    role: (dbUser.role_code as UserRole) || 'student',
    avatarUrl: dbUser.avatar_url,
    isActive: dbUser.is_active,
  };
};

export interface LoginRequest {
  token: string;
  token_type: 'id_token';
  roles: UserRole[];
}

interface BackendLoginResponse {
  success: boolean;
  message: string;
  data: {
    access_token: string;
    token_type: string;
    is_new_user: boolean;
    user: {
      user_id: number;
      google_id: string;
      email: string;
      full_name: string;
      is_active: boolean;
      roles: UserRole[];
    };
  };
  meta: any;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
  isNewUser: boolean;
}

/**
 * POST /auth/google-login
 */
export const loginApi = async (
  payload: LoginRequest
): Promise<LoginResponse> => {

  const response = await api.post<BackendLoginResponse>(
    '/auth/google-login',
    payload
  );

  const result = response.data;

  return {
    accessToken: result.access_token,

    isNewUser: result.is_new_user,

    user: {
      user_id: result.user.user_id,
      email: result.user.email,
      roles: result.user.roles,
    },
  };
};
/**
 * Gọi GET /auth/me
 */
export const getCurrentUserApi = async (): Promise<AuthUser> => {
  try {
    const res = await api.get<ApiResponse<AuthUser>>('/auth/me');

    return res.data;
  } catch (error) {
    console.warn('Failed to fetch current user', error);
    throw error;
  }
};

/**
 * Gọi POST /auth/logout
 */
export const logoutApi = async (): Promise<void> => {
  try {
    return await api.post<void>('/auth/logout');
  } catch (error) {
    console.warn('Failed to logout', error);
    throw error;
  }
};
