import React, { useEffect, useRef, useState } from 'react';
import { BookOpen, Shield, User, Trash2, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { skillsApi, Skill } from '../api/skills';
import { useAuthStore } from '../stores/auth';
import { formatDistanceToNow } from '../utils/date';

function SkillCard({
  skill,
  onDelete,
  canDelete,
}: {
  skill: Skill;
  onDelete?: (id: string) => void;
  canDelete: boolean;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex items-start gap-3">
      <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center flex-shrink-0">
        <BookOpen size={18} className="text-indigo-600 dark:text-indigo-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-gray-900 dark:text-white text-sm">{skill.name}</span>
          {skill.isSystem ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300">
              <Shield size={10} />
              System
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
              <User size={10} />
              Mine
            </span>
          )}
          {!skill.enabled && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
              Disabled
            </span>
          )}
        </div>
        {skill.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{skill.description}</p>
        )}
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          Added {formatDistanceToNow(skill.createdAt)}
        </p>
      </div>
      {canDelete && onDelete && (
        <button
          onClick={() => {
            if (window.confirm(`Delete skill "${skill.name}"?`)) {
              onDelete(skill.id);
            }
          }}
          className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 dark:hover:text-red-400 flex-shrink-0"
        >
          <Trash2 size={15} />
        </button>
      )}
    </div>
  );
}

export function SkillsPage() {
  const { user } = useAuthStore();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    skillsApi
      .list()
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
      const newSkill = await skillsApi.upload(fd);
      setSkills((prev) => [newSkill, ...prev]);
      toast.success(`Skill "${newSkill.name}" uploaded!`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await skillsApi.delete(id);
      setSkills((prev) => prev.filter((s) => s.id !== id));
      toast.success('Skill deleted');
    } catch {
      toast.error('Failed to delete skill');
    }
  };

  const systemSkills = skills.filter((s) => s.isSystem);
  const mySkills = skills.filter((s) => !s.isSystem && s.ownerId === user?.id);

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto">
            {/* Page header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Skills</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  Manage your skill packages
                </p>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg
                  bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-60"
              >
                <Upload size={15} />
                {uploading ? 'Uploading...' : 'Upload Skill (.zip)'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".zip"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {loading ? (
              <div className="text-center py-12 text-gray-400">Loading skills...</div>
            ) : (
              <>
                {/* System Skills */}
                <section className="mb-8">
                  <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Shield size={14} className="text-orange-500" />
                    System Skills
                  </h2>
                  {systemSkills.length === 0 ? (
                    <p className="text-sm text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      No system skills available.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {systemSkills.map((skill) => (
                        <SkillCard key={skill.id} skill={skill} canDelete={false} />
                      ))}
                    </div>
                  )}
                </section>

                {/* My Skills */}
                <section>
                  <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <User size={14} className="text-blue-500" />
                    My Skills
                  </h2>
                  {mySkills.length === 0 ? (
                    <p className="text-sm text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      No skills uploaded yet. Click "Upload Skill (.zip)" to add one.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {mySkills.map((skill) => (
                        <SkillCard
                          key={skill.id}
                          skill={skill}
                          canDelete={true}
                          onDelete={handleDelete}
                        />
                      ))}
                    </div>
                  )}
                </section>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
