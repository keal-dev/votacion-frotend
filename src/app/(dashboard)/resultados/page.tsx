"use client";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth.store";
import { useRouter } from "next/navigation";
import axiosInstance from "@/utils/axios";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, Rectangle } from 'recharts';

// Componente para renderizar la foto/avatar encima de la barra
const CustomBarLabel = (props: any) => {
  const { x, y, width, value, index, data } = props;
  const radius = 24;

  if (!value) return null; // No dibujar si es 0

  const iniciales = data?.[index]?.iniciales || 'IN';

  return (
    <g>
      {data?.[index]?.isCandidate && (
        <>
          {/* Círculo blanco de fondo simulando el recorte */}
          <circle cx={x + width / 2} cy={y} r={radius} fill="#fff" />
          {/* Borde del círculo */}
          <circle cx={x + width / 2} cy={y} r={radius - 2} fill="#f4f5f7" stroke="#ebecf0" strokeWidth={1} />
        </>
      )}

      {/* Foto o iniciales del candidato / Otros */}
      {data?.[index]?.isCandidate ? (
        data?.[index]?.foto ? (
          <g>
            <clipPath id={`clip-${index}`}>
              <circle cx={x + width / 2} cy={y} r={radius - 2} />
            </clipPath>
            <image
              href={data[index].foto}
              x={x + width / 2 - radius + 2}
              y={y - radius + 2}
              height={(radius - 2) * 2}
              width={(radius - 2) * 2}
              preserveAspectRatio="xMidYMid slice"
              clipPath={`url(#clip-${index})`}
            />
          </g>
        ) : (
          <text x={x + width / 2} y={y + 5} fill="#172b4d" textAnchor="middle" dominantBaseline="middle" fontSize="14" fontWeight="bold">
            {iniciales}
          </text>
        )
      ) : (
        <text x={x + width / 2} y={y - 5} fill="#64748b" textAnchor="middle" fontSize="12" fontWeight="bold">
          {iniciales}
        </text>
      )}

      {/* Cantidad de votos encima de la burbuja/texto */}
      <text x={x + width / 2} y={data?.[index]?.isCandidate ? y - radius - 10 : y - 20} fill="#52637d" textAnchor="middle" fontSize="12" fontWeight="bold">
        {value.toLocaleString()}
      </text>
    </g>
  );
};

// Componente para renderizar el logo del partido en el eje X
const CustomTick = (props: any) => {
  const { x, y, payload, data } = props;
  const item = data.find((d: any) => d.name === payload.value);

  if (item && item.logo) {
    return (
      <g transform={`translate(${x},${y})`}>
        <image href={item.logo} x={-20} y={10} height="40" width="40" preserveAspectRatio="xMidYMid meet" />
      </g>
    );
  }

  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={30} textAnchor="middle" fill="#52637d" fontSize="11" fontWeight="bold" width={60}>
        {payload.value.substring(0, 15)}
      </text>
    </g>
  );
};

// Componente para barras más delgadas si son blancos/nulos
const CustomBarShape = (props: any) => {
  const { fill, x, y, width, height, payload } = props;

  if (payload.isCandidate === false) {
    // Barra más delgada (50% del ancho normal) y centrada
    const thinWidth = width * 0.5;
    const thinX = x + (width - thinWidth) / 2;
    return <Rectangle x={thinX} y={y} width={thinWidth} height={height} fill={fill} radius={[4, 4, 0, 0]} opacity={0.6} />;
  }

  // Barra normal
  return <Rectangle x={x} y={y} width={width} height={height} fill={fill} radius={[8, 8, 0, 0]} />;
};

export default function ResultadosPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [selectedNivel, setSelectedNivel] = useState<string>("");
  const [selectedProvincia, setSelectedProvincia] = useState<string>("");
  const [selectedDistrito, setSelectedDistrito] = useState<string>("");
  const [selectedLocal, setSelectedLocal] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (user && user.role === "PERSONERO") {
      router.push("/");
    }
  }, [user, router]);

  useEffect(() => {
    if (user && user.role !== "PERSONERO") {
      const fetchData = async () => {
        try {
          setIsRefreshing(true);
          const response = await axiosInstance.get('/system/resultados', {
            params: {
              provincia: selectedProvincia || undefined,
              distrito: selectedDistrito || undefined,
              local: selectedLocal || undefined
            }
          });
          setData(response.data);

          if (response.data.votos && response.data.votos.length > 0) {
            const uniqueNiveles = Array.from(new Set(response.data.votos.map((v: any) => v.nivel))).sort((a: any, b: any) => {
              const order: Record<string, number> = { DISTRITAL: 1, PROVINCIAL: 2, CONSEJERO: 3, REGIONAL: 4 };
              return (order[a] || 99) - (order[b] || 99);
            });
            if (uniqueNiveles.length > 0 && (!selectedNivel || !uniqueNiveles.includes(selectedNivel))) {
              setSelectedNivel(uniqueNiveles[0] as string);
            }
          }
        } catch (error) {
          console.error("Error fetching resultados", error);
        } finally {
          setLoading(false);
          setIsRefreshing(false);
        }
      };
      
      fetchData();

      const interval = setInterval(fetchData, 60000);
      return () => clearInterval(interval);
    }
  }, [user, selectedProvincia, selectedDistrito, selectedLocal]);

  if (!mounted || user?.role === "PERSONERO") return null;

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const niveles = data?.votos ? Array.from(new Set(data.votos.map((v: any) => v.nivel))).sort((a: any, b: any) => {
    const order: Record<string, number> = { DISTRITAL: 1, PROVINCIAL: 2, CONSEJERO: 3, REGIONAL: 4 };
    return (order[a] || 99) - (order[b] || 99);
  }) : [];

  const votosActivos = data?.votos ? data.votos.filter((v: any) => v.nivel === selectedNivel) : [];

  const formatNivel = (nivel: string) => {
    return nivel.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const avanceGlobal = data?.resumen?.avanceGeneral || 0;

  // Preparar datos para el gráfico
  const COLORS = ['#2872b9', '#3e88d1', '#549ee9', '#6eb3ff', '#88c6ff', '#a4d9ff', '#c1ecff'];
  const dataCandidatos = (votosActivos || [])
    .filter((v: any) => v.tipo === "CANDIDATO")
    .map((v: any, index: number) => ({
      name: v.partido_nombre || 'Independiente',
      value: parseInt(v.total_votos || 0),
      logo: v.partido_logo,
      foto: v.candidato_foto,
      iniciales: (v.candidato_nombres && v.candidato_apellidos)
        ? `${v.candidato_nombres.charAt(0)}${v.candidato_apellidos.charAt(0)}`.toUpperCase()
        : (v.partido_nombre ? v.partido_nombre.substring(0, 2).toUpperCase() : 'IN'),
      fill: COLORS[index % COLORS.length], // Gradiente de azules del sistema
      isCandidate: true
    }))
    .sort((a: any, b: any) => b.value - a.value);

  const dataOtros = (votosActivos || [])
    .filter((v: any) => v.tipo !== "CANDIDATO" && parseInt(v.total_votos || 0) > 0)
    .map((v: any) => {
      let displayName = 'Votos';
      if (v.tipo === 'BLANCO') displayName = 'Blancos';
      if (v.tipo === 'NULO') displayName = 'Nulos';
      if (v.tipo === 'IMPUGNADO') displayName = 'Impugnados';
      return {
        name: displayName,
        value: parseInt(v.total_votos || 0),
        logo: null,
        foto: null,
        iniciales: v.tipo.substring(0, 2).toUpperCase(),
        fill: '#94a3b8', // Gris oscuro para diferenciar
        isCandidate: false
      };
    })
    .sort((a: any, b: any) => b.value - a.value);

  const barData = [...dataCandidatos, ...dataOtros];

  const chartHeight = 450;

  return (
    <div className="animate-in fade-in duration-500 bg-slate-50 min-h-screen pb-10">
      {/* TÍTULO DE LA PÁGINA */}
      <div className="max-w-7xl mx-auto pt-2 px-4 md:px-0">
        <h1 className="text-[24px] md:text-[28px] font-extrabold text-[#172b4d] tracking-tight">Resultados Electorales</h1>
      </div>

      {/* CABECERA COMO CARD */}
      <div className="bg-white border-t-[5px] border-t-[#003876] border border-[#d0d7de] rounded-xl shadow-sm p-6 max-w-7xl mx-auto mt-4 mx-4 md:mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-4 md:gap-8">
            <div className="text-left">
              <div className="text-[13px] text-[#52637d] font-bold uppercase tracking-wider mb-[-5px]">Actas contabilizadas</div>
              <div className="text-[46px] md:text-[56px] font-bold text-[#003876] leading-none tracking-tight flex items-baseline">
                {avanceGlobal.toFixed(3)} <span className="text-[28px] md:text-[36px] ml-1">%</span>
              </div>
            </div>

            <div className="text-[13px] text-[#52637d] sm:border-l sm:border-[#dfe1e6] sm:pl-6 pb-2">
              <div className="font-bold text-[#172b4d] text-[16px] mb-1">Total de actas: {(data?.resumen?.mesasTotales || 0).toLocaleString()}</div>
              <div className="flex items-center gap-4 text-[12px] font-medium mt-1">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#0b9349]"></span> Procesadas: {data?.resumen?.mesasRegistradas || 0}</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#d97008]"></span> Pendientes: {data?.resumen?.mesasPendientes || 0}</span>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-[#52637d] font-bold uppercase bg-slate-50 px-4 py-2.5 rounded-md border border-slate-200 flex items-center gap-2 self-start md:self-auto">
            <span className={`relative flex h-2 w-2 rounded-full bg-green-500 ${isRefreshing ? '' : 'animate-pulse'}`}></span>
            ACTUALIZADO AL {new Date().toLocaleDateString('es-PE')} A LAS {new Date().toLocaleTimeString('es-PE')}
          </div>
        </div>
      </div>

      {/* SECCIÓN INFERIOR COMO CARD */}
      <div className="max-w-7xl mx-auto mt-8 px-4 md:px-0">
        <div className="bg-white border border-[#d0d7de] rounded-xl shadow-sm overflow-hidden p-4 md:p-6">

          {/* BARRA DE FILTROS GEOGRÁFICOS */}
          <div className="flex flex-wrap gap-4 items-center mb-8">

            {/* SELECTOR DE NIVEL (Elección) */}
            {niveles.length > 0 && (
              <div className="relative">
                <select
                  value={selectedNivel}
                  onChange={(e) => setSelectedNivel(e.target.value)}
                  className={`appearance-none px-4 py-1.5 pr-10 rounded text-[13px] font-bold outline-none cursor-pointer border transition-colors ${selectedNivel ? 'bg-[#2171c6] text-white border-[#2171c6]' : 'bg-white text-[#172b4d] border-[#d0d7de] hover:bg-slate-50'}`}
                >
                  {niveles.map((nivel: any) => (
                    <option key={nivel} value={nivel}>Elección {formatNivel(nivel)}</option>
                  ))}
                </select>
                <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 ${selectedNivel ? 'text-white' : 'text-[#172b4d]'}`}>
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                </div>
              </div>
            )}

            {data?.provinciasLista && data.provinciasLista.length > 0 && (
              <div className="relative">
                <select
                  value={selectedProvincia}
                  onChange={(e) => {
                    setSelectedProvincia(e.target.value);
                    setSelectedDistrito("");
                    setSelectedLocal("");
                  }}
                  className={`appearance-none px-4 py-1.5 pr-10 rounded text-[13px] font-bold outline-none cursor-pointer border transition-colors ${selectedProvincia ? 'bg-[#2171c6] text-white border-[#2171c6]' : 'bg-white text-[#172b4d] border-[#d0d7de] hover:bg-slate-50'}`}
                >
                  <option value="">TODAS LAS PROVINCIAS</option>
                  {data.provinciasLista.map((p: any) => (
                    <option key={p} value={p}>{p.toUpperCase()}</option>
                  ))}
                </select>
                <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 ${selectedProvincia ? 'text-white' : 'text-[#172b4d]'}`}>
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                </div>
              </div>
            )}

            {data?.distritos && data.distritos.length > 0 && (
              <div className="relative">
                <select
                  value={selectedDistrito}
                  onChange={(e) => {
                    setSelectedDistrito(e.target.value);
                    setSelectedLocal("");
                  }}
                  className={`appearance-none px-4 py-1.5 pr-10 rounded text-[13px] font-bold outline-none cursor-pointer border transition-colors ${selectedDistrito ? 'bg-[#2171c6] text-white border-[#2171c6]' : 'bg-white text-[#172b4d] border-[#d0d7de] hover:bg-slate-50'}`}
                >
                  <option value="">TODOS LOS DISTRITOS</option>
                  {data.distritos.map((d: any) => (
                    <option key={d.distrito} value={d.distrito}>{d.distrito.toUpperCase()}</option>
                  ))}
                </select>
                <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 ${selectedDistrito ? 'text-white' : 'text-[#172b4d]'}`}>
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                </div>
                    </div>
                  )}

            {selectedDistrito && data?.localesLista && data.localesLista.length > 0 && (
              <div className="relative">
                <select
                  value={selectedLocal}
                  onChange={(e) => setSelectedLocal(e.target.value)}
                  className={`appearance-none px-4 py-1.5 pr-10 rounded text-[13px] font-bold outline-none cursor-pointer border transition-colors ${selectedLocal ? 'bg-[#2171c6] text-white border-[#2171c6]' : 'bg-white text-[#172b4d] border-[#d0d7de] hover:bg-slate-50'}`}
                >
                  <option value="">TODOS LOS LOCALES</option>
                  {data.localesLista.map((local: any, idx: number) => {
                    const value = typeof local === 'string' ? local : local.nombre;
                    const label = typeof local === 'string' ? local : (local.label || local.nombre);
                    return <option key={idx} value={value}>{label.toUpperCase()}</option>;
                  })}
                </select>
                <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 ${selectedLocal ? 'text-white' : 'text-[#172b4d]'}`}>
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                </div>
              </div>
            )}

            <button 
              onClick={() => { setSelectedProvincia(""); setSelectedDistrito(""); setSelectedLocal(""); }}
              className="px-5 py-1.5 border border-[#d0d7de] text-[#172b4d] text-[13px] font-bold rounded bg-white hover:border-[#2171c6] hover:text-[#2171c6] transition-colors ml-auto"
            >
              LIMPIAR
            </button>
          </div>

          {/* GRÁFICO DE BARRAS ONPE */}
          <div className="w-full">
            {barData.length > 0 ? (
              <div className="w-full pt-8 relative" style={{ height: chartHeight }}>
                {/* Fake grid lines (background styling) */}
                <div className="absolute inset-0 z-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(to bottom, transparent 49px, #ebecf0 50px)', backgroundSize: '100% 50px', backgroundPosition: '0 -25px' }}></div>

                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={barData}
                    margin={{ top: 60, right: 30, left: 20, bottom: 60 }}
                    barCategoryGap="15%"
                    barSize={100}
                  >
                    <XAxis
                      dataKey="name"
                      tick={(props: any) => <CustomTick {...props} data={barData} />}
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#52637d', fontSize: 13, fontWeight: 'bold' }}
                      tickFormatter={(value) => value.toLocaleString()}
                      dx={-10}
                    />
                    <RechartsTooltip
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #d0d7de', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontWeight: 'bold', fontSize: '14px', color: '#172b4d' }}
                      formatter={(value: any) => [Number(value || 0).toLocaleString() + ' votos', 'Votos Válidos']}
                    />
                    <Bar
                      dataKey="value"
                      shape={<CustomBarShape />}
                      label={(props: any) => <CustomBarLabel {...props} data={barData} />}
                      animationDuration={1500}
                    >
                      {barData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="py-24 text-center text-[#52637d] font-medium border border-[#d0d7de] rounded-xl bg-slate-50">
                Aún no hay resultados para los filtros seleccionados.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
