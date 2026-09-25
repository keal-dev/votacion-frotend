"use client";

import { useState } from "react";
import { systemService } from "@/services/system.service";
import { useRouter } from "next/navigation";

interface ClearDataModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ClearDataModal({ isOpen, onClose }: ClearDataModalProps) {
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  if (!isOpen) return null;

  const isConfirmed = confirmText === "LIMPIAR";

  const handleClear = async () => {
    if (!isConfirmed) return;

    setIsDeleting(true);
    try {
      await systemService.clearVotingData();
      alert("Datos de votación limpiados correctamente.");
      setConfirmText("");
      onClose();
      // Opcional: recargar la página para reflejar cambios en dashboards si los hubiera
      window.location.reload();
    } catch (error: any) {
      console.error("Error limpiando datos", error);
      alert("Ocurrió un error al limpiar los datos. Verifica la consola.");
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-[#edf0f2]">
          <div className="flex items-center gap-3 text-orange-600 mb-2">
            <span className="text-2xl">🧹</span>
            <h2 className="text-xl font-bold">Limpiar Datos de Votación</h2>
          </div>
          <p className="text-gray-600 text-sm mt-2">
            Estás a punto de borrar <strong>todos los Votos, Actas y Asistencias</strong> registradas hasta ahora. 
            Se conservarán las Elecciones, Mesas, Personeros, Partidos y Candidatos. Esta acción es ideal para borrar datos de un <strong>Simulacro</strong>. Esta acción <strong>no se puede deshacer</strong>.
          </p>
        </div>

        <div className="p-6 bg-gray-50">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Escribe "LIMPIAR" para continuar:
          </label>
          <input
            type="text"
            className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 text-center uppercase tracking-widest font-bold"
            placeholder="LIMPIAR"
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
            onClick={handleClear}
            disabled={!isConfirmed || isDeleting}
            className="px-4 py-2 font-bold text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isDeleting ? "Limpiando..." : "Ejecutar Limpieza"}
          </button>
        </div>
      </div>
    </div>
  );
}
