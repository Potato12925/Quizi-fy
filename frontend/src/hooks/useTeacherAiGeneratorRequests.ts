import { useEffect, useMemo, useState } from 'react';
import {
  getTeacherAiRequests,
  retryTeacherAiRequest,
  type TeacherAiRequestItem,
} from '@/api/teacherAIGeneratorApi';

export const useTeacherAiGeneratorRequests = () => {
  const [requests, setRequests] = useState<TeacherAiRequestItem[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [refreshingRequests, setRefreshingRequests] = useState(false);
  const [retryingRequestId, setRetryingRequestId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const loadRequests = async (silent = false) => {
    if (silent) {
      const response = await getTeacherAiRequests(1, 100);
      setRequests(response.items || []);
      return response.items || [];
    }

    setRefreshingRequests(true);
    try {
      const response = await getTeacherAiRequests(1, 100);
      const items = response.items || [];
      setRequests(items);
      return items;
    } finally {
      setRefreshingRequests(false);
    }
  };

  const retryRequest = async (requestId: number) => {
    clearMessages();
    setRetryingRequestId(requestId);
    try {
      await retryTeacherAiRequest(requestId);
      await loadRequests(true);
      setSuccess(`Đã gửi thử lại cho mã công việc tạo AI #${requestId}.`);
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : 'Không thể retry việc tạo bằng AI.');
      throw caught;
    } finally {
      setRetryingRequestId(null);
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      setLoadingRequests(true);
      clearMessages();
      try {
        await loadRequests(true);
      } catch (caught: unknown) {
        setError(caught instanceof Error ? caught.message : 'Không thể tải danh sách công việc AI.');
      } finally {
        setLoadingRequests(false);
      }
    };

    bootstrap().catch(() => undefined);
  }, []);

  const activeRequests = useMemo(
    () => requests.filter((item) => item.status === 'pending' || item.status === 'processing'),
    [requests],
  );

  useEffect(() => {
    if (!activeRequests.length) return undefined;

    const timer = window.setInterval(() => {
      loadRequests(true).catch(() => undefined);
    }, 7000);

    return () => window.clearInterval(timer);
  }, [activeRequests.length]);

  return {
    activeRequests,
    clearMessages,
    error,
    loadRequests,
    loadingRequests,
    refreshingRequests,
    requests,
    retryRequest,
    retryingRequestId,
    setError,
    setRequests,
    setSuccess,
    success,
  };
};
