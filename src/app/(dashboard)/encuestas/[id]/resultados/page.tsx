"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import axiosInstance from "@/utils/axios";
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';

interface TopCandidato {
    id: string;
    nombre: string;
    partido: string;
    logoUrl: string | null;
    fotoUrl: string | null;
    votos: number;
    porcentaje: string;
}

interface LocalResult {
    id: string;
    nombre: string;
    votosTotales: number;
    top3: TopCandidato[];
    todos: TopCandidato[];
}

const getImageUrl = (url: string | null) => {
    if (!url) return "";
    if (url.startsWith('http') || url.startsWith('//')) return url;
    let baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api').replace('/api', '');
    if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
    const prefix = url.startsWith('/') ? '' : '/';
    return `${baseUrl}${prefix}${url}`;
};

export default function ResultadosEncuestaPage() {
    const { id } = useParams() as { id: string };
    const router = useRouter();

    const [encuesta, setEncuesta] = useState<any>(null);
    const [locales, setLocales] = useState<LocalResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLocal, setSelectedLocal] = useState<LocalResult | null>(null);

    const openModal = (local: LocalResult) => setSelectedLocal(local);
    const closeModal = () => setSelectedLocal(null);

    useEffect(() => {
        fetchResultados();
    }, [id]);

    const fetchResultados = async () => {
        try {
            const { data } = await axiosInstance.get(`/encuestas/${id}/resultados`);
            setEncuesta(data.encuesta);
            // Ordenar locales por cantidad de votos de mayor a menor
            const sortedLocales = data.locales.sort((a: LocalResult, b: LocalResult) => b.votosTotales - a.votosTotales);
            setLocales(sortedLocales);
        } catch (error) {
            console.error("Error al cargar resultados", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    if (!encuesta) {
        return (
            <div className="p-8 text-center bg-white rounded-2xl max-w-lg mx-auto mt-10 shadow-sm border border-slate-100">
                <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">No se pudo cargar la encuesta</h2>
                <button onClick={() => router.push('/encuestas')} className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors">Volver a Encuestas</button>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Cabecera */}
            <div className="mb-8">
                <button 
                    onClick={() => router.push('/encuestas')}
                    className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 transition-colors font-bold text-sm mb-4"
                >
                    <ArrowBackOutlinedIcon fontSize="small" />
                    Volver a Encuestas
                </button>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-800">
                            Boca de Urna: {encuesta.nombre}
                        </h1>
                        <p className="text-slate-500 mt-1 font-medium">
                            Resultados por local de votación (Top 3 Candidatos).
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <div className="bg-white px-5 py-3 rounded-xl shadow-sm border border-slate-100 text-center min-w-[120px]">
                            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Total Votos General</p>
                            <p className="text-2xl font-black text-slate-800 leading-none mt-1">{encuesta.totalVotos}</p>
                        </div>
                    </div>
                </div>
            </div>

            {locales.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-2xl shadow-sm border border-slate-100">
                    <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                        <PlaceOutlinedIcon fontSize="large" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-700">Aún no hay datos por local</h3>
                    <p className="text-slate-500 font-medium mt-1">Los encuestadores no han registrado votos todavía.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {locales.map((local) => (
                        <div key={local.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl transition-shadow duration-300">
                            {/* Fila Principal */}
                            <div className="flex flex-col md:flex-row items-center justify-between p-4 gap-4 md:gap-6">
                                {/* Info del Local */}
                                <div className="flex flex-col md:flex-row md:items-center gap-3 w-full md:w-1/3">
                                    <div className="flex items-center gap-2">
                                        <PlaceOutlinedIcon className="text-emerald-500" fontSize="small" />
                                        <h3 className="font-bold text-slate-800 text-base md:text-lg truncate" title={local.nombre}>{local.nombre}</h3>
                                    </div>
                                    <div className="bg-emerald-50 text-emerald-600 text-xs uppercase font-black px-2 py-1 rounded border border-emerald-100 w-fit shrink-0">
                                        {local.votosTotales} votos
                                    </div>
                                </div>

                                {/* Fotos Top 3 Horizontal */}
                                <div className="flex items-center justify-center gap-4 flex-1">
                                    {local.top3.length === 0 ? (
                                        <span className="text-slate-400 text-sm font-medium">Sin votos</span>
                                    ) : (
                                        local.top3.map((c, i) => (
                                            <div key={c.id} className="flex flex-col items-center gap-1">
                                                <div className="relative">
                                                    <div className={`w-12 h-12 rounded-full border-[2.5px] overflow-hidden bg-white shadow-sm flex items-center justify-center ${i === 0 ? 'border-amber-400' : i === 1 ? 'border-slate-300' : 'border-orange-300'}`}>
                                                        {c.logoUrl ? (
                                                            <img src={getImageUrl(c.logoUrl)} className="w-full h-full object-contain p-1" />
                                                        ) : (
                                                            <span className="text-lg">🖼️</span>
                                                        )}
                                                    </div>
                                                    <div className={`absolute -bottom-1 -right-1 text-[9px] text-white font-black w-4 h-4 flex items-center justify-center rounded-full border border-white shadow-sm ${i === 0 ? 'bg-amber-400' : i === 1 ? 'bg-slate-400' : 'bg-orange-400'}`}>
                                                        {i+1}
                                                    </div>
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-600">{c.porcentaje}%</span>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Boton Detalles */}
                                <div className="w-full md:w-auto text-center md:text-right">
                                    <button 
                                        onClick={() => openModal(local)} 
                                        className="w-full md:w-auto text-emerald-600 font-bold text-sm bg-emerald-50 px-5 py-2.5 rounded-lg hover:bg-emerald-100 transition-colors border border-emerald-100"
                                    >
                                        Ver detalles
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            {/* Modal de Detalles */}
            {selectedLocal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-800 text-white">
                            <div className="flex items-center gap-2">
                                <PlaceOutlinedIcon className="text-emerald-400" fontSize="small" />
                                <h3 className="font-bold text-lg truncate pr-4">{selectedLocal.nombre}</h3>
                            </div>
                            <button onClick={closeModal} className="text-slate-400 hover:text-white transition-colors flex-shrink-0">
                                <CloseOutlinedIcon />
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <span className="font-bold text-slate-500 text-sm uppercase">Total Votos</span>
                                <span className="font-black text-emerald-600 text-lg">{selectedLocal.votosTotales}</span>
                            </div>
                            
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Detalle de Resultados Completos</h4>
                            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                                {selectedLocal.todos.length === 0 ? (
                                    <p className="text-center text-slate-400 py-4 font-medium">No hay votos registrados</p>
                                ) : (
                                    selectedLocal.todos.map((c, i) => (
                                        <div key={c.id} className="flex justify-between items-center bg-white rounded-xl p-3 border border-slate-200 shadow-sm">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <span className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-black text-white ${
                                                    i === 0 ? 'bg-amber-400' : i === 1 ? 'bg-slate-400' : i === 2 ? 'bg-orange-400' : 'bg-slate-300'
                                                }`}>
                                                    #{i+1}
                                                </span>
                                                <div className="flex flex-col overflow-hidden">
                                                    <span className="text-slate-800 font-bold text-sm truncate" title={c.partido}>{c.partido}</span>
                                                    <span className="text-slate-400 text-xs font-medium">{c.porcentaje}% de votos</span>
                                                </div>
                                            </div>
                                            <div className="bg-emerald-50 text-emerald-600 font-black text-base px-3 py-1.5 rounded-lg border border-emerald-100 ml-2 shadow-sm flex-shrink-0">
                                                {c.votos}v
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                            <button onClick={closeModal} className="px-5 py-2 bg-slate-800 text-white rounded-lg font-bold hover:bg-slate-700 transition-colors">
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
