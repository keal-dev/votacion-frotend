"use client";

import { useEffect, useState, useRef } from "react";
import { useAuthStore } from "@/store/auth.store";
import axiosInstance from "@/utils/axios";
import FactCheckIcon from '@mui/icons-material/FactCheck';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ImageSearchIcon from '@mui/icons-material/ImageSearch';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
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
  const actaId = params.id as string;
  const [selectedActa, setSelectedActa] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState<string>('');
  const [transformOrigin, setTransformOrigin] = useState('center center');
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedVotos, setEditedVotos] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [expandedLevel, setExpandedLevel] = useState<string>('REGIONAL');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingFotos, setIsUploadingFotos] = useState(false);

  const handleUploadFotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setIsUploadingFotos(true);
    try {
      const formData = new FormData();
      Array.from(e.target.files).forEach(file => {
        formData.append('fotos_actas', file);
      });
      
      await axiosInstance.post(`/actas/${selectedActa.id}/fotos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // Refresh acta
      const { data } = await axiosInstance.get(`/actas/auditoria/${actaId}`);
      setSelectedActa(data);
      if (data.fotos && data.fotos.length > 0) {
        setActiveImage(data.fotos[0].url);
      }
      alert("Fotos subidas exitosamente");
    } catch (error) {
      console.error("Error uploading fotos", error);
      alert("Error al subir las fotos");
    } finally {
      setIsUploadingFotos(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteFoto = async (fotoId: string) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar esta foto permanentemente?")) return;
    try {
      await axiosInstance.delete(`/actas/${selectedActa.id}/fotos/${fotoId}`);

      const updatedFotos = selectedActa.fotos.filter((f: any) => f.id !== fotoId);
      setSelectedActa({ ...selectedActa, fotos: updatedFotos });

      const fotoActual = selectedActa.fotos.find((f: any) => f.id === fotoId);
      if (fotoActual && activeImage === fotoActual.url) {
        setActiveImage(updatedFotos.length > 0 ? updatedFotos[0].url : null);
      }
    } catch (error) {
      console.error("Error eliminando foto", error);
      alert("Error al eliminar la foto");
    }
  };

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
          const levels = ['REGIONAL', 'CONSEJERO', 'PROVINCIAL', 'DISTRITAL'];
          const firstLevel = levels.find(lvl => data?.votos?.some((v: any) => v.nivel === lvl));
          if (firstLevel) {
            setExpandedLevel(firstLevel);
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
    <div className="w-full mx-auto py-4 px-2 sm:px-4 animate-in fade-in slide-in-from-bottom-4 duration-500 h-[calc(100vh-80px)] flex flex-col">
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
                onMouseMove={(e) => {
                  const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
                  const x = ((e.clientX - left) / width) * 100;
                  const y = ((e.clientY - top) / height) * 100;
                  setTransformOrigin(`${x}% ${y}%`);
                }}
                onMouseLeave={() => setTransformOrigin('center center')}
                style={{ transformOrigin }}
                className="max-w-full max-h-full object-contain cursor-crosshair hover:scale-[2.5] transition-transform duration-200"
                title="Pasa el mouse para hacer zoom"
              />
              <div className="absolute top-4 left-4 flex gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingFotos}
                  className="bg-blue-600/80 text-white px-3 py-1.5 rounded-lg backdrop-blur-sm flex items-center gap-2 text-sm hover:bg-blue-600 transition-colors"
                >
                  <FileUploadIcon fontSize="small" /> {isUploadingFotos ? 'Subiendo...' : 'Añadir Fotos'}
                </button>
              </div>
              <div className="absolute top-4 right-4 flex gap-2">
                <button
                  onClick={() => {
                    const fotoId = selectedActa.fotos.find((f: any) => f.url === activeImage)?.id;
                    if (fotoId) handleDeleteFoto(fotoId);
                  }}
                  className="bg-red-600/80 text-white px-3 py-1.5 rounded-lg backdrop-blur-sm flex items-center gap-2 text-sm hover:bg-red-600 transition-colors"
                  title="Eliminar foto"
                >
                  <DeleteOutlineOutlinedIcon fontSize="small" /> Eliminar
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-white/50 text-sm gap-4">
              <p>No hay foto disponible para esta acta.</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingFotos}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold hover:bg-blue-700 transition-colors"
              >
                <FileUploadIcon fontSize="small" /> {isUploadingFotos ? 'Subiendo...' : 'Subir Fotos Ahora'}
              </button>
            </div>
          )}
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleUploadFotos} 
            multiple 
            accept="image/*" 
            className="hidden" 
          />
          
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
          <div className="bg-[#f6f8fa] border-b border-[#d0d7de] px-5 py-3 shrink-0 flex justify-end items-center">
            
            <div className="flex items-center gap-4">
              <div className="flex items-baseline gap-2">
                <span className="text-[11px] font-bold text-[#52637d] uppercase tracking-wider">Electores (Mesa):</span>
                <span className="text-[15px] font-black text-[#172b4d]">
                  {selectedActa.mesa?.cantidad_electores || 0}
                </span>
              </div>
              
              <div className="h-5 w-px bg-[#d0d7de]"></div>

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
                  className="bg-white text-[#172b4d] px-3 py-1.5 rounded-md text-xs font-bold border border-[#d0d7de] shadow-sm hover:bg-[#f3f4f6] transition-all"
                >
                  Editar Votos
                </button>
              ) : (
                <div className="flex gap-2">
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="bg-white text-[#52637d] px-3 py-1.5 rounded-md text-xs font-bold border border-[#d0d7de] hover:bg-[#f3f4f6] transition-all"
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
            {['REGIONAL', 'CONSEJERO', 'PROVINCIAL', 'DISTRITAL'].map((cargo) => {
              const votosCargo = selectedActa.votos?.filter((v: any) => v.nivel === cargo)
                .sort((a: any, b: any) => {
                  if (a.tipo !== 'CANDIDATO') return 1;
                  if (b.tipo !== 'CANDIDATO') return -1;
                  return b.cantidad - a.cantidad;
                });

              if (!votosCargo || votosCargo.length === 0) return null;

              return (
                <div key={cargo} className="mb-4 last:mb-0 border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
                  <div 
                    className="bg-slate-800 px-4 py-3 flex justify-between items-center cursor-pointer hover:bg-slate-700 transition-colors"
                    onClick={() => setExpandedLevel(expandedLevel === cargo ? '' : cargo)}
                  >
                    <div className="flex items-center gap-3">
                      {expandedLevel === cargo ? 
                        <KeyboardArrowUpIcon className="text-white/70" /> : 
                        <KeyboardArrowDownIcon className="text-white/70" />
                      }
                      <h4 className="text-[14px] font-bold text-white uppercase tracking-wide">
                        Nivel {cargo.toLowerCase()}
                      </h4>
                    </div>
                    <span className="text-[11px] font-bold bg-slate-700/50 text-white/90 px-2.5 py-1 rounded-md border border-slate-600">
                      Suma: {votosCargo.reduce((acc: number, v: any) => acc + (isEditing ? (editedVotos[v.id] ?? v.cantidad) : v.cantidad), 0)}
                    </span>
                  </div>
                  
                  {expandedLevel === cargo && (
                    <div className="border-t border-slate-200">
                      <table className="w-full text-sm">
                        <tbody>
                          {votosCargo.map((voto: any, i: number) => (
                            <tr key={voto.id} className={`border-b border-slate-100 last:border-0 ${voto.tipo !== 'CANDIDATO' ? 'bg-slate-50' : (i % 2 === 0 ? 'bg-white' : 'bg-slate-50/30')}`}>
                              <td className="p-1.5 px-4 font-medium text-slate-700">
                                {voto.tipo === 'CANDIDATO' ? (
                                  <div className="flex items-center gap-2">
                                    {voto.candidato?.partido?.logo_url && (
                                      <img src={getOptimizedUrl(voto.candidato.partido.logo_url, 'thumb')} alt="" className="w-5 h-5 rounded object-contain border border-slate-200 bg-white" />
                                    )}
                                    <span className="text-[#172b4d] font-bold">{voto.candidato?.partido?.nombre || 'Independiente'}</span>
                                  </div>
                                ) : voto.tipo === 'BLANCO' ? (
                                  <span className="inline-block px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-[11px] font-bold uppercase tracking-wide border border-slate-300">Votos en Blanco</span>
                                ) : voto.tipo === 'NULO' ? (
                                  <span className="inline-block px-2 py-0.5 bg-red-100 text-red-700 rounded text-[11px] font-bold uppercase tracking-wide border border-red-200">Votos Nulos</span>
                                ) : (
                                  <span className="inline-block px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-[11px] font-bold uppercase tracking-wide border border-orange-200">Votos Impugnados</span>
                                )}
                              </td>
                              <td className="p-1.5 px-4 text-right w-[120px]">
                                {isEditing ? (
                                  <input 
                                    type="number" 
                                    min="0"
                                    value={editedVotos[voto.id] ?? voto.cantidad}
                                    onChange={(e) => setEditedVotos(prev => ({ ...prev, [voto.id]: parseInt(e.target.value) || 0 }))}
                                    className="w-16 text-center text-[14px] font-bold border border-blue-400 rounded px-1.5 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50/50"
                                  />
                                ) : (
                                  <span className="inline-block min-w-[36px] text-center font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-800 border border-slate-200 shadow-sm text-[14px]">
                                    {voto.cantidad}
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
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
