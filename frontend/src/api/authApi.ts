import { api } from './client';

export type UserRole = 'admin' | 'teacher' | 'student';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  [key: string]: any; // Allow other fields like avatar, etc.
}

export interface LoginRequest {
  email: string;
  password?: string;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

/**
 * Gọi POST /auth/login
 */
export const loginApi = async (data: LoginRequest): Promise<LoginResponse> => {
  try {
    return await api.post<LoginResponse>('/auth/login', data);
  } catch (error) {
    console.warn('Backend endpoint /auth/login not ready. Using fallback mock data.', error);
    // TODO: Replace fallback mock when backend endpoint is ready
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simple mock logic based on email
        const email = data.email.toLowerCase();
        let role: UserRole = 'student';
        if (email.includes('admin')) role = 'admin';
        else if (email.includes('gv')) role = 'teacher';

        resolve({
          accessToken: 'mock_jwt_token_123',
          user: {
            id: 'u_123',
            name: email.split('@')[0],
            email: email,
            role: role
          }
        });
      }, 500);
    });
  }
};

/**
 * Gọi GET /auth/me
 */
export const getCurrentUserApi = async (): Promise<AuthUser> => {
  try {
    return await api.get<AuthUser>('/auth/me');
  } catch (error) {
    console.warn('Backend endpoint /auth/me not ready. Using fallback mock data.', error);
    // TODO: Replace fallback mock when backend endpoint is ready
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: 'u_123',
          name: 'Mock User',
          email: 'mock@quizify.local',
          role: 'student'
        });
      }, 500);
    });
  }
};

/**
 * Gọi POST /auth/logout
 */
export const logoutApi = async (): Promise<void> => {
  try {
    return await api.post<void>('/auth/logout');
  } catch (error) {
    console.warn('Backend endpoint /auth/logout not ready. Using fallback mock data.', error);
    // TODO: Replace fallback mock when backend endpoint is ready
    return new Promise((resolve) => setTimeout(resolve, 500));
  }
};
