import { useState, useRef, useEffect } from 'react';
import axiosInstance from '@/utils/axios';
import { candidatoService } from '@/services/candidato.service';
import { partidoService } from '@/services/partido.service';
import { Candidato, CargoCandidato } from '@/types/candidato.types';
import { Partido } from '@/types/partido.types';
import { Election } from '@/types/election.types';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import ImageSearchOutlinedIcon from '@mui/icons-material/ImageSearchOutlined';

interface Props {
  isOpen: boolean;
  candidato: Candidato | null;
  activeElection: Election | null;
  candidatos: Candidato[];
  onClose: () => void;
  onSuccess: (warning?: boolean) => void;
}

export default function EditCandidatoModal({ isOpen, candidato, activeElection, candidatos, onClose, onSuccess }: Props) {
  const [nombre, setNombre] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [dni, setDni] = useState('');
  const [cargo, setCargo] = useState<CargoCandidato>(CargoCandidato.REGIONAL);
  const [region, setRegion] = useState('');
  const [provincia, setProvincia] = useState('');
  const [distrito, setDistrito] = useState('');
  const [partidoId, setPartidoId] = useState('');
  
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [ubicaciones, setUbicaciones] = useState<{region: string, provincia: string, distrito: string}[]>([]);
  const [regiones, setRegiones] = useState<string[]>([]);
  const [provincias, setProvincias] = useState<string[]>([]);
  const [distritos, setDistritos] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && activeElection) {
      loadPartidos();
      loadUbicaciones();
    }
  }, [isOpen, activeElection]);

  const loadUbicaciones = async () => {
    try {
        const { data } = await axiosInstance.get('/mesas/ubicaciones');
        setUbicaciones(data);
        const uniqueRegiones = Array.from(new Set(data.map((u: any) => u.region))) as string[];
        setRegiones(uniqueRegiones.filter(Boolean));
    } catch (error) {
        console.error("Error cargando ubicaciones:", error);
    }
  };

  useEffect(() => {
    const uniqueProvincias = Array.from(new Set(ubicaciones.filter(u => u.region === region).map(u => u.provincia))) as string[];
    setProvincias(uniqueProvincias.filter(Boolean));
    if (region && !uniqueProvincias.includes(provincia) && !candidato) setProvincia('');
  }, [region, ubicaciones]);

  useEffect(() => {
    const uniqueDistritos = Array.from(new Set(ubicaciones.filter(u => u.region === region && u.provincia === provincia).map(u => u.distrito))) as string[];
    setDistritos(uniqueDistritos.filter(Boolean));
    if (provincia && !uniqueDistritos.includes(distrito) && !candidato) setDistrito('');
  }, [provincia, region, ubicaciones]);

  useEffect(() => {
    if (candidato) {
      setNombre(candidato.nombre);
      setApellidos(candidato.apellidos);
      setDni(candidato.dni);
      setCargo(candidato.cargo);
      setRegion(candidato.region || '');
      setProvincia(candidato.provincia || '');
      setDistrito(candidato.distrito || '');
      setPartidoId(candidato.partido.id);
      
      if (candidato.foto_url) {
        const BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001';
        const absoluteUrl = candidato.foto_url.startsWith('http') ? candidato.foto_url : `${BASE_URL}${candidato.foto_url}`;
        setPreviewUrl(absoluteUrl);
      } else {
        setPreviewUrl(null);
      }
      setFotoFile(null);
    }
  }, [candidato]);

  const loadPartidos = async () => {
    if (!activeElection) return;
    try {
      const data = await partidoService.getAllByElection(activeElection.id);
      setPartidos(data);
    } catch (error) {
      console.error("Error cargando partidos:", error);
    }
  };

  if (!isOpen || !candidato) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFotoFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!nombre || !apellidos || !dni || !partidoId) {
      setError('Todos los campos marcados con * son obligatorios.');
      return;
    }

    if (dni.length !== 8) {
      setError('El DNI debe tener exactamente 8 dígitos.');
      return;
    }

    const dniYaExiste = candidatos.find(c => c.dni === dni && c.id !== candidato.id);
    if (dniYaExiste) {
      setError('Ya existe un candidato registrado con este DNI.');
      return;
    }

    const yaExiste = candidatos.find(c => {
      if (c.id === candidato.id) return false;
      if (c.partido.id !== partidoId || c.cargo !== cargo) return false;

      if (cargo === CargoCandidato.REGIONAL) {
        return c.region === region;
      }
      if (cargo === CargoCandidato.PROVINCIAL) {
        return c.region === region && c.provincia === provincia;
      }
      if (cargo === CargoCandidato.DISTRITAL) {
        return c.region === region && c.provincia === provincia && c.distrito === distrito;
      }
      return false;
    });

    if (yaExiste) {
      setError('Este partido político ya cuenta con un candidato inscrito para este mismo cargo y jurisdicción.');
      return;
    }

    setLoading(true);
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      let uploadedFotoUrl = '';
      if (fotoFile) {
        const uploadResult = await candidatoService.uploadFoto(fotoFile);
        uploadedFotoUrl = uploadResult.fotoUrl;
      }

      const payload: any = {
        nombre,
        apellidos,
        dni,
        cargo,
        partidoId,
        region: region || undefined,
        provincia: cargo !== CargoCandidato.REGIONAL && provincia ? provincia : undefined,
        distrito: cargo === CargoCandidato.DISTRITAL && distrito ? distrito : undefined,
      };

      if (uploadedFotoUrl) {
        payload.fotoUrl = uploadedFotoUrl;
      }

      await candidatoService.update(candidato.id, payload);
      
      let hasWarning = false;
      if (cargo === CargoCandidato.REGIONAL && !region) hasWarning = true;
      if (cargo === CargoCandidato.PROVINCIAL && (!region || !provincia)) hasWarning = true;
      if (cargo === CargoCandidato.DISTRITAL && (!region || !provincia || !distrito)) hasWarning = true;

      handleClose();
      onSuccess(hasWarning);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Error al actualizar el candidato');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError('');
    setFotoFile(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-[0_10px_35px_rgba(0,0,0,0.1)] overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-5 py-4 bg-[#f8fafc]">
          <h2 className="text-base font-extrabold text-[#172b4d]">Editar Candidato</h2>
          <button onClick={handleClose} className="text-[#52637d] hover:bg-slate-200 rounded-full p-1 transition-colors">
            <CloseIcon style={{ fontSize: 20 }} />
          </button>
        </div>

        {/* Form */}
        <div className="overflow-y-auto p-5 relative">
          {loading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/70 backdrop-blur-[1px] rounded-b-xl">
              <svg className="h-10 w-10 animate-spin text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="mt-3 text-sm font-bold text-blue-600">Guardando cambios...</span>
            </div>
          )}
            <form id="edit-candidato-form" onSubmit={handleSubmit}>
            {error && (
                <div className="mb-4 rounded bg-red-50 p-3 text-xs font-medium text-red-600 border border-red-200">
                {error}
                </div>
            )}

            {/* Upload Logo Area */}
            <div className="mb-5 flex flex-col items-center justify-center">
                <label className="mb-2 block text-[12px] font-bold text-[#071f43] self-start">Fotografía del Candidato (Opcional)</label>
                <div 
                onClick={() => !loading && fileInputRef.current?.click()}
                className={`relative flex h-24 w-24 ${loading ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:border-blue-500 hover:bg-blue-50'} items-center justify-center rounded-full border-2 border-dashed border-[#bdc8d5] bg-slate-50 overflow-hidden transition-colors group`}
                >
                {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                    <div className="flex flex-col items-center text-[#52637d] group-hover:text-blue-600">
                    <ImageSearchOutlinedIcon fontSize="small" />
                    <span className="text-[10px] font-bold mt-1">Subir Foto</span>
                    </div>
                )}
                {previewUrl && !loading && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <CloudUploadOutlinedIcon className="text-white" />
                    </div>
                )}
                </div>
                <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleImageChange}
                disabled={loading}
                />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="mb-1 block text-[12px] font-bold text-[#071f43]">Nombres *</label>
                    <input 
                        type="text" 
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        className="w-full p-2.5 text-[13px] border border-[#bdc8d5] rounded-md outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all" 
                  disabled={loading}
                    />
                </div>
                <div>
                    <label className="mb-1 block text-[12px] font-bold text-[#071f43]">Apellidos *</label>
                    <input 
                        type="text" 
                        value={apellidos}
                        onChange={(e) => setApellidos(e.target.value)}
                        className="w-full p-2.5 text-[13px] border border-[#bdc8d5] rounded-md outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all" 
                  disabled={loading}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="mb-1 block text-[12px] font-bold text-[#071f43]">DNI *</label>
                    <input 
                        type="text" 
                        maxLength={8}
                        value={dni}
                        onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))}
                        className="w-full p-2.5 text-[13px] border border-[#bdc8d5] rounded-md outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all" 
                  disabled={loading}
                    />
                </div>
                <div>
                    <label className="mb-1 block text-[12px] font-bold text-[#071f43]">Organización Política *</label>
                    <div className="relative" ref={dropdownRef}>
                      <div 
                        onClick={() => !loading && setIsDropdownOpen(!isDropdownOpen)}
                        className={`w-full p-2.5 text-[13px] border border-[#bdc8d5] rounded-md outline-none bg-white flex items-center justify-between transition-all ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 hover:border-blue-400'}`}
                        tabIndex={0}
                      >
                        {partidoId ? (
                          <div className="flex items-center gap-2">
                            {(() => {
                              const selectedPartido = partidos.find(p => p.id === partidoId);
                              return selectedPartido ? (
                                <>
                                  {selectedPartido.logo_url ? (
                                    <img src={selectedPartido.logo_url} alt="Logo" className="w-5 h-5 object-contain rounded-full border border-line" />
                                  ) : (
                                    <div className="w-5 h-5 bg-slate-200 rounded-full flex items-center justify-center text-[8px] font-bold text-slate-500">?</div>
                                  )}
                                  <span className="truncate max-w-[150px]" title={selectedPartido.nombre}>{selectedPartido.nombre}</span>
                                </>
                              ) : <span className="text-slate-400">Seleccionar...</span>;
                            })()}
                          </div>
                        ) : (
                          <span className="text-slate-400">Seleccione un partido</span>
                        )}
                        <svg className={`w-4 h-4 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                      
                      {isDropdownOpen && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-[#bdc8d5] rounded-md shadow-lg max-h-48 overflow-y-auto">
                          {partidos.map(p => (
                            <div 
                              key={p.id}
                              onClick={() => {
                                setPartidoId(p.id);
                                setIsDropdownOpen(false);
                              }}
                              className={`flex items-center gap-2 px-2.5 py-1.5 text-[12px] cursor-pointer hover:bg-blue-50 transition-colors ${partidoId === p.id ? 'bg-blue-50/50 font-bold text-blue-700' : 'text-[#172b4d]'}`}
                            >
                              {p.logo_url ? (
                                <img src={p.logo_url} alt="Logo" className="w-5 h-5 object-contain rounded-full border border-line bg-white" />
                              ) : (
                                <div className="w-5 h-5 bg-slate-200 rounded-full flex items-center justify-center text-[9px] font-bold text-slate-500">?</div>
                              )}
                              <span className="truncate">{p.nombre}</span>
                            </div>
                          ))}
                          {partidos.length === 0 && (
                            <div className="p-3 text-center text-slate-500 text-[12px]">No hay partidos registrados</div>
                          )}
                        </div>
                      )}
                    </div>
                </div>
            </div>

            <div className="mb-4">
                <label className="mb-1 block text-[12px] font-bold text-[#071f43]">Cargo al que postula *</label>
                <select
                    value={cargo}
                    onChange={(e) => setCargo(e.target.value as CargoCandidato)}
                    className="w-full p-2.5 text-[13px] border border-[#bdc8d5] rounded-md outline-none focus:border-blue-500 bg-white"
                disabled={loading}
                >
                    <option value={CargoCandidato.REGIONAL}>Gobernador Regional</option>
                    <option value={CargoCandidato.PROVINCIAL}>Alcalde Provincial</option>
                    <option value={CargoCandidato.DISTRITAL}>Alcalde Distrital</option>
                </select>
            </div>

            {/* Ubicación Geográfica según el cargo */}
            <div className="grid grid-cols-3 gap-3 mb-2">
                <div>
                    <label className="mb-1 block text-[12px] font-bold text-[#071f43]">Región (Opcional)</label>
                    <select
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                        className="w-full p-2.5 text-[13px] border border-[#bdc8d5] rounded-md outline-none focus:border-blue-500 bg-white"
                    >
                        <option value="">Seleccione Región</option>
                        {regiones.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                </div>
                {cargo !== CargoCandidato.REGIONAL && (
                    <div>
                        <label className="mb-1 block text-[12px] font-bold text-[#071f43]">Provincia (Opcional)</label>
                        <select
                            value={provincia}
                            onChange={(e) => setProvincia(e.target.value)}
                            disabled={!region && regiones.length > 0}
                            className="w-full p-2.5 text-[13px] border border-[#bdc8d5] rounded-md outline-none focus:border-blue-500 bg-white disabled:bg-slate-100"
                        >
                            <option value="">Seleccione Provincia</option>
                            {provincias.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                )}
                {cargo === CargoCandidato.DISTRITAL && (
                    <div>
                        <label className="mb-1 block text-[12px] font-bold text-[#071f43]">Distrito (Opcional)</label>
                        <select
                            value={distrito}
                            onChange={(e) => setDistrito(e.target.value)}
                            disabled={!provincia && provincias.length > 0}
                            className="w-full p-2.5 text-[13px] border border-[#bdc8d5] rounded-md outline-none focus:border-blue-500 bg-white disabled:bg-slate-100"
                        >
                            <option value="">Seleccione Distrito</option>
                            {distritos.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                )}
            </div>

            </form>
        </div>
        
        {/* Actions Footer */}
        <div className="flex justify-end gap-3 border-t border-line px-5 py-4 bg-[#f8fafc] relative z-20">
            <button 
                type="button" 
                onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 rounded-md text-[13px] font-bold text-[#52637d] border border-line hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
                Cancelar
            </button>
            <button 
                type="submit" 
                form="edit-candidato-form"
                disabled={loading}
            className="px-4 py-2 cursor-pointer rounded-md text-[13px] font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-90 flex items-center justify-center min-w-[160px] gap-2 shadow-sm"
            >
            {loading ? (
              <>
                <svg className="h-4 w-4 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Guardando...
              </>
            ) : 'Guardar Cambios'}
            </button>
        </div>
      </div>
    </div>
  );
}
