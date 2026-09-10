import axiosInstance from '@/utils/axios';
import { User } from '@/types/user.types';

export const userService = {
    getAll: async (): Promise<User[]> => {
        const response = await axiosInstance.get('/users');
        return response.data;
    },

    getByElection: async (electionId: string): Promise<User[]> => {
        const response = await axiosInstance.get(`/users/election/${electionId}`);
        return response.data;
    },

    create: async (formData: FormData): Promise<User> => {
        const response = await axiosInstance.post('/users', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    },

    update: async (id: string, formData: FormData): Promise<User> => {
        const response = await axiosInstance.patch(`/users/${id}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await axiosInstance.delete(`/users/${id}`);
    }
};
