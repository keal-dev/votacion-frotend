"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth.store";
import axiosInstance from "@/utils/axios";
import FactCheckIcon from '@mui/icons-material/FactCheck';
import VisibilityIcon from '@mui/icons-material/Visibility';
import InsertPhotoIcon from '@mui/icons-material/InsertPhoto';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import WarningIcon from '@mui/icons-material/Warning';
import { useRouter } from "next/navigation";

const getTimeAgo = (dateString: string) => {
  const diffMs = new Date().getTime() - new Date(dateString).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Hace instantes';
  if (diffMins < 60) return `Hace ${diffMins} min`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `Hace ${diffHrs} h`;
  return `Hace ${Math.floor(diffHrs / 24)} d`;
};

export default function AuditoriaPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [actas, setActas] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>({ total: 0, page: 1, limit: 25, totalPages: 1 });
  const [conteoEstados, setConteoEstados] = useState<any>({ TODOS: 0, PENDIENTE: 0, PROCESADO: 0, AUDITADO: 0, OBSERVADO: 0, ANULADO: 0 });
  const [localesUnicos, setLocalesUnicos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [filtroLocal, setFiltroLocal] = useState<string>('');
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');
  const [busqueda, setBusqueda] = useState<string>('');
  const [debouncedBusqueda, setDebouncedBusqueda] = useState<string>('');

  // Cargar locales únicos una vez
  useEffect(() => {
    axiosInstance.get('/mesas/locales/nombres').then(res => setLocalesUnicos(res.data)).catch(console.error);
  }, []);

  // Debounce para la búsqueda
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedBusqueda(busqueda);
      setPage(1); // Resetear página al buscar
    }, 500);
    return () => clearTimeout(handler);
  }, [busqueda]);

  // Resetear página cuando cambian los filtros (excepto búsqueda que ya se maneja)
  useEffect(() => {
    setPage(1);
  }, [filtroEstado, filtroLocal, limit]);

  useEffect(() => {
    if (user && (user.role === 'ADMIN' || user.role === 'COORDINADOR')) {
      const fetchActas = async () => {
        try {
          setLoading(true);
          const params = new URLSearchParams();
          params.append('page', page.toString());
          params.append('limit', limit.toString());
          if (filtroEstado && filtroEstado !== 'TODOS') params.append('estado', filtroEstado);
          if (filtroLocal) params.append('local', filtroLocal);
          if (debouncedBusqueda) params.append('search', debouncedBusqueda);

          const { data } = await axiosInstance.get(`/actas/auditoria?${params.toString()}`);
          setActas(data?.data || []);
          setMeta(data?.meta || { total: 0, page: 1, limit: 25, totalPages: 1 });
          setConteoEstados(data?.counts || { TODOS: 0, PENDIENTE: 0, PROCESADO: 0, AUDITADO: 0, OBSERVADO: 0, ANULADO: 0 });
        } catch (error) {
          console.error("Error fetching actas", error);
        } finally {
          setLoading(false);
        }
      };
      fetchActas();
    } else if (user && user.role === 'PERSONERO') {
      router.push('/');
    }
  }, [user, router, page, limit, filtroEstado, filtroLocal, debouncedBusqueda]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto py-6 px-4 sm:px-6 lg:px-8 animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[calc(100vh-80px)]">
      <div className="mb-6 shrink-0">
        <h1 className="text-[24px] md:text-[28px] font-extrabold text-[#172b4d] tracking-tight flex items-center gap-2">
          <FactCheckIcon fontSize="large" className="text-blue-600" />
          Centro de Auditoría de Actas
        </h1>
        <p className="text-[#52637d] text-[14px] mt-1">
          Selecciona un acta de la lista para verificar la foto con los datos transcritos.
        </p>
      </div>

      {/* Barra de Herramientas Superior */}
      <div className="mb-4 flex flex-col sm:flex-row gap-4 justify-between items-end sm:items-center">
        {/* Tabs de Estado */}
        <div className="flex flex-wrap gap-2">
          {['TODOS', 'PENDIENTE', 'OBSERVADO', 'AUDITADO'].map((estado) => (
            <button
              key={estado}
              onClick={() => setFiltroEstado(estado)}
              className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors flex items-center gap-2 ${
                filtroEstado === estado 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
                  : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {estado === 'TODOS' ? 'Todas' : estado.charAt(0) + estado.slice(1).toLowerCase()}
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                filtroEstado === estado ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'
              }`}>
                {conteoEstados[estado] || 0}
              </span>
            </button>
          ))}
        </div>

        {/* Buscador Universal */}
        <div className="relative w-full sm:w-72">
          <input 
            type="text" 
            placeholder="Buscar mesa, local, personero..." 
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 text-slate-700"
          />
          <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>



      {actas.length > 0 ? (
        <div className="bg-white border-t border-b border-slate-200 sm:border sm:rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px] whitespace-nowrap">
              <thead className="bg-white border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2 font-medium text-slate-500 w-24">Mesa</th>
                  <th className="px-4 py-1 font-medium text-slate-500 min-w-[200px]">
                    <select 
                      value={filtroLocal} 
                      onChange={(e) => setFiltroLocal(e.target.value)}
                      className="text-xs border-0 border-b border-transparent hover:border-slate-300 focus:border-blue-500 bg-transparent font-semibold outline-none cursor-pointer text-slate-600 focus:ring-0 p-0 py-1 w-full max-w-[200px]"
                    >
                      <option value="">Local de Votación (Todos)</option>
                      {localesUnicos.map((local: any) => (
                        <option key={local} value={local}>{local}</option>
                      ))}
                    </select>
                  </th>
                  <th className="px-4 py-2 font-medium text-slate-500 text-center w-24">Estado</th>
                  <th className="px-4 py-2 font-medium text-slate-500 text-center w-[240px]">Válidos / Bl / Nu / Imp / Total</th>
                  <th className="px-4 py-2 font-medium text-slate-500 w-24">Participación</th>
                  <th className="px-4 py-2 font-medium text-slate-500 text-center w-16">Foto</th>
                  <th className="px-4 py-2 font-medium text-slate-500 text-right w-24">Hora</th>
                  <th className="px-4 py-2 font-medium text-slate-500 text-center w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {actas.length > 0 ? (
                  actas.map((acta: any) => {
                  // Calcular participación
                  const totalVotos = acta.ciudadanos_votaron || 0;
                  const electores = acta.mesa?.cantidad_electores || 0;
                  const porcentaje = electores > 0 ? Math.round((totalVotos / electores) * 100) : 0;
                  const esExcesivo = porcentaje > 100;

                  // Calcular votos especiales
                  const blancos = acta.votos?.filter((v: any) => v.tipo === 'BLANCO').reduce((sum: number, v: any) => sum + v.cantidad, 0) || 0;
                  const nulos = acta.votos?.filter((v: any) => v.tipo === 'NULO').reduce((sum: number, v: any) => sum + v.cantidad, 0) || 0;
                  const impugnados = acta.votos?.filter((v: any) => v.tipo === 'IMPUGNADO').reduce((sum: number, v: any) => sum + v.cantidad, 0) || 0;
                  const validos = Math.max(0, totalVotos - blancos - nulos - impugnados);

                  return (
                    <tr 
                      key={acta.id} 
                      className={`transition-colors group ${esExcesivo ? 'bg-red-50/50 hover:bg-red-50' : 'hover:bg-slate-50'}`}
                    >
                      <td className="px-4 py-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-800 text-[13px] whitespace-nowrap">
                            {acta.mesa?.numero_mesa}
                          </span>
                          {acta.observaciones && (
                            <div title={`Observación: ${acta.observaciones}`} className="text-amber-500 cursor-help flex items-center">
                              <WarningAmberIcon sx={{ fontSize: 14 }} />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-1.5">
                        <div className="flex flex-col justify-center">
                          <span className="text-[12px] text-slate-600 font-medium truncate max-w-[250px]" title={acta.mesa?.local?.nombre || 'Desconocido'}>
                            {acta.mesa?.local?.nombre || 'Desconocido'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium truncate max-w-[250px] mt-0.5" title={`Personero: ${acta.personero?.name} ${acta.personero?.lastname}`}>
                            {acta.personero?.name} {acta.personero?.lastname}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-1.5 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                          acta.estado === 'AUDITADO' ? 'bg-emerald-100 text-emerald-700' :
                          acta.estado === 'PROCESADO' ? 'bg-blue-100 text-blue-700' :
                          acta.estado === 'OBSERVADO' ? 'bg-red-100 text-red-700' :
                          acta.estado === 'ANULADO' ? 'bg-slate-200 text-slate-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {acta.estado || 'PENDIENTE'}
                        </span>
                      </td>
                      <td className="px-4 py-1.5 text-center">
                        <div className="flex justify-center items-center gap-1 text-[11px] font-bold">
                          <span className={`px-1.5 py-0.5 rounded border ${validos > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-transparent text-slate-300 border-transparent opacity-50'}`} title="Votos Válidos (Partidos)">
                            V: {validos}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded border ${blancos > 0 ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-transparent text-slate-300 border-transparent opacity-50'}`} title="Votos Blancos">
                            B: {blancos}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded border ${nulos > 0 ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-transparent text-slate-300 border-transparent opacity-50'}`} title="Votos Nulos">
                            N: {nulos}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded border ${impugnados > 0 ? 'bg-red-50 text-red-600 border-red-200' : 'bg-transparent text-slate-300 border-transparent opacity-50'}`} title="Votos Impugnados">
                            I: {impugnados}
                          </span>
                          <div className="flex items-center ml-1 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-slate-700" title="Total Emitidos / Total Electores">
                            <span>{totalVotos}</span>
                            <span className="text-[10px] text-slate-400 mx-0.5">/</span>
                            <span className="text-slate-500">{electores > 0 ? electores : '?'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-1.5 w-24">
                        <div className="flex flex-col justify-center">
                          <div className="flex justify-end mb-1">
                            {electores > 0 && (
                              <span className={`text-[10px] font-bold tracking-tight leading-none ${esExcesivo ? 'text-red-600' : 'text-slate-500'}`}>
                                {porcentaje}%
                              </span>
                            )}
                          </div>
                          {electores > 0 && (
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${esExcesivo ? 'bg-red-500' : porcentaje > 80 ? 'bg-blue-500' : porcentaje > 50 ? 'bg-emerald-400' : 'bg-slate-300'}`} 
                                style={{ width: `${Math.min(porcentaje, 100)}%` }}
                              ></div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-1.5 text-center">
                        {acta.fotos && acta.fotos.length > 0 ? (
                          <div className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200" title={`${acta.fotos.length} foto(s) subida(s)`}>
                            <InsertPhotoIcon sx={{ fontSize: 14 }} className="text-blue-500" />
                            <span className="text-[11px] font-bold">{acta.fotos.length}</span>
                          </div>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="px-4 py-1.5 text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-medium text-slate-600 leading-tight">{new Date(acta.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <span className="text-[10px] text-slate-400 font-medium leading-tight">{getTimeAgo(acta.createdAt)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-1.5 text-center">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/auditoria/${acta.id}`);
                          }}
                          className="text-slate-400 hover:text-blue-600 bg-transparent hover:bg-blue-50 p-1.5 rounded-full transition-colors flex items-center justify-center"
                          title="Auditar acta"
                        >
                          <VisibilityIcon sx={{ fontSize: 18 }} />
                        </button>
                      </td>
                    </tr>
                  );
                })) : (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center">
                        <FactCheckIcon sx={{ fontSize: 48, opacity: 0.2, marginBottom: '8px' }} />
                        <p className="font-medium text-slate-600">No se encontraron actas con los filtros aplicados.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Controles de Paginación */}
          {actas.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-t border-slate-200 sm:px-6">
              <div className="flex flex-1 justify-between sm:hidden">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="relative inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                  disabled={page >= meta.totalPages}
                  className="relative ml-3 inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-slate-700">
                    Mostrando del <span className="font-semibold">{Math.min(meta.total, (page - 1) * limit + 1)}</span> al <span className="font-semibold">{Math.min(meta.total, page * limit)}</span> de <span className="font-semibold">{meta.total}</span> actas
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <select
                    value={limit}
                    onChange={(e) => setLimit(Number(e.target.value))}
                    className="text-sm border-slate-300 rounded-md py-1.5 pl-3 pr-8 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={10}>10 por página</option>
                    <option value={25}>25 por página</option>
                    <option value={50}>50 por página</option>
                    <option value={100}>100 por página</option>
                  </select>
                  <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="relative inline-flex items-center rounded-l-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                    >
                      <span className="sr-only">Anterior</span>
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-slate-900 ring-1 ring-inset ring-slate-300 focus:outline-offset-0">
                      Página {page} de {meta.totalPages}
                    </span>
                    <button
                      onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                      disabled={page >= meta.totalPages}
                      className="relative inline-flex items-center rounded-r-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                    >
                      <span className="sr-only">Siguiente</span>
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-12 flex flex-col items-center justify-center text-center">
          <FactCheckIcon sx={{ fontSize: 64, opacity: 0.1, marginBottom: '16px' }} />
          <p className="text-lg font-bold text-[#52637d]">No hay actas disponibles</p>
          <p className="text-sm text-[#8993a4] mt-2 max-w-md">
            Aún no se han recibido actas para auditar o no hay datos disponibles en el sistema.
          </p>
        </div>
      )}

    </div>
  );
}
