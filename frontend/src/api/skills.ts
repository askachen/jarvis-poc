import { api } from './client';

export interface Skill {
  id: string;
  name: string;
  description?: string;
  type: string;
  zipPath?: string;
  skillContent?: string;
  isSystem: boolean;
  enabled: boolean;
  ownerId?: string;
  createdAt: string;
  updatedAt: string;
}

export const skillsApi = {
  list: () => api.get<Skill[]>('/skills').then((r) => r.data),

  upload: (fd: FormData) =>
    api
      .post<Skill>('/skills', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => r.data),

  delete: (id: string) => api.delete(`/skills/${id}`),
};
