import { useState, useEffect } from 'react';
import { electionService } from '@/services/election.service';
import { Election } from '@/types/election.types';
import CloseIcon from '@mui/icons-material/Close';

interface Props {
  isOpen: boolean;
  election: Election | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditElectionModal({ isOpen, election, onClose, onSuccess }: Props) {
  const [nombre, setNombre] = useState('');
  const [fecha, setFecha] = useState('');
  const [activa, setActiva] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Sincronizar datos cuando se abre el modal con una elección seleccionada
  useEffect(() => {
    if (election && isOpen) {
      setNombre(election.nombre);
      setFecha(election.fecha);
      setActiva(election.activa);
      setError('');
    }
  }, [election, isOpen]);

  if (!isOpen || !election) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!nombre || !fecha) {
        setError('Por favor completa todos los campos obligatorios.');
        return;
    }

    setLoading(true);
    try {
      await electionService.update(election.id, { nombre, fecha, activa });
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Error al actualizar la elección');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-[0_10px_35px_rgba(0,0,0,0.1)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-5 py-4 bg-[#f8fafc]">
          <h2 className="text-base font-extrabold text-[#172b4d]">Editar Elección</h2>
          <button onClick={onClose} className="text-[#52637d] hover:bg-slate-200 rounded-full p-1 transition-colors">
            <CloseIcon style={{ fontSize: 20 }} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5">
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
            />
          </div>

          <div className="mb-5">
            <label className="mb-1 block text-[12px] font-bold text-[#071f43]">Fecha del Proceso *</label>
            <input 
              type="date" 
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full p-2.5 text-[13px] border border-[#bdc8d5] rounded-md outline-none focus:border-[#138b49] focus:ring-1 focus:ring-[#138b49]/20 transition-all" 
            />
          </div>
          
          <div className="mb-6 flex items-center gap-2">
            <input 
              type="checkbox" 
              id="activa_edit"
              checked={activa}
              onChange={(e) => setActiva(e.target.checked)}
              className="h-[16px] w-[16px] cursor-pointer accent-[#138b49]"
            />
            <label htmlFor="activa_edit" className="text-[12px] font-medium text-[#182c4c] cursor-pointer">
              Marcar como la elección ACTIVA
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 rounded-md text-[13px] font-bold text-[#52637d] border border-line hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="px-4 py-2 rounded-md text-[13px] font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-70 flex items-center justify-center min-w-[120px]"
            >
              {loading ? 'Actualizando...' : 'Actualizar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
