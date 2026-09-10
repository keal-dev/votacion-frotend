import axiosInstance from "../utils/axios";
import { Partido } from "../types/partido.types";

export const partidoService = {
  async getAllByElection(electionId: string): Promise<Partido[]> {
    const { data } = await axiosInstance.get(`/partidos/election/${electionId}`);
    return data;
  },

  async create(formData: FormData): Promise<Partido> {
    // Se usa FormData porque se enviará un archivo de imagen (logo)
    const { data } = await axiosInstance.post('/partidos', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  async update(id: string, formData: FormData): Promise<Partido> {
    const { data } = await axiosInstance.patch(`/partidos/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  async remove(id: string): Promise<void> {
    await axiosInstance.delete(`/partidos/${id}`);
  }
};
