import React, { useEffect, useState } from 'react';
import { Shield, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { Header } from '../../components/layout/Header';
import { AdminSidebar } from '../../components/layout/AdminSidebar';
import { adminApi, AdminUser } from '../../api/admin';
import { formatDistanceToNow } from '../../utils/date';

export function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi
      .getUsers()
      .then(setUsers)
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden">
      <AdminSidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Users</h1>

            {loading ? (
              <div className="text-center py-12 text-gray-400">Loading...</div>
            ) : (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                      <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">User</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Role</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => {
                      const initials = user.email.slice(0, 2).toUpperCase();
                      const isAdmin = user.role === 'admin';
                      return (
                        <tr
                          key={user.id}
                          className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0
                                ${isAdmin ? 'bg-orange-500' : 'bg-indigo-600'}`}>
                                {initials}
                              </div>
                              <span className="text-gray-900 dark:text-white">{user.email}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {isAdmin ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300">
                                <Shield size={10} />
                                Admin
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                <User size={10} />
                                User
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                            {formatDistanceToNow(user.createdAt)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
