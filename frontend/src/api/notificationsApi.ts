import { api } from './client';

interface BackendSuccessEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: NotificationPaginationMeta | null;
}

export interface NotificationItem {
  notification_id: number;
  user_id: number;
  title: string | null;
  content: string | null;
  is_read: boolean;
  created_at: string | null;
}

export interface NotificationPaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  unread_count: number;
}

export const getNotifications = async (params: { page?: number; limit?: number } = {}) => {
  const response = await api.get<BackendSuccessEnvelope<NotificationItem[]>>('/notifications', {
    params: {
      page: String(params.page ?? 1),
      limit: String(params.limit ?? 10),
    },
  });
  return {
    items: response.data || [],
    meta: response.meta ?? null,
  };
};

export const markNotificationAsRead = async (notificationId: number): Promise<NotificationItem> => {
  const response = await api.patch<BackendSuccessEnvelope<NotificationItem>>(`/notifications/${notificationId}/read`);
  return response.data;
};

export const markAllNotificationsAsRead = async (): Promise<{ updated_count: number }> => {
  const response = await api.patch<BackendSuccessEnvelope<{ updated_count: number }>>('/notifications/read-all');
  return response.data;
};
