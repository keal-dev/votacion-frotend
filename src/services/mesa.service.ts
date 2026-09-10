import axiosInstance from "../utils/axios";
import { Mesa } from "../types/mesa.types";

export const mesaService = {
  async uploadCsv(file: File): Promise<{ message: string; count: number }> {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await axiosInstance.post('/mesas/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async getByElection(electionId: string): Promise<Mesa[]> {
    const { data } = await axiosInstance.get(`/mesas/election/${electionId}`);
    return data;
  },

  async assignPersonero(mesaId: string, personeroId: string | null): Promise<Mesa> {
    const { data } = await axiosInstance.patch(`/mesas/${mesaId}/asignar`, { personeroId });
    return data;
  },

  async getMyMesas(): Promise<Mesa[]> {
    const { data } = await axiosInstance.get('/mesas/me');
    return data;
  },
};
