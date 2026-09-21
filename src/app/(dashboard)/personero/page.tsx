"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { asistenciaService, AsistenciaResponse } from "@/services/asistencia.service";
import { mesaService } from "@/services/mesa.service";
import { electionService } from "@/services/election.service";
import { useAuthStore } from "@/store/auth.store";
import { Mesa } from "@/types/mesa.types";
import { Election } from "@/types/election.types";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import KeyOutlinedIcon from '@mui/icons-material/KeyOutlined';
import ConfirmModal from "@/components/modals/ConfirmModal";
import ChangePasswordModal from "@/components/modals/ChangePasswordModal";

export default function PersoneroPage() {
  const [loading, setLoading] = useState(true);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isCheckedOut, setIsCheckedOut] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [gpsLocation, setGpsLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [currentTime, setCurrentTime] = useState("");
  const [checkoutTime, setCheckoutTime] = useState("");
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [activeElection, setActiveElection] = useState<Election | null>(null);
  const [showCheckoutWarning, setShowCheckoutWarning] = useState(false);
  const [showSuccessCard, setShowSuccessCard] = useState(false);
  
  const { user, setUser } = useAuthStore();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  useEffect(() => {
    if (showSuccessCard) {
      const timer = setTimeout(() => setShowSuccessCard(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessCard]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [status, mesasData, elections] = await Promise.all([
          asistenciaService.getToday(),
          mesaService.getMyMesas(),
          electionService.getAll()
        ]);

        const currentActive = elections.find(e => e.activa) || null;
        setActiveElection(currentActive);
        setMesas(mesasData);

        if (status) {
          setIsCheckedIn(true);
          setGpsLocation({ lat: status.latitud_llegada, lng: status.longitud_llegada });
          const arrivalDate = new Date(status.fecha_llegada);
          setCurrentTime(arrivalDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

          if (status.fecha_salida) {
            setIsCheckedOut(true);
            const departureDate = new Date(status.fecha_salida);
            setCheckoutTime(departureDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          }
        }
      } catch (error) {
        console.error("Error fetching personero data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCheckIn = () => {
    setIsCheckingIn(true);
    setLocationError(null);

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          try {
            const data = await asistenciaService.checkIn(lat, lng);
            setGpsLocation({ lat: data.latitud_llegada, lng: data.longitud_llegada });
            const arrivalDate = new Date(data.fecha_llegada);
            setCurrentTime(arrivalDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
            setIsCheckedIn(true);
            setShowSuccessCard(true);
          } catch (error: any) {
            setLocationError(error.response?.data?.message || "Error al registrar asistencia en el servidor.");
          } finally {
            setIsCheckingIn(false);
          }
        },
        (error) => {
          setIsCheckingIn(false);
          switch (error.code) {
            case error.PERMISSION_DENIED:
              setLocationError("Se denegó el acceso a la ubicación. Es obligatorio para registrar tu llegada al local de votación.");
              break;
            case error.POSITION_UNAVAILABLE:
              setLocationError("La información de ubicación no está disponible en este momento.");
              break;
            case error.TIMEOUT:
              setLocationError("Se agotó el tiempo de espera para obtener la ubicación. Intenta nuevamente.");
              break;
            default:
              setLocationError("Ocurrió un error desconocido al intentar obtener tu ubicación.");
              break;
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      setIsCheckingIn(false);
      setLocationError("Tu navegador o dispositivo no soporta la función de geolocalización.");
    }
  };

  const handleCheckOutClick = () => {
    const hasPendingMesas = mesas.some(m => m.estado !== 'ENVIADA');
    if (hasPendingMesas) {
      setShowCheckoutWarning(true);
    } else {
      executeCheckOut();
    }
  };

  const executeCheckOut = () => {
    setShowCheckoutWarning(false);
    setIsCheckingOut(true);
    setLocationError(null);

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          try {
            const data = await asistenciaService.checkOut(lat, lng);
            setIsCheckedOut(true);
            if (data.fecha_salida) {
              const departureDate = new Date(data.fecha_salida);
              setCheckoutTime(departureDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
            }
          } catch (error: any) {
            setLocationError(error.response?.data?.message || "Error al registrar salida en el servidor.");
          } finally {
            setIsCheckingOut(false);
          }
        },
        (error) => {
          setIsCheckingOut(false);
          setLocationError("Ocurrió un error al obtener ubicación para la salida.");
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setIsCheckingOut(false);
      setLocationError("Tu navegador o dispositivo no soporta la función de geolocalización.");
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-green border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-left-8 duration-300">
      <div className="flex justify-between items-center mb-[20px] max-md:flex-col max-md:items-start max-md:gap-[12px]">
        <div className="title">
          <h1 className="text-[24px] md:text-[28px] font-extrabold text-[#172b4d] tracking-tight">Mis mesas</h1>
          <p className="text-muted mt-[5px]">Administra las actas y vigila el escrutinio de las mesas a tu cargo.</p>
        </div>
        <div className="flex items-center gap-[12px]">
          <span className="font-bold text-[#15803d]">{activeElection?.nombre || "Elección no definida"} ({activeElection?.fecha || "Sin fecha"})</span>
        </div>
      </div>

      {user?.isDefaultPassword && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 mb-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm animate-in fade-in duration-300">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-orange-200 flex items-center justify-center shrink-0">
              <KeyOutlinedIcon className="text-orange-600" />
            </div>
            <div>
              <h3 className="text-orange-800 font-bold text-lg m-0">¡Alerta de Seguridad!</h3>
              <p className="text-orange-700 m-0 mt-1 max-w-xl">
                Hemos detectado que tu contraseña sigue siendo tu DNI. Por seguridad, te recomendamos cambiarla de inmediato para proteger tu acceso.
              </p>
            </div>
          </div>
          <button 
            onClick={() => setIsPasswordModalOpen(true)}
            className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 px-6 rounded-lg whitespace-nowrap transition-colors"
          >
            Cambiar Contraseña
          </button>
        </div>
      )}

      {activeElection?.estado === 'PREPARACION' && (
        <div className="bg-white border border-[#edf0f2] rounded-[16px] p-[40px] text-center shadow-sm flex flex-col items-center justify-center min-h-[400px] mt-4">
          <div className="w-[80px] h-[80px] rounded-full bg-orange-50 flex items-center justify-center mb-6">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          </div>
          <h2 className="text-[24px] font-extrabold text-[#0f172a] mb-4">Elección en Preparación</h2>
          <p className="text-[15px] text-[#64748b] max-w-md mx-auto leading-relaxed">
            La jornada electoral aún no ha comenzado. Vuelve el día de la elección para registrar tu asistencia y gestionar las actas de tus mesas asignadas.
          </p>
        </div>
      )}

      {activeElection?.estado === 'FINALIZADA' && (
        <div className="bg-white border border-[#edf0f2] rounded-[16px] p-[40px] text-center shadow-sm flex flex-col items-center justify-center min-h-[400px] mt-4">
          <div className="w-[80px] h-[80px] rounded-full bg-[#f0fdf4] flex items-center justify-center mb-6">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          </div>
          <h2 className="text-[24px] font-extrabold text-[#0f172a] mb-4">Elección Finalizada</h2>
          <p className="text-[15px] text-[#64748b] max-w-md mx-auto leading-relaxed">
            La jornada electoral ha concluido. Gracias por tu participación como personero en esta elección.
          </p>
        </div>
      )}

      {(!activeElection || activeElection?.estado === 'EN_CURSO') && (
        <>
          {!isCheckedIn ? (
            <div className="bg-[#fff9e6] border border-[#f5d98b] rounded-xl p-[32px] mt-[12px] mb-[20px] shadow-sm flex flex-col items-center text-center">
              <div className="w-[60px] h-[60px] rounded-full bg-[#fce8b3] flex items-center justify-center mb-[16px]">
                <LocationOnIcon sx={{ fontSize: 32, color: "#b45309" }} />
              </div>
              <h2 className="text-[20px] font-extrabold text-[#8a5a00] mb-[12px]">Paso 1: Registro de Asistencia Requerido</h2>
              <p className="text-[#8a5a00] mb-[24px] max-w-[500px] text-[15px]">
                Para habilitar tus mesas y poder ingresar las actas, primero debes confirmar que te encuentras físicamente en tu local de votación asignado.
              </p>

              {locationError && (
                <div className="bg-[#fff0f0] text-[#b42318] p-[12px] rounded-lg mb-[20px] border border-[#ffcdcd] max-w-[500px] text-[14px]">
                  ⚠️ {locationError}
                </div>
              )}

              <button
                onClick={handleCheckIn}
                disabled={isCheckingIn}
                className="border-0 rounded-lg px-[18px] py-[10px] font-bold cursor-pointer bg-green hover:bg-[#128a44] text-white text-[15px] shadow-sm transition-colors flex items-center justify-center gap-[6px] disabled:opacity-50 disabled:cursor-not-allowed w-fit"
              >
                {isCheckingIn ? (
                  <>
                    <span className="w-[18px] h-[18px] border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Registrando...</span>
                  </>
                ) : (
                  <>
                    <LocationOnIcon sx={{ fontSize: 18 }} />
                    <span>Marcar Llegada</span>
                  </>
                )}
              </button>
            </div>
          ) : (
              <>
                {/* Asistencia Confirmada Resumen */}
                {showSuccessCard && (
                  <div className="bg-[#effaf3] border border-[#c9efd6] rounded-xl p-[16px] mt-[12px] mb-[24px] flex items-center justify-between shadow-sm flex-wrap gap-4">
                    <div className="flex items-center gap-[16px]">
                      <div className="w-[48px] h-[48px] rounded-full bg-[#dcfce7] flex items-center justify-center text-[#15803d]">
                        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                      </div>
                      <div>
                        <div className="text-[16px] font-extrabold text-[#166534]">Asistencia Registrada</div>
                        <div className="text-[13px] text-[#15803d] mt-[2px] font-medium">
                          Llegada a las {currentTime} • GPS ({Number(gpsLocation?.lat).toFixed(4)}, {Number(gpsLocation?.lng).toFixed(4)})
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Boton Salida */}
                {mesas.length > 0 && mesas.every(m => m.estado === 'ENVIADA') && (
                  <div className="bg-[#f0f9ff] border border-[#bae6fd] rounded-xl p-[24px] mt-[12px] mb-[24px] flex flex-col items-center justify-center text-center shadow-sm">
                    <h3 className="text-[20px] font-extrabold text-[#0369a1] mb-[12px]">Paso 3: Jornada Concluida</h3>
                    <p className="text-[#0369a1] mb-[20px] text-[15px]">Has enviado las actas de todas tus mesas asignadas. Ya puedes registrar tu salida del local.</p>
                    
                    {locationError && (
                      <div className="text-[#b42318] text-[13px] mb-[16px] bg-[#fff0f0] p-[8px] rounded-lg border border-[#ffcdcd]">
                        ⚠️ {locationError}
                      </div>
                    )}

                    {!isCheckedOut ? (
                      <button
                        onClick={handleCheckOutClick}
                        disabled={isCheckingOut}
                        className="bg-[#0369a1] hover:bg-[#0284c7] text-white px-[20px] py-[12px] rounded-lg font-bold transition-all shadow-sm disabled:opacity-50 flex items-center gap-[8px]"
                      >
                        {isCheckingOut ? (
                          <>
                            <span className="w-[18px] h-[18px] border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            <span>Registrando Salida...</span>
                          </>
                        ) : (
                          <>
                            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                            <span>Registrar Salida Final</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="flex items-center gap-[8px] bg-white px-[16px] py-[8px] rounded-full text-[#0369a1] font-bold border border-[#7dd3fc]">
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                        <span>Salida registrada a las {checkoutTime}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Lista de Mesas */}
                <div className="mb-[24px]">
                  <div className="flex justify-between items-center mb-[20px]">
                    <div className="text-[18px] font-extrabold text-[#0f172a]">{mesas.length > 1 ? 'Selecciona tus mesas' : 'Selecciona tu mesa'}</div>
                    <div className="bg-[#f1f5f9] text-[#475569] font-bold px-3 py-1 rounded-lg text-[13px]">{mesas.length} Mesas</div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {mesas.length === 0 ? (
                      <div className="col-span-full text-center p-10 text-[#667085] bg-[#fdfdfd] border border-[#edf0f2] rounded-xl">
                        <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="mx-auto mb-3 text-slate-300">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <div className="font-semibold text-[#475569]">No tienes mesas asignadas aún.</div>
                      </div>
                    ) : (
                      mesas.map((mesa) => (
                        <div key={mesa.id} className="bg-white border border-[#edf0f2] rounded-[16px] p-[16px] shadow-sm flex flex-col gap-4 relative overflow-hidden hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              <div className="w-[40px] h-[40px] rounded-xl bg-[#f1f5f9] flex items-center justify-center text-[#64748b]">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path></svg>
                              </div>
                              <div>
                                <div className="text-[18px] font-black text-[#0f172a]">Mesa {mesa.numero_mesa}</div>
                                <div className="text-[13px] font-medium text-[#64748b] mt-0.5">{mesa.local?.nombre || "Local desconocido"}</div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-1">
                            <div className="flex items-center gap-2 text-[#64748b] bg-[#f8fafc] px-3 py-1.5 rounded-lg border border-[#f1f5f9]">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                              <span className="text-[13px] font-bold">{mesa.cantidad_electores || 0} electores</span>
                            </div>

                            <div>
                              {mesa.estado === 'ENVIADA' ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-extrabold bg-[#dcfce7] text-[#15803d] border border-[#bbf7d0]">
                                  <span className="w-2 h-2 rounded-full bg-[#15803d]"></span> ENVIADA
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-extrabold bg-[#fffbeb] text-[#d97706] border border-[#fef3c7]">
                                  <span className="w-2 h-2 rounded-full bg-[#d97706]"></span> PENDIENTE
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="mt-1">
                            {mesa.estado === 'ENVIADA' ? (
                              <div className="flex justify-center items-center gap-2 border border-[#0369a1] rounded-xl px-[15px] py-[12px] font-bold bg-[#f0f9ff] text-[#0369a1] w-full">
                                <span>✓</span> Acta Registrada
                              </div>
                            ) : (
                              <Link className="flex justify-center items-center gap-2 text-center border-0 rounded-xl px-[15px] py-[12px] font-bold cursor-pointer bg-[#15803d] text-white shadow-sm hover:bg-[#166534] transition-colors w-full" href={`/personero/votos/${mesa.id}`}>
                                Ingresar votos <span>→</span>
                              </Link>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>


            </>
          )}
        </>
      )}

      <ConfirmModal
        isOpen={showCheckoutWarning}
        title="¡Cuidado!"
        message="Aún tienes mesas asignadas sin actas registradas. ¿Estás seguro de que deseas registrar tu salida de todas formas?"
        confirmText="Sí, registrar salida"
        cancelText="Cancelar"
        type="warning"
        onConfirm={executeCheckOut}
        onCancel={() => setShowCheckoutWarning(false)}
      />

      <ChangePasswordModal 
        isOpen={isPasswordModalOpen} 
        onClose={() => {
          setIsPasswordModalOpen(false);
          if (user) {
            setUser({ ...user, isDefaultPassword: false });
          }
        }} 
      />
    </div>
  );
}
