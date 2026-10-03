"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/utils/axios";
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';

export default function EncuestaCodePage() {
    const [codigo, setCodigo] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!codigo.trim()) {
            setError("Por favor ingresa un código.");
            return;
        }

        setLoading(true);
        try {
            // Llamada real al backend para validar el código maestro
            const { data } = await axiosInstance.get(`/encuestas/validar/${codigo}`);
            
            if (data.valido) {
                // Pasamos a la pantalla de selección de local
                router.push(`/encuesta/local?codigo=${codigo}`);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || "Código inválido o encuesta cerrada.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen w-full flex items-center justify-center bg-slate-50 font-sans p-4 relative overflow-hidden">
            
            {/* Decoración de fondo */}
            <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-emerald-600/5 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-20%] w-[60%] h-[60%] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl shadow-slate-200/50 overflow-hidden p-8 sm:p-10 border border-slate-100 relative z-10">
                <div className="text-center mb-8">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-emerald-50 mb-6 border border-emerald-100">
                        <SecurityOutlinedIcon className="text-emerald-600" style={{ fontSize: 36 }} />
                    </div>
                    <h1 className="text-[28px] font-extrabold text-slate-800 mb-3 tracking-tight">Modo Encuesta</h1>
                    <p className="text-slate-500 text-[15px] leading-relaxed">
                        Ingresa el código proporcionado por tu coordinador para iniciar el trabajo de campo.
                    </p>
                </div>

                <form onSubmit={handleVerify} className="space-y-6">
                    {error && (
                        <div className="bg-red-50 text-red-600 text-[14px] p-4 rounded-xl border border-red-100 text-center font-semibold">
                            ⚠️ {error}
                        </div>
                    )}
                    
                    <div>
                        <input
                            type="text"
                            maxLength={10}
                            value={codigo}
                            onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                            placeholder="EJ: LIMA-2026"
                            className="w-full h-[60px] bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 text-center text-2xl text-slate-800 font-extrabold placeholder-slate-300 outline-none transition-all focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 uppercase tracking-widest shadow-sm"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-[56px] rounded-2xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center disabled:opacity-70 disabled:scale-100 hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Verificando código...
                            </span>
                        ) : "Comenzar Encuesta"}
                    </button>
                    
                    <button
                        type="button"
                        onClick={() => router.push('/login')}
                        className="w-full h-12 rounded-xl font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors text-[14px]"
                    >
                        Volver al inicio de sesión
                    </button>
                </form>
            </div>
        </main>
    );
}
