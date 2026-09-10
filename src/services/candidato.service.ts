
import axiosInstance from '@/utils/axios';
import { Candidato } from '../types/candidato.types';

export const candidatoService = {
  async getAllByElection(electionId: string): Promise<Candidato[]> {
    const { data } = await axiosInstance.get(`/candidatos/election/${electionId}`);
    return data;
  },

  async getByMesa(mesaId: string): Promise<Candidato[]> {
    const { data } = await axiosInstance.get(`/candidatos/mesa/${mesaId}`);
    return data;
  },

  async create(formData: FormData): Promise<Candidato> {
    const { data } = await axiosInstance.post('/candidatos', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  async update(id: string, formData: FormData): Promise<Candidato> {
    const { data } = await axiosInstance.patch(`/candidatos/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  async remove(id: string): Promise<void> {
    await axiosInstance.delete(`/candidatos/${id}`);
  }
};
