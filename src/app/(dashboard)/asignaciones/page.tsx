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

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="title">
          <h1 className="text-[24px] md:text-[28px] font-extrabold text-[#172b4d] tracking-tight">Asignación de Mesas a Personeros</h1>
          <p className="text-[13px] text-[#52637d] mt-1">Selecciona un personero y asigna las mesas que tendrá a su cargo.</p>
        </div>
        <div className="mt-1 flex items-center text-[13px] text-[#52637d]">
            <span className="font-medium text-[#52637d]">Personeros</span>
            <span className="mx-2">/</span>
            <span className="font-bold text-blue-600">Asignaciones</span>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-[#f4f5f7] p-6">
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
              <div className="border-b border-line px-5 py-3 bg-[#f8fafc] flex justify-between items-center">
                <h2 className="text-[15px] font-bold text-[#172b4d]">Asignar mesas</h2>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-line shadow-sm">
                    <span className="text-[16px] leading-none">📊</span>
                    <div>
                      <p className="text-[9px] font-bold text-[#52637d] uppercase tracking-wider leading-none mb-0.5">Total Mesas</p>
                      <p className="text-[13px] font-black text-[#172b4d] leading-none">{mesas.length}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-line shadow-sm">
                    <span className="text-[16px] leading-none">✅</span>
                    <div>
                      <p className="text-[9px] font-bold text-[#52637d] uppercase tracking-wider leading-none mb-0.5">Mesas Asignadas</p>
                      <p className="text-[13px] font-black text-[#0b9349] leading-none">{mesas.filter(m => m.personero !== null).length}</p>
                    </div>
                  </div>
                </div>
              </div>

              {selectedUser ? (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="p-5 border-b border-line bg-slate-50/50">
                    <p className="text-[13px] text-[#52637d]">
                      <strong>Personero seleccionado:</strong><br />
                      <span className="text-[15px] font-bold text-[#172b4d]">{selectedUser.name} {selectedUser.lastname}</span> 
                      <span className="ml-2 text-[#667085]">(DNI: {selectedUser.dni})</span>
                    </p>
                  </div>

                  <div className="flex-1 overflow-auto">
                    <table className="w-full text-left text-sm text-[#52637d]">
                      <thead className="sticky top-0 bg-[#f8fafc] text-xs font-extrabold uppercase text-[#52637d] shadow-sm z-10">
                        <tr>
                          <th className="px-5 py-3.5">Mesa</th>
                          <th className="px-5 py-3.5">Local de votación</th>
                          <th className="px-5 py-3.5">Distrito</th>
                          <th className="px-5 py-3.5 text-center">Asignar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line bg-white">
                        {mesas.map(mesa => {
                          const isAssignedToMe = mesa.personero?.id === selectedUser.id;
                          const isAssignedToOther = mesa.personero !== null && mesa.personero?.id !== selectedUser.id;
                          
                          return (
                            <tr key={mesa.id} className="hover:bg-[#f8fafc] transition-colors">
                              <td className="px-5 py-3 font-bold text-[#172b4d] text-[13px]">
                                {mesa.numero_mesa}
                              </td>
                              <td className="px-5 py-3 text-[13px]">
                                {mesa.local?.nombre || 'Sin local'}
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
                        {mesas.length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-5 py-10 text-center text-[#52637d]">
                              No hay mesas registradas para esta elección.
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
