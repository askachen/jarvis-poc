import React, { useEffect, useState } from 'react';
import { Users, BookOpen, Server, ArrowRight } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { AdminSidebar } from '../../components/layout/AdminSidebar';
import { adminApi, AdminStats } from '../../api/admin';
import toast from 'react-hot-toast';

interface StatCard {
  label: string;
  key: keyof AdminStats;
  icon: React.ElementType;
  href: string;
  color: string;
}

const STAT_CARDS: StatCard[] = [
  { label: 'Users', key: 'userCount', icon: Users, href: '/admin/users', color: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' },
  { label: 'Skills', key: 'skillCount', icon: BookOpen, href: '/admin/skills', color: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400' },
  { label: 'MCP Servers', key: 'mcpCount', icon: Server, href: '/admin/mcp', color: 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400' },
];

export function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi
      .getStats()
      .then(setStats)
      .catch(() => toast.error('Failed to load stats'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden">
      <AdminSidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Dashboard</h1>

            {loading ? (
              <div className="text-center py-12 text-gray-400">Loading...</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {STAT_CARDS.map(({ label, key, icon: Icon, href, color }) => (
                  <button
                    key={key}
                    onClick={() => { window.location.href = href; }}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5
                      flex items-center justify-between hover:shadow-md transition-shadow text-left"
                  >
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                        {stats?.[key] ?? 0}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
                        <Icon size={20} />
                      </div>
                      <ArrowRight size={16} className="text-gray-400" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
