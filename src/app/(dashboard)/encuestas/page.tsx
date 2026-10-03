"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/utils/axios";
import PollOutlinedIcon from '@mui/icons-material/PollOutlined';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';


interface Encuesta {
    id: string;
    nombre: string;
    codigoAcceso: string;
    cuotaMax: number;
    activa: boolean;
    createdAt: string;
    cargo?: string;
    region?: string;
    provincia?: string;
    distrito?: string;
}

export default function EncuestasAdminPage() {
    const router = useRouter();
    const [encuestas, setEncuestas] = useState<Encuesta[]>([]);
    const [loading, setLoading] = useState(true);
    const [ubicaciones, setUbicaciones] = useState<any[]>([]);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        nombre: "",
        codigoAcceso: "",
        cuotaMax: 50,
        cargo: "DISTRITAL",
        region: "",
        provincia: "",
        distrito: ""
    });

    useEffect(() => {
        fetchEncuestas();
        fetchUbicaciones();
    }, []);

    const fetchUbicaciones = async () => {
        try {
            const { data } = await axiosInstance.get('/mesas/ubicaciones');
            setUbicaciones(data);
        } catch (error) {
            console.error("Error al cargar ubicaciones", error);
        }
    };

    const fetchEncuestas = async () => {
        try {
            const response = await axiosInstance.get("/encuestas");
            setEncuestas(response.data);
        } catch (error) {
            console.error("Error al cargar encuestas", error);
            // Fallback temporal para la UI
            setEncuestas([
                { id: "1", nombre: "Boca de Urna Lima", codigoAcceso: "LIMA2026", cuotaMax: 500, activa: true, createdAt: new Date().toISOString() }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axiosInstance.post("/encuestas", formData);
            setIsModalOpen(false);
            fetchEncuestas();
            setFormData({ nombre: "", codigoAcceso: "", cuotaMax: 50, cargo: "DISTRITAL", region: "", provincia: "", distrito: "" });
        } catch (error) {
            console.error("Error al crear", error);
            alert("Error al crear la encuesta. Es posible que el código ya exista.");
        }
    };

    const handleDelete = async (id: string, nombre: string) => {
        if (!window.confirm(`¿Estás seguro de que deseas eliminar la encuesta "${nombre}"? Esta acción no se puede deshacer y borrará todos los votos asociados.`)) {
            return;
        }

        try {
            await axiosInstance.delete(`/encuestas/${id}`);
            fetchEncuestas();
        } catch (error) {
            console.error("Error al eliminar", error);
            alert("Hubo un error al intentar eliminar la encuesta.");
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <PollOutlinedIcon className="text-emerald-600" />
                        Gestión de Encuestas
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Crea encuestas tipo boca de urna y genera sus códigos de acceso.
                    </p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20"
                >
                    <AddOutlinedIcon fontSize="small" />
                    Nueva Encuesta
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase text-xs">
                        <tr>
                            <th className="px-6 py-4">Nombre</th>
                            <th className="px-6 py-4">Código Maestro</th>
                            <th className="px-6 py-4">Cargo / Ubicación</th>
                            <th className="px-6 py-4">Límite por Local</th>
                            <th className="px-6 py-4">Estado</th>
                            <th className="px-6 py-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={5} className="text-center py-8">Cargando...</td></tr>
                        ) : encuestas.length === 0 ? (
                            <tr><td colSpan={5} className="text-center py-8 text-slate-400">No hay encuestas creadas.</td></tr>
                        ) : (
                            encuestas.map((encuesta) => (
                                <tr key={encuesta.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-slate-800">{encuesta.nombre}</td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-3 py-1 rounded-lg bg-slate-100 text-slate-700 font-mono font-bold text-xs tracking-widest border border-slate-200">
                                            {encuesta.codigoAcceso}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-700 text-xs uppercase">{encuesta.cargo || 'NO DEFINIDO'}</span>
                                            <span className="text-[11px] text-slate-500 font-medium">
                                                {[encuesta.distrito, encuesta.provincia, encuesta.region].filter(Boolean).join(', ') || 'General'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-semibold text-slate-600">{encuesta.cuotaMax} votos</td>
                                    <td className="px-6 py-4">
                                        {encuesta.activa ? (
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700">ACTIVA</span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-100 text-red-700">CERRADA</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            <button 
                                                onClick={() => router.push(`/encuestas/${encuesta.id}/resultados`)}
                                                className="text-emerald-600 font-semibold hover:text-emerald-800 transition-colors text-sm"
                                            >
                                                Ver Resultados
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(encuesta.id, encuesta.nombre)}
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-all"
                                                title="Eliminar Encuesta"
                                            >
                                                <DeleteOutlinedIcon fontSize="small" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal de Creación */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden">
                        <div className="p-6 border-b border-slate-100 max-h-[90vh] overflow-y-auto">
                            <h2 className="text-xl font-bold text-slate-800">Crear Nueva Encuesta</h2>
                            <p className="text-sm text-slate-500">Configura los detalles, código y el alcance geográfico de los candidatos.</p>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 max-h-[calc(90vh-80px)] overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Columna 1: Datos Principales */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 mb-4">
                                        Datos Principales
                                    </h3>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Nombre Descriptivo</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.nombre}
                                            onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                                            placeholder="Ej: Boca de Urna Surco"
                                            className="w-full h-11 px-3 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-sm font-medium"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Código de Acceso Maestro</label>
                                        <input
                                            type="text"
                                            required
                                            maxLength={10}
                                            value={formData.codigoAcceso}
                                            onChange={(e) => setFormData({...formData, codigoAcceso: e.target.value.toUpperCase()})}
                                            placeholder="Ej: SURCO26"
                                            className="w-full h-11 px-3 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-sm font-bold uppercase tracking-widest text-emerald-700"
                                        />
                                        <p className="text-[11px] text-slate-500 mt-1">Este código lo usarán los encuestadores.</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Límite de encuestas por local</label>
                                        <input
                                            type="number"
                                            min="1"
                                            required
                                            value={formData.cuotaMax}
                                            onChange={(e) => setFormData({...formData, cuotaMax: parseInt(e.target.value)})}
                                            className="w-full h-11 px-3 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-sm font-semibold"
                                        />
                                    </div>
                                </div>

                                {/* Columna 2: Alcance Geográfico */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 mb-4">
                                        Filtro de Candidatos
                                    </h3>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Cargo</label>
                                        <select
                                            value={formData.cargo}
                                            onChange={(e) => setFormData({...formData, cargo: e.target.value})}
                                            className="w-full h-11 px-3 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 text-sm font-medium bg-white"
                                        >
                                            <option value="REGIONAL">Gobernador Regional</option>
                                            <option value="CONSEJERO">Consejero</option>
                                            <option value="PROVINCIAL">Alcalde Provincial</option>
                                            <option value="DISTRITAL">Alcalde Distrital</option>
                                        </select>
                                    </div>
                                    
                                    {(formData.cargo === 'REGIONAL' || formData.cargo === 'CONSEJERO' || formData.cargo === 'PROVINCIAL' || formData.cargo === 'DISTRITAL') && (
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1">Región</label>
                                            <select
                                                value={formData.region}
                                                onChange={(e) => setFormData({...formData, region: e.target.value, provincia: "", distrito: ""})}
                                                className="w-full h-11 px-3 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 text-sm bg-white"
                                            >
                                                <option value="" disabled>-- Seleccione Región --</option>
                                                {Array.from(new Set(ubicaciones.map(u => u.region))).sort().map(region => (
                                                    <option key={region} value={region}>{region}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {(formData.cargo === 'PROVINCIAL' || formData.cargo === 'DISTRITAL') && (
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1">Provincia</label>
                                            <select
                                                value={formData.provincia}
                                                onChange={(e) => setFormData({...formData, provincia: e.target.value, distrito: ""})}
                                                disabled={!formData.region}
                                                className="w-full h-11 px-3 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 text-sm bg-white disabled:bg-slate-50"
                                            >
                                                <option value="" disabled>-- Seleccione Provincia --</option>
                                                {Array.from(new Set(ubicaciones.filter(u => u.region === formData.region).map(u => u.provincia))).sort().map(prov => (
                                                    <option key={prov} value={prov}>{prov}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {formData.cargo === 'DISTRITAL' && (
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1">Distrito</label>
                                            <select
                                                value={formData.distrito}
                                                onChange={(e) => setFormData({...formData, distrito: e.target.value})}
                                                disabled={!formData.provincia}
                                                className="w-full h-11 px-3 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 text-sm bg-white disabled:bg-slate-50"
                                            >
                                                <option value="" disabled>-- Seleccione Distrito --</option>
                                                {Array.from(new Set(ubicaciones.filter(u => u.region === formData.region && u.provincia === formData.provincia).map(u => u.distrito))).sort().map(dist => (
                                                    <option key={dist} value={dist}>{dist}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="pt-6 mt-8 border-t border-slate-100 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-6 h-11 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-8 h-11 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-600/20"
                                >
                                    Guardar Encuesta
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
