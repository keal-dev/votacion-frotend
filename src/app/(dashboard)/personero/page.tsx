"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { asistenciaService, AsistenciaResponse } from "@/services/asistencia.service";
import { mesaService } from "@/services/mesa.service";
import { electionService } from "@/services/election.service";
import { Mesa } from "@/types/mesa.types";
import { Election } from "@/types/election.types";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import ConfirmModal from "@/components/modals/ConfirmModal";

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
          <p className="text-muted mt-[5px]">Consulta el estado de las mesas que tienes bajo tu responsabilidad.</p>
        </div>
        <div className="flex items-center gap-[12px]">
          {activeElection?.estado === 'EN_CURSO' ? (
            <span className="inline-flex items-center gap-[6px] px-[12px] py-[7px] rounded-[20px] text-[12px] font-bold bg-[#e6f6ec] text-green-2">● Jornada Electoral En Curso</span>
          ) : (
            <span className="inline-flex items-center gap-[6px] px-[12px] py-[7px] rounded-[20px] text-[12px] font-bold bg-orange-100 text-orange-700">⌛ {activeElection?.estado === 'PREPARACION' ? 'En Preparación' : 'Finalizada'}</span>
          )}
          <span>{activeElection?.fecha || "Sin fecha"}</span>
        </div>
      </div>

      {!isCheckedIn ? (
        <div className="bg-[#fff9e6] border border-[#f5d98b] rounded-xl p-[24px] mb-[20px] shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex flex-col items-center text-center">
          <div className="w-[50px] h-[50px] rounded-full bg-[#fce8b3] flex items-center justify-center mb-[12px]">
            <LocationOnIcon sx={{ fontSize: 24, color: "#b45309" }} />
          </div>
          <h2 className="text-[18px] font-extrabold text-[#8a5a00] mb-[8px]">Registro de Asistencia Requerido</h2>
          <p className="text-[#8a5a00] mb-[20px] max-w-[500px]">
            Para habilitar el ingreso de actas, primero debes confirmar que te encuentras físicamente en tu local de votación asignado.
          </p>

          {locationError && (
            <div className="bg-[#fff0f0] text-[#b42318] p-[12px] rounded-lg mb-[16px] border border-[#ffcdcd] max-w-[500px] text-[14px]">
              ⚠️ {locationError}
            </div>
          )}

          <button
            onClick={handleCheckIn}
            disabled={isCheckingIn || activeElection?.estado !== 'EN_CURSO'}
            className="border-0 rounded-lg px-[24px] py-[14px] font-bold cursor-pointer bg-green text-white text-[16px] shadow-sm hover:bg-[#128a44] transition-colors flex items-center gap-[8px] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isCheckingIn ? (
              <>
                <span className="w-[18px] h-[18px] border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Obteniendo ubicación GPS...
              </>
            ) : activeElection?.estado !== 'EN_CURSO' ? (
              <>La elección no está en curso</>
            ) : (
              <>Registrar mi llegada al local</>
            )}
          </button>
        </div>
      ) : (
        <div className="bg-[#effaf3] border border-[#c9efd6] rounded-xl p-[16px] mb-[20px] flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex-wrap gap-4">
          <div className="flex items-center gap-[12px]">
            <div className="w-[40px] h-[40px] rounded-full bg-[#dcf5e3] flex items-center justify-center text-[20px] text-[#176b39]">
              ✓
            </div>
            <div>
              <div className="text-[15px] font-extrabold text-[#176b39]">Llegada registrada exitosamente</div>
              <div className="text-[13px] text-[#1e8a49] mt-[2px]">
                {currentTime} • Coordenadas GPS capturadas ({Number(gpsLocation?.lat).toFixed(4)}, {Number(gpsLocation?.lng).toFixed(4)})
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end">
            {locationError && (
              <div className="text-[#b42318] text-[12px] mb-2 whitespace-nowrap text-right">
                ⚠️ {locationError}
              </div>
            )}
            {!isCheckedOut ? (
              mesas.length > 0 && mesas.every(m => m.estado === 'ENVIADA') && (
                <button
                  onClick={handleCheckOutClick}
                  disabled={isCheckingOut}
                  className="border-0 rounded-lg px-[16px] py-[10px] font-bold cursor-pointer bg-[#e0f2fe] text-[#0369a1] text-[14px] shadow-sm hover:bg-[#bae6fd] transition-colors flex items-center gap-[8px] disabled:opacity-70"
                >
                  {isCheckingOut ? "Registrando..." : "Registrar Salida"}
                </button>
              )
            ) : (
              <div className="text-[#0369a1] text-[13px] font-bold bg-[#e0f2fe] px-3 py-1.5 rounded-md">
                Salida registrada a las {checkoutTime}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-white border border-line rounded-xl p-[18px] shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
        <div className="text-[15px] font-extrabold mb-[14px]">Mesas asignadas</div>
        {/* Vista Desktop (Tabla) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left p-[13px_12px] border-b border-[#edf0f2] text-[12px] text-[#667085] bg-[#fafbfc]">Mesa</th>
                <th className="text-left p-[13px_12px] border-b border-[#edf0f2] text-[12px] text-[#667085] bg-[#fafbfc]">Local de votación</th>
                <th className="text-center p-[13px_12px] border-b border-[#edf0f2] text-[12px] text-[#667085] bg-[#fafbfc]">Electores</th>
                <th className="text-left p-[13px_12px] border-b border-[#edf0f2] text-[12px] text-[#667085] bg-[#fafbfc]">Estado</th>
                <th className="text-left p-[13px_12px] border-b border-[#edf0f2] text-[12px] text-[#667085] bg-[#fafbfc]">Acción</th>
              </tr>
            </thead>
            <tbody>
              {mesas.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center p-8 text-[#667085] bg-[#fdfdfd] border-b border-[#edf0f2]">
                    No tienes mesas asignadas aún.
                  </td>
                </tr>
              ) : (
                mesas.map((mesa) => (
                  <tr key={mesa.id}>
                    <td className="text-left p-[13px_12px] border-b border-[#edf0f2] text-[15px] text-[#172b4d]"><strong>Mesa {mesa.numero_mesa}</strong></td>
                    <td className="text-left p-[13px_12px] border-b border-[#edf0f2] text-[13px]">{mesa.local?.nombre || "Local desconocido"}</td>
                    <td className="text-center p-[13px_12px] border-b border-[#edf0f2] text-[13px] font-medium text-[#52637d]">{mesa.cantidad_electores || 0}</td>
                    <td className="text-left p-[13px_12px] border-b border-[#edf0f2] text-[13px]">
                      {mesa.estado === 'ENVIADA' ? (
                        <span className="inline-flex items-center gap-[6px] px-[12px] py-[7px] rounded-[20px] text-[12px] font-bold bg-[#e0f2fe] text-[#0369a1]">✓ ENVIADA</span>
                      ) : (
                        <span className="inline-flex items-center gap-[6px] px-[12px] py-[7px] rounded-[20px] text-[12px] font-bold bg-[#fffbeb] text-[#d97706]">⌛ PENDIENTE</span>
                      )}
                    </td>
                    <td className="text-left p-[13px_12px] border-b border-[#edf0f2] text-[13px]">
                      {mesa.estado === 'ENVIADA' ? (
                        <span className="inline-block text-center border border-[#0369a1] rounded-lg px-[15px] py-[10px] font-bold bg-[#f0f9ff] text-[#0369a1] cursor-default">Completado</span>
                      ) : (!isCheckedIn || activeElection?.estado !== 'EN_CURSO') ? (
                        <button disabled className="border border-line rounded-lg px-[15px] py-[10px] font-bold bg-[#f7f9fa] text-[#98a2b3] cursor-not-allowed">Ingresar votos</button>
                      ) : (
                        <Link className="inline-block text-center border-0 rounded-lg px-[15px] py-[10px] font-bold cursor-pointer bg-green text-white hover:bg-[#128a44] transition-colors" href={`/personero/votos/${mesa.id}`}>Ingresar votos</Link>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Vista Móvil (Tarjetas estilo React Native) */}
        <div className="md:hidden flex flex-col gap-4">
          {mesas.length === 0 ? (
            <div className="text-center p-8 text-[#667085] bg-[#fdfdfd] border border-[#edf0f2] rounded-xl">
              No tienes mesas asignadas aún.
            </div>
          ) : (
            mesas.map((mesa) => (
              <div key={mesa.id} className="bg-white border border-[#edf0f2] rounded-[16px] p-[16px] shadow-sm flex flex-col gap-4 relative overflow-hidden">
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
                  ) : (!isCheckedIn || activeElection?.estado !== 'EN_CURSO') ? (
                    <button disabled className="w-full border border-line rounded-xl px-[15px] py-[12px] font-bold bg-[#f1f5f9] text-[#94a3b8] cursor-not-allowed">
                      Ingresar votos
                    </button>
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

      <div className="mt-[18px]">
        <div className="bg-[#effaf3] border border-[#c9efd6] text-[#176b39] rounded-[10px] p-[15px]">
          <div className="text-[15px] font-extrabold mb-[14px]">Información importante</div>
          <p>✓ Debes registrar tu llegada en el local de votación usando GPS.</p>
          <p className="mt-[8px]">✓ Solo podrás registrar votos en las mesas que tengas asignadas y una vez registrada tu asistencia.</p>
          <p className="mt-[8px]">✓ Verifica cuidadosamente los datos de cada acta antes de confirmar.</p>
          <p className="mt-[8px]">✓ Deberás adjuntar una foto legible del acta final.</p>
        </div>
      </div>

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
    </div>
  );
}
