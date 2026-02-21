import React, { useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck, X } from 'lucide-react';
import { notificationsApi } from '../../api/notifications';
import { useNotificationsStore } from '../../stores/notifications';
import { formatDistanceToNow } from '../../utils/date';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, setNotifications, markRead, markAllRead } =
    useNotificationsStore();
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const data = await notificationsApi.list(1, 20);
      setNotifications(data.data, data.unreadCount);
    } catch {
      // silently ignore
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close panel on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      markAllRead();
    } catch {
      // silently ignore
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      markRead(id);
    } catch {
      // silently ignore
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors
          text-gray-500 dark:text-gray-400 relative"
        title="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span
            className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5
              bg-red-500 text-white text-[10px] font-bold rounded-full
              flex items-center justify-center leading-none"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-[480px] z-50
            bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
            rounded-xl shadow-xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3
            border-b border-gray-100 dark:border-gray-700">
            <span className="font-semibold text-gray-900 dark:text-white text-sm">
              Notifications
            </span>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400
                    hover:text-indigo-800 dark:hover:text-indigo-200 px-2 py-1 rounded
                    hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                  title="Mark all as read"
                >
                  <CheckCheck size={13} />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700
                  text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="max-h-[70vh] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center text-sm text-gray-400 dark:text-gray-500 py-10 px-4">
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.isRead && handleMarkRead(n.id)}
                  className={`
                    px-4 py-3 border-b border-gray-50 dark:border-gray-700/50 last:border-0
                    ${!n.isRead
                      ? 'bg-indigo-50/60 dark:bg-indigo-900/20 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/30'
                      : 'bg-white dark:bg-gray-800'
                    }
                    transition-colors
                  `}
                >
                  <div className="flex items-start gap-2">
                    {!n.isRead && (
                      <span className="mt-1.5 flex-shrink-0 w-2 h-2 rounded-full bg-indigo-500" />
                    )}
                    <div className={`flex-1 min-w-0 ${n.isRead ? 'pl-4' : ''}`}>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                        {n.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 whitespace-pre-wrap break-words">
                        {n.body}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {formatDistanceToNow(n.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
