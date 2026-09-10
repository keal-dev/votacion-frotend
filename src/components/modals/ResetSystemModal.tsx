"use client";

import { useState } from "react";
import { systemService } from "@/services/system.service";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { authService } from "@/services/auth.service";


interface ResetSystemModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ResetSystemModal({ isOpen, onClose }: ResetSystemModalProps) {
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const logout = useAuthStore(state => state.logout);

  if (!isOpen) return null;

  const isConfirmed = confirmText === "CONFIRMAR";

  const handleReset = async () => {
    if (!isConfirmed) return;

    setIsDeleting(true);
    try {
      await systemService.resetSystem();
      alert("Sistema restablecido correctamente. Se cerrará la sesión.");
      authService.logout();
    } catch (error: any) {
      console.error("Error reseteando el sistema", error);
      alert("Ocurrió un error al restablecer el sistema. Verifica la consola.");
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-[#edf0f2]">
          <div className="flex items-center gap-3 text-red-600 mb-2">
            <span className="text-2xl">⚠️</span>
            <h2 className="text-xl font-bold">¡Peligro! Restablecer Sistema</h2>
          </div>
          <p className="text-gray-600 text-sm mt-2">
            Estás a punto de borrar <strong>TODA</strong> la base de datos (Mesas, Votos, Actas, Partidos, Candidatos y Usuarios).
            Solo sobrevivirá tu cuenta de Administrador. Esta acción <strong>no se puede deshacer</strong>.
          </p>
        </div>

        <div className="p-6 bg-gray-50">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Escribe "CONFIRMAR" para continuar:
          </label>
          <input
            type="text"
            className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-red-500 focus:ring-2 focus:ring-red-200 text-center uppercase tracking-widest font-bold"
            placeholder="CONFIRMAR"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
            disabled={isDeleting}
          />
        </div>

        <div className="p-4 flex justify-end gap-3 bg-white border-t border-[#edf0f2]">
          <button
            onClick={() => {
              setConfirmText("");
              onClose();
            }}
            disabled={isDeleting}
            className="px-4 py-2 font-bold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleReset}
            disabled={!isConfirmed || isDeleting}
            className="px-4 py-2 font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isDeleting ? "Borrando todo..." : "Ejecutar Borrado"}
          </button>
        </div>
      </div>
    </div>
  );
}
