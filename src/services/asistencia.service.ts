import axiosInstance from '../utils/axios';

export interface AsistenciaResponse {
  id: string;
  latitud_llegada: number;
  longitud_llegada: number;
  fecha_llegada: string;
  latitud_salida: number | null;
  longitud_salida: number | null;
  fecha_salida: string | null;
}

class AsistenciaService {
  async getToday(): Promise<AsistenciaResponse | null> {
    const { data } = await axiosInstance.get('/asistencias/me/today');
    return data;
  }

  async checkIn(latitud: number, longitud: number): Promise<AsistenciaResponse> {
    const { data } = await axiosInstance.post('/asistencias/check-in', {
      latitud,
      longitud,
    });
    return data;
  }

  async checkOut(latitud: number, longitud: number): Promise<AsistenciaResponse> {
    const { data } = await axiosInstance.patch('/asistencias/check-out', {
      latitud,
      longitud,
    });
    return data;
  }
}

export const asistenciaService = new AsistenciaService();
