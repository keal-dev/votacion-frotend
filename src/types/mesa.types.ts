import { User } from './user.types';

export interface Local {
  id: string;
  nombre: string;
  direccion: string;
  region: string;
  provincia: string;
  distrito: string;
}

export interface Mesa {
  id: string;
  numero_mesa: string;
  cantidad_electores: number;
  local: Local;
  personero?: User | null;
  actas?: any[];
  estado?: string;
}
