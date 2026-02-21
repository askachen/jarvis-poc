import { api } from './client';
import { Skill } from './skills';

export interface AdminUser {
  id: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface McpServer {
  id: string;
  name: string;
  description?: string;
  command: string;
  args: string[];
  env: Record<string, string>;
  isSystem: boolean;
  ownerId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface McpTestResult {
  success: boolean;
  tools?: Array<{ name: string; description?: string }>;
  error?: string;
}

export interface AdminStats {
  userCount: number;
  skillCount: number;
  mcpCount: number;
}

export interface AdminSkill extends Skill {
  owner?: { email: string } | null;
}

export const adminApi = {
  // Stats
  getStats: () => api.get<AdminStats>('/admin/stats').then((r) => r.data),

  // Users
  getUsers: () => api.get<AdminUser[]>('/admin/users').then((r) => r.data),

  // Skills
  getSkills: () => api.get<AdminSkill[]>('/admin/skills').then((r) => r.data),

  uploadSystemSkill: (fd: FormData) =>
    api
      .post<Skill>('/admin/skills', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => r.data),

  updateSkill: (id: string, data: { name?: string; description?: string; enabled?: boolean }) =>
    api.put<Skill>(`/admin/skills/${id}`, data).then((r) => r.data),

  deleteSkill: (id: string) => api.delete(`/admin/skills/${id}`),

  // MCP Servers
  getMcpServers: () => api.get<McpServer[]>('/admin/mcp-servers').then((r) => r.data),

  createMcpServer: (data: {
    name: string;
    description?: string;
    command: string;
    args: string[];
    env: Record<string, string>;
  }) => api.post<McpServer>('/admin/mcp-servers', data).then((r) => r.data),

  updateMcpServer: (
    id: string,
    data: {
      name?: string;
      description?: string;
      command?: string;
      args?: string[];
      env?: Record<string, string>;
    }
  ) => api.put<McpServer>(`/admin/mcp-servers/${id}`, data).then((r) => r.data),

  deleteMcpServer: (id: string) => api.delete(`/admin/mcp-servers/${id}`),

  testMcpServer: (id: string) =>
    api.post<McpTestResult>(`/admin/mcp-servers/${id}/test`).then((r) => r.data),
};
