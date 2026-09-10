import axiosInstance from "../utils/axios";

export interface SettingData {
  id: string;
  gps_tolerance_meters: number;
  maintenance_mode: boolean;
  max_photo_size_mb: number;
  platform_name: string;
  global_announcement: string | null;
}

export const settingsService = {
  async getSettings(): Promise<SettingData> {
    const { data } = await axiosInstance.get('/settings');
    return data;
  },
  
  async updateSettings(updateData: Partial<SettingData>): Promise<SettingData> {
    const { data } = await axiosInstance.patch('/settings', updateData);
    return data;
  }
};
