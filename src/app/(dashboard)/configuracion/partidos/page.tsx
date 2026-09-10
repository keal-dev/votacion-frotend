'use client'
import { useEffect, useState } from "react";
import Link from "next/link";
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
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
        } catch (error) {
            console.error("Error al eliminar", error);
            alert("No se pudo eliminar el partido");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="flex h-full flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4">
                <div>
                    <h1 className="text-[24px] md:text-[28px] font-extrabold text-[#172b4d] tracking-tight">Organizaciones Políticas</h1>
                    <div className="mt-1 flex items-center text-[13px] text-[#52637d]">
                        <Link href="/configuracion/elecciones" className="hover:text-blue-600">Configuración</Link>
                        <span className="mx-2">/</span>
                        <span className="font-bold text-blue-600">Partidos Políticos</span>
                    </div>
                </div>

                {activeElection && (
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 active:scale-95"
                    >
                        <AddIcon fontSize="small" />
                        Inscribir Partido
                    </button>
                )}
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
                message={`¿Estás seguro de que deseas retirar la inscripción de "${partidoToDelete?.nombre}"?`}
                onConfirm={confirmDelete}
                onCancel={() => setIsDeleteModalOpen(false)}
                loading={isDeleting}
            />

            {/* Contenido Principal */}
            <div className="flex-1 overflow-auto bg-[#f4f5f7] p-6">
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
                        <AddIcon className="text-blue-600" style={{ fontSize: 32 }} />
                    </div>
                    <h3 className="mb-2 text-base font-bold text-[#172b4d]">Sin Partidos Inscritos</h3>
                    <p className="text-[13px] text-[#52637d] max-w-md mx-auto">
                        No hay ninguna organización política participando en la elección <strong>{activeElection?.nombre}</strong>. Haz clic en el botón superior derecho para inscribir el primero.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {partidos.map((partido) => (
                        <div key={partido.id} className="group relative rounded-xl border border-line bg-white p-5 text-center shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg">
                            
                            <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-all group-hover:opacity-100">
                                <button
                                    onClick={() => handleEditClick(partido)}
                                    className="rounded-full bg-slate-50 p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600"
                                    title="Editar"
                                >
                                    <EditOutlinedIcon fontSize="small" />
                                </button>
                                <button
                                    onClick={() => handleDeleteClick(partido)}
                                    className="rounded-full bg-slate-50 p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                                    title="Eliminar"
                                >
                                    <DeleteOutlineOutlinedIcon fontSize="small" />
                                </button>
                            </div>

                            <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full border border-line bg-slate-50 overflow-hidden shadow-inner p-1">
                                {partido.logo_url ? (
                                    <img
                                        src={partido.logo_url.startsWith('http') ? partido.logo_url : `${BASE_URL}${partido.logo_url}`}
                                        alt={`Logo ${partido.siglas}`}
                                        className="h-full w-full object-contain rounded-full"
                                    />
                                ) : (
                                    <span className="text-xl font-black text-slate-300 select-none">
                                        {partido.siglas}
                                    </span>
                                )}
                            </div>

                            <h3 className="text-[13px] font-bold text-[#172b4d] leading-tight mb-1 truncate" title={partido.nombre}>
                                {partido.nombre}
                            </h3>
                            <span className="inline-block rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600 border border-blue-100">
                                {partido.siglas}
                            </span>
                        </div>
                    ))}
                </div>
            )}
            </div>
        </div>
    );
}
