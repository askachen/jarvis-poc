import React, { useState } from 'react';
import {
  Plus,
  MessageSquare,
  Trash2,
  Sun,
  Moon,
  LogOut,
  User,
  ChevronRight,
  ListTodo,
  Plug,
  BookOpen,
  Shield,
} from 'lucide-react';
import { useConversations } from '../../hooks/useConversations';
import { useAuthStore } from '../../stores/auth';
import { useThemeStore } from '../../stores/theme';
import { authApi } from '../../api/auth';
import { formatDistanceToNow } from '../../utils/date';

export function Sidebar() {
  const {
    conversations,
    activeConversationId,
    createConversation,
    deleteConversation,
    switchConversation,
  } = useConversations();

  const { user, clearAuth } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const currentPath = window.location.pathname;

  const handleNewConversation = async () => {
    await createConversation();
  };

  const handleDeleteConversation = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Delete this conversation?')) {
      await deleteConversation(id);
    }
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {}
    clearAuth();
    window.location.href = '/login';
  };

  return (
    <aside className="flex flex-col w-64 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-full">
      {/* Nav section */}
      <div className="p-3 space-y-1">
        <button
          onClick={handleNewConversation}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
            bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
        >
          <Plus size={16} />
          New Conversation
        </button>
        <button
          onClick={() => { window.location.href = '/tasks'; }}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
            transition-colors
            ${currentPath === '/tasks'
              ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
        >
          <ListTodo size={16} />
          Tasks
        </button>
        <button
          onClick={() => { window.location.href = '/connectors'; }}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
            transition-colors
            ${currentPath === '/connectors'
              ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
        >
          <Plug size={16} />
          Connectors
        </button>
        <button
          onClick={() => { window.location.href = '/skills'; }}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
            transition-colors
            ${currentPath === '/skills'
              ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
        >
          <BookOpen size={16} />
          Skills
        </button>
        {user?.role === 'admin' && (
          <button
            onClick={() => { window.location.href = '/admin'; }}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
              transition-colors
              ${currentPath.startsWith('/admin')
                ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
          >
            <Shield size={16} />
            Admin
          </button>
        )}
      </div>

      <hr className="border-gray-200 dark:border-gray-700" />

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto py-2">
        {conversations.length === 0 ? (
          <p className="text-center text-sm text-gray-400 dark:text-gray-500 mt-8 px-4">
            No conversations yet.
            <br />
            Start by creating one!
          </p>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => {
                if (currentPath !== '/') {
                  window.location.href = '/';
                } else {
                  switchConversation(conv.id);
                }
              }}
              onMouseEnter={() => setHoveredId(conv.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={`
                flex items-center gap-2 px-3 py-2 mx-2 my-0.5 rounded-lg cursor-pointer
                transition-colors group
                ${
                  activeConversationId === conv.id
                    ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }
              `}
            >
              <MessageSquare size={15} className="flex-shrink-0 opacity-60" />
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{conv.title}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {formatDistanceToNow(conv.updatedAt)}
                </p>
              </div>
              {hoveredId === conv.id && (
                <button
                  onClick={(e) => handleDeleteConversation(e, conv.id)}
                  className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30
                    text-gray-400 hover:text-red-500 dark:hover:text-red-400 flex-shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      <hr className="border-gray-200 dark:border-gray-700" />

      {/* User menu */}
      <div className="p-2 relative">
        <button
          onClick={() => setUserMenuOpen(!userMenuOpen)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg
            hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
            <User size={14} className="text-white" />
          </div>
          <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 text-left truncate">
            {user?.email}
          </span>
          <ChevronRight
            size={14}
            className={`text-gray-400 transition-transform ${userMenuOpen ? 'rotate-90' : ''}`}
          />
        </button>

        {/* Popover */}
        {userMenuOpen && (
          <div className="absolute bottom-14 left-2 right-2 bg-white dark:bg-gray-700
            border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50 overflow-hidden">
            <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-600">
              <p className="text-xs text-gray-400 dark:text-gray-400">Signed in as</p>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                {user?.email}
              </p>
            </div>

            {/* Theme toggle */}
            <button
              onClick={() => { toggleTheme(); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm
                text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600
                transition-colors"
            >
              {theme === 'dark' ? (
                <>
                  <Sun size={14} />
                  Switch to Light Mode
                </>
              ) : (
                <>
                  <Moon size={14} />
                  Switch to Dark Mode
                </>
              )}
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm
                text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20
                transition-colors"
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
