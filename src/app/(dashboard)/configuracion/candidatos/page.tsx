'use client'
import { useEffect, useState } from "react";
import Link from "next/link";
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { candidatoService } from "@/services/candidato.service";
import { electionService } from "@/services/election.service";
import { Candidato, CargoCandidato } from "@/types/candidato.types";
import { Election } from "@/types/election.types";
import CreateCandidatoModal from "./components/CreateCandidatoModal";
import EditCandidatoModal from "./components/EditCandidatoModal";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
import PersonIcon from '@mui/icons-material/Person';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001';

export default function CandidatosPage() {
    const [candidatos, setCandidatos] = useState<Candidato[]>([]);
    const [activeElection, setActiveElection] = useState<Election | null>(null);
    const [loading, setLoading] = useState(true);
    const [filterCargo, setFilterCargo] = useState<string>('ALL');
    const [filterPartido, setFilterPartido] = useState<string | 'ALL'>('ALL');
    const [filterDistrito, setFilterDistrito] = useState<string>('ALL');

    // Modales
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [candidatoToEdit, setCandidatoToEdit] = useState<Candidato | null>(null);
    const [candidatoToDelete, setCandidatoToDelete] = useState<Candidato | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const elections = await electionService.getAll();
            const active = elections.find(e => e.activa);

            if (active) {
                setActiveElection(active);
                const data = await candidatoService.getAllByElection(active.id);
                setCandidatos(data);
            }
        } catch (error) {
            console.error("Error al cargar candidatos:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (candidato: Candidato) => {
        setCandidatoToDelete(candidato);
        setIsDeleteModalOpen(true);
    };

    const handleEditClick = (candidato: Candidato) => {
        setCandidatoToEdit(candidato);
        setIsEditModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!candidatoToDelete) return;

        try {
            setIsDeleting(true);
            await candidatoService.remove(candidatoToDelete.id);
            await loadData();
            setIsDeleteModalOpen(false);
        } catch (error) {
            console.error("Error al eliminar el candidato:", error);
        } finally {
            setIsDeleting(false);
            setCandidatoToDelete(null);
        }
    };

    const partidosUnicos = Array.from(
        new Map(candidatos.filter(c => c.partido).map((c) => [c.partido?.id, c.partido])).values()
    );

    const distritosUnicos = Array.from(
        new Set(candidatos.filter(c => c.distrito).map(c => c.distrito as string))
    ).sort();

    const filteredCandidatos = candidatos.filter(c => {
        const matchCargo = filterCargo === 'ALL' || c.cargo === filterCargo;
        const matchPartido = filterPartido === 'ALL' || c.partido?.id === filterPartido;
        const matchDistrito = filterDistrito === 'ALL' || c.distrito === filterDistrito;
        return matchCargo && matchPartido && matchDistrito;
    });

    return (
        <div className="flex h-full flex-col">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-4">
                <div>
                    <h1 className="text-[24px] md:text-[28px] font-extrabold text-[#172b4d] tracking-tight">Candidatos</h1>
                    <div className="mt-1 flex items-center text-[13px] text-[#52637d]">
                        <Link href="/configuracion/elecciones" className="hover:text-blue-600">Configuración</Link>
                        <span className="mx-2">/</span>
                        <span className="font-bold text-blue-600">Candidatos</span>
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
                            className="flex cursor-pointer w-full sm:w-auto h-fit items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 active:scale-95"
                        >
                            <AddIcon fontSize="small" />
                            Inscribir Candidato
                        </button>
                    )}
                </div>
            </div>

            {/* Modales */}
            <CreateCandidatoModal
                isOpen={isCreateModalOpen}
                activeElection={activeElection}
                candidatos={candidatos}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={(warning) => {
                    setIsCreateModalOpen(false);
                    loadData();
                    if (warning) {
                        alert("✅ Candidato guardado con éxito.\n\n⚠️ Advertencia: Aún no tiene un lugar asignado (Región/Provincia/Distrito). Recuerde asignarlo más adelante.");
                    }
                }}
            />

            <EditCandidatoModal
                isOpen={isEditModalOpen}
                candidato={candidatoToEdit}
                activeElection={activeElection}
                candidatos={candidatos}
                onClose={() => setIsEditModalOpen(false)}
                onSuccess={(warning) => {
                    setIsEditModalOpen(false);
                    loadData();
                    if (warning) {
                        alert("✅ Candidato actualizado con éxito.\n\n⚠️ Advertencia: Aún no tiene un lugar asignado (Región/Provincia/Distrito). Recuerde asignarlo más adelante.");
                    }
                }}
            />

            <DeleteConfirmModal
                isOpen={isDeleteModalOpen}
                title="Eliminar Candidato"
                message={`¿Estás seguro de que deseas retirar la inscripción de "${candidatoToDelete?.nombre} ${candidatoToDelete?.apellidos}"?`}
                onConfirm={confirmDelete}
                onCancel={() => setIsDeleteModalOpen(false)}
                loading={isDeleting}
            />

            {/* Contenido Principal */}
            <div className="flex-1 overflow-auto bg-[#f4f5f7]">
                {loading ? (
                    <div className="flex h-full items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
                    </div>
                ) : !activeElection ? (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center mt-4">
                            <h3 className="text-base font-bold text-amber-800 mb-2">No hay ninguna Elección Activa</h3>
                            <p className="text-sm text-amber-700">
                                Debes tener una elección marcada como ACTIVA para inscribir candidatos. Ve a la sección de Elecciones y activa una.
                        </p>
                    </div>
                ) : (
                    <div>
                        {/* Filtros */}
                        <div className="mb-6 flex flex-col md:flex-row gap-6 rounded-xl bg-white p-4 shadow-sm border border-line">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                <span className="text-[13px] font-bold text-[#52637d]">Cargo:</span>
                                <select
                                    value={filterCargo}
                                    onChange={(e) => setFilterCargo(e.target.value)}
                                    className="rounded-lg border border-line bg-slate-50 px-2 py-1.5 text-[12px] font-medium text-[#172b4d] shadow-sm outline-none transition-all hover:bg-white focus:bg-white hover:border-blue-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 min-w-[160px]"
                                >
                                    <option value="ALL">Todos los cargos</option>
                                    <option value={CargoCandidato.REGIONAL}>Gubernatura Regional</option>
                                    <option value={CargoCandidato.CONSEJERO}>Consejería Regional</option>
                                    <option value={CargoCandidato.PROVINCIAL}>Alcaldía Provincial</option>
                                    <option value={CargoCandidato.DISTRITAL}>Alcaldía Distrital</option>
                                </select>
                            </div>

                            {partidosUnicos.length > 0 && (
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:border-l md:border-line md:pl-6">
                                    <span className="text-[13px] font-bold text-[#52637d]">Partido Político:</span>
                                    <select
                                        value={filterPartido}
                                        onChange={(e) => setFilterPartido(e.target.value)}
                                        className="rounded-lg border border-line bg-slate-50 px-2 py-1.5 text-[12px] font-medium text-[#172b4d] shadow-sm outline-none transition-all hover:bg-white focus:bg-white hover:border-blue-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 min-w-[160px]"
                                    >
                                        <option value="ALL">Todos los partidos</option>
                                        {partidosUnicos.map(p => (
                                            <option key={p.id} value={p.id}>{p.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                                    {distritosUnicos.length > 0 && (
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:border-l md:border-line md:pl-6">
                                            <span className="text-[13px] font-bold text-[#52637d]">Distrito:</span>
                                            <select
                                                value={filterDistrito}
                                                onChange={(e) => setFilterDistrito(e.target.value)}
                                                className="rounded-lg border border-line bg-slate-50 px-2 py-1.5 text-[12px] font-medium text-[#172b4d] shadow-sm outline-none transition-all hover:bg-white focus:bg-white hover:border-blue-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 min-w-[160px]"
                                            >
                                                <option value="ALL">Todos los distritos</option>
                                                {distritosUnicos.map(d => (
                                                    <option key={d} value={d}>{d}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                        </div>

                        {filteredCandidatos.length === 0 ? (
                                    <div className="flex h-[400px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#e2e8f0] bg-[#f8fafc]">
                                        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-200/50">
                                            <InboxOutlinedIcon className="text-slate-400" style={{ fontSize: 40 }} />
                                        </div>
                                        <h3 className="text-[15px] font-extrabold text-[#172b4d] mb-1">Sin Candidatos</h3>
                                        <p className="text-[13px] font-medium text-[#52637d] text-center max-w-xs">No hay candidatos registrados en esta categoría.</p>
                            </div>
                        ) : (
                            <div className="overflow-hidden rounded-xl border border-line bg-white shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-[13px]">
                                        <thead className="bg-[#f8fafc] text-xs font-bold uppercase text-[#52637d]">
                                            <tr>
                                                <th className="px-4 py-3 border-b border-line">Candidato</th>
                                                <th className="px-4 py-3 border-b border-line">DNI</th>
                                                <th className="px-4 py-3 border-b border-line">Cargo</th>
                                                <th className="px-4 py-3 border-b border-line">Partido</th>
                                                <th className="px-4 py-3 border-b border-line">Ubicación</th>
                                                <th className="px-4 py-3 border-b border-line text-right">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-line">
                                            {filteredCandidatos.map((candidato) => (
                                                <tr key={candidato.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-slate-50 overflow-hidden">
                                                                {candidato.foto_url ? (
                                                                    <img
                                                                        src={candidato.foto_url.startsWith('http') ? candidato.foto_url : `${BASE_URL}${candidato.foto_url}`}
                                                                        alt={`Foto`}
                                                                        className="h-full w-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <PersonIcon className="text-slate-300" fontSize="small" />
                                                                )}
                                                            </div>
                                                            <span className="font-bold text-[#172b4d] truncate max-w-[200px]" title={`${candidato.apellidos}, ${candidato.nombre}`}>{candidato.apellidos}, {candidato.nombre}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-[#52637d] font-medium">{candidato.dni}</td>
                                                    <td className="px-4 py-3">
                                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${candidato.cargo === CargoCandidato.REGIONAL ? 'bg-purple-50 text-purple-700' :
                                                                candidato.cargo === CargoCandidato.CONSEJERO ? 'bg-amber-50 text-amber-700' :
                                                                candidato.cargo === CargoCandidato.PROVINCIAL ? 'bg-blue-50 text-blue-700' :
                                                                    'bg-emerald-50 text-emerald-700'
                                                            }`}>
                                                            {candidato.cargo}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2">
                                                            {candidato.partido.logo_url && (
                                                                <div className="flex h-6 w-6 shrink-0 overflow-hidden rounded-full border border-line bg-white p-[1px]">
                                                                    <img
                                                                        src={candidato.partido.logo_url.startsWith('http') ? candidato.partido.logo_url : `${BASE_URL}${candidato.partido.logo_url}`}
                                                                        alt={candidato.partido.siglas}
                                                                        className="h-full w-full object-contain"
                                                                    />
                                                                </div>
                                                            )}
                                                            <span className="text-[12px] font-semibold text-[#52637d] truncate max-w-[150px]" title={candidato.partido.nombre}>{candidato.partido.nombre}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-[12px] font-medium text-[#52637d]">
                                                        {(() => {
                                                            const isMissing = 
                                                                (candidato.cargo === CargoCandidato.REGIONAL && !candidato.region) ||
                                                                ((candidato.cargo === CargoCandidato.PROVINCIAL || candidato.cargo === CargoCandidato.CONSEJERO) && (!candidato.region || !candidato.provincia)) ||
                                                                (candidato.cargo === CargoCandidato.DISTRITAL && (!candidato.region || !candidato.provincia || !candidato.distrito));
                                                                
                                                            if (isMissing) {
                                                                return (
                                                                    <span className="inline-flex items-center gap-1 rounded-md bg-orange-50 px-2 py-1 text-[11px] font-bold text-orange-600 border border-orange-200" title="Aún no tiene un lugar asignado">
                                                                        ⚠️ Sin ubicación
                                                                    </span>
                                                                );
                                                            }
                                                            
                                                            if (candidato.cargo === CargoCandidato.REGIONAL) return candidato.region;
                                                            if (candidato.cargo === CargoCandidato.PROVINCIAL || candidato.cargo === CargoCandidato.CONSEJERO) return `${candidato.provincia} (${candidato.region})`;
                                                            if (candidato.cargo === CargoCandidato.DISTRITAL) return `${candidato.distrito} (${candidato.provincia})`;
                                                        })()}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <div className="flex justify-end gap-1">
                                                            <button
                                                                onClick={() => handleEditClick(candidato)}
                                                                className="rounded bg-slate-50 p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                                                title="Editar"
                                                            >
                                                                <EditOutlinedIcon fontSize="small" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteClick(candidato)}
                                                                className="rounded bg-slate-50 p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                                                                title="Eliminar"
                                                            >
                                                                <DeleteOutlineOutlinedIcon fontSize="small" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
