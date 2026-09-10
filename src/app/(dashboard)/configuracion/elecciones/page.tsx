"use client";

import Link from "next/link";
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopCircleOutlinedIcon from '@mui/icons-material/StopCircleOutlined';
import { useEffect, useState } from "react";
import { electionService } from "@/services/election.service";
import { Election } from "@/types/election.types";
import CreateElectionModal from "@/app/(dashboard)/configuracion/elecciones/components/CreateElectionModal";
import EditElectionModal from "@/components/EditElectionModal";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";

export default function EleccionesPage() {
    const [elecciones, setElecciones] = useState<Election[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Estado para edición
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [electionToEdit, setElectionToEdit] = useState<Election | null>(null);

    // Estado para eliminación
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [electionToDelete, setElectionToDelete] = useState<Election | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleEditClick = (eleccion: Election) => {
        setElectionToEdit(eleccion);
        setIsEditModalOpen(true);
    };

    const handleEstadoChange = async (eleccion: Election, nuevoEstado: 'PREPARACION' | 'EN_CURSO' | 'FINALIZADA') => {
        try {
            await electionService.update(eleccion.id, { estado: nuevoEstado });
            loadElecciones();
        } catch (error) {
            console.error("Error al cambiar estado", error);
            alert("No se pudo cambiar el estado de la elección");
        }
    };

    const loadElecciones = async () => {
        try {
            setLoading(true);
            const data = await electionService.getAll();
            setElecciones(data);
        } catch (error) {

        } finally {
            setLoading(false);
        }
    };

    const confirmDelete = async () => {
        if (!electionToDelete) return;

        try {
            setIsDeleting(true);
            await electionService.remove(electionToDelete.id);
            setIsDeleteModalOpen(false);
            loadElecciones();
        } catch (error) {
            console.error("Error al eliminar", error);
            alert("No se pudo eliminar la elección");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDeleteClick = (eleccion: Election) => {
        setElectionToDelete(eleccion);
        setIsDeleteModalOpen(true);
    };

    useEffect(() => {
        loadElecciones();
    }, []);

    return (
        <div className="mx-auto max-w-6xl p-5">
            {/* Encabezado */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                    <h1 className="text-[24px] md:text-[28px] font-extrabold text-[#172b4d] tracking-tight">
                        Gestión de Elecciones
                    </h1>
                    <div className="flex items-center gap-2 text-xs mt-1">
                        <Link href="/configuracion" className="font-medium text-slate-500 hover:text-blue-600 transition-colors">
                            Configuración
                        </Link>
                        <span className="text-slate-300">›</span>
                        <span className="font-medium text-blue-600">Elecciones</span>
                    </div>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 rounded-lg bg-green px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-green-2 active:scale-95"
                >
                    <AddIcon fontSize="small" />
                    Crear Elección
                </button>
            </div>

            {/* Modales */}
            <CreateElectionModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={() => {
                    setIsCreateModalOpen(false);
                    loadElecciones();
                }}
            />

            <EditElectionModal
                isOpen={isEditModalOpen}
                election={electionToEdit}
                onClose={() => setIsEditModalOpen(false)}
                onSuccess={() => {
                    setIsEditModalOpen(false);
                    loadElecciones();
                }}
            />

            <DeleteConfirmModal
                isOpen={isDeleteModalOpen}
                title="Eliminar Elección"
                message={`¿Estás seguro de que deseas eliminar la elección "${electionToDelete?.nombre}"? Esta acción no se puede deshacer.`}
                onConfirm={confirmDelete}
                onCancel={() => setIsDeleteModalOpen(false)}
                loading={isDeleting}
            />

            {/* Tarjeta de Lista */}
            <div className="rounded-xl border border-line bg-white shadow-sm overflow-hidden">
                <div className="border-b border-line px-5 py-4">
                    <h2 className="text-[15px] font-extrabold text-[#172b4d]">Elecciones Registradas</h2>
                    <p className="text-xs text-muted mt-1">Administra todas las elecciones del sistema. Solo puede haber una elección activa a la vez.</p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-[#172b4d]">
                        <thead className="bg-[#f8fafc] text-xs font-bold uppercase text-[#52637d]">
                            <tr>
                                <th className="px-5 py-3">Nombre del Proceso</th>
                                <th className="px-5 py-3">Fecha</th>
                                <th className="px-5 py-3 text-center">Activa</th>
                                <th className="px-5 py-3 text-center">Estado</th>
                                <th className="px-5 py-3 text-center">Estadísticas</th>
                                <th className="px-5 py-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-line">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-5 py-8 text-center text-muted">
                                        Cargando elecciones...
                                    </td>
                                </tr>
                            ) : elecciones.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-5 py-8 text-center text-muted">
                                        No hay elecciones registradas. ¡Crea una nueva!
                                    </td>
                                </tr>
                            ) : (
                                elecciones.map((eleccion) => (
                                    <tr key={eleccion.id} className="hover:bg-[#f8fafc] transition-colors">
                                        <td className="px-5 py-4 font-semibold">
                                            {eleccion.nombre}
                                        </td>
                                        <td className="px-5 py-4">
                                            {eleccion.fecha}
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            {eleccion.activa ? (
                                                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 border border-blue-200">
                                                    <CheckCircleIcon style={{ fontSize: 14 }} />
                                                    ACTIVA
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500 border border-slate-200">
                                                    <RadioButtonUncheckedIcon style={{ fontSize: 14 }} />
                                                    INACTIVA
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <select
                                                value={eleccion.estado}
                                                onChange={(e) => handleEstadoChange(eleccion, e.target.value as 'PREPARACION' | 'EN_CURSO' | 'FINALIZADA')}
                                                className={`rounded-lg border px-3 py-1 text-xs font-bold outline-none cursor-pointer transition-colors focus:ring-2 focus:ring-blue-500/20 ${
                                                    eleccion.estado === 'EN_CURSO' ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' :
                                                    eleccion.estado === 'FINALIZADA' ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' :
                                                    'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100'
                                                }`}
                                            >
                                                <option value="PREPARACION" className="bg-white text-[#172b4d]">PREPARACIÓN</option>
                                                <option value="EN_CURSO" className="bg-white text-[#172b4d]">EN CURSO</option>
                                                <option value="FINALIZADA" className="bg-white text-[#172b4d]">FINALIZADA</option>
                                            </select>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <div className="flex flex-col text-xs text-muted">
                                                <span><strong>{eleccion.localesCount}</strong> Locales</span>
                                                <span><strong>{eleccion.mesasCount}</strong> Mesas</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEditClick(eleccion)}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                                    title="Editar"
                                                >
                                                    <EditOutlinedIcon fontSize="small" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(eleccion)}
                                                    className="p-1.5 text-red hover:bg-red-50 rounded-md transition-colors"
                                                    title="Eliminar"
                                                >
                                                    <DeleteOutlineOutlinedIcon fontSize="small" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
