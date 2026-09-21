'use client'
import { useEffect, useState } from "react";
import Link from "next/link";
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';
import { partidoService } from "@/services/partido.service";
import { electionService } from "@/services/election.service";
import { Partido } from "@/types/partido.types";
import { Election } from "@/types/election.types";
import CreatePartidoModal from "./components/CreatePartidoModal";
import EditPartidoModal from "./components/EditPartidoModal";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";

export default function PartidosPage() {
    const [partidos, setPartidos] = useState<Partido[]>([]);
    const [activeElection, setActiveElection] = useState<Election | null>(null);
    const [loading, setLoading] = useState(true);

    // Modales
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [partidoToEdit, setPartidoToEdit] = useState<Partido | null>(null);
    const [partidoToDelete, setPartidoToDelete] = useState<Partido | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Reemplaza esto con tu URL base correcta si es necesario
    const BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001';

    const loadData = async () => {
        try {
            setLoading(true);
            const elections = await electionService.getAll();
            const active = elections.find(e => e.activa);

            if (active) {
                setActiveElection(active);
                const partidosData = await partidoService.getAllByElection(active.id);
                setPartidos(partidosData);
            }
        } catch (error) {
            console.error("Error loading data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleDeleteClick = (partido: Partido) => {
        setPartidoToDelete(partido);
        setIsDeleteModalOpen(true);
    };

    const handleEditClick = (partido: Partido) => {
        setPartidoToEdit(partido);
        setIsEditModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!partidoToDelete) return;

        try {
            setIsDeleting(true);
            await partidoService.remove(partidoToDelete.id);
            setIsDeleteModalOpen(false);
            loadData();
        } catch (error: any) {
            console.error("Error al eliminar", error);
            const msg = error.response?.data?.message || "No se pudo eliminar el partido";
            alert("❌ " + msg);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="flex h-full flex-col">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-4">
                <div>
                    <h1 className="text-[24px] md:text-[28px] font-extrabold text-[#172b4d] tracking-tight">Organizaciones Políticas</h1>
                    <div className="mt-1 flex items-center text-[13px] text-[#52637d]">
                        <Link href="/configuracion/elecciones" className="hover:text-blue-600">Configuración</Link>
                        <span className="mx-2">/</span>
                        <span className="font-bold text-blue-600">Partidos Políticos</span>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
                    {activeElection && (
                        <div className="flex items-center gap-2 rounded-full bg-green-50 px-4 py-2 border border-green-200 shadow-sm w-full sm:w-auto justify-center">
                            <div className="w-2 h-2 rounded-full bg-[#0b9349] animate-pulse"></div>
                            <span className="text-[13px] font-bold text-[#0b9349]">{activeElection.nombre}</span>
                        </div>
                    )}

                    {activeElection && (
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex w-full sm:w-auto h-fit items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 active:scale-95"
                        >
                            <AddIcon fontSize="small" />
                            Inscribir Partido
                        </button>
                    )}
                </div>
            </div>

            {/* Modales */}
            <CreatePartidoModal
                isOpen={isCreateModalOpen}
                activeElection={activeElection}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={() => {
                    setIsCreateModalOpen(false);
                    loadData();
                }}
            />

            <EditPartidoModal 
                isOpen={isEditModalOpen}
                partido={partidoToEdit}
                onClose={() => setIsEditModalOpen(false)}
                onSuccess={() => {
                    setIsEditModalOpen(false);
                    loadData();
                }}
            />

            <DeleteConfirmModal
                isOpen={isDeleteModalOpen}
                title="Eliminar Partido"
                message={`¿Estás seguro de que deseas retirar la inscripción de "${partidoToDelete?.nombre}"? 
⚠️ ADVERTENCIA: Esta acción es irreversible y ELIMINARÁ TAMBIÉN a todos los candidatos inscritos bajo este partido.`}
                onConfirm={confirmDelete}
                onCancel={() => setIsDeleteModalOpen(false)}
                loading={isDeleting}
            />

            {/* Contenido Principal */}
            <div className="flex-1 overflow-auto bg-[#f4f5f7]">
                {!activeElection && !loading ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
                    <h3 className="text-base font-bold text-amber-800 mb-2">No hay ninguna Elección Activa</h3>
                    <p className="text-sm text-amber-700">
                        Debes tener una elección marcada como ACTIVA para inscribir partidos políticos. Ve a la sección de Elecciones y activa una.
                    </p>
                </div>
            ) : loading ? (
                <div className="flex justify-center p-12">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-sm font-bold text-[#52637d]">Cargando organizaciones...</p>
                    </div>
                </div>
            ) : partidos.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#bdc8d5] bg-white p-12 text-center shadow-sm">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
                        <InboxOutlinedIcon className="text-blue-600" style={{ fontSize: 32 }} />
                    </div>
                    <h3 className="mb-2 text-base font-bold text-[#172b4d]">Sin Partidos Inscritos</h3>
                    <p className="text-[13px] text-[#52637d] max-w-md mx-auto">
                        No hay ninguna organización política participando en la elección <strong>{activeElection?.nombre}</strong>. Haz clic en el botón superior derecho para inscribir el primero.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 p-5">
                    {partidos.map((partido) => (
                        <div key={partido.id} className="group relative rounded-xl border border-[#e2e8f0] border-l-[4px] border-l-[#138b49] bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(0,0,0,0.06)] hover:border-[#cbd5e1] hover:border-l-[#0b9349] overflow-hidden flex flex-col">
                            {/* Card Cover/Header */}
                            <div className="h-12 w-full bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 border-b border-[#e2e8f0] relative">
                                <div className="absolute right-1 top-1 flex gap-1 opacity-0 transition-all duration-200 group-hover:opacity-100 z-10">
                                    <button
                                        onClick={() => handleEditClick(partido)}
                                        className="rounded-full bg-white/90 backdrop-blur shadow-sm p-1 text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-colors border border-transparent hover:border-blue-100"
                                        title="Editar"
                                    >
                                        <EditOutlinedIcon style={{ fontSize: 14 }} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteClick(partido)}
                                        className="rounded-full bg-white/90 backdrop-blur shadow-sm p-1 text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors border border-transparent hover:border-red-100"
                                        title="Eliminar"
                                    >
                                        <DeleteOutlineOutlinedIcon style={{ fontSize: 14 }} />
                                    </button>
                                </div>
                            </div>
                            
                            {/* Card Body */}
                            <div className="px-3 pb-3 pt-0 flex-1 flex flex-col items-center text-center relative bg-white">
                                {/* Logo (Overlapping) */}
                                <div className="mx-auto -mt-6 mb-2 flex h-12 w-12 items-center justify-center rounded-full border-[3px] border-white bg-white overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.08)] z-10">
                                    {partido.logo_url ? (
                                        <img
                                            src={partido.logo_url.startsWith('http') ? partido.logo_url : `${BASE_URL}${partido.logo_url}`}
                                            alt={`Logo ${partido.siglas}`}
                                            className="h-full w-full object-contain p-0.5"
                                        />
                                    ) : (
                                        <div className="h-full w-full bg-slate-50 flex items-center justify-center">
                                            <span className="text-sm font-black text-slate-300 select-none">
                                                {partido.siglas.substring(0, 2)}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <h3 className="text-[12px] font-extrabold text-[#0f172a] leading-tight mb-1.5 line-clamp-2" title={partido.nombre}>
                                    {partido.nombre}
                                </h3>
                                
                                <div className="mt-auto w-full">
                                    <div className="mx-auto inline-flex items-center justify-center rounded bg-[#f8fafc] px-2 py-0.5 text-[10px] font-bold text-[#475569] border border-[#e2e8f0]">
                                        {partido.siglas}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            </div>
        </div>
    );
}
