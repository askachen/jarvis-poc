import { api } from './client';

export interface OutlookConnector {
  id: string;
  userId: string;
  connected: boolean;
  mockMode: boolean;
  displayEmail: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OutlookEmail {
  id: string;
  from: string;
  fromName: string;
  subject: string;
  receivedAt: string;
  bodyPreview: string;
}

export const outlookApi = {
  getStatus: () =>
    api.get<OutlookConnector | null>('/outlook/status').then((r) => r.data),

  connectMock: (displayEmail?: string) =>
    api.post<OutlookConnector>('/outlook/connect-mock', { displayEmail }).then((r) => r.data),

  disconnect: () =>
    api.delete<OutlookConnector>('/outlook/disconnect').then((r) => r.data),

  previewEmails: () =>
    api.get<OutlookEmail[]>('/outlook/preview-emails').then((r) => r.data),
};
