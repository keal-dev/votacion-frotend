import { Election } from './election.types';

export type User = {
    id: string;
    name: string;
    lastname: string;
    phone: string;
    dni: string;
    password?: string;
    role: Role | null;
    image: string;
    publicId: string;
    createdAt: string | Date;
    updatedAt: string | Date;
    deletedAt: string | Date | null;
    election?: Election | null;
};

export enum Role {
    ADMIN = 'ADMIN',
    COORDINADOR = 'COORDINADOR',
    PERSONERO = 'PERSONERO',
}