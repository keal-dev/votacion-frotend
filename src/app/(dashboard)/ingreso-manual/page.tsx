'use client';
import { useEffect, useState } from 'react';
import { mesaService } from '@/services/mesa.service';
import { electionService } from '@/services/election.service';
import axiosInstance from '@/utils/axios';
import { Mesa } from '@/types/mesa.types';

interface Candidato {
    id: string;
    nombre: string;
    nombres?: string;
    apellidos: string;
    cargo: string;
    fotoUrl?: string | null;
    foto_url?: string | null;
    partido: {
        id: string;
        nombre: string;
        logoUrl?: string | null;
        logo_url?: string | null;
    } | null;
}

const getImageUrl = (url: string | null) => {
    if (!url) return "";
    if (url.startsWith('http')) return url;
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api').replace('/api', '');
    return `${baseUrl}${url}`;
};

export default function IngresoManualPage() {
    const [mesas, setMesas] = useState<Mesa[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMesa, setSelectedMesa] = useState<Mesa | null>(null);

    const [candidatos, setCandidatos] = useState<Candidato[]>([]);
    const [loadingCandidatos, setLoadingCandidatos] = useState(false);
    const [votos, setVotos] = useState<Record<string, string>>({});
    const [activeTab, setActiveTab] = useState<'REGIONAL' | 'CONSEJERO' | 'PROVINCIAL' | 'DISTRITAL'>('REGIONAL');
    const [submitting, setSubmitting] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");

    const loadData = async () => {
        try {
            setLoading(true);
            const elections = await electionService.getAll();
            const active = elections.find(e => e.activa);
            if (!active) {
                setLoading(false);
                return;
            }
            const mesasData = await mesaService.getByElection(active.id);
            setMesas(mesasData);
        } catch (error) {
            console.error('Error fetching mesas', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSelectMesa = async (mesa: Mesa) => {
        setSelectedMesa(mesa);
        setLoadingCandidatos(true);
        setVotos({});
        setSuccessMsg("");
        setActiveTab('REGIONAL');
        try {
            const { data } = await axiosInstance.get(`/candidatos/mesa/${mesa.id}`);
            setCandidatos(data);
            
            const initialVotos: Record<string, string> = {
                voto_blanco_regional: '', voto_nulo_regional: '', voto_impugnado_regional: '',
                voto_blanco_consejero: '', voto_nulo_consejero: '', voto_impugnado_consejero: '',
                voto_blanco_provincial: '', voto_nulo_provincial: '', voto_impugnado_provincial: '',
                voto_blanco_distrital: '', voto_nulo_distrital: '', voto_impugnado_distrital: '',
            };
            data.forEach((c: any) => {
                initialVotos[`voto_${c.id}`] = '';
            });

            // Intentar cargar acta existente si hay una guardada parcialmente
            try {
                const actaRes = await axiosInstance.get(`/actas/mesa/${mesa.id}`);
                if (actaRes.data && actaRes.data.votos) {
                    actaRes.data.votos.forEach((v: any) => {
                        if (v.candidato) {
                            if (v.cantidad > 0) initialVotos[`voto_${v.candidato.id}`] = v.cantidad.toString();
                        } else {
                            const tipo = v.tipo.toLowerCase();
                            const nivel = v.nivel.toLowerCase();
                            if (v.cantidad > 0) initialVotos[`voto_${tipo}_${nivel}`] = v.cantidad.toString();
                        }
                    });
                }
            } catch (e) {
                // Ignore if no acta found
            }

            setVotos(initialVotos);
        } catch (error) {
            console.error('Error fetching candidates', error);
            alert("Error al cargar candidatos de la mesa");
        } finally {
            setLoadingCandidatos(false);
        }
    };

    const handleVotoChange = (key: string, value: string) => {
        const cleanValue = value.replace(/[^0-9]/g, '');
        setVotos(prev => ({ ...prev, [key]: cleanValue }));
    };

    const calcularTotalTab = (tab: string) => {
        let total = 0;
        candidatos.filter(c => c.cargo === tab).forEach(c => {
            total += parseInt(votos[`voto_${c.id}`]) || 0;
        });
        const tabLower = tab.toLowerCase();
        total += parseInt(votos[`voto_blanco_${tabLower}`]) || 0;
        total += parseInt(votos[`voto_nulo_${tabLower}`]) || 0;
        total += parseInt(votos[`voto_impugnado_${tabLower}`]) || 0;
        return total;
    };

    const submitManualActa = async (isPartial: boolean = false) => {
        if (!selectedMesa) return;
        
        const totReg = calcularTotalTab('REGIONAL');
        const totConsejero = calcularTotalTab('CONSEJERO');
        const totProv = calcularTotalTab('PROVINCIAL');
        const totDist = calcularTotalTab('DISTRITAL');
        const maxTotal = Math.max(totReg, totConsejero, totProv, totDist);

        const niveles = [
            { name: 'REGIONAL', tot: totReg },
            { name: 'CONSEJERO', tot: totConsejero },
            { name: 'PROVINCIAL', tot: totProv },
            { name: 'DISTRITAL', tot: totDist }
        ];

        const nivelesActivos = niveles.filter(n => candidatos.some(c => c.cargo === n.name));
        
        if (nivelesActivos.length > 0 && !isPartial) {
            const firstTotal = nivelesActivos[0].tot;
            const todosIguales = nivelesActivos.every(n => n.tot === firstTotal);
            if (!todosIguales) {
                alert("La suma total de votos no coincide en todas las pestañas.");
                return;
            }
            if (firstTotal === 0) {
                alert("Debes ingresar la cantidad de votos reales antes de guardar.");
                return;
            }
            if (selectedMesa.cantidad_electores > 0 && firstTotal > selectedMesa.cantidad_electores) {
                alert(`El total (${firstTotal}) supera los electores de la mesa (${selectedMesa.cantidad_electores}).`);
                return;
            }
        }

        if (isPartial) {
            if (!confirm(`¿Estás seguro de guardar el progreso de esta acta de la Mesa ${selectedMesa.numero_mesa}? No se enviará como completada aún.`)) return;
        } else {
            if (!confirm(`¿Estás seguro de registrar y FINALIZAR esta acta manualmente para la Mesa ${selectedMesa.numero_mesa}?`)) return;
        }

        setSubmitting(true);
        try {
            const finalVotos = { ...votos };
            candidatos.forEach(c => {
                const k = `voto_${c.id}`;
                if (finalVotos[k] === undefined || finalVotos[k] === '') finalVotos[k] = '0';
            });
            ['regional', 'consejero', 'provincial', 'distrital'].forEach(n => {
                if (!finalVotos[`voto_blanco_${n}`]) finalVotos[`voto_blanco_${n}`] = '0';
                if (!finalVotos[`voto_nulo_${n}`]) finalVotos[`voto_nulo_${n}`] = '0';
                if (!finalVotos[`voto_impugnado_${n}`]) finalVotos[`voto_impugnado_${n}`] = '0';
            });

            await axiosInstance.post('/actas/manual', {
                mesaId: selectedMesa.id,
                votos: finalVotos,
                isPartial
            });

            setSuccessMsg(isPartial ? "¡Progreso guardado exitosamente!" : "¡Acta registrada exitosamente!");
            if (!isPartial) {
                setMesas(mesas.map(m => m.id === selectedMesa.id ? { ...m, estado: 'ENVIADA' as any } : m));
            }
            setTimeout(() => {
                setSelectedMesa(null);
            }, 2000);
        } catch (error: any) {
            alert(error.response?.data?.message || "Error al registrar el acta.");
        } finally {
            setSubmitting(false);
        }
    };

    const term = searchTerm.toLowerCase();
    const filteredMesas = mesas.filter(m => {
        const personeroName = m.personero ? `${m.personero.name} ${m.personero.lastname}`.toLowerCase() : '';
        const personeroDni = m.personero?.dni || '';
        
        return m.numero_mesa.includes(searchTerm) || 
               personeroName.includes(term) || 
               personeroDni.includes(term);
    });

    return (
        <div className="max-w-7xl mx-auto flex h-full flex-col animate-in fade-in slide-in-from-left-8 duration-300 w-full">
            {!selectedMesa && (
                <div className="flex items-center justify-between mb-5 shrink-0">
                    <div className="title">
                        <h1 className="text-[24px] md:text-[28px] font-extrabold text-[#172b4d] tracking-tight">Digitación Rápida</h1>
                        <p className="text-[13px] text-[#52637d] mt-1">Ingresa manualmente los resultados de las actas de contingencia.</p>
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-hidden bg-[#f4f5f7] flex flex-col">
                {loading ? (
                    <div className="flex h-full items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
                    </div>
                ) : !selectedMesa ? (
                    // VISTA DE TABLA
                    <div className="bg-white border border-line rounded-2xl flex flex-col shadow-[0_2px_10px_rgba(0,0,0,0.02)] h-full overflow-hidden">
                        <div className="border-b border-line px-5 py-4 bg-[#f8fafc] flex justify-between items-center">
                            <h2 className="text-[15px] font-bold text-[#172b4d]">Lista de Mesas</h2>
                            <div className="w-64 sm:w-80">
                                <input 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full px-3 py-2 text-[13px] bg-white border border-[#dfe1e6] rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none" 
                                    placeholder="⌕ Buscar mesa, personero o DNI..." 
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-auto">
                            <table className="w-full text-left text-sm text-[#52637d]">
                                <thead className="sticky top-0 bg-[#f8fafc] text-xs font-extrabold uppercase text-[#52637d] shadow-sm z-10">
                                    <tr>
                                        <th className="px-5 py-3.5">Mesa</th>
                                        <th className="px-5 py-3.5">Local de votación</th>
                                        <th className="px-5 py-3.5">Personero / DNI</th>
                                        <th className="px-5 py-3.5">Distrito / C.P.</th>
                                        <th className="px-5 py-3.5 text-center">Electores</th>
                                        <th className="px-5 py-3.5 text-center">Estado</th>
                                        <th className="px-5 py-3.5 text-center">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-line bg-white">
                                    {filteredMesas.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-5 py-10 text-center text-[#52637d]">
                                                No se encontraron mesas.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredMesas.map(mesa => {
                                            const isProcessed = mesa.estado === 'ENVIADA' || mesa.estado === 'PROCESADO' || mesa.estado === 'AUDITADO';
                                            return (
                                                <tr key={mesa.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-5 py-3 font-bold text-[#172b4d] text-[14px]">
                                                        {mesa.numero_mesa}
                                                    </td>
                                                    <td className="px-5 py-3 text-[13px]">
                                                        {mesa.local?.nombre || '-'}
                                                    </td>
                                                    <td className="px-5 py-3 text-[13px]">
                                                        {mesa.personero ? (
                                                            <>
                                                                <span className="font-bold text-[#172b4d]">{mesa.personero.name} {mesa.personero.lastname}</span><br/>
                                                                <span className="text-[11px] text-slate-500">{mesa.personero.dni}</span>
                                                            </>
                                                        ) : (
                                                            <span className="text-slate-400 italic">Sin asignar</span>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-3 text-[13px]">
                                                        {mesa.local?.distrito || '-'} <br/>
                                                        <span className="text-[11px] text-slate-400">{mesa.local?.centro_poblado}</span>
                                                    </td>
                                                    <td className="px-5 py-3 text-[13px] text-center font-semibold">
                                                        {mesa.cantidad_electores}
                                                    </td>
                                                    <td className="px-5 py-3 text-center">
                                                        {isProcessed ? (
                                                            <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-1 rounded-full uppercase">Completado</span>
                                                        ) : (
                                                            <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-1 rounded-full uppercase">Pendiente</span>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-3 text-center">
                                                        <button 
                                                            onClick={() => !isProcessed && handleSelectMesa(mesa)}
                                                            disabled={isProcessed}
                                                            className={`text-[12px] font-bold px-3 py-1.5 rounded-lg transition-colors ${
                                                                isProcessed 
                                                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                                                                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                                                            }`}
                                                        >
                                                            Llenar Votos
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    // VISTA DE DIGITACIÓN FULL WIDTH
                    <div className="bg-white border border-line rounded-2xl flex flex-col shadow-[0_2px_10px_rgba(0,0,0,0.02)] h-full overflow-hidden">
                        
                        <div className="border-b border-line px-5 py-3 bg-[#f8fafc] flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-4">
                                <button 
                                    onClick={() => setSelectedMesa(null)}
                                    className="text-slate-500 hover:text-slate-800 flex items-center justify-center w-8 h-8 rounded-full hover:bg-slate-200 transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                                </button>
                                <div>
                                    <h2 className="text-[18px] font-bold text-[#172b4d]">Acta de Mesa {selectedMesa.numero_mesa}</h2>
                                    <p className="text-[13px] text-slate-500">{selectedMesa.local?.nombre} | Electores: {selectedMesa.cantidad_electores}</p>
                                </div>
                            </div>
                        </div>

                        {successMsg ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                                <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center mb-6 text-emerald-600 shadow-lg shadow-emerald-500/20">
                                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                </div>
                                <h3 className="text-[24px] font-extrabold text-emerald-600 mb-2">{successMsg}</h3>
                                <p className="text-slate-500 font-medium">Volviendo a la lista de mesas...</p>
                            </div>
                        ) : loadingCandidatos ? (
                            <div className="flex-1 flex items-center justify-center">
                                <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
                            </div>
                        ) : (
                            <div className="flex flex-col h-full overflow-hidden">
                                <div className="flex border-b border-line shrink-0">
                                    {['REGIONAL', 'CONSEJERO', 'PROVINCIAL', 'DISTRITAL'].map(tab => (
                                        <button 
                                            key={tab}
                                            onClick={() => setActiveTab(tab as any)}
                                            className={`flex-1 py-4 text-[13px] uppercase font-bold transition-colors ${activeTab === tab ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30' : 'text-slate-500 hover:bg-slate-50'}`}
                                        >
                                            {tab} ({calcularTotalTab(tab)})
                                        </button>
                                    ))}
                                </div>

                                <div className="flex-1 overflow-y-auto p-5 bg-slate-50">
                                    <div className="max-w-2xl mx-auto space-y-1.5">
                                        {candidatos.filter(c => c.cargo === activeTab).length === 0 ? (
                                            <div className="text-center py-6 text-slate-500 bg-white rounded-lg border border-slate-200">No hay candidatos para este nivel en esta jurisdicción.</div>
                                        ) : (
                                            <>
                                                {candidatos.filter(c => c.cargo === activeTab).map(c => (
                                                    <div key={c.id} className="flex items-center gap-3 bg-white p-1.5 px-3 rounded-lg border border-slate-200 shadow-sm hover:border-blue-300 transition-colors">
                                                        <div className="w-9 h-9 bg-slate-100 rounded flex items-center justify-center p-0.5 shrink-0">
                                                            {(c.partido?.logoUrl || c.partido?.logo_url) ? (
                                                                <img src={getImageUrl(c.partido?.logoUrl || c.partido?.logo_url || null)} className="w-full h-full object-contain" />
                                                            ) : <span className="text-lg">🖼️</span>}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="text-[13px] font-bold text-[#172b4d] leading-tight">{c.partido?.nombre || 'INDEPENDIENTE'}</div>
                                                            <div className="text-[11px] text-slate-500 font-medium leading-tight mt-0.5">{c.nombres || c.nombre} {c.apellidos}</div>
                                                        </div>
                                                        <input
                                                            type="text"
                                                            inputMode="numeric"
                                                            placeholder="0"
                                                            value={votos[`voto_${c.id}`]}
                                                            onChange={(e) => handleVotoChange(`voto_${c.id}`, e.target.value)}
                                                            className="w-20 text-center font-black text-[17px] h-9 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all text-[#172b4d]"
                                                        />
                                                    </div>
                                                ))}
                                                
                                                <div className="h-px bg-slate-200 my-3"></div>
                                                
                                                {['blanco', 'nulo', 'impugnado'].map(tipo => (
                                                    <div key={tipo} className="flex items-center gap-3 bg-white p-1.5 px-3 rounded-lg border border-slate-200 shadow-sm hover:border-blue-300 transition-colors">
                                                        <div className="w-9 h-9 bg-slate-50 border border-slate-100 rounded flex items-center justify-center shrink-0 text-slate-400 font-bold uppercase text-[10px]">
                                                            {tipo.substring(0,3)}
                                                        </div>
                                                        <div className="flex-1 text-[13px] font-bold text-slate-700 uppercase">
                                                            VOTOS EN {tipo}
                                                        </div>
                                                        <input
                                                            type="text"
                                                            inputMode="numeric"
                                                            placeholder="0"
                                                            value={votos[`voto_${tipo}_${activeTab.toLowerCase()}`]}
                                                            onChange={(e) => handleVotoChange(`voto_${tipo}_${activeTab.toLowerCase()}`, e.target.value)}
                                                            className="w-20 text-center font-black text-[17px] h-9 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none bg-slate-50 transition-all text-[#172b4d]"
                                                        />
                                                    </div>
                                                ))}
                                            </>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="p-5 border-t border-line bg-white flex justify-between items-center shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-[20px] font-black text-[#172b4d]">
                                            {calcularTotalTab(activeTab)}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[12px] text-slate-500 uppercase font-bold tracking-wider">Total de votos</span>
                                            <span className="text-[14px] font-bold text-[#172b4d]">Pestaña {activeTab}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => submitManualActa(true)}
                                            disabled={submitting}
                                            className="bg-white border-2 border-slate-200 text-slate-700 font-bold px-6 py-3.5 rounded-xl flex items-center gap-2 hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-70 hover:scale-[1.02] active:scale-[0.98] text-[14px]"
                                        >
                                            Guardar Progreso
                                        </button>
                                        <button
                                            onClick={() => submitManualActa(false)}
                                            disabled={submitting}
                                            className="bg-blue-600 text-white font-bold px-8 py-3.5 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-70 hover:scale-[1.02] active:scale-[0.98] text-[14px]"
                                        >
                                            {submitting ? (
                                                <>
                                                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                                    Guardando...
                                                </>
                                            ) : 'Guardar y Enviar Acta'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
