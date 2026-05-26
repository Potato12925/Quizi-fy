/**
 * Custom API Error for HTTP issues
 */
export class ApiError extends Error {
  public status: number;
  public data?: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Generic API Response wrapper if needed
 */
export interface ApiResponse<T = any> {
  data: T;
  status_code: number;
  message?: string;
}

/**
 * Options for Fetch request
 */
export interface RequestOptions extends RequestInit {
  data?: any; // To pass JSON payload easily
  params?: Record<string, string>; // Query parameters
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

/**
 * Core API Client using native fetch
 */
export const apiClient = async <T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> => {
  const { data, params, headers, ...customConfig } = options;
  const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;

  // Build headers
  const configHeaders: Record<string, string> = { 
    ...(headers as Record<string, string> || {}) 
  };

  // Determine content type if we have data to send
  if (data && !isFormData) {
    configHeaders['Content-Type'] = 'application/json';
  }

  // Auth token injection
  const token = localStorage.getItem('accessToken');
  if (token) {
    configHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...customConfig,
    headers: configHeaders,
  };

  if (data) {
    config.body = isFormData ? data : JSON.stringify(data);
  }

  // Query parameters parsing
  let url = `${API_BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  try {
    const response = await fetch(url, config);

    // 401 Unauthorized handling
    if (response.status === 401) {
      // Clear token to effectively log out the user.
      // We don't automatically redirect here to keep the client pure.
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
    }

    // 204 No Content
    if (response.status === 204) {
      return null as any;
    }

    let responseData;
    // Attempt to parse JSON, fallback to text if not JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    if (!response.ok) {
      throw new ApiError(
        response.status,
        responseData?.message || response.statusText || 'Lỗi hệ thống',
        responseData
      );
    }

    return responseData as T;
  } catch (error) {
    // If it's already an ApiError, re-throw it
    if (error instanceof ApiError) {
      throw error;
    }
    // Network or other fetch errors
    throw new ApiError(500, error instanceof Error ? error.message : 'Unknown Network Error');
  }
};

/**
 * Convenience methods
 */
export const api = {
  get: <T = any>(endpoint: string, options?: Omit<RequestOptions, 'method'>) =>
    apiClient<T>(endpoint, { ...options, method: 'GET' }),

  post: <T = any>(endpoint: string, data?: any, options?: Omit<RequestOptions, 'method' | 'data'>) =>
    apiClient<T>(endpoint, { ...options, method: 'POST', data }),

  put: <T = any>(endpoint: string, data?: any, options?: Omit<RequestOptions, 'method' | 'data'>) =>
    apiClient<T>(endpoint, { ...options, method: 'PUT', data }),

  patch: <T = any>(endpoint: string, data?: any, options?: Omit<RequestOptions, 'method' | 'data'>) =>
    apiClient<T>(endpoint, { ...options, method: 'PATCH', data }),

  delete: <T = any>(endpoint: string, options?: Omit<RequestOptions, 'method'>) =>
    apiClient<T>(endpoint, { ...options, method: 'DELETE' }),
};
