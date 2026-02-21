import React from 'react';
import { LayoutDashboard, BookOpen, Server, Users, ArrowLeft } from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/admin', icon: LayoutDashboard, exact: true },
  { label: 'System Skills', path: '/admin/skills', icon: BookOpen, exact: false },
  { label: 'MCP Servers', path: '/admin/mcp', icon: Server, exact: false },
  { label: 'Users', path: '/admin/users', icon: Users, exact: false },
];

export function AdminSidebar() {
  const currentPath = window.location.pathname;

  const isActive = (path: string, exact: boolean) => {
    if (exact) return currentPath === path;
    return currentPath.startsWith(path);
  };

  return (
    <aside className="flex flex-col w-56 bg-orange-50 dark:bg-gray-800 border-r border-orange-200 dark:border-gray-700 h-full">
      {/* Logo */}
      <div className="p-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-sm">A</span>
        </div>
        <div>
          <p className="font-semibold text-gray-900 dark:text-white text-sm leading-tight">Admin</p>
          <p className="text-xs text-orange-600 dark:text-orange-400">Jarvis POC</p>
        </div>
      </div>

      <hr className="border-orange-200 dark:border-gray-700" />

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {NAV_ITEMS.map(({ label, path, icon: Icon, exact }) => (
          <button
            key={path}
            onClick={() => { window.location.href = path; }}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
              ${isActive(path, exact)
                ? 'bg-orange-200 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300'
                : 'text-gray-700 dark:text-gray-300 hover:bg-orange-100 dark:hover:bg-gray-700'
              }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </nav>

      <hr className="border-orange-200 dark:border-gray-700" />

      {/* Back to App */}
      <div className="p-3">
        <button
          onClick={() => { window.location.href = '/'; }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
            text-gray-600 dark:text-gray-400 hover:bg-orange-100 dark:hover:bg-gray-700 transition-colors"
        >
          <ArrowLeft size={15} />
          Back to App
        </button>
      </div>
    </aside>
  );
}
