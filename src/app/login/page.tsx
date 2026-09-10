"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";
import Cookies from "js-cookie";
import { useAuthStore } from "@/store/auth.store";
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';

export default function LoginPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [remember, setRemember] = useState(false);

    // Login state
    const [dni, setDni] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const router = useRouter();
    const setUser = useAuthStore((state) => state.setUser);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!dni || !password) {
            setError("Por favor ingrese su DNI y contraseña.");
            return;
        }

        setLoading(true);
        try {
            const { token, user } = await authService.login({
                dni, // Enviamos el DNI directamente ya que el backend espera 'dni'
                password
            });

            if (token) {
                Cookies.set("token", token, { expires: 1, path: "/" }); // expires in 1 day
                setUser(user);
                router.push("/");
            }
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || "Error al iniciar sesión. Verifique sus credenciales.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen w-full flex bg-white font-sans">
            
            {/* Panel Izquierdo - Visual / Decorativo */}
            <section className="relative hidden lg:flex flex-col justify-between w-[55%] bg-[#061b40] overflow-hidden p-12">
                {/* Fondo dinámico */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#061b40] via-[#092a5e] to-[#041126] z-10"></div>
                    <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-emerald-600/30 rounded-full blur-[120px] mix-blend-screen animate-pulse duration-[8000ms]"></div>
                    <div className="absolute bottom-[-10%] right-[-20%] w-[60%] h-[60%] bg-blue-500/20 rounded-full blur-[100px] mix-blend-screen"></div>
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 mix-blend-overlay"></div>
                </div>

                <div className="relative z-20 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 shadow-lg shadow-emerald-500/30">
                        <SecurityOutlinedIcon className="text-white" style={{ fontSize: 22 }} />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-white">
                        Voto<span className="text-emerald-400">Secure</span>
                    </span>
                </div>

                <div className="relative z-20 max-w-lg my-auto">
                    <h1 className="text-[42px] leading-[1.1] font-extrabold text-white tracking-tight mb-6">
                        Gestión electoral <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">
                            transparente y eficiente.
                        </span>
                    </h1>
                    <p className="text-[15px] leading-relaxed text-blue-100/80 mb-8">
                        Plataforma oficial para la administración de mesas de votación, personeros y resultados en tiempo real con los más altos estándares de seguridad.
                    </p>
                    
                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm border border-white/10">
                                <BarChartOutlinedIcon className="text-emerald-400" fontSize="small" />
                            </div>
                            <span className="text-sm font-semibold text-white">Precisión</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm border border-white/10">
                                <PeopleOutlinedIcon className="text-emerald-400" fontSize="small" />
                            </div>
                            <span className="text-sm font-semibold text-white">Escalabilidad</span>
                        </div>
                    </div>
                </div>

                <div className="relative z-20 text-xs font-medium text-blue-200/50">
                    © 2026 Sistema Electoral Municipal. Todos los derechos reservados.
                </div>
            </section>

            {/* Panel Derecho - Formulario de Login */}
            <section className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-12 lg:px-20 xl:px-24 bg-white relative">
                
                {/* Decoración sutil en modo claro */}
                <div className="absolute right-0 top-0 h-64 w-64 bg-slate-50 rounded-bl-[100%] pointer-events-none opacity-50"></div>
                
                <div className="w-full max-w-[400px] mx-auto relative z-10">
                    <div className="mb-10 lg:hidden flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0b9349] shadow-md shadow-green-500/20">
                            <SecurityOutlinedIcon className="text-white" style={{ fontSize: 18 }} />
                        </div>
                        <span className="text-lg font-bold tracking-tight text-[#172b4d]">
                            Voto<span className="text-[#0b9349]">Secure</span>
                        </span>
                    </div>

                    <div className="mb-10">
                        <h2 className="text-3xl font-extrabold tracking-tight text-[#172b4d] mb-2">
                            Bienvenido de nuevo
                        </h2>
                        <p className="text-[14px] text-slate-500">
                            Ingresa tus credenciales para acceder a tu panel de administración.
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        {error && (
                            <div className="rounded-xl bg-red-50 border border-red-100 p-4 flex gap-3 items-start">
                                <div className="text-red-500 mt-0.5">⚠️</div>
                                <div className="text-[13px] font-medium text-red-700 leading-tight">
                                    {error}
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-[12px] font-bold text-[#172b4d] mb-2">
                                Documento de Identidad
                            </label>
                            <input
                                type="text"
                                maxLength={8}
                                value={dni}
                                onChange={(e) => setDni(e.target.value)}
                                placeholder="Ej: 12345678"
                                className="w-full h-[50px] bg-slate-50 border border-slate-200 rounded-xl px-4 text-[14px] text-[#172b4d] font-medium placeholder-slate-400 outline-none transition-all focus:bg-white focus:border-[#0b9349] focus:ring-4 focus:ring-[#0b9349]/10 shadow-sm"
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-[12px] font-bold text-[#172b4d]">
                                    Contraseña
                                </label>
                                <a href="#" className="text-[12px] font-bold text-[#0b9349] hover:text-[#087d3e] transition-colors">
                                    ¿Olvidaste tu contraseña?
                                </a>
                            </div>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full h-[50px] bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-12 text-[14px] text-[#172b4d] font-medium placeholder-slate-400 outline-none transition-all focus:bg-white focus:border-[#0b9349] focus:ring-4 focus:ring-[#0b9349]/10 shadow-sm tracking-widest"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-[#172b4d] transition-colors"
                                >
                                    {showPassword ? <VisibilityOffOutlinedIcon style={{ fontSize: 20 }} /> : <VisibilityOutlinedIcon style={{ fontSize: 20 }} />}
                                </button>
                            </div>
                        </div>

                        <label className="flex items-center gap-3 cursor-pointer group w-max pt-1">
                            <div className="relative flex items-center justify-center">
                                <input type="checkbox" className="sr-only" checked={remember} onChange={() => setRemember(!remember)} />
                                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${remember ? 'bg-[#0b9349] border-[#0b9349]' : 'bg-white border-slate-300 group-hover:border-[#0b9349]'}`}>
                                    {remember && <span className="text-white text-[12px] font-extrabold leading-none">✓</span>}
                                </div>
                            </div>
                            <span className="text-[13px] font-medium text-slate-600 select-none">Mantener sesión iniciada</span>
                        </label>

                        <button
                            type="submit"
                            disabled={loading}
                            className="relative w-full h-[54px] mt-8 rounded-xl font-bold text-white overflow-hidden group disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-[#0b9349]/20"
                        >
                            <div className="absolute inset-0 bg-[#0b9349] transition-transform duration-300"></div>
                            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <span className="relative flex items-center justify-center gap-2 text-[14px]">
                                {loading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Iniciando sesión...
                                    </>
                                ) : (
                                    "Acceder al panel"
                                )}
                            </span>
                        </button>
                    </form>
                </div>
            </section>
        </main>
    );
}