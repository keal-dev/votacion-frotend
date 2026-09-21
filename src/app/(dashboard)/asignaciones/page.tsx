'use client';
import { useEffect, useState } from 'react';
import { userService } from '@/services/user.service';
import { mesaService } from '@/services/mesa.service';
import { electionService } from '@/services/election.service';
import { User, Role } from '@/types/user.types';
import { Mesa } from '@/types/mesa.types';
import { Election } from '@/types/election.types';
import Link from 'next/link';

export default function AsignacionesPage() {
  const [activeElection, setActiveElection] = useState<Election | null>(null);
  const [personeros, setPersoneros] = useState<User[]>([]);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [distritoFiltro, setDistritoFiltro] = useState<string>('TODOS');
  const [centroPobladoFiltro, setCentroPobladoFiltro] = useState<string>('TODOS');

  const loadData = async () => {
    try {
      setLoading(true);
      const elections = await electionService.getAll();
      const active = elections.find(e => e.activa);
      
      if (!active) {
        setLoading(false);
        return;
      }
      
      setActiveElection(active);

      const allUsers = await userService.getAll();
      const electionPersoneros = allUsers.filter(u => 
        u.role === Role.PERSONERO && 
        u.election?.id === active.id
      );
      setPersoneros(electionPersoneros);

      const mesasData = await mesaService.getByElection(active.id);
      setMesas(mesasData);

    } catch (error) {
      console.error('Error fetching data for asignaciones', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleMesa = async (mesa: Mesa) => {
    if (!selectedUser) return;

    const isAssignedToMe = mesa.personero?.id === selectedUser.id;
    const newPersoneroId = isAssignedToMe ? null : selectedUser.id;

    const previousMesas = [...mesas];
    setMesas(mesas.map(m => m.id === mesa.id ? { ...m, personero: newPersoneroId ? selectedUser : null } : m));

    try {
      await mesaService.assignPersonero(mesa.id, newPersoneroId);
    } catch (error) {
      console.error('Error assigning personero', error);
      alert('Error al asignar la mesa. Por favor intenta de nuevo.');
      setMesas(previousMesas); 
    }
  };

  const filteredPersoneros = personeros.filter(p => 
    `${p.name} ${p.lastname}`.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.dni.includes(searchTerm)
  );

  const distritos = Array.from(new Set(mesas.map(m => m.local?.distrito).filter(Boolean))) as string[];
  const centrosPoblados = Array.from(new Set(
    mesas
      .filter(m => distritoFiltro === 'TODOS' || m.local?.distrito === distritoFiltro)
      .map(m => m.local?.centro_poblado)
      .filter(Boolean)
  )) as string[];

  const mesasFiltradasGeograficamente = mesas.filter(m => {
    if (distritoFiltro !== 'TODOS' && m.local?.distrito !== distritoFiltro) return false;
    if (centroPobladoFiltro !== 'TODOS' && m.local?.centro_poblado !== centroPobladoFiltro) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto flex h-full flex-col animate-in fade-in slide-in-from-left-8 duration-300 w-full">
      <div className="flex items-center justify-between mb-5">
        <div className="title">
          <h1 className="text-[24px] md:text-[28px] font-extrabold text-[#172b4d] tracking-tight">Asignación de Mesas a Personeros</h1>
          <p className="text-[13px] text-[#52637d] mt-1">Selecciona un personero y asigna las mesas que tendrá a su cargo.</p>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-[#f4f5f7]">
        {!activeElection && !loading ? (
           <div className="flex h-full flex-col items-center justify-center rounded-xl border border-line bg-white p-8 text-center shadow-sm">
             <div className="mb-4 rounded-full bg-yellow-50 p-4 text-yellow-500">
               <span className="text-4xl">⚠️</span>
             </div>
             <h2 className="mb-2 text-lg font-bold text-[#172b4d]">No hay elección activa</h2>
             <p className="max-w-md text-sm text-[#52637d]">
               Debes activar una elección en la configuración para poder asignar mesas a personeros.
             </p>
           </div>
        ) : loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          </div>
        ) : (
          <div className="grid gap-[18px] grid-cols-1 md:grid-cols-[1fr_2fr] h-full">
            <div className="bg-white border border-line rounded-2xl flex flex-col shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden">
              <div className="border-b border-line px-5 py-4 bg-[#f8fafc]">
                <h2 className="text-[15px] font-bold text-[#172b4d]">Personeros registrados</h2>
              </div>
              
              <div className="p-4 border-b border-line">
                <input 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 text-[13px] bg-white border border-[#dfe1e6] rounded-md focus:ring-2 focus:ring-[#0b9349]/20 focus:border-[#0b9349] transition-all outline-none" 
                  placeholder="⌕ Buscar personero (Nombre o DNI)..." 
                />
              </div>

              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
                {filteredPersoneros.length === 0 ? (
                  <div className="text-center text-[13px] text-[#52637d] py-6">
                    No se encontraron personeros para esta elección.
                  </div>
                ) : (
                  filteredPersoneros.map(personero => {
                    const isSelected = selectedUser?.id === personero.id;
                    const assignedCount = mesas.filter(m => m.personero?.id === personero.id).length;
                    
                    return (
                      <div 
                        key={personero.id}
                        onClick={() => setSelectedUser(personero)}
                        className={`px-3 py-2.5 rounded-lg cursor-pointer border transition-all ${
                          isSelected 
                            ? 'border-blue-300 bg-blue-50 shadow-sm' 
                            : 'border-transparent hover:border-line hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <strong className="block text-[13px] text-[#172b4d]">
                              {personero.name} {personero.lastname}
                              {personero.role === 'COORDINADOR' && (
                                <span className="ml-2 inline-flex items-center justify-center bg-purple-100 text-purple-700 text-[9px] font-extrabold px-1.5 py-0.5 rounded border border-purple-200 align-middle">
                                  COORDINADOR
                                </span>
                              )}
                            </strong>
                            <small className="text-[#52637d] text-[11px]">DNI: {personero.dni}</small>
                          </div>
                          {assignedCount > 0 && (
                            <span className="inline-flex items-center justify-center bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              {assignedCount} mesas
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="bg-white border border-line rounded-2xl flex flex-col shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden">
                  <div className="border-b border-line px-5 py-3 bg-[#f8fafc] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
                <h2 className="text-[15px] font-bold text-[#172b4d]">Asignar mesas</h2>
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                      <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
                        <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Total Mesas</span>
                        <span className="bg-white text-slate-800 text-[12px] font-black px-2 py-0.5 rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                          {mesas.length}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                        <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Asignadas</span>
                        <span className="bg-white text-emerald-700 text-[12px] font-black px-2 py-0.5 rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                          {mesas.filter(m => m.personero !== null).length}
                        </span>
                  </div>
                </div>
              </div>

              {selectedUser ? (
                <div className="flex-1 flex flex-col overflow-hidden">
                      <div className="px-5 py-3 border-b border-line bg-slate-50/50 flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                          <strong className="text-[13px] text-[#52637d]">Personero:</strong>
                          <span className="text-[14px] font-bold text-[#172b4d]">{selectedUser.name} {selectedUser.lastname}</span>
                        </div>
                        <div className="flex-1"></div>
                        <div className="flex items-center gap-3">
                          <select
                            value={distritoFiltro}
                            onChange={(e) => {
                              setDistritoFiltro(e.target.value);
                              setCentroPobladoFiltro('TODOS'); // Reset centro poblado
                            }}
                            className="text-[12px] bg-white border border-[#dfe1e6] rounded px-2 py-1 outline-none focus:border-blue-500 text-[#172b4d]"
                          >
                            <option value="TODOS">Todos los Distritos</option>
                            {distritos.map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                          <select
                            value={centroPobladoFiltro}
                            onChange={(e) => setCentroPobladoFiltro(e.target.value)}
                            className="text-[12px] bg-white border border-[#dfe1e6] rounded px-2 py-1 outline-none focus:border-blue-500 text-[#172b4d]"
                          >
                            <option value="TODOS">Todos los C. Poblados</option>
                            {centrosPoblados.map(cp => <option key={cp} value={cp}>{cp}</option>)}
                          </select>
                        </div>
                  </div>

                  <div className="flex-1 overflow-auto">
                    <table className="w-full text-left text-sm text-[#52637d]">
                      <thead className="sticky top-0 bg-[#f8fafc] text-xs font-extrabold uppercase text-[#52637d] shadow-sm z-10">
                        <tr>
                          <th className="px-5 py-3.5">Mesa</th>
                          <th className="px-5 py-3.5">Local de votación</th>
                              <th className="px-5 py-3.5">Centro Poblado</th>
                          <th className="px-5 py-3.5">Distrito</th>
                          <th className="px-5 py-3.5 text-center">Asignar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line bg-white">
                            {mesasFiltradasGeograficamente.map(mesa => {
                          const isAssignedToMe = mesa.personero?.id === selectedUser.id;
                          const isAssignedToOther = mesa.personero !== null && mesa.personero?.id !== selectedUser.id;
                          
                          return (
                            <tr key={mesa.id} className={`transition-colors ${isAssignedToMe ? 'bg-blue-50/40 hover:bg-blue-50/60' : 'hover:bg-[#f8fafc]'}`}>
                              <td className="px-5 py-3 font-bold text-[#172b4d] text-[13px]">
                                {mesa.numero_mesa}
                              </td>
                              <td className="px-5 py-3 text-[13px]">
                                {mesa.local?.nombre || 'Sin local'}
                              </td>
                              <td className="px-5 py-3 text-[13px]">
                                {mesa.local?.centro_poblado || '-'}
                              </td>
                              <td className="px-5 py-3 text-[13px]">
                                {mesa.local?.distrito || '-'}
                              </td>
                              <td className="px-5 py-3 text-center">
                                {isAssignedToOther ? (
                                  <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-1 rounded-full" title={`Asignada a ${mesa.personero?.name}`}>
                                    Ocupada
                                  </span>
                                ) : (
                                  <input 
                                    className="w-4 h-4 cursor-pointer accent-[#0b9349]" 
                                    type="checkbox" 
                                    checked={isAssignedToMe}
                                    onChange={() => handleToggleMesa(mesa)}
                                  />
                                )}
                              </td>
                            </tr>
                          );
                        })}
                            {mesasFiltradasGeograficamente.length === 0 && (
                          <tr>
                                <td colSpan={5} className="px-5 py-10 text-center text-[#52637d]">
                                  No hay mesas que coincidan con estos filtros.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                  <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4 border border-line">
                    <span className="text-2xl">👆</span>
                  </div>
                  <h3 className="text-[15px] font-bold text-[#172b4d] mb-1">Selecciona un personero</h3>
                  <p className="text-[13px] text-[#52637d] max-w-sm">
                    Haz clic en un personero de la lista a la izquierda para ver y gestionar las mesas que tiene a su cargo.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
