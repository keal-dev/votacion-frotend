import axiosInstance from '@/utils/axios';

export interface BackupInfo {
  filename: string;
  size: number;
  createdAt: string;
}

export const backupService = {
  async getBackups(): Promise<BackupInfo[]> {
    const response = await axiosInstance.get<BackupInfo[]>('/backup');
    return response.data;
  },

  async generateBackup(): Promise<{ message: string; filename: string }> {
    const response = await axiosInstance.post('/backup/generate');
    return response.data;
  },

  async restoreBackup(filename: string): Promise<{ message: string }> {
    const response = await axiosInstance.post(`/backup/restore/${filename}`);
    return response.data;
  },

  async deleteBackup(filename: string): Promise<{ message: string }> {
    const response = await axiosInstance.delete(`/backup/${filename}`);
    return response.data;
  },

  // Note: For download, it's often easier to handle it directly in the component 
  // via window.open() or using an anchor tag if the route is public, but since it's protected,
  // we can use axios with responseType 'blob'.
  async downloadBackup(filename: string): Promise<Blob> {
    const response = await axiosInstance.get(`/backup/download/${filename}`, {
      responseType: 'blob',
    });
    return response.data;
  }
};
