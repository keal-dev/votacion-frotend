import axiosInstance from "../utils/axios";

export const systemService = {
  async resetSystem(): Promise<{ message: string }> {
    const { data } = await axiosInstance.post('/system/reset');
    return data;
  },

  async clearVotingData(): Promise<{ message: string }> {
    const { data } = await axiosInstance.post('/system/clear-data');
    return data;
  }
};
