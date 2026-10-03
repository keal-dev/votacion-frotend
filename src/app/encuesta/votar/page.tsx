"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axiosInstance from "@/utils/axios";
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';

interface Candidato {
    id: string;
    nombre: string;
    apellidos: string;
    fotoUrl?: string | null;
    foto_url?: string | null;
    partido: {
        nombre: string;
        logoUrl?: string | null;
        logo_url?: string | null;
    } | null;
}

const getImageUrl = (url: string | null) => {
    if (!url) return "";
    if (url.startsWith('http')) return url;
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api').replace('/api', '');
    return `${baseUrl}${url}`;
};

function VotarEncuestaContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const codigo = searchParams.get("codigo");
    const localId = searchParams.get("local");
    const localName = searchParams.get("localName");

    const [candidatos, setCandidatos] = useState<Candidato[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");
    const [encuestaCount, setEncuestaCount] = useState(1);
    const [progreso, setProgreso] = useState({ actuales: 0, cuotaMax: 0 });

    useEffect(() => {
        if (codigo && localId) {
            const savedCount = sessionStorage.getItem(`encuestaCount_${codigo}_${localId}`);
            if (savedCount) {
                setEncuestaCount(parseInt(savedCount, 10));
            }
            fetchCandidatos();
            fetchProgreso();
        } else {
            setLoading(false);
        }
    }, [codigo, localId]);

    const fetchProgreso = async () => {
        try {
            const { data } = await axiosInstance.get(`/encuestas/${codigo}/progreso/${localId}`);
            setProgreso(data);
        } catch (error) {
            console.error("Error al cargar progreso", error);
        }
    };

    const fetchCandidatos = async () => {
        try {
            // Reutilizamos el endpoint público si lo hay, o el de admin
            const { data } = await axiosInstance.get(`/encuestas/${codigo}/candidatos`);
            setCandidatos(data);
        } catch (error) {
            console.error("Error al cargar candidatos", error);
            // Fallback UI
            setCandidatos([
                { id: "1", nombre: "Juan", apellidos: "Pérez", fotoUrl: null, partido: null },
                { id: "2", nombre: "María", apellidos: "Gómez", fotoUrl: null, partido: null }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleVote = async (candidatoId: string | null = null) => {
        if (submitting) return;
        setSubmitting(true);
        try {
            await axiosInstance.post('/encuestas/votar', {
                codigoAcceso: codigo,
                localId: localId,
                candidatoId: candidatoId
            });

            // Mostrar mensaje de éxito temporalmente
            setSuccessMsg(`¡Encuesta #${encuestaCount} registrada con éxito!`);
            setProgreso(p => ({ ...p, actuales: p.actuales + 1 }));
            setTimeout(() => {
                setSuccessMsg("");
                const nextCount = encuestaCount + 1;
                setEncuestaCount(nextCount);
                if (codigo && localId) {
                    sessionStorage.setItem(`encuestaCount_${codigo}_${localId}`, nextCount.toString());
                }
            }, 2000);

            // No redirigimos. Se queda en esta pantalla para seguir encuestando (Modo Kiosco)
        } catch (error: any) {
            alert(error.response?.data?.message || "Error al registrar el voto. ¿Quizás se llenó la cuota del local?");
            if (error.response?.data?.message?.includes("cuota")) {
                router.push('/encuesta'); // Expulsar si la cuota se llenó
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <main className="min-h-screen w-full bg-slate-50 font-sans p-4 sm:p-6 relative">
            {/* Header de la Encuesta */}
            <header className="sticky top-2 sm:top-4 z-50 max-w-4xl mx-auto mb-8 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-md border border-slate-200">
                <div className="text-center sm:text-left">
                    <h1 className="text-xl font-bold text-slate-800">
                        Elecciones 2026 <span className="text-emerald-600">- Encuesta #{encuestaCount}</span>
                        {localName && <span className="block text-sm font-semibold text-slate-500 mt-1">{localName}</span>}
                    </h1>
                </div>

                {/* Barra de progreso */}
                {progreso.cuotaMax > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                        <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
                            <span>Progreso de cuota del Local</span>
                            <span>{progreso.actuales} / {progreso.cuotaMax} encuestas</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                            <div 
                                className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500 ease-out" 
                                style={{ width: `${Math.min(100, (progreso.actuales / progreso.cuotaMax) * 100)}%` }}
                            ></div>
                        </div>
                    </div>
                )}
            </header>

            {/* Grid de Candidatos */}
            <div className="max-w-4xl mx-auto">
                {(!codigo || !localId) ? (
                    <div className="text-center p-6 bg-red-50 text-red-600 rounded-2xl font-bold mt-10">
                        Error: Faltan datos de sesión (Código o Local). 
                        Por favor, finalice la encuesta y vuelva a ingresar.
                    </div>
                ) : successMsg ? (
                    <div className="flex flex-col items-center justify-center py-20 animate-in fade-in zoom-in duration-300">
                        <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
                            <svg className="w-12 h-12 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                        </div>
                        <h2 className="text-3xl font-extrabold text-emerald-600 mb-2">{successMsg}</h2>
                        <p className="text-slate-500 font-medium text-lg animate-pulse">Preparando la siguiente encuesta...</p>
                    </div>
                ) : (
                    <>
                        <h2 className="text-center text-2xl font-extrabold text-slate-800 mb-8">¿Por quién votaría usted?</h2>
                        
                        <div className="border-[3px] border-black bg-white rounded-md overflow-hidden flex flex-col shadow-sm max-w-2xl mx-auto">
                            {candidatos.map((candidato) => (
                                <button
                                    key={candidato.id}
                                    disabled={submitting}
                                    onClick={() => handleVote(candidato.id)}
                                    className="w-full text-left flex border-b-[2px] border-black items-stretch bg-[#fffdf0] hover:bg-[#fff9d6] active:bg-[#f2ecbd] transition-colors disabled:opacity-50 cursor-pointer"
                                >
                                    <div className="flex-1 p-3 sm:p-4 flex flex-col justify-center border-r-[2px] border-black">
                                        <span className="text-black font-black uppercase text-[15px] sm:text-[18px] leading-tight">
                                            {candidato.partido?.nombre || "INDEPENDIENTE"}
                                        </span>
                                        <span className="text-black/70 text-[12px] sm:text-[14px] uppercase font-bold mt-1">
                                            {candidato.nombre} {candidato.apellidos}
                                        </span>
                                    </div>

                                    <div className="flex w-[140px] sm:w-[180px] bg-white">
                                        {/* Foto Candidato */}
                                        <div className="flex-1 p-1 sm:p-2 flex items-center justify-center border-r-[2px] border-black/10">
                                            {(candidato.fotoUrl || candidato.foto_url) ? (
                                                <img src={getImageUrl(candidato.fotoUrl || candidato.foto_url || null)} alt="candidato" className="w-full h-full object-cover rounded max-h-[60px]" />
                                            ) : (
                                                <PersonOutlineOutlinedIcon className="text-slate-300" style={{ fontSize: 36 }} />
                                            )}
                                        </div>
                                        {/* Logo Partido */}
                                        <div className="flex-1 p-1 sm:p-2 flex items-center justify-center">
                                            {(candidato.partido?.logoUrl || candidato.partido?.logo_url) ? (
                                                <img src={getImageUrl(candidato.partido.logoUrl || candidato.partido.logo_url || null)} alt="logo" className="w-full h-full object-contain max-h-[60px]" />
                                            ) : (
                                                <span className="text-[#98a2b3] text-2xl">🖼️</span>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))}

                            {/* Botón de Voto Blanco/Nulo */}
                            <button
                                disabled={submitting}
                                onClick={() => handleVote(null)}
                                className="w-full text-left flex items-stretch bg-gray-50 hover:bg-gray-100 active:bg-gray-200 transition-colors disabled:opacity-50 cursor-pointer"
                            >
                                <div className="flex-1 p-3 sm:p-4 flex flex-col justify-center border-r-[2px] border-black">
                                    <span className="text-black font-black uppercase text-[15px] sm:text-[18px] leading-tight">
                                        VOTO BLANCO / NULO
                                    </span>
                                </div>
                                <div className="w-[140px] sm:w-[180px] bg-white p-2 flex items-center justify-center">
                                    <div className="w-12 h-12 border-2 border-dashed border-gray-400 rounded-full flex items-center justify-center text-gray-400">
                                        <span className="text-xl font-bold">O</span>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </>
                )}
            </div>
        </main>
    );
}

export default function VotarEncuestaPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full"></div></div>}>
            <VotarEncuestaContent />
        </Suspense>
    );
}
