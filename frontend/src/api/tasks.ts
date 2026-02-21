import { api } from './client';

export interface Task {
  id: string;
  userId: string;
  name: string;
  prompt: string;
  frequency: string;
  cronExpr: string;
  enabled: boolean;
  lastRunAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskRun {
  id: string;
  taskId: string;
  status: 'running' | 'success' | 'failed';
  result: string | null;
  error: string | null;
  startedAt: string;
  finishedAt: string | null;
}

export interface CreateTaskInput {
  name: string;
  prompt: string;
  frequency: string;
  cronExpr?: string;
  enabled?: boolean;
}

export const tasksApi = {
  list: (page = 1, limit = 20) =>
    api
      .get<{ data: Task[]; pagination: any }>('/tasks', { params: { page, limit } })
      .then((r) => r.data),

  create: (input: CreateTaskInput) =>
    api.post<Task>('/tasks', input).then((r) => r.data),

  get: (id: string) =>
    api.get<Task>(`/tasks/${id}`).then((r) => r.data),

  update: (id: string, input: Partial<CreateTaskInput>) =>
    api.put<Task>(`/tasks/${id}`, input).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/tasks/${id}`),

  getRuns: (id: string, page = 1, limit = 10) =>
    api
      .get<{ data: TaskRun[]; pagination: any }>(`/tasks/${id}/runs`, { params: { page, limit } })
      .then((r) => r.data),

  trigger: (id: string) =>
    api.post<{ message: string }>(`/tasks/${id}/trigger`).then((r) => r.data),
};
