import { useState } from 'react';
import { electionService } from '@/services/election.service';
import CloseIcon from '@mui/icons-material/Close';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateElectionModal({ isOpen, onClose, onSuccess }: Props) {
  const [nombre, setNombre] = useState('');
  const [fecha, setFecha] = useState('');
  const [activa, setActiva] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!nombre || !fecha) {
      setError('Por favor completa todos los campos obligatorios.');
      return;
    }

    setLoading(true);
    try {
      // Agregar un pequeño retraso artificial para que se pueda apreciar la animación de carga
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await electionService.create({ nombre, fecha, activa });
      // Reset form
      setNombre('');
      setFecha('');
      setActiva(false);
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Error al crear la elección');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-[0_10px_35px_rgba(0,0,0,0.1)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-5 py-4 bg-[#f8fafc]">
          <h2 className="text-base font-extrabold text-[#172b4d]">Crear Nueva Elección</h2>
          <button onClick={onClose} className="text-[#52637d] hover:bg-slate-200 rounded-full p-1 transition-colors">
            <CloseIcon style={{ fontSize: 20 }} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 relative">
          {loading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/70 backdrop-blur-[1px] rounded-b-xl">
              <svg className="h-10 w-10 animate-spin text-[#0b9349]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="mt-3 text-sm font-bold text-[#0b9349]">Creando elección...</span>
            </div>
          )}

          {error && (
            <div className="mb-4 rounded bg-red-50 p-3 text-xs font-medium text-red-600 border border-red-200">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="mb-1 block text-[12px] font-bold text-[#071f43]">Nombre de la Elección *</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Elecciones Municipales 2026"
              className="w-full p-2.5 text-[13px] border border-[#bdc8d5] rounded-md outline-none focus:border-[#138b49] focus:ring-1 focus:ring-[#138b49]/20 transition-all"
              autoFocus
              disabled={loading}
            />
          </div>

          <div className="mb-5">
            <label className="mb-1 block text-[12px] font-bold text-[#071f43]">Fecha del Proceso *</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full p-2.5 text-[13px] border border-[#bdc8d5] rounded-md outline-none focus:border-[#138b49] focus:ring-1 focus:ring-[#138b49]/20 transition-all"
              disabled={loading}
            />
          </div>



          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 relative z-20">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-md text-[13px] font-bold text-[#52637d] border border-line hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-md text-[13px] font-bold text-white bg-[#0b9349] hover:bg-[#087d3e] transition-colors disabled:opacity-90 flex items-center justify-center min-w-[150px] gap-2 shadow-sm"
            >
              {loading ? (
                <>
                  <svg className="h-4 w-4 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Guardando...
                </>
              ) : (
                'Guardar Elección'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
