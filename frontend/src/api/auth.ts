import { api } from './client';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: { id: string; email: string; role: string };
}

export const authApi = {
  login: (data: LoginPayload) =>
    api.post<AuthResponse>('/auth/login', data).then((r) => r.data),

  logout: () => api.post('/auth/logout'),

  me: () =>
    api.get<{ id: string; email: string; role: string }>('/users/me').then((r) => r.data),
};
