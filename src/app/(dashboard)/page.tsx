"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuthStore } from "@/store/auth.store";
import axiosInstance from "@/utils/axios";
import Link from "next/link";
import GroupIcon from '@mui/icons-material/Group';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MapIcon from '@mui/icons-material/Map';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, PieChart, Pie, Cell } from 'recharts';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorIcon from '@mui/icons-material/Error';
import TimelineIcon from '@mui/icons-material/Timeline';
import KeyOutlinedIcon from '@mui/icons-material/KeyOutlined';
import CloseIcon from '@mui/icons-material/Close';
import ChangePasswordModal from "@/components/modals/ChangePasswordModal";

export default function DashboardInicio() {
  const { user, setUser } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [hidePasswordWarning, setHidePasswordWarning] = useState(false);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [selectedProgresoDistrito, setSelectedProgresoDistrito] = useState("");
  const [selectedProgresoCentroMesa, setSelectedProgresoCentroMesa] = useState("");

  const distritosProgreso = useMemo(() => {
    if (!metrics?.progresoPersoneros) return [];
    return Array.from(new Set(metrics.progresoPersoneros.map((p: any) => p.local_distrito))).filter(Boolean).sort();
  }, [metrics]);

  const centrosPobladosMesasProgreso = useMemo(() => {
    if (!metrics?.progresoPersoneros) return [];
    let list = metrics.progresoPersoneros;
    if (selectedProgresoDistrito) {
      list = list.filter((p: any) => p.local_distrito === selectedProgresoDistrito);
    }
    const combined = list.map((p: any) => {
      const cp = p.local_centro_poblado || "Sin CP";
      const mesas = p.mesas_numeros ? `Mesa(s): ${p.mesas_numeros}` : "";
      return `${cp} - ${mesas}`;
    });
    return Array.from(new Set<string>(combined)).filter((s) => s !== "Sin CP - ").sort();
  }, [metrics, selectedProgresoDistrito]);

  const filteredProgreso = useMemo(() => {
    if (!metrics?.progresoPersoneros) return [];
    return metrics.progresoPersoneros.filter((p: any) => {
      if (selectedProgresoDistrito && p.local_distrito !== selectedProgresoDistrito) return false;
      if (selectedProgresoCentroMesa) {
        const cp = p.local_centro_poblado || "Sin CP";
        const mesas = p.mesas_numeros ? `Mesa(s): ${p.mesas_numeros}` : "";
        const combined = `${cp} - ${mesas}`;
        if (combined !== selectedProgresoCentroMesa) return false;
      }
      return true;
    });
  }, [metrics, selectedProgresoDistrito, selectedProgresoCentroMesa]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [personeroStatus, setPersoneroStatus] = useState<any>(null);

  useEffect(() => {
    if (user?.role === 'ADMIN' || user?.role === 'COORDINADOR') {
      const fetchMetrics = async () => {
        try {
          const { data } = await axiosInstance.get('/system/dashboard');
          setMetrics(data);
        } catch (error) {
          console.error("Error fetching metrics", error);
        } finally {
          setLoading(false);
        }
      };
      fetchMetrics();
    } else if (user?.role === 'PERSONERO') {
      const fetchPersoneroData = async () => {
        try {
          const [asistenciaRes, mesasRes] = await Promise.all([
            axiosInstance.get('/asistencias/me/today').catch(() => ({ data: null })),
            axiosInstance.get('/mesas/me').catch(() => ({ data: [] }))
          ]);
          setPersoneroStatus({
            asistencia: asistenciaRes.data,
            mesas: mesasRes.data
          });
        } catch (error) {
          console.error("Error fetching personero status", error);
        } finally {
          setLoading(false);
        }
      };
      fetchPersoneroData();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (!mounted || loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // VISTA PARA PERSONEROS
  if (user?.role === 'PERSONERO') {
    const isCheckedIn = !!personeroStatus?.asistencia;
    const isCheckedOut = !!personeroStatus?.asistencia?.fecha_salida;
    const mesas = personeroStatus?.mesas || [];
    const currentTime = personeroStatus?.asistencia ? new Date(personeroStatus.asistencia.fecha_llegada).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
    const checkoutTime = personeroStatus?.asistencia?.fecha_salida ? new Date(personeroStatus.asistencia.fecha_salida).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

    return (
      <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-left-8 duration-300">
        {user.isDefaultPassword && !hidePasswordWarning && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mx-auto mb-6 flex flex-col sm:flex-row items-center justify-between text-left shadow-sm relative group pr-10">
            <button 
              onClick={() => setHidePasswordWarning(true)}
              className="absolute top-1/2 -translate-y-1/2 right-2 text-orange-400 hover:text-orange-700 p-1 opacity-60 hover:opacity-100 transition-all"
              title="Cerrar advertencia"
            >
              <CloseIcon sx={{ fontSize: 18 }} />
            </button>
            <div className="flex items-center gap-3 mb-3 sm:mb-0">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                <KeyOutlinedIcon className="text-orange-600" />
              </div>
              <div>
                <h3 className="text-orange-800 font-bold text-sm m-0 leading-tight">Alerta de Seguridad</h3>
                <p className="text-orange-700 text-xs m-0 mt-0.5">
                  Tu contraseña sigue siendo tu DNI. Cámbiala ahora para proteger tu cuenta.
                </p>
              </div>
            </div>
            <button 
              onClick={() => setIsPasswordModalOpen(true)}
              className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold py-2 px-4 rounded whitespace-nowrap sm:ml-4 transition-colors w-full sm:w-auto"
            >
              Cambiar Contraseña
            </button>
          </div>
        )}

        <div className="bg-white border border-[#d0d7de] rounded-2xl shadow-sm p-8 text-center mb-8">
          <div className="w-16 h-16 bg-[#e3fcee] text-[#0b9349] rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircleIcon sx={{ fontSize: 32 }} />
          </div>
          <h1 className="text-[24px] md:text-[28px] font-extrabold text-[#172b4d] tracking-tight mb-2">
            ¡Hola, {user.name}!
          </h1>
          <p className="text-[#52637d] text-sm max-w-md mx-auto mb-4">
            Bienvenido al Centro de Operaciones. Revisa el estado de tu jornada o ve a la sección de mesas para empezar a trabajar.
          </p>

          <Link href="/personero" className="inline-block px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors">
            Ir a Mis Mesas
          </Link>
        </div>





        {/* Timeline Visual Informativo */}
        <div className="bg-white border border-[#d0d7de] rounded-2xl p-8 mb-8 shadow-sm">
          <h2 className="text-lg font-bold text-[#172b4d] mb-8 text-center">Fases del Personero</h2>
          <div className="max-w-md mx-auto pl-4">
            
            {/* Fase 1: Asistencia Llegada */}
            <div className="flex">
              <div className="flex flex-col items-center mr-5">
                {isCheckedIn ? (
                  <div className="w-6 h-6 rounded-full bg-[#15803d] flex items-center justify-center text-white z-10">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full border-2 border-[#15803d] bg-[#dcfce7] flex items-center justify-center z-10">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#15803d]"></div>
                  </div>
                )}
                <div className={`w-0.5 flex-1 -mt-2 -mb-2 z-0 ${isCheckedIn ? 'bg-[#15803d]' : 'bg-[#e2e8f0]'}`}></div>
              </div>
              <div className="pb-8 pt-0.5 flex-1 text-left">
                <h3 className={`text-[15px] ${isCheckedIn ? 'font-semibold text-[#334155]' : 'font-bold text-[#0f172a]'}`}>Asistencia Llegada</h3>
                <p className="text-[13px] text-[#64748b] mt-1">Registro inicial {isCheckedIn ? `(${currentTime})` : ''}</p>
                {!isCheckedIn && (
                  <span className="inline-block mt-2 px-2.5 py-1 bg-[#fef08a] text-[#854d0e] text-[11px] font-bold rounded-md">
                    En progreso
                  </span>
                )}
              </div>
            </div>

            {/* Fase 2: Envío de Actas */}
            <div className="flex">
              <div className="flex flex-col items-center mr-5">
                {(isCheckedIn && mesas.length > 0 && mesas.every((m: any) => (m.actas ?? []).length > 0)) ? (
                  <div className="w-6 h-6 rounded-full bg-[#15803d] flex items-center justify-center text-white z-10">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                ) : isCheckedIn ? (
                  <div className="w-6 h-6 rounded-full border-2 border-[#15803d] bg-[#dcfce7] flex items-center justify-center z-10">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#15803d]"></div>
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full border-2 border-[#cbd5e1] bg-[#e2e8f0] z-10"></div>
                )}
                <div className={`w-0.5 flex-1 -mt-2 -mb-2 z-0 ${(isCheckedIn && mesas.length > 0 && mesas.every((m: any) => (m.actas ?? []).length > 0)) ? 'bg-[#15803d]' : 'bg-[#e2e8f0]'}`}></div>
              </div>
              <div className="pb-8 pt-0.5 flex-1 text-left">
                <h3 className={`text-[15px] ${(isCheckedIn && mesas.length > 0 && mesas.every((m: any) => (m.actas ?? []).length > 0)) ? 'font-semibold text-[#334155]' : isCheckedIn ? 'font-bold text-[#0f172a]' : 'font-semibold text-[#94a3b8]'}`}>Envío de Actas</h3>
                <p className="text-[13px] text-[#64748b] mt-1">Durante escrutinio</p>
                {isCheckedIn && (mesas.length === 0 || !mesas.every((m: any) => (m.actas ?? []).length > 0)) && (
                  <span className="inline-block mt-2 px-2.5 py-1 bg-[#fef08a] text-[#854d0e] text-[11px] font-bold rounded-md">
                    En progreso
                  </span>
                )}
              </div>
            </div>

            {/* Fase 3: Salida Asistencia */}
            <div className="flex">
              <div className="flex flex-col items-center mr-5">
                {isCheckedOut ? (
                  <div className="w-6 h-6 rounded-full bg-[#15803d] flex items-center justify-center text-white z-10">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                ) : (isCheckedIn && mesas.length > 0 && mesas.every((m: any) => (m.actas ?? []).length > 0)) ? (
                  <div className="w-6 h-6 rounded-full border-2 border-[#15803d] bg-[#dcfce7] flex items-center justify-center z-10">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#15803d]"></div>
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full border-2 border-[#cbd5e1] bg-[#e2e8f0] z-10"></div>
                )}
              </div>
              <div className="pb-2 pt-0.5 flex-1 text-left">
                <h3 className={`text-[15px] ${isCheckedOut ? 'font-semibold text-[#334155]' : (isCheckedIn && mesas.length > 0 && mesas.every((m: any) => (m.actas ?? []).length > 0)) ? 'font-bold text-[#0f172a]' : 'font-semibold text-[#94a3b8]'}`}>Salida Asistencia</h3>
                <p className="text-[13px] text-[#64748b] mt-1">Fin de jornada {isCheckedOut ? `(${checkoutTime})` : ''}</p>
                {!isCheckedOut && (isCheckedIn && mesas.length > 0 && mesas.every((m: any) => (m.actas ?? []).length > 0)) && (
                  <span className="inline-block mt-2 px-2.5 py-1 bg-[#fef08a] text-[#854d0e] text-[11px] font-bold rounded-md">
                    Pendiente
                  </span>
                )}
              </div>
            </div>
            
          </div>
        </div>

        <ChangePasswordModal 
          isOpen={isPasswordModalOpen} 
          onClose={() => setIsPasswordModalOpen(false)} 
          onSuccess={() => {
            if (user) {
              setUser({ ...user, isDefaultPassword: false });
            }
          }}
        />
      </div>
    );
  }

  // VISTA PARA ADMIN Y COORDINADOR
  return (
    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-left-8 duration-300">

      <div className="mb-8">
        <h1 className="text-[24px] md:text-[28px] font-extrabold text-[#172b4d] tracking-tight">Centro de Operaciones</h1>
        <p className="text-[#52637d] text-[14px] mt-1">
          Panel de control logístico en tiempo real.
        </p>
      </div>

      {metrics && (
        <>
          {/* Tarjetas de Métricas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

            <div className="bg-white border border-[#d0d7de] rounded-xl p-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#52637d] font-semibold text-xs uppercase tracking-wider">Cobertura de Mesas</span>
                <MapIcon className="text-blue-500" fontSize="small" />
              </div>
              <div className="text-2xl font-extrabold text-[#172b4d]">
                {metrics.mesasAsignadas} <span className="text-[#8993a4] text-lg">/ {metrics.totalMesas}</span>
              </div>
              <div className="w-full bg-[#f4f5f7] h-1.5 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full"
                  style={{ width: `${metrics.totalMesas > 0 ? (metrics.mesasAsignadas / metrics.totalMesas) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-white border border-[#d0d7de] rounded-xl p-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#52637d] font-semibold text-xs uppercase tracking-wider">Personeros Activos</span>
                <GroupIcon className="text-purple-500" fontSize="small" />
              </div>
              <div className="text-2xl font-extrabold text-[#172b4d]">
                {metrics.totalPersoneros}
              </div>
              <div className="text-[11px] text-[#52637d] mt-2 font-medium">
                Total de usuarios con rol de personero.
              </div>
            </div>

            <div className="bg-white border border-[#d0d7de] rounded-xl p-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#52637d] font-semibold text-xs uppercase tracking-wider">Asistencias</span>
                <LocationOnIcon className="text-orange-500" fontSize="small" />
              </div>
              <div className="text-2xl font-extrabold text-[#172b4d]">
                {metrics.asistenciasHoy}
              </div>
              <div className="text-[11px] text-[#52637d] mt-2 font-medium">
                Personeros que han marcado ingreso.
              </div>
            </div>

            <div className="bg-white border border-[#d0d7de] rounded-xl p-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#52637d] font-semibold text-xs uppercase tracking-wider">Actas Subidas</span>
                <InsertDriveFileIcon className="text-green-600" fontSize="small" />
              </div>
              <div className="text-2xl font-extrabold text-[#172b4d]">
                {metrics.totalActas}
              </div>
              <div className="text-[11px] text-[#52637d] mt-2 font-medium">
                Fotografías de actas recibidas.
              </div>
            </div>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 mb-8">
            <div className="space-y-6">
              {/* Gráfico de Velocidad de Escrutinio */}
              <div className="bg-white border border-[#d0d7de] rounded-xl shadow-sm overflow-hidden flex flex-col p-6 h-full relative">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-[16px] font-extrabold text-[#172b4d] flex items-center gap-2">
                      <InsertDriveFileIcon className="text-blue-600" />
                      Estado del Escrutinio
                    </h3>
                    <p className="text-[#52637d] text-[13px] mt-1">
                      Proporción de actas procesadas vs pendientes.
                    </p>
                  </div>
                </div>

                <div className="h-[250px] w-full flex items-center justify-center relative">
                  {(() => {
                    const pendientes = Math.max(0, metrics.totalMesas - metrics.totalActas);
                    const pieData = [
                      { name: 'Procesadas', value: metrics.totalActas, fill: '#2563eb' },
                      { name: 'Pendientes', value: pendientes, fill: '#e2e8f0' }
                    ];
                    const porcentaje = metrics.totalMesas > 0 ? ((metrics.totalActas / metrics.totalMesas) * 100).toFixed(1) : "0.0";
                    
                    return (
                      <>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieData}
                              innerRadius={80}
                              outerRadius={110}
                              paddingAngle={2}
                              dataKey="value"
                              stroke="none"
                            >
                              {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Pie>
                            <Tooltip 
                              formatter={(value) => [value, "Actas"]}
                              contentStyle={{ borderRadius: '8px', border: '1px solid #d0d7de', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <span className="text-3xl font-extrabold text-[#172b4d]">{porcentaje}%</span>
                          <span className="text-sm font-medium text-[#52637d]">Completado</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Columna Derecha: Estadísticas del Proceso */}
            <div className="space-y-6">
              <div className="bg-white border border-[#d0d7de] rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
                <div className="bg-[#f0fdf4] border-b border-[#bbf7d0] px-5 py-4 flex items-center justify-between">
                  <h3 className="text-[15px] font-extrabold text-[#166534] flex items-center gap-2">
                    <LocationOnIcon />
                    Métricas del Proceso
                  </h3>
                </div>

                <div className="flex-1 p-6 flex flex-col justify-center bg-white space-y-6">
                  
                  {/* Barra 1: Llegadas */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[13px] font-bold text-[#52637d]">Personeros que Llegaron</span>
                      <span className="text-[13px] font-extrabold text-[#172b4d]">
                        {metrics.asistenciasHoy} / {metrics.totalPersoneros}
                      </span>
                    </div>
                    <div className="h-2.5 w-full bg-[#ebecf0] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#0b9349] transition-all duration-1000 ease-out"
                        style={{ width: `${metrics.totalPersoneros > 0 ? (metrics.asistenciasHoy / metrics.totalPersoneros) * 100 : 0}%` }}
                      ></div>
                    </div>
                    <p className="text-[11px] text-[#8993a4] mt-1 text-right">
                      {metrics.totalPersoneros > 0 ? Math.round((metrics.asistenciasHoy / metrics.totalPersoneros) * 100) : 0}% Completado
                    </p>
                  </div>

                  {/* Barra 2: Salidas */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[13px] font-bold text-[#52637d]">Personeros que Salieron</span>
                      <span className="text-[13px] font-extrabold text-[#172b4d]">
                        {metrics.salidasHoy || 0} / {metrics.totalPersoneros}
                      </span>
                    </div>
                    <div className="h-2.5 w-full bg-[#ebecf0] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 transition-all duration-1000 ease-out"
                        style={{ width: `${metrics.totalPersoneros > 0 ? ((metrics.salidasHoy || 0) / metrics.totalPersoneros) * 100 : 0}%` }}
                      ></div>
                    </div>
                    <p className="text-[11px] text-[#8993a4] mt-1 text-right">
                      {metrics.totalPersoneros > 0 ? Math.round(((metrics.salidasHoy || 0) / metrics.totalPersoneros) * 100) : 0}% Completado
                    </p>
                  </div>

                  {/* Barra 3: Actas Finalizadas */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[13px] font-bold text-[#52637d]">Actas Finalizadas</span>
                      <span className="text-[13px] font-extrabold text-[#172b4d]">
                        {metrics.totalActas} / {metrics.totalMesas}
                      </span>
                    </div>
                    <div className="h-2.5 w-full bg-[#ebecf0] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-purple-600 transition-all duration-1000 ease-out"
                        style={{ width: `${metrics.totalMesas > 0 ? (metrics.totalActas / metrics.totalMesas) * 100 : 0}%` }}
                      ></div>
                    </div>
                    <p className="text-[11px] text-[#8993a4] mt-1 text-right">
                      {metrics.totalMesas > 0 ? Math.round((metrics.totalActas / metrics.totalMesas) * 100) : 0}% Completado
                    </p>
                  </div>

                </div>
              </div>
            </div>
          </div>

          <div className="w-full">
              {/* Progreso del Personal (Tabla Unificada) */}
              <div className="bg-white border border-[#d0d7de] rounded-xl shadow-sm overflow-hidden flex flex-col">
                <div className="bg-[#f6f8fa] border-b border-[#d0d7de] px-5 py-3 flex items-center justify-between flex-wrap gap-4">
                  <h3 className="text-[15px] font-extrabold text-[#172b4d] flex items-center gap-2">
                    <GroupIcon className="text-purple-600" />
                    Progreso del Personal
                  </h3>
                  <div className="flex items-center gap-3">
                    <select
                      className="border border-[#d0d7de] rounded-md px-3 py-1.5 text-sm bg-white text-[#172b4d] focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={selectedProgresoDistrito}
                      onChange={(e) => {
                        setSelectedProgresoDistrito(e.target.value);
                        setSelectedProgresoCentroMesa("");
                      }}
                    >
                      <option value="">Todos los Distritos</option>
                      {distritosProgreso.map((d: any) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>

                    <select
                      className="border border-[#d0d7de] rounded-md px-3 py-1.5 text-sm bg-white text-[#172b4d] focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-[300px]"
                      value={selectedProgresoCentroMesa}
                      onChange={(e) => setSelectedProgresoCentroMesa(e.target.value)}
                    >
                      <option value="">Todos los Centros / Mesas</option>
                      {centrosPobladosMesasProgreso.map((c: any) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="text-left p-[12px_16px] border-b border-[#ebecf0] text-[12px] font-bold text-[#52637d] bg-white uppercase tracking-wider">Personero</th>
                        <th className="text-left p-[12px_16px] border-b border-[#ebecf0] text-[12px] font-bold text-[#52637d] bg-white uppercase tracking-wider">Local Asignado</th>
                        <th className="text-center p-[12px_16px] border-b border-[#ebecf0] text-[12px] font-bold text-[#52637d] bg-white uppercase tracking-wider w-[120px]">Llegada</th>
                        <th className="text-left p-[12px_16px] border-b border-[#ebecf0] text-[12px] font-bold text-[#52637d] bg-white uppercase tracking-wider min-w-[200px]">Progreso de Actas</th>
                        <th className="text-center p-[12px_16px] border-b border-[#ebecf0] text-[12px] font-bold text-[#52637d] bg-white uppercase tracking-wider w-[120px]">Salida</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProgreso && filteredProgreso.length > 0 ? (
                        filteredProgreso.map((p: any, idx: number) => {
                          const total = parseInt(p.total_mesas) || 0;
                          const registradas = parseInt(p.mesas_registradas) || 0;
                          const pct = total > 0 ? (registradas / total) * 100 : 0;
                          const isAusente = !p.check_in;
                          const hasSalida = !!p.check_out;

                          return (
                            <tr key={`${p.id}-${idx}`} className="hover:bg-[#fafbfc] transition-colors">
                              <td className="text-left p-[14px_16px] border-b border-[#ebecf0]">
                                <div className="flex items-center gap-2">
                                  <div className="relative">
                                    <div className="w-8 h-8 rounded-full bg-[#f4f5f7] border border-[#d0d7de] flex items-center justify-center font-bold text-[#172b4d] text-xs">
                                      {p.name.charAt(0)}{p.lastname.charAt(0)}
                                    </div>
                                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${isAusente ? 'bg-[#d93025]' : 'bg-[#0b9349]'}`} title={isAusente ? 'Ausente / Sin check-in' : 'Activo'}></div>
                                  </div>
                                  <div>
                                    <p className="text-[13px] font-bold text-[#172b4d]">{p.name} {p.lastname}</p>
                                    <p className="text-[11px] text-[#52637d]">
                                      DNI: {p.dni} {p.phone ? `• Tel: ${p.phone}` : ''}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="text-left p-[14px_16px] border-b border-[#ebecf0]">
                                {p.local_nombre ? (
                                  <>
                                    <p className="text-[13px] font-bold text-[#172b4d]">{p.local_nombre}</p>
                                    <p className="text-[11px] text-[#52637d]">{p.local_distrito}</p>
                                  </>
                                ) : (
                                  <span className="text-[12px] text-[#8993a4] italic">Sin local asignado</span>
                                )}
                              </td>
                              
                              {/* Llegada */}
                              <td className="text-center p-[14px_16px] border-b border-[#ebecf0]">
                                {!isAusente ? (
                                  <span className="inline-flex items-center gap-1 bg-[#e6f4ea] text-[#137333] px-2.5 py-1 rounded-md text-[11px] font-bold border border-[#ceead6]">
                                    <CheckCircleIcon style={{ fontSize: 14 }} /> Registrada
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 bg-[#fce8e6] text-[#c5221f] px-2.5 py-1 rounded-md text-[11px] font-bold border border-[#fad2cf]">
                                    <WarningAmberIcon style={{ fontSize: 14 }} /> Pendiente
                                  </span>
                                )}
                              </td>

                              {/* Progreso de Actas */}
                              <td className="text-left p-[14px_16px] border-b border-[#ebecf0]">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[12px] font-bold text-[#172b4d]">{pct.toFixed(0)}%</span>
                                  <span className="text-[11px] font-medium text-[#52637d]">{registradas}/{total} Mesas</span>
                                </div>
                                <div className="h-[8px] bg-[#ebecf0] rounded-full overflow-hidden w-full">
                                  <div
                                    className={`h-full rounded-full transition-all duration-1000 ${isAusente ? 'bg-[#d93025]' : pct === 100 ? 'bg-purple-600' : 'bg-[#2563eb]'}`}
                                    style={{ width: `${pct}%` }}
                                  ></div>
                                </div>
                              </td>

                              {/* Salida */}
                              <td className="text-center p-[14px_16px] border-b border-[#ebecf0]">
                                {hasSalida ? (
                                  <span className="inline-flex items-center gap-1 bg-[#e8f0fe] text-[#1967d2] px-2.5 py-1 rounded-md text-[11px] font-bold border border-[#d2e3fc]">
                                    <CheckCircleIcon style={{ fontSize: 14 }} /> Registrada
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-500 px-2.5 py-1 rounded-md text-[11px] font-bold border border-slate-200">
                                    <WarningAmberIcon style={{ fontSize: 14 }} /> Pendiente
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={5} className="text-center p-8 text-[#8993a4] text-sm">
                            No hay personeros registrados en el sistema.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
          </div>
        </>
      )}
    </div>
  );
}
