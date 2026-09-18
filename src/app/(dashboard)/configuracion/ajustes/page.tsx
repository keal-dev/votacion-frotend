"use client";

import { useEffect, useState } from "react";
import { useSettingsStore } from "@/store/settings.store";
import { settingsService, SettingData } from "@/services/settings.service";
import ResetSystemModal from "@/components/modals/ResetSystemModal";
import ConfirmModal from "@/components/modals/ConfirmModal";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export default function AjustesGeneralesPage() {
  const { settings, fetchSettings, isLoading, updateSettingsLocally } = useSettingsStore();
  
  // Estado local del formulario
  const [formData, setFormData] = useState<Partial<SettingData>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  
  // UI States
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Confirm Modal States
  const [maintenanceConfirmOpen, setMaintenanceConfirmOpen] = useState(false);
  const [pendingMaintenanceValue, setPendingMaintenanceValue] = useState(false);

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

  const handleToggleMaintenance = async () => {
    try {
      const dataToSave = { ...formData, maintenance_mode: pendingMaintenanceValue };
      if (dataToSave.global_announcement === "") {
        dataToSave.global_announcement = null;
      }
      const updated = await settingsService.updateSettings(dataToSave);
      updateSettingsLocally(updated);
      setFormData(dataToSave);
    } catch (error: any) {
      console.error("Error al cambiar mantenimiento:", error);
      alert("Error: " + (error.response?.data?.message || error.message));
    } finally {
      setMaintenanceConfirmOpen(false);
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

        {/* Reglas Técnicas */}
        <section className="bg-white border border-[#d0d7de] rounded-xl shadow-sm overflow-hidden">
          <div className="bg-[#f6f8fa] px-6 py-4 border-b border-[#d0d7de]">
            <h2 className="text-[16px] font-semibold text-[#24292f]">Reglas Técnicas</h2>
          </div>
          <div className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-semibold text-[#24292f] mb-2">Tolerancia GPS</label>
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  className={InputClass}
                  style={{maxWidth: '120px'}}
                  value={formData.gps_tolerance_meters || ""}
                  onChange={(e) => setFormData({...formData, gps_tolerance_meters: parseInt(e.target.value) || 0})}
                />
                <span className="text-sm text-[#57606a] font-medium">metros</span>
              </div>
              <small className="text-[#57606a] mt-2 block">Radio de tolerancia para que el personero registre su asistencia.</small>
            </div>
            
            <hr className="border-[#eaeef2]" />

            <div>
              <label className="block text-sm font-semibold text-[#24292f] mb-2">Peso Máx. Foto de Acta</label>
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  className={InputClass}
                  style={{maxWidth: '120px'}}
                  value={formData.max_photo_size_mb || ""}
                  onChange={(e) => setFormData({...formData, max_photo_size_mb: parseInt(e.target.value) || 0})}
                />
                <span className="text-sm text-[#57606a] font-medium">MB</span>
              </div>
              <small className="text-[#57606a] mt-2 block">Límite de tamaño al intentar subir fotos, ideal para evitar envíos muy pesados.</small>
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

        {/* Danger Zone */}
        <section className="mt-8 border border-[#cf222e] rounded-xl overflow-hidden shadow-sm bg-white">
          <div className="bg-[#ffebe9] px-6 py-4 border-b border-[#cf222e]">
            <h2 className="text-[16px] font-semibold text-[#cf222e]">Zona de Peligro</h2>
          </div>

          <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#d0d7de]">
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

          <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-[#24292f]">Modo Mantenimiento Estricto</h3>
              <p className="text-sm text-[#57606a] mt-1">
                Al activarlo, bloquearás a todos los usuarios (excepto a ti).
              </p>
            </div>
            
            <div className="shrink-0 flex items-center">
              <button
                onClick={() => {
                  const newValue = !formData.maintenance_mode;
                  setPendingMaintenanceValue(newValue);
                  setMaintenanceConfirmOpen(true);
                }}
                className={`px-4 py-2 font-semibold text-sm rounded-lg transition-colors shadow-sm border ${
                  formData.maintenance_mode 
                  ? 'bg-white text-[#cf222e] border-[#cf222e] hover:bg-[#ffebe9]' 
                  : 'bg-[#f6f8fa] text-[#cf222e] border-[#d0d7de] hover:bg-[#f3f4f6]'
                }`}
              >
                {formData.maintenance_mode ? 'Desactivar Modo Mantenimiento' : 'Activar Modo Mantenimiento'}
              </button>
            </div>
          </div>
        </section>

      </div>

      <ResetSystemModal 
        isOpen={isResetModalOpen} 
        onClose={() => setIsResetModalOpen(false)} 
      />

      <ConfirmModal
        isOpen={maintenanceConfirmOpen}
        title={pendingMaintenanceValue ? "Activar Modo Mantenimiento" : "Desactivar Modo Mantenimiento"}
        message={pendingMaintenanceValue 
          ? "¿Estás seguro de que deseas ACTIVAR el modo mantenimiento? Nadie más que tú podrá acceder a la plataforma." 
          : "¿Deseas DESACTIVAR el modo mantenimiento y permitir el acceso a todos los usuarios nuevamente?"}
        confirmText={pendingMaintenanceValue ? "Sí, activar" : "Sí, desactivar"}
        type="danger"
        onCancel={() => setMaintenanceConfirmOpen(false)}
        onConfirm={handleToggleMaintenance}
      />
    </div>
  );
}
