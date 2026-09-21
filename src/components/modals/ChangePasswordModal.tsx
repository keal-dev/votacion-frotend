"use client";

import { useState } from "react";
import CloseIcon from '@mui/icons-material/Close';
import axiosInstance from "@/utils/axios";
import VpnKeyOutlinedIcon from '@mui/icons-material/VpnKeyOutlined';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ChangePasswordModal({ isOpen, onClose, onSuccess }: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword.length < 6) {
      setError("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas nuevas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      await axiosInstance.patch("/auth/change-password", {
        currentPassword,
        newPassword
      });
      setSuccess(true);
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setSuccess(false);
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al cambiar la contraseña");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-[#172b4d] px-6 py-4 flex justify-between items-center">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <VpnKeyOutlinedIcon fontSize="small" className="text-blue-400" />
            Cambiar Contraseña
          </h2>
          <button 
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors p-1"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="p-6">
          {success ? (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-lg text-sm font-bold text-center mb-4">
              ¡Contraseña actualizada con éxito!
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-sm font-bold">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-[13px] font-bold text-[#52637d] mb-1">Contraseña Actual</label>
                <input 
                  type="password" 
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow"
                  placeholder="Ingresa tu contraseña actual"
                />
              </div>

              <div>
                <label className="block text-[13px] font-bold text-[#52637d] mb-1">Nueva Contraseña</label>
                <input 
                  type="password" 
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              <div>
                <label className="block text-[13px] font-bold text-[#52637d] mb-1">Confirmar Nueva Contraseña</label>
                <input 
                  type="password" 
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow"
                  placeholder="Repite la nueva contraseña"
                />
              </div>

              <div className="mt-2 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                >
                  {loading ? 'Guardando...' : 'Actualizar Contraseña'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
