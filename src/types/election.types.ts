export interface Election {
  id: string;
  nombre: string;
  fecha: string;
  activa: boolean;
  estado: 'PREPARACION' | 'EN_CURSO' | 'FINALIZADA';
  createdAt: string;
  updatedAt: string;
  // Campos visuales para el frontend
  localesCount?: number;
  mesasCount?: number;
}

export interface CreateElectionDto {
  nombre: string;
  fecha: string;
  activa?: boolean;
  estado?: 'PREPARACION' | 'EN_CURSO' | 'FINALIZADA';
}

export interface UpdateElectionDto extends Partial<CreateElectionDto> { }
