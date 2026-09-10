"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth.store";
import axiosInstance from "@/utils/axios";
import FactCheckIcon from '@mui/icons-material/FactCheck';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ImageSearchIcon from '@mui/icons-material/ImageSearch';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useRouter, useParams } from "next/navigation";

const getOptimizedUrl = (url: string, type: 'thumb' | 'main') => {
  if (!url || !url.includes('cloudinary.com')) return url;
  const parts = url.split('/upload/');
  if (parts.length !== 2) return url;
  
  // thumb: cuadrado pequeño y súper ligero para la galería
  if (type === 'thumb') return `${parts[0]}/upload/w_150,h_150,c_fill,q_auto,f_auto/${parts[1]}`;
  // main: ancho máximo 1600px, compresión inteligente para lectura nítida y carga rápida
  if (type === 'main') return `${parts[0]}/upload/w_1600,c_limit,q_auto,f_auto/${parts[1]}`;
  return url;
};

export default function ActaDetallePage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const actaId = params?.id as string;
  
  const [selectedActa, setSelectedActa] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState<string>('');
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedVotos, setEditedVotos] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    if (user.role === 'ADMIN' || user.role === 'COORDINADOR') {
      const fetchActa = async () => {
        try {
          const { data } = await axiosInstance.get(`/actas/auditoria/${actaId}`);
          setSelectedActa(data);
          if (data?.fotos?.length > 0) {
            setActiveImage(data.fotos[0].url);
          }
        } catch (error) {
          console.error("Error fetching acta", error);
        } finally {
          setLoading(false);
        }
      };
      if (actaId) {
        fetchActa();
      }
    } else {
      router.push('/');
    }
  }, [user, router, actaId]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!selectedActa) {
    return (
      <div className="p-12 flex flex-col items-center justify-center text-center h-[calc(100vh-80px)]">
        <FactCheckIcon sx={{ fontSize: 64, opacity: 0.1, marginBottom: '16px' }} />
        <p className="text-lg font-bold text-[#52637d]">Acta no encontrada</p>
        <button 
          onClick={() => router.push('/auditoria')}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors"
        >
          Volver a la lista
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto py-4 px-4 sm:px-6 lg:px-8 animate-in fade-in slide-in-from-bottom-4 duration-500 h-[calc(100vh-80px)] flex flex-col">
      <div className="mb-4 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/auditoria')}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-200 transition-colors text-slate-600"
            title="Volver"
          >
            <ArrowBackIcon />
          </button>
          <div>
            <h1 className="text-[24px] md:text-[28px] font-extrabold text-[#172b4d] tracking-tight flex items-center gap-2">
              Auditoría Mesa {selectedActa.mesa?.numero_mesa}
              <span className={`text-[12px] px-2 py-0.5 rounded font-bold uppercase tracking-wide ml-2 ${
                selectedActa.estado === 'AUDITADO' ? 'bg-emerald-100 text-emerald-700' :
                selectedActa.estado === 'PROCESADO' ? 'bg-blue-100 text-blue-700' :
                selectedActa.estado === 'OBSERVADO' ? 'bg-red-100 text-red-700' :
                selectedActa.estado === 'ANULADO' ? 'bg-slate-200 text-slate-700' :
                'bg-amber-100 text-amber-700'
              }`}>
                {selectedActa.estado || 'PENDIENTE'}
              </span>
            </h1>
            <p className="text-[#52637d] text-[13px] mt-0.5">
              Local: {selectedActa.mesa?.local?.nombre || 'Desconocido'} • Personero: {selectedActa.personero?.name} {selectedActa.personero?.lastname}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {selectedActa.estado !== 'ANULADO' && (
            <button 
              onClick={async () => {
                if (confirm('¿Estás seguro de anular esta acta?')) {
                  try {
                    await axiosInstance.patch(`/actas/${selectedActa.id}/estado`, { estado: 'ANULADO' });
                    setSelectedActa({ ...selectedActa, estado: 'ANULADO' });
                  } catch(e) { alert('Error al anular'); }
                }
              }} 
              className="bg-white text-slate-600 border border-slate-300 hover:bg-slate-50 px-3 py-2 rounded-lg text-sm font-bold transition-colors"
            >
              Anular
            </button>
          )}
          {selectedActa.estado !== 'OBSERVADO' && (
            <button 
              onClick={async () => {
                try {
                  await axiosInstance.patch(`/actas/${selectedActa.id}/estado`, { estado: 'OBSERVADO' });
                  setSelectedActa({ ...selectedActa, estado: 'OBSERVADO' });
                } catch(e) { alert('Error al observar'); }
              }} 
              className="bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 px-3 py-2 rounded-lg text-sm font-bold transition-colors"
            >
              Observar
            </button>
          )}
          {selectedActa.estado !== 'AUDITADO' && (
            <button 
              onClick={async () => {
                try {
                  await axiosInstance.patch(`/actas/${selectedActa.id}/estado`, { estado: 'AUDITADO' });
                  setSelectedActa({ ...selectedActa, estado: 'AUDITADO' });
                } catch(e) { alert('Error al aprobar'); }
              }} 
              className="bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
            >
              Aprobar (Auditar)
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-6">
        {/* Panel Izquierdo: Visor de Imágenes (ahora toma más espacio) */}
        <div className="w-full lg:w-3/5 bg-[#172b4d] border border-[#d0d7de] rounded-xl shadow-sm overflow-hidden flex flex-col relative group">
          {activeImage ? (
            <div className="flex-1 flex items-center justify-center p-2 relative overflow-hidden bg-black/95">
              <img 
                src={getOptimizedUrl(activeImage, 'main')} 
                alt="Foto del Acta" 
                className="max-w-full max-h-full object-contain cursor-zoom-in hover:scale-150 transition-transform duration-300 origin-center"
                title="Pasa el mouse para hacer zoom"
              />
              <div className="absolute top-4 left-4 bg-black/60 text-white px-3 py-1.5 rounded-lg backdrop-blur-sm flex items-center gap-2 pointer-events-none text-sm">
                <ImageSearchIcon fontSize="small" /> Zoom al hacer hover
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-white/50 text-sm">
              No hay foto disponible para esta acta.
            </div>
          )}
          
          {selectedActa.fotos && selectedActa.fotos.length > 1 && (
            <div className="bg-[#091522] p-3 flex gap-2 overflow-x-auto border-t border-white/10 shrink-0">
              {selectedActa.fotos.map((foto: any, idx: number) => (
                <button 
                  key={idx}
                  onClick={() => setActiveImage(foto.url)}
                  className={`w-20 h-20 rounded border-2 overflow-hidden shrink-0 transition-all ${activeImage === foto.url ? 'border-blue-500 opacity-100 scale-105' : 'border-transparent opacity-50 hover:opacity-100'}`}
                >
                  <img src={getOptimizedUrl(foto.url, 'thumb')} className="w-full h-full object-cover" alt={`Miniatura ${idx + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Panel Derecho: Datos Transcritos y Edición */}
        <div className="w-full lg:w-2/5 bg-white border border-[#d0d7de] rounded-xl shadow-sm flex flex-col overflow-hidden">
          <div className="bg-[#f6f8fa] border-b border-[#d0d7de] px-5 py-4 shrink-0 flex justify-between items-center">
            <h3 className="text-[15px] font-extrabold text-[#172b4d] flex items-center gap-2">
              <VisibilityIcon className="text-purple-600" />
              Datos Transcritos
            </h3>
            <div className="text-right flex items-center gap-4">
              <div>
                <span className="block text-[11px] text-[#8993a4]">Total Votos</span>
                <span className="block text-sm font-bold text-[#172b4d]">{selectedActa.ciudadanos_votaron}</span>
              </div>
              {!isEditing ? (
                <button 
                  onClick={() => {
                    const initialVotes: Record<string, number> = {};
                    selectedActa.votos?.forEach((v: any) => {
                      initialVotes[v.id] = v.cantidad;
                    });
                    setEditedVotos(initialVotes);
                    setIsEditing(true);
                  }}
                  className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-xs font-bold border border-blue-200 hover:bg-blue-100 transition-colors"
                >
                  Editar Votos
                </button>
              ) : (
                <div className="flex gap-2">
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 hover:bg-slate-200 transition-colors"
                    disabled={isSaving}
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={async () => {
                      setIsSaving(true);
                      try {
                        const payload = Object.entries(editedVotos).map(([votoId, cantidad]) => ({ votoId, cantidad }));
                        await axiosInstance.patch(`/actas/votos/${selectedActa.id}`, { votos: payload });
                        
                        // Refresh
                        const { data } = await axiosInstance.get(`/actas/auditoria/${selectedActa.id}`);
                        setSelectedActa(data);
                        setIsEditing(false);
                      } catch (error) {
                        console.error("Error saving votos", error);
                        alert("Error al guardar los votos");
                      } finally {
                        setIsSaving(false);
                      }
                    }}
                    className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors"
                    disabled={isSaving}
                  >
                    {isSaving ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-5 bg-[#fdfdfd]">
            {['REGIONAL', 'PROVINCIAL', 'DISTRITAL'].map((cargo) => {
              const votosCargo = selectedActa.votos?.filter((v: any) => v.nivel === cargo)
                .sort((a: any, b: any) => {
                  if (a.tipo !== 'CANDIDATO') return 1;
                  if (b.tipo !== 'CANDIDATO') return -1;
                  return b.cantidad - a.cantidad;
                });

              if (!votosCargo || votosCargo.length === 0) return null;

              return (
                <div key={cargo} className="mb-6 last:mb-0">
                  <h4 className="text-[13px] font-bold text-white bg-slate-800 px-3 py-1.5 rounded-t-lg uppercase tracking-wide flex justify-between items-center">
                    <span>Nivel {cargo.toLowerCase()}</span>
                    <span className="text-[10px] bg-slate-700 px-2 py-0.5 rounded">
                      Suma: {votosCargo.reduce((acc: number, v: any) => acc + (isEditing ? (editedVotos[v.id] ?? v.cantidad) : v.cantidad), 0)}
                    </span>
                  </h4>
                  <div className="border border-slate-200 border-t-0 rounded-b-lg overflow-hidden bg-white">
                    <table className="w-full text-sm">
                      <tbody>
                        {votosCargo.map((voto: any, i: number) => (
                          <tr key={voto.id} className={`border-b border-slate-100 last:border-0 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                            <td className="p-2.5 px-4 font-medium text-slate-700">
                              {voto.tipo === 'CANDIDATO' ? (voto.candidato?.partido?.nombre || 'Independiente') : (voto.tipo === 'BLANCO' ? 'Votos en Blanco' : voto.tipo === 'NULO' ? 'Votos Nulos' : 'Votos Impugnados')}
                            </td>
                            <td className="p-2.5 px-4 text-right">
                              {isEditing ? (
                                <input 
                                  type="number" 
                                  min="0"
                                  value={editedVotos[voto.id] ?? voto.cantidad}
                                  onChange={(e) => setEditedVotos(prev => ({ ...prev, [voto.id]: parseInt(e.target.value) || 0 }))}
                                  className="w-16 text-center text-sm border border-blue-400 rounded px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              ) : (
                                <span className="inline-block min-w-[32px] text-center font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-800 border border-slate-200">
                                  {voto.cantidad}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
            
            {selectedActa.observaciones && (
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="text-xs font-bold text-yellow-800 uppercase mb-1">Observaciones del Personero</h4>
                <p className="text-sm text-yellow-900">{selectedActa.observaciones}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
