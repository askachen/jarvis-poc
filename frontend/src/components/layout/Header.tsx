import React from 'react';
import { useConversationsStore } from '../../stores/conversations';
import { NotificationBell } from './NotificationBell';

export function Header() {
  const { activeConversationId, conversations } = useConversationsStore();
  const activeConv = conversations.find((c) => c.id === activeConversationId);
  const path = window.location.pathname;
  const isTasksPage = path === '/tasks';
  const isConnectorsPage = path === '/connectors';
  const isSkillsPage = path === '/skills';
  const isAdminPage = path.startsWith('/admin');

  return (
    <header className="flex items-center justify-between px-4 py-3
      bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">J</span>
          </div>
          <span className="font-semibold text-gray-900 dark:text-white text-lg">Jarvis</span>
        </div>
        {isTasksPage ? (
          <>
            <span className="text-gray-300 dark:text-gray-600">/</span>
            <span className="text-gray-600 dark:text-gray-400 text-sm">Tasks</span>
          </>
        ) : isConnectorsPage ? (
          <>
            <span className="text-gray-300 dark:text-gray-600">/</span>
            <span className="text-gray-600 dark:text-gray-400 text-sm">Connectors</span>
          </>
        ) : isSkillsPage ? (
          <>
            <span className="text-gray-300 dark:text-gray-600">/</span>
            <span className="text-gray-600 dark:text-gray-400 text-sm">Skills</span>
          </>
        ) : isAdminPage ? (
          <>
            <span className="text-gray-300 dark:text-gray-600">/</span>
            <span className="text-gray-600 dark:text-gray-400 text-sm">Admin</span>
          </>
        ) : activeConv ? (
          <>
            <span className="text-gray-300 dark:text-gray-600">/</span>
            <span className="text-gray-600 dark:text-gray-400 text-sm truncate max-w-xs">
              {activeConv.title}
            </span>
          </>
        ) : null}
      </div>

      <NotificationBell />
    </header>
  );
}
