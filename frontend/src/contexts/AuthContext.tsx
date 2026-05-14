import React, { createContext, useState, useEffect, useContext } from 'react';
import { loginApi, logoutApi, getCurrentUserApi } from '@/api/authApi';
import type { AuthUser, LoginRequest } from '@/api/authApi';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<AuthUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const currentUser = await getCurrentUserApi();
        setUser(currentUser);
        localStorage.setItem('user', JSON.stringify(currentUser));
      } catch (error) {
        console.error('Lỗi khi lấy thông tin user (token hết hạn/không hợp lệ)', error);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (data: LoginRequest) => {
    setIsLoading(true);
    try {
      const response = await loginApi(data);
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('user', JSON.stringify(response.user));
      setUser(response.user);
      return response.user;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await logoutApi();
    } catch (error) {
      console.error('Lỗi khi gọi API logout', error);
    } finally {
      // Luôn xóa session ở client dù API lỗi hay không
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
