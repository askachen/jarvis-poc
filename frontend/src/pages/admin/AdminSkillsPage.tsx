import React, { useEffect, useRef, useState } from 'react';
import { Upload, Pencil, Trash2, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { Header } from '../../components/layout/Header';
import { AdminSidebar } from '../../components/layout/AdminSidebar';
import { adminApi, AdminSkill } from '../../api/admin';
import { formatDistanceToNow } from '../../utils/date';

function EditSkillModal({
  skill,
  onClose,
  onSave,
}: {
  skill: AdminSkill;
  onClose: () => void;
  onSave: (updated: AdminSkill) => void;
}) {
  const [name, setName] = useState(skill.name);
  const [description, setDescription] = useState(skill.description ?? '');
  const [enabled, setEnabled] = useState(skill.enabled);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const updated = await adminApi.updateSkill(skill.id, { name, description, enabled });
      onSave({ ...skill, ...updated });
      toast.success('Skill updated');
      onClose();
    } catch {
      toast.error('Failed to update skill');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">Edit Skill</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg
                bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg
                bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setEnabled(!enabled)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors
                ${enabled ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'}`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform
                  ${enabled ? 'translate-x-4' : 'translate-x-1'}`}
              />
            </button>
            <span className="text-sm text-gray-700 dark:text-gray-300">Enabled</span>
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
              className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AdminSkillsPage() {
  const [skills, setSkills] = useState<AdminSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingSkill, setEditingSkill] = useState<AdminSkill | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    adminApi
      .getSkills()
      .then(setSkills)
      .catch(() => toast.error('Failed to load skills'))
      .finally(() => setLoading(false));
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('zip', file);
    setUploading(true);
    try {
      const newSkill = await adminApi.uploadSystemSkill(fd);
      setSkills((prev) => [{ ...newSkill, owner: null }, ...prev]);
      toast.success(`System skill "${newSkill.name}" uploaded!`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminApi.deleteSkill(id);
      setSkills((prev) => prev.filter((s) => s.id !== id));
      toast.success('Skill deleted');
    } catch {
      toast.error('Failed to delete skill');
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden">
      <AdminSidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">System Skills</h1>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg
                  bg-orange-500 hover:bg-orange-600 text-white transition-colors disabled:opacity-60"
              >
                <Upload size={15} />
                {uploading ? 'Uploading...' : 'Upload System Skill'}
              </button>
              <input ref={fileInputRef} type="file" accept=".zip" className="hidden" onChange={handleFileChange} />
            </div>

            {loading ? (
              <div className="text-center py-12 text-gray-400">Loading...</div>
            ) : (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                      <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Name</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Description</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Type</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Owner</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Status</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Created</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {skills.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-gray-400">No skills yet.</td>
                      </tr>
                    ) : (
                      skills.map((skill) => (
                        <tr
                          key={skill.id}
                          className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30"
                        >
                          <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{skill.name}</td>
                          <td className="px-4 py-3 text-gray-500 dark:text-gray-400 max-w-xs">
                            <span className="line-clamp-1">{skill.description || '—'}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              skill.isSystem
                                ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300'
                                : 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                            }`}>
                              {skill.isSystem ? 'System' : 'User'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                            {skill.owner?.email || '—'}
                          </td>
                          <td className="px-4 py-3">
                            {skill.enabled ? (
                              <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 text-xs">
                                <Check size={12} /> Enabled
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">Disabled</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                            {formatDistanceToNow(skill.createdAt)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => setEditingSkill(skill)}
                                className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(`Delete skill "${skill.name}"?`)) handleDelete(skill.id);
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

      {editingSkill && (
        <EditSkillModal
          skill={editingSkill}
          onClose={() => setEditingSkill(null)}
          onSave={(updated) =>
            setSkills((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
          }
        />
      )}
    </div>
  );
}
