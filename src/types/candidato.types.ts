import { Partido } from './partido.types';

export enum CargoCandidato {
  REGIONAL = 'REGIONAL',
  PROVINCIAL = 'PROVINCIAL',
  DISTRITAL = 'DISTRITAL',
}

export interface Candidato {
  id: string;
  nombre: string;
  apellidos: string;
  dni: string;
  cargo: CargoCandidato;
  region?: string | null;
  provincia?: string | null;
  distrito?: string | null;
  foto_url?: string | null;
  partido: Partido;
  createdAt: string;
  updatedAt: string;
}
