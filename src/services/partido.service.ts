import axiosInstance from "../utils/axios";
import { Partido } from "../types/partido.types";

export const partidoService = {
  async getAllByElection(electionId: string): Promise<Partido[]> {
    const { data } = await axiosInstance.get(`/partidos/election/${electionId}`);
    return data;
  },

  async uploadLogo(file: File): Promise<{ logoUrl: string }> {
    const formData = new FormData();
    formData.append('logo', file);
    const { data } = await axiosInstance.post('/partidos/upload-logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async create(partidoData: { nombre: string; siglas: string; electionId: string; logoUrl?: string }): Promise<Partido> {
    const { data } = await axiosInstance.post('/partidos', partidoData);
    return data;
  },

  async update(id: string, partidoData: { nombre?: string; siglas?: string; logoUrl?: string }): Promise<Partido> {
    const { data } = await axiosInstance.patch(`/partidos/${id}`, partidoData);
    return data;
  },

  async remove(id: string): Promise<void> {
    await axiosInstance.delete(`/partidos/${id}`);
  }
};
