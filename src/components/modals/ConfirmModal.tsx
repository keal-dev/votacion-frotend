import CloseIcon from '@mui/icons-material/Close';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

interface Props {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function ConfirmModal({ 
  isOpen, 
  title, 
  message, 
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  type = 'warning',
  onConfirm, 
  onCancel, 
  loading = false 
}: Props) {
  if (!isOpen) return null;

  const getColors = () => {
    switch(type) {
      case 'danger': return { headerText: 'text-red-600', btnBg: 'bg-[#cf222e] hover:bg-[#a41e26]', icon: <WarningAmberIcon fontSize="small" /> };
      case 'info': return { headerText: 'text-blue-600', btnBg: 'bg-[#0969da] hover:bg-[#0854b0]', icon: <InfoOutlinedIcon fontSize="small" /> };
      default: return { headerText: 'text-orange-600', btnBg: 'bg-orange-600 hover:bg-orange-700', icon: <WarningAmberIcon fontSize="small" /> };
    }
  };

  const { headerText, btnBg, icon } = getColors();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in zoom-in duration-200">
      <div className="w-full max-w-sm rounded-xl bg-white shadow-xl overflow-hidden border border-[#d0d7de]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#d0d7de] px-5 py-4 bg-[#f6f8fa]">
          <div className={`flex items-center gap-2 ${headerText}`}>
            {icon}
            <h2 className="text-base font-semibold text-[#24292f]">{title}</h2>
          </div>
          <button onClick={onCancel} className="text-[#57606a] hover:bg-[#eaeef2] rounded-full p-1 transition-colors">
            <CloseIcon style={{ fontSize: 20 }} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 bg-white">
          <p className="text-[14px] text-[#24292f] mb-6">
            {message}
          </p>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onCancel}
              disabled={loading}
              className="px-4 py-2 rounded-md text-[13px] font-semibold text-[#24292f] bg-[#f6f8fa] border border-[#d0d7de] hover:bg-[#f3f4f6] transition-colors disabled:opacity-70"
            >
              {cancelText}
            </button>
            <button 
              type="button" 
              onClick={onConfirm}
              disabled={loading}
              className={`px-4 py-2 rounded-md text-[13px] font-semibold text-white transition-colors disabled:opacity-70 flex items-center justify-center min-w-[100px] border border-[rgba(27,31,36,0.15)] ${btnBg}`}
            >
              {loading ? 'Procesando...' : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
