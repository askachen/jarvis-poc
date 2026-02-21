import { api } from './client';

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  files?: FileAttachment[] | null;
  createdAt: string;
}

export interface FileAttachment {
  name: string;
  path: string;
  size: number;
  type: string;
  extractedText?: string;
}

export const conversationsApi = {
  list: (page = 1, limit = 20) =>
    api
      .get<{ data: Conversation[]; pagination: any }>('/conversations', {
        params: { page, limit },
      })
      .then((r) => r.data),

  create: (title?: string) =>
    api.post<Conversation>('/conversations', { title }).then((r) => r.data),

  delete: (id: string) => api.delete(`/conversations/${id}`),

  getMessages: (id: string) =>
    api.get<Message[]>(`/conversations/${id}/messages`).then((r) => r.data),
};
