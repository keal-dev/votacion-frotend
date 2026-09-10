"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { mesaService } from "@/services/mesa.service";
import { candidatoService } from "@/services/candidato.service";
import { actaService } from "@/services/acta.service";
import { Mesa } from "@/types/mesa.types";
import { Candidato, CargoCandidato } from "@/types/candidato.types";
import { useVotosStore } from "@/store/votosStore";
import ConfirmModal from "@/components/modals/ConfirmModal";

// Componente para inputs conectado a Zustand, extraído para evitar re-renders de toda la página
const NumberInput = ({ mesaId, inputId }: { mesaId: string, inputId: string }) => {
  const value = useVotosStore((state) => state.votos[`${mesaId}_${inputId}`] || '');
  const setVoto = useVotosStore((state) => state.setVoto);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Solo permite números
    const val = e.target.value.replace(/[^0-9]/g, '');
    setVoto(mesaId, inputId, val);
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      className="w-[70px] text-center p-[8px] border border-[#d8dde3] rounded-[7px] font-bold outline-none focus:border-green focus:ring-2 focus:ring-[#e6f6ec]"
      value={value}
      onChange={handleChange}
      placeholder="0"
    />
  );
};

// Componente para calcular el total sin renderizar toda la página
const TotalVotos = ({ mesaId, candidatos, nivel, electores }: { mesaId: string, candidatos: Candidato[], nivel: string, electores?: number }) => {
  const total = useVotosStore((state) => {
    let sum = 0;
    candidatos.forEach(c => {
      sum += parseInt(state.votos[`${mesaId}_${c.id}`]) || 0;
    });
    sum += parseInt(state.votos[`${mesaId}_blanco_${nivel}`]) || 0;
    sum += parseInt(state.votos[`${mesaId}_nulo_${nivel}`]) || 0;
    sum += parseInt(state.votos[`${mesaId}_impugnado_${nivel}`]) || 0;
    return sum;
  });

  return (
    <span className="flex items-center justify-center gap-[4px] whitespace-nowrap">
      {total}
      {electores ? <span className="text-[13px] text-[#64748b] font-bold">/ {electores}</span> : null}
    </span>
  );
};

// Componente para subir múltiples actas
const ActaUploader = ({ onFilesChange }: { onFilesChange: (files: File[]) => void }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`El archivo ${file.name} excede los 5 MB.`);
        return false;
      }
      return true;
    });

    const updatedFiles = [...files, ...validFiles];
    setFiles(updatedFiles);
    
    const newPreviews = validFiles.map(file => URL.createObjectURL(file));
    setPreviews([...previews, ...newPreviews]);
    
    onFilesChange(updatedFiles);
  };

  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
    
    const newPreviews = [...previews];
    URL.revokeObjectURL(newPreviews[index]); // Liberar memoria
    newPreviews.splice(index, 1);
    setPreviews(newPreviews);
    
    onFilesChange(newFiles);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  return (
    <div className="bg-white border border-line rounded-xl p-[18px] shadow-[0_1px_2px_rgba(0,0,0,0.03)] h-full flex flex-col">
      <div className="text-[15px] font-extrabold mb-[14px]">
        Fotos de las Actas
      </div>
      
      <div className="mb-4 bg-blue-50 text-blue-700 text-[12px] p-3 rounded-lg font-medium text-left shadow-sm">
        💡 <b>Tip:</b> Toma la foto con tu cámara primero para tener un respaldo en tu galería.
      </div>
      
      {previews.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-4">
          {previews.map((preview, index) => (
            <div key={index} className="w-20 h-20 border border-line rounded-[10px] overflow-hidden relative group shrink-0 shadow-sm">
              <img src={preview} alt={`Acta ${index + 1}`} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button 
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  className="bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold cursor-pointer shadow-sm hover:bg-red-600 transition-colors"
                  title="Quitar"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div 
        className={`border-2 border-dashed rounded-[10px] p-[20px] text-center transition-colors cursor-pointer flex flex-col items-center justify-center flex-1 min-h-[150px] ${isDragging ? "border-green bg-[#f3faf5]" : "border-[#cfd6dd] text-[#667085] hover:bg-[#fafbfc]"}`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <span className="text-[24px] mb-[8px]">{previews.length > 0 ? "➕" : "📸"}</span>
        <strong className="block text-[#344054] mb-[7px]">
          {previews.length > 0 ? "Agrega otra foto o selecciona desde tu dispositivo" : "Arrastra las fotos aquí o selecciona archivos desde tu dispositivo"}
        </strong>
        <button 
          type="button" 
          className="border border-line rounded-lg px-[15px] py-[10px] font-bold cursor-pointer bg-white text-[#344054] mt-[12px] hover:bg-gray-50 shadow-sm"
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
        >
          {previews.length > 0 ? "Seleccionar más" : "Seleccionar archivos"}
        </button>
        <small className="block mt-[12px] text-[12px]">
          JPG, PNG · Máx. 5 MB c/u
        </small>
      </div>
      
      <input 
        type="file" 
        accept="image/jpeg, image/png"
        multiple
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
      />
    </div>
  );
};

const CustomAlertModal = ({ 
  isOpen, 
  title, 
  message, 
  type, 
  onConfirm 
}: { 
  isOpen: boolean, 
  title: string, 
  message: string, 
  type: 'success' | 'error' | 'warning',
  onConfirm: () => void 
}) => {
  if (!isOpen) return null;
  
  const icons = {
    success: <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-2xl mb-3 mx-auto font-bold">✓</div>,
    error: <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-2xl mb-3 mx-auto font-bold">✕</div>,
    warning: <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 text-2xl mb-3 mx-auto font-bold">!</div>
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xs p-5 text-center transform transition-all animate-in zoom-in-95 duration-200">
        {icons[type]}
        <h3 className="text-lg font-extrabold text-[#172b4d] mb-1">{title}</h3>
        <p className="text-[#52637d] text-sm mb-4">{message}</p>
        <button 
          onClick={onConfirm}
          className={`w-full py-2.5 px-4 rounded-xl font-bold text-white transition-colors ${
            type === 'success' ? 'bg-green hover:bg-[#128a44]' :
            type === 'error' ? 'bg-red-600 hover:bg-red-700' :
            'bg-yellow-500 hover:bg-yellow-600'
          }`}
        >
          Entendido
        </button>
      </div>
    </div>
  );
};

export default function VotosPage() {
  const params = useParams();
  const router = useRouter();
  const mesaId = params.mesaId as string;
  const [mesa, setMesa] = useState<Mesa | null>(null);
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [activeTab, setActiveTab] = useState("regional");
  const [loading, setLoading] = useState(true);
  const [actaFiles, setActaFiles] = useState<File[]>([]);
  const [observaciones, setObservaciones] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning';
    onConfirm?: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "warning"
  });

  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'warning', onConfirm?: () => void) => {
    setModalConfig({
      isOpen: true,
      title,
      message,
      type,
      onConfirm: () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        if (onConfirm) onConfirm();
      }
    });
  };

  useEffect(() => {
    if (mesaId) {
      Promise.all([
        mesaService.getMyMesas(),
        candidatoService.getByMesa(mesaId)
      ]).then(([mesasResponse, candidatosResponse]) => {
        const found = mesasResponse.find(m => m.id === mesaId);
        if (found) setMesa(found);
        setCandidatos(candidatosResponse);
        setLoading(false);
      }).catch(err => {
        console.error("Error loading mesa data:", err);
        setLoading(false);
      });
    }
  }, [mesaId]);

  if (loading) {
    return <div className="p-8 text-center text-muted">Cargando datos de la mesa y candidatos...</div>;
  }

  if (!mesa) {
    return <div className="p-8 text-center text-red-500 font-bold">Mesa no encontrada o no asignada a ti.</div>;
  }

  const distritales = candidatos.filter(c => c.cargo === CargoCandidato.DISTRITAL);
  const provinciales = candidatos.filter(c => c.cargo === CargoCandidato.PROVINCIAL);
  const regionales = candidatos.filter(c => c.cargo === CargoCandidato.REGIONAL);

  const handleSubmit = async () => {
    if (actaFiles.length === 0) {
      showAlert("Foto Requerida", "Por favor, selecciona o toma la foto de las actas antes de enviar.", "warning");
      return;
    }
    setShowConfirmSubmit(true);
  };

  const executeSubmit = async () => {
    setShowConfirmSubmit(false);
    
    // Filtrar los votos para enviar solo los de esta mesa
    const todosLosVotos = useVotosStore.getState().votos;
    const votosDeMesa: Record<string, string> = {};
    
    for (const key in todosLosVotos) {
      if (key.startsWith(`${mesaId}_`)) {
        votosDeMesa[key] = todosLosVotos[key];
      }
    }

    try {
      setIsSubmitting(true);
      const res = await actaService.enviarActa(mesaId, actaFiles, observaciones, votosDeMesa);
      setIsSubmitting(false); // Detener el loader

      if (res.fotosFallidas) {
        showAlert("¡Acta Guardada!", "Acta guardada, pero las fotos fallaron. Súbelas más tarde.", "warning", () => {
          router.push("/personero"); // Volver al dashboard
        });
      } else {
        showAlert("¡Guardado!", "Actas y fotos guardadas exitosamente.", "success", () => {
          router.push("/personero"); // Volver al dashboard
        });
      }
    } catch (error: any) {
      console.error("Error al enviar el acta:", error);
      const errorMsg = error.response?.data?.message || "Ocurrió un error al enviar el acta. Por favor, intenta nuevamente.";
      showAlert("Error al Guardar", errorMsg, "error");
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-[16px] md:mb-[20px]">
        <div className="title">
          <h1 className="text-[22px] md:text-[28px] font-extrabold text-[#172b4d] tracking-tight flex items-center flex-wrap gap-2">
            <span>Mesa {mesa.numero_mesa}</span>
            <span className="hidden md:inline-flex items-center gap-[6px] px-[12px] py-[7px] rounded-[20px] text-[12px] font-bold bg-[#e6f6ec] text-green-2">● Habilitada</span>
            {mesa.cantidad_electores > 0 && (
              <span className="inline-flex items-center gap-[6px] px-[10px] py-[4px] md:px-[12px] md:py-[7px] rounded-[20px] text-[11px] md:text-[12px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                👥 {mesa.cantidad_electores} Electores Hábiles
              </span>
            )}
          </h1>
          <p className="text-muted mt-[2px] md:mt-[5px] text-[13px] md:text-[15px]">
            {mesa.local?.nombre || "Local desconocido"} <span className="hidden md:inline">· {mesa.local?.direccion}</span>
          </p>
        </div>
        <div className="hidden md:flex items-center gap-[12px]">
          <span className="inline-flex items-center gap-[6px] px-[12px] py-[7px] rounded-[20px] text-[12px] font-bold bg-[#e6f6ec] text-green-2">Jornada Electoral Activa</span>
          <span className="text-[14px]">26 de mayo de 2025 · 10:45 a. m.</span>
        </div>
      </div>

      <div className="rounded-xl">

        {/* TAB NAVIGATION */}
        <div className="inline-flex bg-[#f8fafc] p-1.5 rounded-xl mb-6 relative z-10 border border-[#e2e8f0] overflow-x-auto hide-scrollbar shadow-inner w-full md:w-auto">
          <button
            onClick={() => setActiveTab("regional")}
            className={`flex-1 md:flex-none py-[10px] px-[24px] font-semibold text-[14px] rounded-lg transition-all duration-300 ease-out whitespace-nowrap ${activeTab === "regional" ? "bg-white text-green shadow-[0_2px_8px_-2px_rgba(0,0,0,0.12)] ring-1 ring-black/[0.04] scale-100" : "text-[#64748b] hover:text-[#334155] hover:bg-[#f1f5f9] scale-[0.98]"}`}
          >
            Regional
          </button>
          <button
            onClick={() => setActiveTab("provincial")}
            className={`flex-1 md:flex-none py-[10px] px-[24px] font-semibold text-[14px] rounded-lg transition-all duration-300 ease-out whitespace-nowrap ${activeTab === "provincial" ? "bg-white text-green shadow-[0_2px_8px_-2px_rgba(0,0,0,0.12)] ring-1 ring-black/[0.04] scale-100" : "text-[#64748b] hover:text-[#334155] hover:bg-[#f1f5f9] scale-[0.98]"}`}
          >
            Provincial
          </button>
          <button
            onClick={() => setActiveTab("distrital")}
            className={`flex-1 md:flex-none py-[10px] px-[24px] font-semibold text-[14px] rounded-lg transition-all duration-300 ease-out whitespace-nowrap ${activeTab === "distrital" ? "bg-white text-green shadow-[0_2px_8px_-2px_rgba(0,0,0,0.12)] ring-1 ring-black/[0.04] scale-100" : "text-[#64748b] hover:text-[#334155] hover:bg-[#f1f5f9] scale-[0.98]"}`}
          >
            Distrital
          </button>
        </div>

        {/* SINGLE CARD CONTENT */}
        <div className="bg-white border border-line rounded-xl shadow-[0_8px_30px_-4px_rgba(0,0,0,0.04)] overflow-hidden mb-[24px]">

          {activeTab === "distrital" && (
            <div className="animate-in fade-in duration-200">
              {distritales.length === 0 ? (
                <div className="p-8 text-center text-muted">No hay candidatos para este nivel de elección en esta mesa.</div>
              ) : (
                <>
                  {distritales.map((candidato, index) => (
                    <div key={candidato.id} className="grid grid-cols-[28px_36px_1fr_78px] items-center p-[10px_12px] border-b border-[#edf0f2] hover:bg-slate-50 transition-colors">
                      <b>{index + 1}</b>
                      <div className="w-[30px] h-[30px] bg-[#f2f4f7] rounded-full border border-[#d8dde3] flex items-center justify-center text-[11px] overflow-hidden">
                        {candidato.partido?.logo_url ? (
                          <img src={candidato.partido.logo_url} alt="logo" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[#98a2b3]">🖼️</span>
                        )}
                      </div>
                      <div className="flex flex-col justify-center">
                        <span className="text-[#344054] font-medium leading-tight">{candidato.partido?.nombre || "Independiente"}</span>
                        <span className="text-[#667085] text-[11px] leading-tight mt-[2px]">{candidato.nombre} {candidato.apellidos}</span>
                      </div>
                      <NumberInput mesaId={mesaId} inputId={candidato.id} />
                    </div>
                  ))}

                  <div className="grid grid-cols-[28px_36px_1fr_78px] items-center p-[10px_12px] border-b border-[#edf0f2] bg-[#fff9e9]">
                    <span></span>
                    <span></span>
                    <span>Votos en Blanco</span>
                    <NumberInput mesaId={mesaId} inputId="blanco_distrital" />
                  </div>
                  <div className="grid grid-cols-[28px_36px_1fr_78px] items-center p-[10px_12px] border-b border-[#edf0f2] bg-[#fff0f0]">
                    <span></span>
                    <span></span>
                    <span>Votos Nulos</span>
                    <NumberInput mesaId={mesaId} inputId="nulo_distrital" />
                  </div>
                  <div className="grid grid-cols-[28px_36px_1fr_78px] items-center p-[10px_12px] border-b border-[#edf0f2] bg-[#f8f9fa]">
                    <span></span>
                    <span></span>
                    <span>Votos Impugnados</span>
                    <NumberInput mesaId={mesaId} inputId="impugnado_distrital" />
                  </div>
                  <div className="grid grid-cols-[28px_36px_1fr_78px] items-center p-[10px_12px] font-extrabold bg-[#f3faf5] text-green-2">
                    <span></span>
                    <span></span>
                    <span>Total de votos Distrital</span>
                    <div className="w-[100px] text-center text-[16px] justify-self-center">
                      <TotalVotos mesaId={mesaId} candidatos={distritales} nivel="distrital" electores={mesa.cantidad_electores} />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === "provincial" && (
            <div className="animate-in fade-in duration-200">
              {provinciales.length === 0 ? (
                <div className="p-8 text-center text-muted">No hay candidatos para este nivel de elección en esta mesa.</div>
              ) : (
                <>
                  {provinciales.map((candidato, index) => (
                    <div key={candidato.id} className="grid grid-cols-[28px_36px_1fr_78px] items-center p-[10px_12px] border-b border-[#edf0f2] hover:bg-slate-50 transition-colors">
                      <b>{index + 1}</b>
                      <div className="w-[30px] h-[30px] bg-[#f2f4f7] rounded-full border border-[#d8dde3] flex items-center justify-center text-[11px] overflow-hidden">
                        {candidato.partido?.logo_url ? (
                          <img src={candidato.partido.logo_url} alt="logo" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[#98a2b3]">🖼️</span>
                        )}
                      </div>
                      <div className="flex flex-col justify-center">
                        <span className="text-[#344054] font-medium leading-tight">{candidato.partido?.nombre || "Independiente"}</span>
                        <span className="text-[#667085] text-[11px] leading-tight mt-[2px]">{candidato.nombre} {candidato.apellidos}</span>
                      </div>
                      <NumberInput mesaId={mesaId} inputId={candidato.id} />
                    </div>
                  ))}

                  <div className="grid grid-cols-[28px_36px_1fr_78px] items-center p-[10px_12px] border-b border-[#edf0f2] bg-[#fff9e9]">
                    <span></span>
                    <span></span>
                    <span>Votos en Blanco</span>
                    <NumberInput mesaId={mesaId} inputId="blanco_provincial" />
                  </div>
                  <div className="grid grid-cols-[28px_36px_1fr_78px] items-center p-[10px_12px] border-b border-[#edf0f2] bg-[#fff0f0]">
                    <span></span>
                    <span></span>
                    <span>Votos Nulos</span>
                    <NumberInput mesaId={mesaId} inputId="nulo_provincial" />
                  </div>
                  <div className="grid grid-cols-[28px_36px_1fr_78px] items-center p-[10px_12px] border-b border-[#edf0f2] bg-[#f8f9fa]">
                    <span></span>
                    <span></span>
                    <span>Votos Impugnados</span>
                    <NumberInput mesaId={mesaId} inputId="impugnado_provincial" />
                  </div>
                  <div className="grid grid-cols-[28px_36px_1fr_78px] items-center p-[10px_12px] font-extrabold bg-[#f3faf5] text-green-2">
                    <span></span>
                    <span></span>
                    <span>Total de votos Provincial</span>
                    <div className="w-[100px] text-center text-[16px] justify-self-center">
                      <TotalVotos mesaId={mesaId} candidatos={provinciales} nivel="provincial" electores={mesa.cantidad_electores} />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === "regional" && (
            <div className="animate-in fade-in duration-200">
              {regionales.length === 0 ? (
                <div className="p-8 text-center text-muted">No hay candidatos para este nivel de elección en esta mesa.</div>
              ) : (
                <>
                  {regionales.map((candidato, index) => (
                    <div key={candidato.id} className="grid grid-cols-[28px_36px_1fr_78px] items-center p-[10px_12px] border-b border-[#edf0f2] hover:bg-slate-50 transition-colors">
                      <b>{index + 1}</b>
                      <div className="w-[30px] h-[30px] bg-[#f2f4f7] rounded-full border border-[#d8dde3] flex items-center justify-center text-[11px] overflow-hidden">
                        {candidato.partido?.logo_url ? (
                          <img src={candidato.partido.logo_url} alt="logo" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[#98a2b3]">🖼️</span>
                        )}
                      </div>
                      <div className="flex flex-col justify-center">
                        <span className="text-[#344054] font-medium leading-tight">{candidato.partido?.nombre || "Independiente"}</span>
                        <span className="text-[#667085] text-[11px] leading-tight mt-[2px]">{candidato.nombre} {candidato.apellidos}</span>
                      </div>
                      <NumberInput mesaId={mesaId} inputId={candidato.id} />
                    </div>
                  ))}

                  <div className="grid grid-cols-[28px_36px_1fr_78px] items-center p-[10px_12px] border-b border-[#edf0f2] bg-[#fff9e9]">
                    <span></span>
                    <span></span>
                    <span>Votos en Blanco</span>
                    <NumberInput mesaId={mesaId} inputId="blanco_regional" />
                  </div>
                  <div className="grid grid-cols-[28px_36px_1fr_78px] items-center p-[10px_12px] border-b border-[#edf0f2] bg-[#fff0f0]">
                    <span></span>
                    <span></span>
                    <span>Votos Nulos</span>
                    <NumberInput mesaId={mesaId} inputId="nulo_regional" />
                  </div>
                  <div className="grid grid-cols-[28px_36px_1fr_78px] items-center p-[10px_12px] border-b border-[#edf0f2] bg-[#f8f9fa]">
                    <span></span>
                    <span></span>
                    <span>Votos Impugnados</span>
                    <NumberInput mesaId={mesaId} inputId="impugnado_regional" />
                  </div>
                  <div className="grid grid-cols-[28px_36px_1fr_78px] items-center p-[10px_12px] font-extrabold bg-[#f3faf5] text-green-2">
                    <span></span>
                    <span></span>
                    <span>Total de votos Regional</span>
                    <div className="w-[100px] text-center text-[16px] justify-self-center">
                      <TotalVotos mesaId={mesaId} candidatos={regionales} nivel="regional" electores={mesa.cantidad_electores} />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

        </div>

        {/* BOTTOM SECTIONS */}
        <div className="grid gap-[18px] grid-cols-1 md:grid-cols-[1.6fr_1fr]">
          <ActaUploader onFilesChange={setActaFiles} />
          
          <div className="bg-white border border-line rounded-xl p-[18px] shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
            <div className="text-[15px] font-extrabold mb-[14px]">
              Observaciones <span className="font-normal text-[#667085]">(opcional)</span>
            </div>
            <textarea
              className="w-full p-[10px] border border-line rounded-lg outline-none resize-y"
              rows={6}
              placeholder="Escribe alguna observación sobre el desarrollo de la votación..."
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              disabled={isSubmitting}
            ></textarea>
          </div>
        </div>

        <div className="flex justify-end gap-[10px] mt-[18px]">
          <button 
            type="button"
            onClick={() => router.back()}
            disabled={isSubmitting}
            className="border border-line rounded-lg px-[15px] py-[10px] font-bold cursor-pointer bg-white text-[#344054] disabled:opacity-50"
          >
            Cancelar
          </button>
          <button 
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="border-0 rounded-lg px-[15px] py-[10px] font-bold cursor-pointer bg-green text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
            {isSubmitting ? "Enviando..." : "Guardar y Enviar Acta →"}
          </button>
        </div>

        <div className="p-[12px] rounded-[9px] bg-[#fff8e7] border border-[#f5d98b] text-[#8a5a00] text-[12px] mt-[14px]">
          🛡️ <strong>Importante:</strong> verifica cuidadosamente los datos antes
          de continuar. Una vez confirmados, los resultados no podrán modificarse.
        </div>
      </div>
      <CustomAlertModal 
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        onConfirm={modalConfig.onConfirm || (() => setModalConfig(prev => ({ ...prev, isOpen: false })))}
      />
      <ConfirmModal 
        isOpen={showConfirmSubmit}
        title="Confirmar envío"
        message="¿Estás seguro de que deseas guardar y enviar esta acta? Una vez enviada, la información será registrada permanentemente en el sistema."
        confirmText="Sí, guardar acta"
        cancelText="Revisar de nuevo"
        type="info"
        onConfirm={executeSubmit}
        onCancel={() => setShowConfirmSubmit(false)}
        loading={isSubmitting}
      />
      
      {isSubmitting && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#0f172a]/40 backdrop-blur-[2px] transition-all">
          <div className="w-16 h-16 border-[5px] border-white/20 border-t-white rounded-full animate-spin shadow-[0_0_15px_rgba(0,0,0,0.1)]"></div>
          <span className="mt-4 text-white font-bold text-lg drop-shadow-md tracking-wide">Procesando...</span>
        </div>
      )}
      

    </>
  );
}
