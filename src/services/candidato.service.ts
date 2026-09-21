
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

  async uploadFoto(file: File): Promise<{ fotoUrl: string }> {
    const formData = new FormData();
    formData.append('foto', file);
    const { data } = await axiosInstance.post('/candidatos/upload-foto', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  async create(payload: Partial<Candidato> & { electionId: string, partidoId: string, fotoUrl?: string }): Promise<Candidato> {
    const { data } = await axiosInstance.post('/candidatos', payload);
    return data;
  },

  async update(id: string, payload: Partial<Candidato> & { fotoUrl?: string }): Promise<Candidato> {
    const { data } = await axiosInstance.patch(`/candidatos/${id}`, payload);
    return data;
  },

  async remove(id: string): Promise<void> {
    await axiosInstance.delete(`/candidatos/${id}`);
  }
};
