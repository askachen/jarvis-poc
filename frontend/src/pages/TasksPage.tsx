import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Play, History, ChevronDown, ChevronUp, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import { tasksApi, Task, TaskRun, CreateTaskInput } from '../api/tasks';
import { formatDistanceToNow } from '../utils/date';

const FREQUENCY_OPTIONS = [
  { value: 'hourly', label: 'Every hour' },
  { value: 'daily_9am', label: 'Daily at 9 AM' },
  { value: 'weekly_mon_9am', label: 'Weekly (Mon 9 AM)' },
  { value: 'custom', label: 'Custom cron expression' },
];

const FREQUENCY_LABELS: Record<string, string> = {
  hourly: 'Every hour',
  daily_9am: 'Daily at 9 AM',
  weekly_mon_9am: 'Weekly (Mon 9 AM)',
  custom: 'Custom',
};

function StatusBadge({ status }: { status: string }) {
  if (status === 'success') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
        bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
        <CheckCircle size={11} />
        Success
      </span>
    );
  }
  if (status === 'failed') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
        bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
        <XCircle size={11} />
        Failed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
      bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
      <Loader2 size={11} className="animate-spin" />
      Running
    </span>
  );
}

// ---- Task Form Modal ----
interface TaskFormModalProps {
  task?: Task | null;
  onClose: () => void;
  onSaved: () => void;
}

function TaskFormModal({ task, onClose, onSaved }: TaskFormModalProps) {
  const [name, setName] = useState(task?.name ?? '');
  const [prompt, setPrompt] = useState(task?.prompt ?? '');
  const [frequency, setFrequency] = useState(task?.frequency ?? 'daily_9am');
  const [cronExpr, setCronExpr] = useState(
    task?.frequency === 'custom' ? task.cronExpr : ''
  );
  const [enabled, setEnabled] = useState(task?.enabled ?? true);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !prompt.trim()) {
      toast.error('Name and prompt are required');
      return;
    }

    const input: CreateTaskInput = { name: name.trim(), prompt: prompt.trim(), frequency, enabled };
    if (frequency === 'custom') input.cronExpr = cronExpr.trim();

    setSaving(true);
    try {
      if (task) {
        await tasksApi.update(task.id, input);
        toast.success('Task updated');
      } else {
        await tasksApi.create(input);
        toast.success('Task created');
      }
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save task');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            {task ? 'Edit Task' : 'New Task'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Task Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Daily market summary"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600
                bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm
                focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Prompt <span className="text-red-500">*</span>
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="What should Jarvis do when this task runs?"
              rows={5}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600
                bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm
                focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Frequency
            </label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600
                bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm
                focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {FREQUENCY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {frequency === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Cron Expression
              </label>
              <input
                type="text"
                value={cronExpr}
                onChange={(e) => setCronExpr(e.target.value)}
                placeholder="e.g. 0 8 * * 1-5"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-mono
                  focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Standard 5-field cron syntax. Timezone: Asia/Taipei (UTC+8)
              </p>
            </div>
          )}

          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer
                dark:bg-gray-600 peer-checked:after:translate-x-5
                after:content-[''] after:absolute after:top-0.5 after:left-[2px]
                after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all
                peer-checked:bg-indigo-600"></div>
            </label>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {enabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600
                text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm rounded-lg bg-indigo-600 hover:bg-indigo-700
                text-white font-medium transition-colors disabled:opacity-60"
            >
              {saving ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---- Runs Modal ----
interface RunsModalProps {
  task: Task;
  onClose: () => void;
}

function RunsModal({ task, onClose }: RunsModalProps) {
  const [runs, setRuns] = useState<TaskRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    tasksApi.getRuns(task.id).then((data) => {
      setRuns(data.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [task.id]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">Run History</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{task.name}</p>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600
              text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading && (
            <div className="text-center py-8 text-sm text-gray-400">Loading...</div>
          )}
          {!loading && runs.length === 0 && (
            <div className="text-center py-8 text-sm text-gray-400">No runs yet</div>
          )}
          {runs.map((run) => (
            <div
              key={run.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
            >
              <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer
                  hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                onClick={() => setExpanded(expanded === run.id ? null : run.id)}
              >
                <div className="flex items-center gap-3">
                  <StatusBadge status={run.status} />
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDistanceToNow(run.startedAt)}
                  </span>
                  {run.finishedAt && (
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      · {Math.round((new Date(run.finishedAt).getTime() - new Date(run.startedAt).getTime()) / 1000)}s
                    </span>
                  )}
                </div>
                {expanded === run.id ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
              </div>
              {expanded === run.id && (
                <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30">
                  {run.result && (
                    <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono max-h-48 overflow-y-auto">
                      {run.result}
                    </pre>
                  )}
                  {run.error && (
                    <p className="text-xs text-red-600 dark:text-red-400 font-mono">{run.error}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---- TasksPage ----
export function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [runsTask, setRunsTask] = useState<Task | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [triggeringId, setTriggeringId] = useState<string | null>(null);

  const loadTasks = async () => {
    try {
      const data = await tasksApi.list();
      setTasks(data.data);
    } catch {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleDelete = async (task: Task) => {
    if (!window.confirm(`Delete task "${task.name}"?`)) return;
    try {
      await tasksApi.delete(task.id);
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
      toast.success('Task deleted');
    } catch {
      toast.error('Failed to delete task');
    }
  };

  const handleTrigger = async (task: Task) => {
    setTriggeringId(task.id);
    try {
      await tasksApi.trigger(task.id);
      toast.success(`Task "${task.name}" triggered — check notifications in a moment`);
    } catch {
      toast.error('Failed to trigger task');
    } finally {
      setTriggeringId(null);
    }
  };

  const handleToggle = async (task: Task) => {
    setTogglingId(task.id);
    try {
      const updated = await tasksApi.update(task.id, { enabled: !task.enabled });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    } catch {
      toast.error('Failed to update task');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900 overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <div className="flex-1 overflow-y-auto p-6">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Scheduled Tasks</h1>
            <button
              onClick={() => { setEditTask(null); setShowForm(true); }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
            >
              <Plus size={16} />
              New Task
            </button>
          </div>

          {/* Task list */}
          {loading ? (
            <div className="text-center py-16 text-sm text-gray-400">Loading tasks...</div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800
                flex items-center justify-center mx-auto mb-4">
                <Clock size={32} className="text-gray-400" />
              </div>
              <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-1">
                No tasks yet
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Create a scheduled task to run AI prompts automatically.
              </p>
              <button
                onClick={() => { setEditTask(null); setShowForm(true); }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                  bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
              >
                <Plus size={15} />
                Create your first task
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                    rounded-xl p-4 flex items-center gap-4 hover:border-indigo-300
                    dark:hover:border-indigo-700 transition-colors"
                >
                  {/* Toggle */}
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={task.enabled}
                      onChange={() => handleToggle(task)}
                      disabled={togglingId === task.id}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer
                      dark:bg-gray-600 peer-checked:after:translate-x-5
                      after:content-[''] after:absolute after:top-0.5 after:left-[2px]
                      after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all
                      peer-checked:bg-indigo-600 disabled:opacity-50"></div>
                  </label>

                  {/* Info */}
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => { setEditTask(task); setShowForm(true); }}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {task.name}
                      </p>
                      {!task.enabled && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700
                          text-gray-500 dark:text-gray-400">
                          Disabled
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                        {FREQUENCY_LABELS[task.frequency] ?? task.frequency}
                      </span>
                      <span className="text-xs font-mono text-gray-400 dark:text-gray-500">
                        {task.cronExpr}
                      </span>
                      {task.lastRunAt && (
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          Last run: {formatDistanceToNow(task.lastRunAt)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate">
                      {task.prompt}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleTrigger(task)}
                      disabled={triggeringId === task.id}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium
                        text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700
                        hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors
                        disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Run now"
                    >
                      {triggeringId === task.id
                        ? <Loader2 size={13} className="animate-spin" />
                        : <Play size={13} />
                      }
                      Run Now
                    </button>
                    <button
                      onClick={() => setRunsTask(task)}
                      className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
                        hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      title="Run history"
                    >
                      <History size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(task)}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-500 dark:hover:text-red-400
                        hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                      title="Delete task"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showForm && (
        <TaskFormModal
          task={editTask}
          onClose={() => { setShowForm(false); setEditTask(null); }}
          onSaved={loadTasks}
        />
      )}
      {runsTask && (
        <RunsModal
          task={runsTask}
          onClose={() => setRunsTask(null)}
        />
      )}
    </div>
  );
}
