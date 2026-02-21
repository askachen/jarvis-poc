import { create } from 'zustand';
import { Notification } from '../api/notifications';

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  setNotifications: (items: Notification[], unreadCount: number) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  notifications: [],
  unreadCount: 0,

  setNotifications: (items, unreadCount) =>
    set({ notifications: items, unreadCount }),

  markRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - (state.notifications.find((n) => n.id === id && !n.isRead) ? 1 : 0)),
    })),

  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    })),
}));
