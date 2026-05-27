import { api, type ApiResponse } from './client';

export type UserRole = 'admin' | 'teacher' | 'student';

export interface AuthUser {
  user_id: number;
  username: string;
  roles: UserRole[];
  full_name?: string;
  is_active: boolean;
  must_change_password: boolean
}

export interface LoginRequest {
  username: string;
  password: string;
}

interface BackendSuccessResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta: any;
}

interface BackendLoginData {
  access_token: string;
  token_type: string;
  user: {
    user_id: number;
    username: string;
    full_name: string;
    is_active: boolean;
    must_change_password: boolean;
    roles: UserRole[];
  };
}

export interface LoginResponse {
  accessToken: string;
  token_type: string;
  user: AuthUser;
}

export const loginApi = async (payload: LoginRequest): Promise<LoginResponse> => {
  const response = await api.post<BackendSuccessResponse<BackendLoginData>>(
    '/auth/login',
    payload
  );

  const result = response.data;

  return {
    accessToken: result.access_token,
    token_type: result.token_type,
    user: {
      user_id: result.user.user_id,
      username: result.user.username,
      roles: result.user.roles,
      full_name: result.user.full_name,
      is_active: result.user.is_active,
      must_change_password: result.user.must_change_password
    },
  };
};

export const getCurrentUserApi = async (): Promise<AuthUser> => {
  try {
    const res = await api.get<ApiResponse<AuthUser>>('/auth/me');
    return res.data;
  } catch (error) {
    console.warn('Failed to fetch current user', error);
    throw error;
  }
};

export const logoutApi = async (): Promise<void> => {
  try {
    return await api.post<void>('/auth/logout');
  } catch (error) {
    console.warn('Failed to logout', error);
    throw error;
  }
};
