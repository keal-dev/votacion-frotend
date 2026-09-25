"use client";

import { useEffect, useState } from "react";
import { useSettingsStore } from "@/store/settings.store";
import { settingsService, SettingData } from "@/services/settings.service";
import ResetSystemModal from "@/components/modals/ResetSystemModal";
import ClearDataModal from "@/components/modals/ClearDataModal";
import ConfirmModal from "@/components/modals/ConfirmModal";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export default function AjustesGeneralesPage() {
  const { settings, fetchSettings, isLoading, updateSettingsLocally } = useSettingsStore();
  
  // Estado local del formulario
  const [formData, setFormData] = useState<Partial<SettingData>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isClearDataModalOpen, setIsClearDataModalOpen] = useState(false);
  
  // UI States
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (settings) {
      setFormData({
        gps_tolerance_meters: settings.gps_tolerance_meters,
        maintenance_mode: settings.maintenance_mode,
        max_photo_size_mb: settings.max_photo_size_mb,
        platform_name: settings.platform_name,
        global_announcement: settings.global_announcement || "",
      });
    }
  }, [settings]);

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Cargando ajustes...</div>;
  }

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');
    setErrorMessage('');
    
    try {
      const dataToSave = { ...formData };
      if (dataToSave.global_announcement === "") {
        dataToSave.global_announcement = null;
      }
      
      const updated = await settingsService.updateSettings(dataToSave);
      updateSettingsLocally(updated);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error: any) {
      console.error("Error al guardar:", error);
      setSaveStatus('error');
      setErrorMessage(error.response?.data?.message || error.message);
    } finally {
      setIsSaving(false);
    }
  };



  const InputClass = "w-full p-2 px-3 bg-white border border-[#d0d7de] rounded-md outline-none focus:border-[#0969da] focus:ring-1 focus:ring-[#0969da] transition-colors text-sm shadow-[inset_0_1px_2px_rgba(0,0,0,0.075)]";

  return (
    <div className="max-w-[768px] mx-auto animate-in fade-in duration-300">
      <div className="mb-6">
        <h1 className="text-[24px] md:text-[28px] font-extrabold text-[#172b4d] tracking-tight">Ajustes Generales</h1>
        <p className="text-[#57606a] mt-1 text-sm">
          Configura las reglas globales de funcionamiento del sistema electoral. Los cambios pueden tardar unos segundos en propagarse.
        </p>
      </div>

      <div className="space-y-6">
        
        {/* Apariencia y Avisos */}
        <section className="bg-white border border-[#d0d7de] rounded-xl shadow-sm overflow-hidden">
          <div className="bg-[#f6f8fa] px-6 py-4 border-b border-[#d0d7de]">
            <h2 className="text-[16px] font-semibold text-[#24292f]">Apariencia y Avisos</h2>
          </div>
          <div className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-semibold text-[#24292f] mb-2">Nombre de la Plataforma</label>
              <input 
                type="text" 
                className={InputClass}
                value={formData.platform_name || ""}
                onChange={(e) => setFormData({...formData, platform_name: e.target.value})}
              />
              <small className="text-[#57606a] mt-2 block">Aparecerá en el menú lateral y como título global de la aplicación.</small>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#24292f] mb-2">Aviso Global Importante</label>
              <textarea 
                className={`${InputClass} resize-y min-h-[80px]`}
                placeholder="Ej: Recuerden llevar sus credenciales el día domingo..."
                value={formData.global_announcement || ""}
                onChange={(e) => setFormData({...formData, global_announcement: e.target.value})}
              ></textarea>
              <small className="text-[#57606a] mt-2 block">Deja esto vacío si no quieres mostrar ningún aviso. Si escribes algo, aparecerá un banner superior visible para todos los usuarios.</small>
            </div>
          </div>
        </section>



        {/* Botón de Guardar normal */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-end gap-3">
          {saveStatus === 'success' && (
            <span className="text-[#2da44e] text-sm font-semibold flex items-center gap-1 animate-in fade-in">
              <CheckCircleIcon fontSize="small" /> Ajustes guardados
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="text-[#cf222e] text-sm font-semibold animate-in fade-in">
              Error: {errorMessage}
            </span>
          )}
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center justify-center px-6 py-2.5 bg-[#2da44e] hover:bg-[#2c974b] text-white font-semibold text-sm rounded-lg transition-colors disabled:opacity-70 shadow-sm border border-[rgba(27,31,36,0.15)]"
          >
            {isSaving ? "Guardando..." : "Guardar ajustes"}
          </button>
        </div>

        {/* Simulacro y Mantenimiento */}
        <section className="mt-8 border border-orange-300 rounded-xl overflow-hidden shadow-sm bg-white">
          <div className="bg-orange-50 px-6 py-4 border-b border-orange-200">
            <h2 className="text-[16px] font-semibold text-orange-800">Zona de Simulacros</h2>
          </div>

          <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-[#24292f]">Limpiar Datos de Votación</h3>
              <p className="text-sm text-[#57606a] mt-1">
                Borrará solo Votos, Actas y Asistencias. Mantiene intactos tus Personeros, Mesas, Candidatos y Partidos. Ideal para después de un simulacro.
              </p>
            </div>
            
            <div className="shrink-0 flex items-center">
              <button
                onClick={() => setIsClearDataModalOpen(true)}
                className="px-4 py-2 font-semibold text-sm rounded-lg transition-colors shadow-sm border bg-white text-orange-600 border-orange-300 hover:bg-orange-600 hover:text-white hover:border-orange-600"
              >
                Limpiar Datos
              </button>
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="mt-8 border border-[#cf222e] rounded-xl overflow-hidden shadow-sm bg-white">
          <div className="bg-[#ffebe9] px-6 py-4 border-b border-[#cf222e]">
            <h2 className="text-[16px] font-semibold text-[#cf222e]">Zona de Peligro</h2>
          </div>

          <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-[#24292f]">Restablecer Base de Datos</h3>
              <p className="text-sm text-[#57606a] mt-1">
                Borrará todas las mesas, votos, actas y usuarios (excepto tu cuenta). Esta acción es irreversible.
              </p>
            </div>
            
            <div className="shrink-0 flex items-center">
              <button
                onClick={() => setIsResetModalOpen(true)}
                className="px-4 py-2 font-semibold text-sm rounded-lg transition-colors shadow-sm border bg-[#f6f8fa] text-[#cf222e] border-[#d0d7de] hover:bg-[#cf222e] hover:text-white hover:border-[#cf222e]"
              >
                Restablecer Sistema
              </button>
            </div>
          </div>
        </section>

      </div>

      <ResetSystemModal 
        isOpen={isResetModalOpen} 
        onClose={() => setIsResetModalOpen(false)} 
      />

      <ClearDataModal
        isOpen={isClearDataModalOpen}
        onClose={() => setIsClearDataModalOpen(false)}
      />
    </div>
  );
}
