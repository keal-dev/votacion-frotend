import { useState, useRef } from 'react';
import { partidoService } from '@/services/partido.service';
import { Election } from '@/types/election.types';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import ImageSearchOutlinedIcon from '@mui/icons-material/ImageSearchOutlined';

interface Props {
  isOpen: boolean;
  activeElection: Election | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreatePartidoModal({ isOpen, activeElection, onClose, onSuccess }: Props) {
  const [nombre, setNombre] = useState('');
  const [siglas, setSiglas] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!activeElection) {
      setError('No hay una elección activa para asociar este partido.');
      return;
    }

    if (!nombre || !siglas) {
        setError('El nombre y las siglas son obligatorios.');
        return;
    }

    if (!logoFile) {
      setError('Debes subir el logo oficial del partido.');
      return;
    }

    setLoading(true);
    try {
      // Agregar un pequeño retraso artificial para que se pueda apreciar la animación de carga
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Fase 1: Subir imagen
      let uploadedLogoUrl = '';
      if (logoFile) {
        const uploadResult = await partidoService.uploadLogo(logoFile);
        uploadedLogoUrl = uploadResult.logoUrl;
      }

      // Fase 2: Crear partido con los datos
      await partidoService.create({
        nombre,
        siglas,
        electionId: activeElection.id,
        logoUrl: uploadedLogoUrl || undefined
      });
      
      // Limpiar y cerrar
      setNombre('');
      setSiglas('');
      setLogoFile(null);
      setPreviewUrl(null);
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Error al crear el partido');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setNombre('');
    setSiglas('');
    setLogoFile(null);
    setPreviewUrl(null);
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-[0_10px_35px_rgba(0,0,0,0.1)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-5 py-4 bg-[#f8fafc]">
          <h2 className="text-base font-extrabold text-[#172b4d]">Inscribir Organización Política</h2>
          <button onClick={handleClose} disabled={loading} className="text-[#52637d] hover:bg-slate-200 rounded-full p-1 transition-colors disabled:opacity-50">
            <CloseIcon style={{ fontSize: 20 }} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 relative">
          {loading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/70 backdrop-blur-[1px] rounded-b-xl">
              <svg className="h-10 w-10 animate-spin text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="mt-3 text-sm font-bold text-blue-600">Inscribiendo partido...</span>
            </div>
          )}

          {error && (
            <div className="mb-4 rounded bg-red-50 p-3 text-xs font-medium text-red-600 border border-red-200">
              {error}
            </div>
          )}

          {/* Upload Logo Area */}
          <div className="mb-5 flex flex-col items-center justify-center">
            <label className="mb-2 block text-[12px] font-bold text-[#071f43] self-start">Logo del Partido *</label>
            <div 
              onClick={() => !loading && fileInputRef.current?.click()}
              className={`relative flex h-28 w-28 ${loading ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:border-[#138b49] hover:bg-green-50'} items-center justify-center rounded-full border-2 border-dashed border-[#bdc8d5] bg-slate-50 overflow-hidden transition-colors group`}
            >
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                <div className="flex flex-col items-center text-[#52637d] group-hover:text-[#138b49]">
                  <ImageSearchOutlinedIcon fontSize="medium" />
                  <span className="text-[10px] font-bold mt-1">Subir Logo</span>
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

          <div className="mb-4">
            <label className="mb-1 block text-[12px] font-bold text-[#071f43]">Nombre Oficial *</label>
            <input 
              type="text" 
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Partido Morado"
              className="w-full p-2.5 text-[13px] border border-[#bdc8d5] rounded-md outline-none focus:border-[#138b49] focus:ring-1 focus:ring-[#138b49]/20 transition-all" 
              autoFocus
              disabled={loading}
            />
          </div>

          <div className="mb-6">
            <label className="mb-1 block text-[12px] font-bold text-[#071f43]">Siglas / Abreviatura *</label>
            <input 
              type="text" 
              value={siglas}
              onChange={(e) => setSiglas(e.target.value)}
              placeholder="Ej. PM"
              className="w-full p-2.5 text-[13px] border border-[#bdc8d5] rounded-md outline-none focus:border-[#138b49] focus:ring-1 focus:ring-[#138b49]/20 transition-all" 
              disabled={loading}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 relative z-20">
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
              disabled={loading}
              className="px-4 py-2 cursor-pointer rounded-md text-[13px] font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-90 flex items-center justify-center min-w-[150px] gap-2 shadow-sm"
            >
              {loading ? (
                <>
                  <svg className="h-4 w-4 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Inscribiendo...
                </>
              ) : (
                'Inscribir Partido'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
