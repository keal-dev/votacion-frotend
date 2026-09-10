import CloseIcon from '@mui/icons-material/Close';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

interface Props {
  isOpen: boolean;
  title?: string;
  message?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function DeleteConfirmModal({ 
  isOpen, 
  title = "Confirmar eliminación", 
  message = "¿Estás seguro de que deseas eliminar este registro? Esta acción no se puede deshacer.", 
  onConfirm, 
  onCancel, 
  loading = false 
}: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white shadow-[0_10px_35px_rgba(0,0,0,0.1)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-5 py-4 bg-[#f8fafc]">
          <div className="flex items-center gap-2 text-red-600">
            <WarningAmberIcon fontSize="small" />
            <h2 className="text-base font-extrabold">{title}</h2>
          </div>
          <button onClick={onCancel} className="text-[#52637d] hover:bg-slate-200 rounded-full p-1 transition-colors">
            <CloseIcon style={{ fontSize: 20 }} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          <p className="text-[13px] text-[#182c4c] mb-6">
            {message}
          </p>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onCancel}
              disabled={loading}
              className="px-4 py-2 rounded-md text-[13px] font-bold text-[#52637d] border border-line hover:bg-slate-50 transition-colors disabled:opacity-70"
            >
              Cancelar
            </button>
            <button 
              type="button" 
              onClick={onConfirm}
              disabled={loading}
              className="px-4 py-2 rounded-md text-[13px] font-bold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-70 flex items-center justify-center min-w-[100px]"
            >
              {loading ? 'Eliminando...' : 'Eliminar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
