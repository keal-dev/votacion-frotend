import axiosInstance from '@/utils/axios';
import { LoginDto, AuthResponse } from '@/types/auth.types';
import Cookies from 'js-cookie';
import { useAuthStore } from '@/store/auth.store';

export const authService = {
  async login(credentials: LoginDto): Promise<AuthResponse> {
    const response = await axiosInstance.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  logout() {
    if (typeof window !== 'undefined') {
      Cookies.remove('token');
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
  }
};
