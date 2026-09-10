import axiosInstance from "../utils/axios";
import { Election, CreateElectionDto, UpdateElectionDto } from "../types/election.types";

export const electionService = {
  async getAll(): Promise<Election[]> {
    const { data } = await axiosInstance.get('/elections');
    // Mapeamos para que localesCount y mesasCount sean 0 por ahora hasta tener esas tablas
    return data.map((e: Election) => ({
      ...e,
      localesCount: 0,
      mesasCount: 0
    }));
  },

  async getById(id: string): Promise<Election> {
    const { data } = await axiosInstance.get(`/elections/${id}`);
    return data;
  },

  async create(createElectionDto: CreateElectionDto): Promise<Election> {
    const { data } = await axiosInstance.post('/elections', createElectionDto);
    return data;
  },

  async update(id: string, updateElectionDto: UpdateElectionDto): Promise<Election> {
    const { data } = await axiosInstance.patch(`/elections/${id}`, updateElectionDto);
    return data;
  },

  async remove(id: string): Promise<void> {
    await axiosInstance.delete(`/elections/${id}`);
  }
};
