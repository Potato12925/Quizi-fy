import * as client from './client';

export interface StudentAiChatMessage {
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  actions?: StudentAiChatAction[];
}

export interface StudentAiChatAction {
  label: string;
  type: 'review_topic' | 'review_wrong_questions' | 'view_progress';
  target: string | null;
}

export interface StudentAiChatSendResponse {
  message: string;
  cached: boolean;
  rate_limit_remaining: number;
  actions: StudentAiChatAction[];
}

export const sendStudentAiChatMessage = async (message: string): Promise<StudentAiChatSendResponse> => {
  const response = await client.api.post('/student/ai-chat/message', { message });
  return response.data;
};

export const getStudentAiChatHistory = async (): Promise<StudentAiChatMessage[]> => {
  const response = await client.api.get('/student/ai-chat/history');
  return response.data?.messages || [];
};

export const clearStudentAiChatHistory = async (): Promise<void> => {
  await client.api.delete('/student/ai-chat/history');
};
