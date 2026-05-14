import { api } from './client';

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
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  isActive: boolean;
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
    // In a real scenario, the backend might return { accessToken, user: DbUser }
    // We map it here.
    const response = await api.post<{ accessToken: string; user: DbUser }>('/auth/login', data);
    return {
      accessToken: response.accessToken,
      user: mapDbUserToAuthUser(response.user)
    };
  } catch (error) {
    console.warn('Backend endpoint /auth/login not ready. Using fallback mock data.', error);
    // TODO: Replace fallback mock when backend endpoint is ready
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simple mock logic based on email
        const email = data.email.toLowerCase();
        let roleCode = 'student';
        if (email.includes('admin')) roleCode = 'admin';
        else if (email.includes('gv')) roleCode = 'teacher';

        const mockDbUser: DbUser = {
          user_id: 123,
          google_id: 'google_123',
          email: email,
          full_name: email.split('@')[0].toUpperCase(),
          avatar_url: undefined,
          is_active: true,
          role_code: roleCode,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        resolve({
          accessToken: 'mock_jwt_token_123',
          user: mapDbUserToAuthUser(mockDbUser)
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
    const dbUser = await api.get<DbUser>('/auth/me');
    return mapDbUserToAuthUser(dbUser);
  } catch (error) {
    console.warn('Backend endpoint /auth/me not ready. Using fallback mock data.', error);
    // TODO: Replace fallback mock when backend endpoint is ready
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockDbUser: DbUser = {
          user_id: 123,
          google_id: 'google_123',
          email: 'mock@quizify.local',
          full_name: 'MOCK USER',
          avatar_url: undefined,
          is_active: true,
          role_code: 'student',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        resolve(mapDbUserToAuthUser(mockDbUser));
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
