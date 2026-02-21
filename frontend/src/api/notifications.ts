import { api } from './client';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  taskRunId: string | null;
}

export const notificationsApi = {
  list: (page = 1, limit = 20) =>
    api
      .get<{ data: Notification[]; unreadCount: number; pagination: any }>('/notifications', {
        params: { page, limit },
      })
      .then((r) => r.data),

  markAsRead: (id: string) =>
    api.put<Notification>(`/notifications/${id}/read`).then((r) => r.data),

  markAllAsRead: () =>
    api.put<{ success: boolean }>('/notifications/read-all').then((r) => r.data),
};
