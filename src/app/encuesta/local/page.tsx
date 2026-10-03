"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axiosInstance from "@/utils/axios";
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';

interface Local {
    id: string;
    nombre: string;
}

export default function SelectLocalPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const codigo = searchParams.get("codigo");

    const [locales, setLocales] = useState<Local[]>([]);
    const [selectedLocal, setSelectedLocal] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (codigo) {
            fetchLocales();
        }
    }, [codigo]);

    const fetchLocales = async () => {
        try {
            const { data } = await axiosInstance.get('/encuestas/locales');
            setLocales(data);
        } catch (error) {
            console.error("Error al cargar locales", error);
            // Fallback si falla
            setLocales([{ id: "1", nombre: "Error cargando locales" }]);
        } finally {
            setLoading(false);
        }
    };

    const handleContinue = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedLocal) return;

        const localObj = locales.find(l => l.id === selectedLocal);
        const localName = localObj ? localObj.nombre : "Local de Votación";

        setSubmitting(true);
        // Pequeño delay visual
        setTimeout(() => {
            router.push(`/encuesta/votar?codigo=${codigo}&local=${selectedLocal}&localName=${encodeURIComponent(localName)}`);
        }, 500);
    };

    return (
        <main className="min-h-screen w-full flex items-center justify-center bg-slate-50 font-sans p-4 relative overflow-hidden">
            
            {/* Decoración de fondo */}
            <div className="absolute top-[-20%] right-[-10%] w-[70%] h-[70%] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] left-[-20%] w-[60%] h-[60%] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl shadow-slate-200/50 overflow-hidden p-8 sm:p-10 border border-slate-100 relative z-10">
                <div className="text-center mb-8">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-blue-50 mb-6 border border-blue-100">
                        <LocationOnOutlinedIcon className="text-blue-600" style={{ fontSize: 36 }} />
                    </div>
                    <h1 className="text-[26px] font-extrabold text-slate-800 mb-3 tracking-tight">Ubicación</h1>
                    <p className="text-slate-500 text-[14px] leading-relaxed">
                        Selecciona el local de votación donde te encuentras realizando la encuesta.
                    </p>
                </div>

                <form onSubmit={handleContinue} className="space-y-6">
                    {!codigo ? (
                        <div className="text-center p-4 bg-red-50 text-red-600 rounded-xl font-bold">
                            Falta el código de acceso. Por favor, regresa y vuelve a ingresarlo.
                        </div>
                    ) : (
                        <>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Local de Votación</label>
                                {loading ? (
                                    <div className="w-full h-14 bg-slate-100 animate-pulse rounded-xl"></div>
                                ) : (
                                    <select
                                        required
                                        value={selectedLocal}
                                        onChange={(e) => setSelectedLocal(e.target.value)}
                                        className="w-full h-14 bg-slate-50 border-2 border-slate-200 rounded-xl px-4 text-slate-700 font-semibold outline-none transition-all focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                    >
                                        <option value="" disabled>-- Selecciona un local --</option>
                                        {locales.map(local => (
                                            <option key={local.id} value={local.id}>
                                                {local.nombre}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={submitting || !selectedLocal}
                                className="w-full h-[56px] rounded-2xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center disabled:opacity-50 disabled:scale-100 hover:scale-[1.02] active:scale-[0.98]"
                            >
                                {submitting ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Preparando encuesta...
                                    </span>
                                ) : "Continuar"}
                            </button>
                        </>
                    )}
                    
                    <button
                        type="button"
                        onClick={() => router.push('/encuesta')}
                        className="w-full h-12 rounded-xl font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors text-[14px]"
                    >
                        Cambiar código
                    </button>
                </form>
            </div>
        </main>
    );
}
