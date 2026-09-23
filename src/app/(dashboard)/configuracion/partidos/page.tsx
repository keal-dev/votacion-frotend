'use client'
import { useEffect, useState, useRef } from "react";
import { toast } from 'react-hot-toast';
import Link from "next/link";
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { partidoService } from "@/services/partido.service";
import { electionService } from "@/services/election.service";
import { Partido } from "@/types/partido.types";
import { Election } from "@/types/election.types";
import CreatePartidoModal from "./components/CreatePartidoModal";
import EditPartidoModal from "./components/EditPartidoModal";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";

function SortableTableRow({ partido, handleEditClick, handleDeleteClick, BASE_URL }: any) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: partido.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.8 : 1,
        backgroundColor: isDragging ? '#f8fafc' : undefined,
        position: isDragging ? ('relative' as const) : undefined,
        zIndex: isDragging ? 50 : 1,
    };

    return (
        <tr ref={setNodeRef} style={style} className={`hover:bg-[#f8fafc] transition-colors group ${isDragging ? 'shadow-lg border border-[#e2e8f0]' : ''}`}>
            <td className="px-2 py-3 w-10 text-center">
                <button 
                    className="text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing p-1 rounded hover:bg-slate-100 transition-colors"
                    {...attributes}
                    {...listeners}
                >
                    <DragIndicatorIcon fontSize="small" />
                </button>
            </td>
            <td className="px-5 py-3 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-[#e2e8f0] bg-white overflow-hidden shadow-sm">
                    {partido.logo_url ? (
                        <img
                            src={partido.logo_url.startsWith('http') ? partido.logo_url : `${BASE_URL}${partido.logo_url}`}
                            alt={`Logo ${partido.siglas}`}
                            className="h-full w-full object-contain p-1"
                        />
                    ) : (
                        <div className="h-full w-full bg-slate-50 flex items-center justify-center">
                            <span className="text-[10px] font-black text-slate-400 select-none">
                                {partido.siglas.substring(0, 2)}
                            </span>
                        </div>
                    )}
                </div>
            </td>
            <td className="px-5 py-3">
                <div className="font-bold text-[#172b4d] text-[13px]">{partido.nombre}</div>
            </td>
            <td className="px-5 py-3">
                <span className="inline-flex items-center justify-center rounded bg-[#f1f5f9] px-2 py-1 text-[11px] font-bold text-[#475569] border border-[#e2e8f0]">
                    {partido.siglas}
                </span>
            </td>
            <td className="px-5 py-3">
                <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => handleEditClick(partido)}
                        className="rounded-full bg-white shadow-sm p-1.5 text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-colors border border-[#e2e8f0] hover:border-blue-100"
                        title="Editar"
                    >
                        <EditOutlinedIcon style={{ fontSize: 16 }} />
                    </button>
                    <button
                        onClick={() => handleDeleteClick(partido)}
                        className="rounded-full bg-white shadow-sm p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors border border-[#e2e8f0] hover:border-red-100"
                        title="Eliminar"
                    >
                        <DeleteOutlineOutlinedIcon style={{ fontSize: 16 }} />
                    </button>
                </div>
            </td>
        </tr>
    );
}

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

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        
        if (over && active.id !== over.id) {
            setPartidos((items) => {
                const oldIndex = items.findIndex(item => item.id === active.id);
                const newIndex = items.findIndex(item => item.id === over.id);
                
                const newItems = arrayMove(items, oldIndex, newIndex);
                
                // Save immediately asynchronously
                const updates = newItems.map((item, index) => ({
                    id: item.id,
                    orden: index
                }));
                
                partidoService.reorder(updates).catch(err => {
                    console.error("Error al reordenar", err);
                    toast.error("Hubo un error al guardar el orden");
                    loadData();
                });
                
                return newItems;
            });
        }
    };

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
                        <div className="flex gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap justify-end">
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="flex w-full sm:w-auto h-fit items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 active:scale-95"
                            >
                                <AddIcon fontSize="small" />
                                Inscribir Partido
                            </button>
                        </div>
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
                <div className="pb-5">
                    <div className="rounded-2xl border border-[#e2e8f0] bg-white shadow-sm overflow-hidden flex flex-col">
                        <div className="border-b border-[#e2e8f0] px-5 py-4 bg-[#f8fafc]">
                            <div className="flex justify-between items-center">
                                <h2 className="text-[15px] font-bold text-[#172b4d]">
                                    Organizaciones Registradas
                                </h2>
                                <span className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full text-xs font-bold border border-blue-100">
                                    {partidos.length} Totales
                                </span>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                <table className="w-full text-left text-sm text-[#52637d]">
                                    <thead className="bg-[#f8fafc] text-xs font-extrabold uppercase text-[#52637d] border-b border-[#e2e8f0]">
                                        <tr>
                                            <th className="px-2 py-4 w-10"></th>
                                            <th className="px-5 py-4 text-center w-20">Logo</th>
                                            <th className="px-5 py-4">Nombre del Partido</th>
                                            <th className="px-5 py-4">Siglas</th>
                                            <th className="px-5 py-4 text-right w-28">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#e2e8f0] bg-white">
                                        <SortableContext items={partidos.map(p => p.id)} strategy={verticalListSortingStrategy}>
                                            {partidos.map((partido) => (
                                                <SortableTableRow 
                                                    key={partido.id} 
                                                    partido={partido} 
                                                    handleEditClick={handleEditClick} 
                                                    handleDeleteClick={handleDeleteClick}
                                                    BASE_URL={BASE_URL}
                                                />
                                            ))}
                                        </SortableContext>
                                    </tbody>
                                </table>
                            </DndContext>
                        </div>
                    </div>
                </div>
            )}
            </div>
        </div>
    );
}
