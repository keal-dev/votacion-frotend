import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface VotosState {
  // Guardaremos los votos como strings para permitir campos vacíos temporalmente al escribir
  votos: Record<string, string>;
  setVoto: (mesaId: string, key: string, value: string) => void;
  getVoto: (mesaId: string, key: string) => string;
  clearVotosPorMesa: (mesaId: string) => void;
}

export const useVotosStore = create<VotosState>()(
  persist(
    (set, get) => ({
      votos: {},
      setVoto: (mesaId, key, value) =>
        set((state) => ({
          votos: {
            ...state.votos,
            [`${mesaId}_${key}`]: value,
          },
        })),
      getVoto: (mesaId, key) => {
        return get().votos[`${mesaId}_${key}`] || '';
      },
      clearVotosPorMesa: (mesaId) =>
        set((state) => {
          const newVotos = { ...state.votos };
          Object.keys(newVotos).forEach((k) => {
            if (k.startsWith(`${mesaId}_`)) {
              delete newVotos[k];
            }
          });
          return { votos: newVotos };
        }),
    }),
    {
      name: 'votos-storage', // Nombre para el localStorage
    }
  )
);
