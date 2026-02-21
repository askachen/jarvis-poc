import React, { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { LoginPage } from './pages/LoginPage';
import { ChatPage } from './pages/ChatPage';
import { TasksPage } from './pages/TasksPage';
import { ConnectorsPage } from './pages/ConnectorsPage';
import { SkillsPage } from './pages/SkillsPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminSkillsPage } from './pages/admin/AdminSkillsPage';
import { AdminMcpPage } from './pages/admin/AdminMcpPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { useAuthStore } from './stores/auth';
import { useThemeStore } from './stores/theme';

function App() {
  const { isAuthenticated, user } = useAuthStore();
  const { theme } = useThemeStore();

  // Keep theme in sync
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const path = window.location.pathname;

  // Simple client-side routing
  if (!isAuthenticated() && path !== '/login') {
    window.location.href = '/login';
    return null;
  }

  if (isAuthenticated() && path === '/login') {
    window.location.href = '/';
    return null;
  }

  if (path.startsWith('/admin') && user?.role !== 'admin') {
    window.location.href = '/';
    return null;
  }

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'dark:bg-gray-800 dark:text-gray-100',
          duration: 4000,
          style: {
            fontSize: '14px',
          },
        }}
      />
      {path === '/login' ? <LoginPage />
        : path === '/tasks' ? <TasksPage />
        : path === '/connectors' ? <ConnectorsPage />
        : path === '/skills' ? <SkillsPage />
        : path === '/admin' ? <AdminDashboardPage />
        : path === '/admin/skills' ? <AdminSkillsPage />
        : path === '/admin/mcp' ? <AdminMcpPage />
        : path === '/admin/users' ? <AdminUsersPage />
        : <ChatPage />}
    </>
  );
}

export default App;
