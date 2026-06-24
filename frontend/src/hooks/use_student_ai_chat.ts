import { useCallback, useEffect, useState } from 'react';
import type { StudentAiChatMessage } from '@/api/student_ai_chat_api';
import {
  clearStudentAiChatHistory,
  getStudentAiChatHistory,
  sendStudentAiChatMessage,
} from '@/api/student_ai_chat_api';

const createLocalMessage = (role: StudentAiChatMessage['role'], content: string): StudentAiChatMessage => ({
  role,
  content,
  created_at: new Date().toISOString(),
});

export const useStudentAiChat = () => {
  const [messages, setMessages] = useState<StudentAiChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [rateLimit, setRateLimit] = useState<number | null>(null);

  const loadHistory = useCallback(async () => {
    try {
      const history = await getStudentAiChatHistory();
      setMessages(history);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải lịch sử chat');
    }
  }, []);

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) {
      return;
    }

    setInput('');
    setError(null);
    setLoading(true);
    setMessages((current) => [...current, createLocalMessage('user', trimmed)]);

    try {
      const response = await sendStudentAiChatMessage(trimmed);
      setRateLimit(response.rate_limit_remaining);
      setMessages((current) => [...current, createLocalMessage('assistant', response.message)]);
    } catch (err: any) {
      const message = err?.data?.message || err?.message || 'Không thể gửi tin nhắn';
      setError(message);
      setMessages((current) => [...current, createLocalMessage('assistant', message)]);
    } finally {
      setLoading(false);
    }
  }, [input, loading]);

  const clearHistory = useCallback(async () => {
    try {
      await clearStudentAiChatHistory();
      setMessages([]);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể xoá lịch sử chat');
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      void loadHistory();
    }
  }, [isOpen, loadHistory]);

  return {
    messages,
    input,
    setInput,
    loading,
    error,
    isOpen,
    setIsOpen,
    rateLimit,
    sendMessage,
    loadHistory,
    clearHistory,
  };
};
