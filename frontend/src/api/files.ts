import { api } from './client';
import { FileAttachment } from './conversations';

export const filesApi = {
  upload: async (file: File): Promise<FileAttachment> => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await api.post<FileAttachment>('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return res.data;
  },
};
