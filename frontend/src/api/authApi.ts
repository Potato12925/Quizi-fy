import { api, type ApiResponse } from './client';
export type UserRole = 'admin' | 'teacher' | 'student';

export interface AuthUser {
  user_id: number;
  email: string;
  roles: UserRole[];
}

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
