import { create } from 'zustand';
import { SettingData, settingsService } from '@/services/settings.service';

interface SettingsState {
  settings: SettingData | null;
  isLoading: boolean;
  error: string | null;
  fetchSettings: () => Promise<void>;
  updateSettingsLocally: (data: Partial<SettingData>) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: null,
  isLoading: true,
  error: null,
  fetchSettings: async () => {
    try {
      set({ isLoading: true, error: null });
      const data = await settingsService.getSettings();
      set({ settings: data, isLoading: false });
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.response?.data?.message || 'Error al obtener ajustes' 
      });
    }
  },
  updateSettingsLocally: (data) => {
    set((state) => ({
      settings: state.settings ? { ...state.settings, ...data } : null
    }));
  }
}));
