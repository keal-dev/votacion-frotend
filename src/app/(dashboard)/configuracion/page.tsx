"use client";

import Link from "next/link";
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WhereToVoteIcon from '@mui/icons-material/WhereToVote';
import GroupIcon from '@mui/icons-material/Group';
import FlagIcon from '@mui/icons-material/Flag';
import BadgeIcon from '@mui/icons-material/Badge';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useAuthStore } from "@/store/auth.store";
import { useEffect, useState } from "react";
import { electionService } from "@/services/election.service";
import { mesaService } from "@/services/mesa.service";
import { partidoService } from "@/services/partido.service";
import { candidatoService } from "@/services/candidato.service";
import { userService } from "@/services/user.service";
import { Election } from "@/types/election.types";

const opciones = [
    {
        titulo: "Elecciones",
        descripcion: "Gestiona las elecciones activas, fechas y configuración general.",
        icon: HowToVoteIcon,
        color: "text-blue-500",
        href: "/configuracion/elecciones",
    },
    {
        titulo: "Mesas Electorales",
        descripcion: "Registra y administra todas las mesas de votación.",
        icon: WhereToVoteIcon,
        color: "text-slate-500",
        href: "/configuracion/mesas",
    },
    {
        titulo: "Organizaciones Políticas",
        descripcion: "Registra partidos y movimientos políticos.",
        icon: FlagIcon,
        color: "text-green-600",
        href: "/configuracion/partidos",
    },
    {
        titulo: "Candidatos",
        descripcion: "Gestiona candidatos y listas por cada elección.",
        icon: GroupIcon,
        color: "text-orange-500",
        href: "/configuracion/candidatos",
    },
    {
        titulo: "Usuarios del sistema",
        descripcion: "Administra personeros y sus asignaciones.",
        icon: BadgeIcon,
        color: "text-blue-500",
        href: "/configuracion/personeros",
    },
    {
        titulo: "Ajustes Generales",
        descripcion: "Ajustes generales del sistema electoral.",
        icon: SettingsIcon,
        color: "text-slate-500",
        href: "/configuracion/ajustes",
        adminOnly: true,
    },
];

export default function ConfiguracionPage() {
    const { user } = useAuthStore();
    const [mounted, setMounted] = useState(false);
    const [activeElection, setActiveElection] = useState<Election | null>(null);
    const [totalMesas, setTotalMesas] = useState<number | null>(null);
    const [totalPartidos, setTotalPartidos] = useState<number | null>(null);
    const [totalCandidatos, setTotalCandidatos] = useState<number | null>(null);
    const [totalUsuarios, setTotalUsuarios] = useState<number | null>(null);

    useEffect(() => {
        setMounted(true);
        // Traer elección activa
        electionService.getAll().then((data) => {
            const active = data.find(e => e.activa);
            if (active) {
                setActiveElection(active);
                // Traer cantidad de mesas para la elección activa
                mesaService.getByElection(active.id).then(mesas => {
                    setTotalMesas(mesas.length);
                }).catch(console.error);
                // Traer cantidad de partidos
                partidoService.getAllByElection(active.id).then(partidos => {
                    setTotalPartidos(partidos.length);
                }).catch(console.error);
                // Traer cantidad de candidatos
                candidatoService.getAllByElection(active.id).then(candidatos => {
                    setTotalCandidatos(candidatos.length);
                }).catch(console.error);
                // Traer cantidad de usuarios
                userService.getByElection(active.id).then(usuarios => {
                    setTotalUsuarios(usuarios.length);
                }).catch(console.error);
            }
        }).catch(console.error);
    }, []);

    // Evitar errores de hidratación
    if (!mounted) return null;

    // Filtrar opciones basado en el rol (ocultar adminOnly si es Coordinador)
    const opcionesVisibles = opciones.filter(opcion => {
        if (user?.role === "ADMIN") return true;
        if (opcion.adminOnly) return false;
        return true;
    });

    return (
        <div className="mx-auto max-w-6xl p-5">

            {/* Encabezado */}
            <div className="mb-6 flex items-start justify-between">
                <h1 className="text-[24px] md:text-[28px] font-extrabold text-[#172b4d] tracking-tight">
                    Configuración del Sistema
                </h1>

                {/* Breadcrumb */}
                <div className="flex items-center gap-3 text-xs">
                    <div className="relative">
                        <span className="font-medium text-orange-500">
                            Configuración
                        </span>
                    </div>
                </div>
            </div>

            {/* Grid de opciones */}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {opcionesVisibles.map((opcion) => {
                    const Icon = opcion.icon;

                    return (
                        <Link
                            key={opcion.titulo}
                            href={opcion.href}
                            className="relative group flex min-h-[136px] cursor-pointer flex-col items-center justify-center rounded-lg border border-slate-200 bg-white px-5 py-4 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
                        >
                            {/* Etiqueta de elección activa */}
                            {opcion.titulo === "Elecciones" && activeElection && (
                                <div className="absolute top-2 left-2 w-max max-w-[90%] truncate rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-bold text-blue-600 border border-blue-100">
                                    {activeElection.nombre.toUpperCase()}
                                </div>
                            )}

                            {/* Etiqueta de cantidad de mesas */}
                            {opcion.titulo === "Mesas Electorales" && totalMesas !== null && (
                                <div className="absolute top-2 left-2 w-max max-w-[90%] truncate rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-600 border border-slate-200">
                                    {totalMesas} MESA{totalMesas !== 1 ? 'S' : ''}
                                </div>
                            )}

                            {/* Etiqueta de cantidad de organizaciones politicas */}
                            {opcion.titulo === "Organizaciones Políticas" && totalPartidos !== null && (
                                <div className="absolute top-2 left-2 w-max max-w-[90%] truncate rounded-full bg-green-50 px-2 py-0.5 text-[9px] font-bold text-green-600 border border-green-200">
                                    {totalPartidos} ORGANIZACI{totalPartidos !== 1 ? 'ONES' : 'ÓN'}
                                </div>
                            )}

                            {/* Etiqueta de cantidad de candidatos */}
                            {opcion.titulo === "Candidatos" && totalCandidatos !== null && (
                                <div className="absolute top-2 left-2 w-max max-w-[90%] truncate rounded-full bg-orange-50 px-2 py-0.5 text-[9px] font-bold text-orange-600 border border-orange-200">
                                    {totalCandidatos} CANDIDATO{totalCandidatos !== 1 ? 'S' : ''}
                                </div>
                            )}

                            {/* Etiqueta de cantidad de usuarios */}
                            {opcion.titulo === "Usuarios del sistema" && totalUsuarios !== null && (
                                <div className="absolute top-2 left-2 w-max max-w-[90%] truncate rounded-full bg-indigo-50 px-2 py-0.5 text-[9px] font-bold text-indigo-600 border border-indigo-200">
                                    {totalUsuarios} USUARIO{totalUsuarios !== 1 ? 'S' : ''}
                                </div>
                            )}

                            {/* Icono */}
                            <div className="mb-4 mt-2">
                                <Icon
                                    className={`${opcion.color} transition-transform duration-200 group-hover:scale-110`}
                                    style={{ fontSize: 40 }}
                                />
                            </div>

                            {/* Título */}
                            <h2 className="mb-1 text-sm font-semibold text-slate-900">
                                {opcion.titulo}
                            </h2>

                            {/* Descripción */}
                            <p className="max-w-[250px] text-[11px] leading-4 text-slate-600">
                                {opcion.descripcion}
                            </p>

                            {/* Enlace visual */}
                            <div className="mt-2 flex items-center gap-1 text-[11px] font-medium text-blue-600 transition-colors group-hover:text-blue-800">
                                Ver más
                                <ArrowForwardIcon style={{ fontSize: 14 }} />
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}