"use client";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth.store";
import { useRouter } from "next/navigation";
import axiosInstance from "@/utils/axios";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';

export default function ResultadosPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>("");
  const [selectedDistrito, setSelectedDistrito] = useState<string>("");
  const [selectedLocal, setSelectedLocal] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [modalDistritos, setModalDistritos] = useState<{ open: boolean, partido: string, distritos: string[] }>({ open: false, partido: '', distritos: [] });

  useEffect(() => {
    setMounted(true);
    if (user && user.role === "PERSONERO") {
      router.push("/");
    }
  }, [user, router]);

  useEffect(() => {
    if (user && user.role !== "PERSONERO") {
      const fetchData = async () => {
        try {
          setIsRefreshing(true);
          const response = await axiosInstance.get('/system/resultados', {
            params: {
              distrito: selectedDistrito || undefined,
              local: selectedLocal || undefined
            }
          });
          setData(response.data);
          
          // Set first tab as active automatically if not set
          if (response.data.votos && response.data.votos.length > 0) {
            const uniqueNiveles = Array.from(new Set(response.data.votos.map((v: any) => v.nivel))).sort((a: any, b: any) => {
              const order: Record<string, number> = { DISTRITAL: 1, PROVINCIAL: 2, REGIONAL: 3 };
              return (order[a] || 99) - (order[b] || 99);
            });
            if (uniqueNiveles.length > 0 && !activeTab) setActiveTab(uniqueNiveles[0] as string);
          }
        } catch (error) {
          console.error("Error fetching resultados", error);
        } finally {
          setLoading(false);
          setIsRefreshing(false);
        }
      };
      
      fetchData();
      
      // Actualizar automáticamente cada 60 segundos
      const interval = setInterval(fetchData, 60000);
      return () => clearInterval(interval);
    }
  }, [user, selectedDistrito, selectedLocal]);

  if (!mounted || user?.role === "PERSONERO") return null;

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const niveles = data?.votos ? Array.from(new Set(data.votos.map((v: any) => v.nivel))).sort((a: any, b: any) => {
    const order: Record<string, number> = { DISTRITAL: 1, PROVINCIAL: 2, REGIONAL: 3 };
    return (order[a] || 99) - (order[b] || 99);
  }) : [];
  const votosActivos = data?.votos ? data.votos.filter((v: any) => v.nivel === activeTab) : [];
  
  // Calcular total de votos del tab actual
  const totalVotosNivel = votosActivos.reduce((sum: number, v: any) => sum + parseInt(v.total_votos || 0), 0);

  // Helper para formatear los nombres de enum a texto legible
  const formatNivel = (nivel: string) => {
    return nivel.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-[20px] max-md:flex-col max-md:items-start max-md:gap-[12px]">
        <div className="title">
          <h1 className="text-[24px] md:text-[28px] font-extrabold text-[#172b4d] tracking-tight">Resultados en Tiempo Real</h1>
          <p className="text-muted mt-[5px]">Monitoreo de resultados recibidos durante la jornada electoral.</p>
        </div>
        <div className="flex items-center gap-[12px] flex-wrap">
          <span className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
            <span className={`relative flex h-2 w-2 rounded-full bg-green-500 ${isRefreshing ? '' : 'animate-pulse'}`}></span>
            {isRefreshing ? 'Actualizando...' : 'Actualización automática'}
          </span>
          <small className="text-[#52637d] font-medium">{new Date().toLocaleTimeString()}</small>
        </div>
      </div>

      <div className="bg-white border border-[#d0d7de] p-[16px] rounded-xl shadow-sm mb-[20px] flex flex-wrap gap-[12px] items-center">
        <span className="text-[13px] font-bold text-[#52637d] uppercase tracking-wider mr-2">Filtros:</span>
        {data?.distritos && data.distritos.length > 0 && (
          <select
            value={selectedDistrito}
            onChange={(e) => {
              setSelectedDistrito(e.target.value);
              setSelectedLocal(""); // Resetear local cuando cambia el distrito
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            <option value="">Todos los Distritos (General)</option>
            {data.distritos.map((d: any) => (
              <option key={d.distrito} value={d.distrito}>
                {d.distrito}
              </option>
            ))}
          </select>
        )}
        
        {selectedDistrito && data?.localesLista && data.localesLista.length > 0 && (
          <select
            value={selectedLocal}
            onChange={(e) => setSelectedLocal(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            <option value="">Todos los Locales</option>
            {data.localesLista.map((localName: string, idx: number) => (
              <option key={idx} value={localName}>
                {localName}
              </option>
            ))}
          </select>
        )}
      </div>
      
      <div className="grid gap-[18px] grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white border border-[#d0d7de] rounded-xl p-[18px] shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[27px] font-extrabold text-[#172b4d]">{data?.resumen?.mesasTotales || 0}</div>
            <div className="text-[#52637d] text-[12px] mt-[3px] font-medium uppercase tracking-wide">Mesas totales</div>
          </div>
          <div className="w-[42px] h-[42px] rounded-xl bg-[#f4f5f7] grid place-items-center text-[#52637d] text-[19px]">▣</div>
        </div>
        <div className="bg-white border border-[#d0d7de] rounded-xl p-[18px] shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[27px] font-extrabold text-[#172b4d]">{data?.resumen?.mesasRegistradas || 0}</div>
            <div className="text-[#52637d] text-[12px] mt-[3px] font-medium uppercase tracking-wide">Mesas registradas</div>
          </div>
          <div className="w-[42px] h-[42px] rounded-xl bg-[#e3fcee] grid place-items-center text-[#0b9349] text-[19px]">✓</div>
        </div>
        <div className="bg-white border border-[#d0d7de] rounded-xl p-[18px] shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[27px] font-extrabold text-[#172b4d]">{data?.resumen?.mesasPendientes || 0}</div>
            <div className="text-[#52637d] text-[12px] mt-[3px] font-medium uppercase tracking-wide">Mesas pendientes</div>
          </div>
          <div className="w-[42px] h-[42px] rounded-xl bg-[#fff4e5] grid place-items-center text-[#d97008] text-[19px]">⌛</div>
        </div>
        <div className="bg-white border border-[#d0d7de] rounded-xl p-[18px] shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[27px] font-extrabold text-[#172b4d]">{data?.resumen?.avanceGeneral?.toFixed(1) || 0}%</div>
            <div className="text-[#52637d] text-[12px] mt-[3px] font-medium uppercase tracking-wide">Avance general</div>
          </div>
          <div className="w-[42px] h-[42px] rounded-xl bg-[#e9f2ff] grid place-items-center text-blue-600 text-[19px]">↗</div>
        </div>
      </div>
      
      <div className="grid gap-[18px] grid-cols-1 mt-[18px]">
        {/* Panel de Votos */}
        <div className="bg-white border border-[#d0d7de] rounded-xl p-[24px] shadow-sm">
          <div className="text-[16px] font-extrabold text-[#172b4d] mb-[20px]">Resultados por elección</div>
          
          {niveles.length > 0 ? (
            <>
              <div className="flex gap-[10px] border-b border-[#d0d7de] mb-[24px] overflow-x-auto">
                {niveles.map((nivel: any) => (
                  <button 
                    key={nivel}
                    onClick={() => setActiveTab(nivel)}
                    className={`p-[10px_16px] cursor-pointer whitespace-nowrap text-sm font-bold border-b-2 transition-colors ${activeTab === nivel ? 'text-blue-600 border-blue-600 bg-[#f4f5f7] rounded-t-lg' : 'text-[#52637d] border-transparent hover:text-[#172b4d] hover:bg-[#f6f8fa] rounded-t-lg'}`}
                  >
                    {formatNivel(nivel)}
                  </button>
                ))}
              </div>
              
              <div className="space-y-5">
                {votosActivos.map((voto: any, idx: number) => {
                  const numVotos = parseInt(voto.total_votos || 0);
                  const porcentaje = totalVotosNivel > 0 ? ((numVotos / totalVotosNivel) * 100).toFixed(1) : "0.0";
                  
                  let nombreFila = "";
                  let colorFila = "#0b9349"; // Default green
                  
                  if (voto.tipo === "CANDIDATO") {
                    nombreFila = `${voto.partido_nombre || 'Independiente'} - ${voto.candidato_nombres} ${voto.candidato_apellidos}`;
                    if (voto.partido_color) colorFila = voto.partido_color;
                  } else {
                    nombreFila = `Votos ${voto.tipo}`;
                    colorFila = voto.tipo === "BLANCO" ? "#8993a4" : (voto.tipo === "NULO" ? "#d93025" : "#e3a800");
                  }

                  return (
                    <div key={idx} className="grid items-center gap-[16px] grid-cols-[140px_1fr_60px] md:grid-cols-[220px_1fr_70px]">
                      <div className="flex items-center gap-[10px] min-w-0" title={voto.tipo === "CANDIDATO" ? `${voto.partido_nombre || 'Independiente'} - ${voto.candidato_nombres} ${voto.candidato_apellidos}` : nombreFila}>
                        {voto.tipo === "CANDIDATO" && voto.partido_logo ? (
                          <div className="w-[32px] h-[32px] rounded-full overflow-hidden border border-[#ebecf0] bg-white flex-shrink-0 flex items-center justify-center">
                            <img src={voto.partido_logo} alt="Logo" className="w-full h-full object-contain p-1" />
                          </div>
                        ) : voto.tipo === "CANDIDATO" ? (
                          <div className="w-[32px] h-[32px] rounded-full border border-[#ebecf0] bg-[#f4f5f7] flex-shrink-0 flex items-center justify-center text-[12px] font-bold text-[#52637d]">
                            {voto.partido_nombre ? voto.partido_nombre.substring(0, 2).toUpperCase() : 'IN'}
                          </div>
                        ) : (
                          <div className="w-[32px] h-[32px] rounded-full border border-[#ebecf0] bg-slate-100 flex-shrink-0 flex items-center justify-center text-[12px]">
                            {voto.tipo === "BLANCO" ? '⬜' : '🚫'}
                          </div>
                        )}
                        <div className="flex flex-col min-w-0">
                          {voto.tipo === "CANDIDATO" ? (
                            <>
                              <span className="text-[13px] font-extrabold text-[#172b4d] truncate">
                                {voto.partido_nombre || 'Independiente'}
                              </span>
                              <span className="text-[11px] font-medium text-[#52637d] truncate">
                                {voto.candidato_nombres} {voto.candidato_apellidos}
                              </span>
                            </>
                          ) : (
                            <span className="text-[13px] font-bold text-[#172b4d] truncate">
                              {nombreFila}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="h-[12px] bg-[#ebecf0] rounded-full overflow-hidden">
                        <span 
                          className="block h-full rounded-full transition-all duration-1000" 
                          style={{ width: `${porcentaje}%`, backgroundColor: colorFila }}
                        ></span>
                      </div>
                      <div className="text-right">
                        <strong className="text-[14px] text-[#172b4d] block">{porcentaje}%</strong>
                        <small className="text-[#52637d] text-[11px] block">{numVotos} v</small>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <hr className="border-0 border-t border-[#d0d7de] my-[20px]" />
              <div className="flex justify-between items-center text-[#172b4d]">
                <strong className="text-[14px]">Total de votos contabilizados:</strong>
                <strong className="text-[16px]">{totalVotosNivel.toLocaleString()}</strong>
              </div>
            </>
          ) : (
            <div className="py-12 text-center">
              <p className="text-[#52637d]">Aún no hay votos registrados en el sistema.</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-[18px] grid-cols-1 lg:grid-cols-2 mt-[18px]">
        {/* Termómetro de Distritos */}
        <div className="bg-white border border-[#d0d7de] rounded-xl p-[24px] shadow-sm flex flex-col h-full lg:col-span-1 max-h-[400px]">
          <div className="text-[16px] font-extrabold text-[#172b4d] mb-[6px]">Termómetro de Distritos</div>
          <p className="text-[#52637d] text-[12px] mb-[20px]">Porcentaje de actas recibidas por distrito.</p>
          
          <div className="flex-1 overflow-y-auto pr-2">
            {data?.distritos && data.distritos.length > 0 ? (
              <div className="space-y-4">
                {data.distritos.map((distrito: any, idx: number) => {
                  const registradas = parseInt(distrito.mesas_registradas || 0);
                  const totales = parseInt(distrito.total_mesas || 0);
                  const pct = totales > 0 ? (registradas / totales) * 100 : 0;
                  
                  let statusColor = "bg-red-500";
                  if (pct >= 75) statusColor = "bg-green-500";
                  else if (pct >= 50) statusColor = "bg-yellow-500";
                  else if (pct >= 25) statusColor = "bg-orange-500";

                  return (
                    <div key={idx}>
                      <div className="flex justify-between items-end mb-1">
                        <span className="text-[13px] font-bold text-[#172b4d]">{distrito.distrito}</span>
                        <span className="text-[12px] font-medium text-[#52637d]">{registradas}/{totales} ({pct.toFixed(0)}%)</span>
                      </div>
                      <div className="h-[8px] bg-[#ebecf0] rounded-full overflow-hidden">
                        <span className={`block h-full rounded-full transition-all duration-1000 ${statusColor}`} style={{ width: `${pct}%` }}></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-[#52637d] text-sm text-center">
                No hay distritos registrados o locales asignados.
              </div>
            )}
          </div>
          
          <div className="flex justify-around mt-[24px] pt-[16px] border-t border-[#d0d7de] text-[11px] font-medium text-[#52637d]">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> 75–100%</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500"></span> 50–74%</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500"></span> 25–49%</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> 0–24%</span>
          </div>
        </div>

        {/* Resumen de Mayorías */}
        <div className="bg-white border border-[#d0d7de] rounded-xl p-[24px] shadow-sm flex flex-col h-full lg:col-span-1 max-h-[400px]">
          <div className="text-[16px] font-extrabold text-[#172b4d] mb-[6px]">Proyección Distrital</div>
          <p className="text-[#52637d] text-[12px] mb-[20px]">Distritos liderados por partido.</p>

          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {data?.distritosGanados && data.distritosGanados.length > 0 ? (
              data.distritosGanados.map((ganador: any, idx: number) => (
                <div key={idx} className="flex items-center gap-[12px] p-[12px] rounded-lg border border-[#ebecf0] hover:bg-[#f4f5f7] transition-colors">
                  {ganador.partido_logo ? (
                    <div className="w-[36px] h-[36px] rounded-full overflow-hidden border border-[#ebecf0] bg-white flex-shrink-0 flex items-center justify-center">
                      <img src={ganador.partido_logo} alt="Logo" className="w-full h-full object-contain p-1" />
                    </div>
                  ) : (
                    <div className="w-[36px] h-[36px] rounded-full border border-[#ebecf0] bg-slate-100 flex-shrink-0 flex items-center justify-center text-[12px] font-bold text-[#52637d]">
                      {ganador.partido_nombre.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-[13px] font-extrabold text-[#172b4d] truncate">{ganador.partido_nombre}</span>
                    <span className="text-[12px] text-[#52637d]">
                      Lidera en <strong className="text-blue-600">{ganador.distritos_ganados}</strong> {ganador.distritos_ganados === 1 ? 'distrito' : 'distritos'}
                    </span>
                  </div>
                  <button 
                    onClick={() => setModalDistritos({ open: true, partido: ganador.partido_nombre, distritos: ganador.nombres_distritos || [] })}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors flex-shrink-0"
                    title="Ver distritos ganados"
                  >
                    <VisibilityIcon fontSize="small" />
                  </button>
                </div>
              ))
            ) : (
              <div className="h-full flex items-center justify-center text-[#52637d] text-sm text-center">
                No hay resultados consolidados aún.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Distritos Ganados */}
      {modalDistritos.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                Distritos Ganados
              </h3>
              <button 
                onClick={() => setModalDistritos({ open: false, partido: '', distritos: [] })}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <CloseIcon />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-sm text-slate-600 mb-4">
                El partido <strong className="text-slate-800">{modalDistritos.partido}</strong> lidera en los siguientes distritos:
              </p>
              
              <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2">
                {modalDistritos.distritos.length > 0 ? (
                  modalDistritos.distritos.map((distrito, idx) => (
                    <div key={idx} className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                      {distrito}
                    </div>
                  ))
                ) : (
                  <div className="text-center text-sm text-slate-500 py-4">No hay información de distritos.</div>
                )}
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-slate-200 flex justify-end">
              <button 
                onClick={() => setModalDistritos({ open: false, partido: '', distritos: [] })}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
