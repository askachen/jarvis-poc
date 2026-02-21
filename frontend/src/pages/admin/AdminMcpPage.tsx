import React, { useEffect, useState } from 'react';
import { Plus, Terminal, Loader2, CheckCircle, XCircle, Pencil, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Header } from '../../components/layout/Header';
import { AdminSidebar } from '../../components/layout/AdminSidebar';
import { adminApi, McpServer, McpTestResult } from '../../api/admin';
import { formatDistanceToNow } from '../../utils/date';

function parseEnvText(text: string): Record<string, string> {
  const result: Record<string, string> = {};
  text.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      result[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim();
    }
  });
  return result;
}

function serializeEnv(env: Record<string, string>): string {
  return Object.entries(env)
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');
}

function McpFormModal({
  server,
  onClose,
  onSave,
}: {
  server: McpServer | null;
  onClose: () => void;
  onSave: (server: McpServer) => void;
}) {
  const isEdit = !!server;
  const [name, setName] = useState(server?.name ?? '');
  const [description, setDescription] = useState(server?.description ?? '');
  const [command, setCommand] = useState(server?.command ?? '');
  const [argsText, setArgsText] = useState(server?.args.join('\n') ?? '');
  const [envText, setEnvText] = useState(server ? serializeEnv(server.env) : '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !command.trim()) return;
    const args = argsText.split('\n').map((l) => l.trim()).filter(Boolean);
    const env = parseEnvText(envText);
    setSaving(true);
    try {
      if (isEdit && server) {
        const updated = await adminApi.updateMcpServer(server.id, { name, description, command, args, env });
        onSave(updated);
        toast.success('MCP server updated');
      } else {
        const created = await adminApi.createMcpServer({ name, description, command, args, env });
        onSave(created);
        toast.success('MCP server created');
      }
      onClose();
    } catch {
      toast.error(isEdit ? 'Failed to update server' : 'Failed to create server');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            {isEdit ? 'Edit MCP Server' : 'Add MCP Server'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg
                bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg
                bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Command *</label>
            <input
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="e.g. npx"
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg
                bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Args <span className="text-gray-400 font-normal">(one per line)</span>
            </label>
            <textarea
              value={argsText}
              onChange={(e) => setArgsText(e.target.value)}
              rows={4}
              placeholder={`-y\n@modelcontextprotocol/server-filesystem\n/tmp`}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg
                bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Environment <span className="text-gray-400 font-normal">(KEY=VALUE per line)</span>
            </label>
            <textarea
              value={envText}
              onChange={(e) => setEnvText(e.target.value)}
              rows={3}
              placeholder="API_KEY=your_key_here"
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg
                bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-medium bg-orange-500 hover:bg-orange-600 text-white rounded-lg disabled:opacity-60"
            >
              {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Server'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TestResultModal({
  server,
  result,
  onClose,
}: {
  server: McpServer;
  result: McpTestResult;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">Test Result — {server.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X size={18} />
          </button>
        </div>
        <div className="p-4">
          {result.success ? (
            <>
              <div className="flex items-center gap-2 mb-4 text-green-600 dark:text-green-400">
                <CheckCircle size={20} />
                <span className="font-medium">Connection successful</span>
              </div>
              {result.tools && result.tools.length > 0 ? (
                <>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {result.tools.length} tool{result.tools.length !== 1 ? 's' : ''} available:
                  </p>
                  <div className="max-h-56 overflow-y-auto space-y-1.5">
                    {result.tools.map((tool) => (
                      <div
                        key={tool.name}
                        className="flex items-start gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50"
                      >
                        <Terminal size={13} className="text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-mono font-medium text-gray-900 dark:text-white">{tool.name}</p>
                          {tool.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">{tool.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">No tools exposed by this server.</p>
              )}
            </>
          ) : (
            <div className="flex items-start gap-2 text-red-600 dark:text-red-400">
              <XCircle size={20} className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Connection failed</p>
                {result.error && (
                  <p className="text-sm mt-1 text-red-500 dark:text-red-300">{result.error}</p>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="px-4 pb-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminMcpPage() {
  const [servers, setServers] = useState<McpServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editServer, setEditServer] = useState<McpServer | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ server: McpServer; result: McpTestResult } | null>(null);

  useEffect(() => {
    adminApi
      .getMcpServers()
      .then(setServers)
      .catch(() => toast.error('Failed to load MCP servers'))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await adminApi.deleteMcpServer(id);
      setServers((prev) => prev.filter((s) => s.id !== id));
      toast.success('MCP server deleted');
    } catch {
      toast.error('Failed to delete MCP server');
    }
  };

  const handleTest = async (server: McpServer) => {
    setTestingId(server.id);
    try {
      const result = await adminApi.testMcpServer(server.id);
      setTestResult({ server, result });
    } catch {
      setTestResult({ server, result: { success: false, error: 'Request failed' } });
    } finally {
      setTestingId(null);
    }
  };

  const handleSave = (saved: McpServer) => {
    setServers((prev) => {
      const idx = prev.findIndex((s) => s.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden">
      <AdminSidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">MCP Servers</h1>
              <button
                onClick={() => { setEditServer(null); setShowForm(true); }}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg
                  bg-orange-500 hover:bg-orange-600 text-white transition-colors"
              >
                <Plus size={15} />
                Add Server
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12 text-gray-400">Loading...</div>
            ) : (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                      <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Name</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Command</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Args</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Description</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Created</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {servers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-gray-400">No MCP servers configured.</td>
                      </tr>
                    ) : (
                      servers.map((server) => (
                        <tr
                          key={server.id}
                          className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30"
                        >
                          <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{server.name}</td>
                          <td className="px-4 py-3">
                            <code className="text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded font-mono text-gray-800 dark:text-gray-200">
                              {server.command}
                            </code>
                          </td>
                          <td className="px-4 py-3 text-gray-500 dark:text-gray-400 max-w-[200px]">
                            <span className="font-mono text-xs truncate block">
                              {server.args.length > 0
                                ? server.args.join(' ').slice(0, 40) + (server.args.join(' ').length > 40 ? '…' : '')
                                : '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                            {server.description || '—'}
                          </td>
                          <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                            {formatDistanceToNow(server.createdAt)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleTest(server)}
                                disabled={testingId === server.id}
                                className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-40"
                                title="Test connection"
                              >
                                {testingId === server.id ? (
                                  <Loader2 size={14} className="animate-spin" />
                                ) : (
                                  <Terminal size={14} />
                                )}
                              </button>
                              <button
                                onClick={() => { setEditServer(server); setShowForm(true); }}
                                className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(`Delete MCP server "${server.name}"?`)) handleDelete(server.id);
                                }}
                                className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {showForm && (
        <McpFormModal
          server={editServer}
          onClose={() => { setShowForm(false); setEditServer(null); }}
          onSave={handleSave}
        />
      )}

      {testResult && (
        <TestResultModal
          server={testResult.server}
          result={testResult.result}
          onClose={() => setTestResult(null)}
        />
      )}
    </div>
  );
}
