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
  onClose: () => void;
  onSuccess: (warning?: boolean) => void;
}

export default function EditCandidatoModal({ isOpen, candidato, activeElection, onClose, onSuccess }: Props) {
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

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('nombre', nombre);
      formData.append('apellidos', apellidos);
      formData.append('dni', dni);
      formData.append('cargo', cargo);
      formData.append('partidoId', partidoId);
      
      if (region) formData.append('region', region);
      if (cargo !== CargoCandidato.REGIONAL && provincia) formData.append('provincia', provincia);
      if (cargo === CargoCandidato.DISTRITAL && distrito) formData.append('distrito', distrito);
      
      if (fotoFile) formData.append('foto', fotoFile);

      await candidatoService.update(candidato.id, formData);
      
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
      <div className="w-full max-w-lg rounded-xl bg-white shadow-[0_10px_35px_rgba(0,0,0,0.1)] overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-5 py-4 bg-[#f8fafc]">
          <h2 className="text-base font-extrabold text-[#172b4d]">Editar Candidato</h2>
          <button onClick={handleClose} className="text-[#52637d] hover:bg-slate-200 rounded-full p-1 transition-colors">
            <CloseIcon style={{ fontSize: 20 }} />
          </button>
        </div>

        {/* Form */}
        <div className="overflow-y-auto p-5">
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
                onClick={() => fileInputRef.current?.click()}
                className="relative flex h-24 w-24 cursor-pointer items-center justify-center rounded-full border-2 border-dashed border-[#bdc8d5] bg-slate-50 overflow-hidden hover:border-blue-500 hover:bg-blue-50 transition-colors group"
                >
                {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                    <div className="flex flex-col items-center text-[#52637d] group-hover:text-blue-600">
                    <ImageSearchOutlinedIcon fontSize="small" />
                    <span className="text-[10px] font-bold mt-1">Subir Foto</span>
                    </div>
                )}
                {previewUrl && (
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
                    />
                </div>
                <div>
                    <label className="mb-1 block text-[12px] font-bold text-[#071f43]">Apellidos *</label>
                    <input 
                        type="text" 
                        value={apellidos}
                        onChange={(e) => setApellidos(e.target.value)}
                        className="w-full p-2.5 text-[13px] border border-[#bdc8d5] rounded-md outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all" 
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
                    />
                </div>
                <div>
                    <label className="mb-1 block text-[12px] font-bold text-[#071f43]">Organización Política *</label>
                    <select
                        value={partidoId}
                        onChange={(e) => setPartidoId(e.target.value)}
                        className="w-full p-2.5 text-[13px] border border-[#bdc8d5] rounded-md outline-none focus:border-blue-500 bg-white"
                    >
                        {partidos.map(p => (
                            <option key={p.id} value={p.id}>{p.nombre}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="mb-4">
                <label className="mb-1 block text-[12px] font-bold text-[#071f43]">Cargo al que postula *</label>
                <select
                    value={cargo}
                    onChange={(e) => setCargo(e.target.value as CargoCandidato)}
                    className="w-full p-2.5 text-[13px] border border-[#bdc8d5] rounded-md outline-none focus:border-blue-500 bg-white"
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
        <div className="flex justify-end gap-3 border-t border-line px-5 py-4 bg-[#f8fafc]">
            <button 
                type="button" 
                onClick={handleClose}
                className="px-4 py-2 rounded-md text-[13px] font-bold text-[#52637d] border border-line hover:bg-slate-50 transition-colors"
            >
                Cancelar
            </button>
            <button 
                type="submit" 
                form="edit-candidato-form"
                disabled={loading}
                className="px-4 py-2 rounded-md text-[13px] font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-70 flex items-center justify-center min-w-[120px]"
            >
                {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
        </div>
      </div>
    </div>
  );
}
