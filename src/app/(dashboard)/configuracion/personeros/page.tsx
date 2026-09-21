'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { userService } from '@/services/user.service';
import { User, Role } from '@/types/user.types';
import axiosInstance from '@/utils/axios';
import DeleteConfirmModal from "@/components/DeleteConfirmModal";

// Inline SVG Icons
const PlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

const MapPinIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
  </svg>
);

const EditIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
  </svg>
);

const KeyIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
  </svg>
);

const TrashIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);

const UserIconSvg = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
);

const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const BriefcaseIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.896 1.95-2.022 2.022M3.75 14.15v4.25c0 1.094.896 1.95 2.022 2.022M3.75 14.15V9c0-1.094.896-1.95 2.022-2.022h12.456c1.094 0 2.022.896 2.022 2.022v5.15M3.75 14.15l8.25 4.5 8.25-4.5M9 5.25v-1.5a2.25 2.25 0 012.25-2.25h1.5a2.25 2.25 0 012.25 2.25v1.5M12 13.5a.75.75 0 100-1.5.75.75 0 000 1.5z" />
  </svg>
);

interface ElectionOption {
  id: string;
  nombre: string;
  activa: boolean;
}

export default function PersonerosPage() {
  const [personeros, setPersoneros] = useState<User[]>([]);
  const [activeElection, setActiveElection] = useState<ElectionOption | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modales de eliminación
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [personeroToDelete, setPersoneroToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadPersoneros = async () => {
    try {
      setLoading(true);
      const data = await userService.getAll();
      setPersoneros(data);
    } catch (e) {
      console.error('Error fetching personeros', e);
    } finally {
      setLoading(false);
    }
  };

  const loadElections = async () => {
    try {
      const resp = await axiosInstance.get<ElectionOption[]>('/elections');
      const active = resp.data.find(e => e.activa);
      if (active) setActiveElection(active);
    } catch (e) {
      console.error('Error fetching elections', e);
    }
  };

  useEffect(() => {
    loadPersoneros();
    loadElections();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setError(null);
    setIsModalOpen(true);
  };

  const openEdit = (personero: User) => {
    setEditing(personero);
    setError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditing(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);

    // Si la contraseña está vacía, no la enviamos para no sobrescribirla ni fallar la validación
    if (!formData.get('password')) {
      formData.delete('password');
    }

    setIsSubmitting(true);
    try {
      // Retraso artificial mínimo para apreciar la animación
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (editing) {
        await userService.update(editing.id, formData);
      } else {
        await userService.create(formData);
      }
      await loadPersoneros();
      closeModal();
    } catch (err: any) {
      console.error('Error saving personero', err);
      const errorMessage = err.response?.data?.message || 'Error al guardar el usuario.';
      setError(Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (personero: User) => {
    setPersoneroToDelete(personero);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!personeroToDelete) return;
    try {
      setIsDeleting(true);
      await userService.delete(personeroToDelete.id);
      setIsDeleteModalOpen(false);
      await loadPersoneros();
    } catch (error) {
      console.error(error);
      alert("No se pudo eliminar el usuario");
    } finally {
      setIsDeleting(false);
      setPersoneroToDelete(null);
    }
  };

  const getRoleBadge = (role: Role | null) => {
    switch (role) {
      case Role.ADMIN:
        return <span className="inline-flex items-center justify-center bg-red-100 px-2.5 py-1 rounded-full text-xs font-bold text-red-700 border border-red-200">Administrador</span>;
      case Role.COORDINADOR:
        return <span className="inline-flex items-center justify-center bg-blue-100 px-2.5 py-1 rounded-full text-xs font-bold text-blue-700 border border-blue-200">Coordinador</span>;
      case Role.PERSONERO:
        return <span className="inline-flex items-center justify-center bg-[#e3fcee] px-2.5 py-1 rounded-full text-xs font-bold text-[#0b9349] border border-[#bbf4d5]">Personero</span>;
      default:
        return <span className="inline-flex items-center justify-center bg-slate-100 px-2.5 py-1 rounded-full text-xs font-bold text-[#52637d]">Sin Rol</span>;
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Encabezado (Estilo Candidatos) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-4">
        <div>
          <h1 className="text-[24px] md:text-[28px] font-extrabold text-[#172b4d] tracking-tight">
            Directorio de Usuarios
          </h1>
          <div className="mt-1 flex items-center text-[13px] text-[#52637d]">
            <Link href="/configuracion" className="hover:text-blue-600 transition-colors">
              Configuración
            </Link>
            <span className="mx-2">/</span>
            <span className="font-bold text-blue-600">Usuarios y Roles</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
          {activeElection && (
            <div className="flex items-center gap-2 rounded-full bg-green-50 px-4 py-2 border border-green-200 shadow-sm w-full sm:w-auto justify-center">
              <div className="w-2 h-2 rounded-full bg-[#0b9349] animate-pulse"></div>
              <span className="text-[13px] font-bold text-[#0b9349]">{activeElection.nombre}</span>
            </div>
          )}

          <button
            onClick={openCreate}
            className="flex w-full cursor-pointer sm:w-auto h-fit items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 active:scale-95"
          >
            <PlusIcon className="w-5 h-5" />
            Nuevo Usuario
          </button>
        </div>
      </div>

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        title="Eliminar Usuario"
        message={`¿Estás seguro de que deseas eliminar al usuario "${personeroToDelete?.name} ${personeroToDelete?.lastname}"? Esta acción no se puede deshacer.`}
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
        loading={isDeleting}
      />

      {/* Contenedor Principal */}
      <div className="flex-1 overflow-auto bg-[#f4f5f7]">
        <div className="mx-auto max-w-6xl">
          {/* Tabla de Usuarios */}
          <div className="rounded-2xl border border-line bg-white shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col h-full">
        <div className="border-b border-line px-5 py-4 flex justify-between items-center bg-[#f8fafc]">
          <h2 className="text-[15px] font-bold text-[#172b4d]">
            Usuarios Registrados
          </h2>
          <span className="bg-[#e3fcee] text-[#0b9349] px-2.5 py-1 rounded-full text-xs font-bold border border-[#bbf4d5]">
            {personeros.length} Totales
          </span>
        </div>

        <div className="flex-1 overflow-auto max-h-[600px]">
          <table className="w-full text-left text-sm text-[#52637d]">
            <thead className="sticky top-0 bg-[#f8fafc] text-xs font-extrabold uppercase text-[#52637d] shadow-sm z-10">
              <tr>
                <th className="px-5 py-3.5">Perfil</th>
                <th className="px-5 py-3.5">Identificación</th>
                <th className="px-5 py-3.5">Rol</th>
                <th className="px-5 py-3.5">Elección Asignada</th>
                <th className="px-5 py-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line bg-white">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-[#52637d]">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-[#0b9349] border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-xs font-bold">Cargando usuarios...</p>
                    </div>
                  </td>
                </tr>
              ) : personeros.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-[#52637d]">
                    <UserIconSvg className="w-12 h-12 mb-2 text-[#dfe1e6] mx-auto" />
                    <p className="font-bold text-[#172b4d]">No hay usuarios registrados</p>
                    <p className="text-xs mt-1">Haz clic en "Nuevo Usuario" para comenzar.</p>
                  </td>
                </tr>
              ) : (
                personeros.map((p) => (
                  <tr key={p.id} className="hover:bg-[#f8fafc] transition-colors group">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {p.image ? (
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-10 h-10 flex-shrink-0 rounded-full object-cover border border-[#dfe1e6]"
                          />
                        ) : (
                            <div className="w-10 h-10 flex-shrink-0 rounded-full bg-[#f4f5f7] border border-[#dfe1e6] flex items-center justify-center text-[#172b4d] font-bold text-sm">
                            {p.name.charAt(0)}{p.lastname.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-[#172b4d] text-[13px]">{p.name} {p.lastname}</div>
                          <div className="text-[11px] text-[#52637d] mt-0.5">{p.phone || 'Sin teléfono'}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3 font-bold text-[#172b4d] text-[13px]">
                      {p.dni}
                    </td>

                    <td className="px-5 py-3">
                      {getRoleBadge(p.role)}
                    </td>

                    <td className="px-5 py-3">
                      {p.election ? (
                        <div className="flex items-center gap-1.5 text-[12px] font-medium text-[#172b4d]">
                          <MapPinIcon className="w-3.5 h-3.5 text-[#0b9349]" />
                          {p.election.nombre}
                        </div>
                      ) : (
                        <span className="text-[11px] text-[#8993a4] italic">No asignada</span>
                      )}
                    </td>

                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={() => alert(`La contraseña de ${p.name} es:\n\n${p.password || p.dni}`)}
                          className="p-1.5 text-[#52637d] hover:text-amber-500 hover:bg-amber-50 rounded transition-colors"
                          title="Ver contraseña"
                        >
                          <KeyIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEdit(p)}
                          className="p-1.5 text-[#52637d] hover:text-[#0b9349] hover:bg-green-50 rounded transition-colors"
                          title="Editar usuario"
                        >
                          <EditIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(p)}
                          className="p-1.5 text-[#52637d] hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Eliminar usuario"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal / Slide-over (Centered) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
          <div
            className="fixed inset-0 bg-[#091e42]/50 backdrop-blur-sm transition-opacity"
            onClick={closeModal}
          />

          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-xl overflow-hidden transform transition-all">

            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-line flex items-center justify-between bg-[#f8fafc]">
              <div className="flex items-center gap-2.5">
                <div className="bg-[#e3fcee] p-1.5 rounded-md">
                  {editing ? <EditIcon className="w-4 h-4 text-[#0b9349]" /> : <UserIconSvg className="w-4 h-4 text-[#0b9349]" />}
                </div>
                <h3 className="text-[15px] font-bold text-[#172b4d]">
                  {editing ? 'Actualizar Usuario' : 'Nuevo Registro'}
                </h3>
              </div>
              <button
                onClick={closeModal}
                className="text-[#8993a4] hover:text-[#172b4d] p-1 rounded-full transition-colors"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
                <form onSubmit={handleSubmit} className="p-6 relative">
                  {isSubmitting && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/70 backdrop-blur-[1px]">
                      <svg className="h-10 w-10 animate-spin text-[#0b9349]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="mt-3 text-sm font-bold text-[#0b9349]">Guardando usuario...</span>
                    </div>
                  )}
                  {error && (
                    <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-[13px] font-medium text-red-700 border border-red-200">
                      <svg className="w-5 h-5 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div>
                        <span className="font-bold block mb-0.5">No se pudo guardar el usuario:</span>
                        <span>{error}</span>
                      </div>
                    </div>
                  )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <div className="space-y-1">
                  <label className="text-[12px] font-bold text-[#52637d]">Nombres <span className="text-red-500">*</span></label>
                  <input
                    name="name"
                    defaultValue={editing?.name}
                    required
                    placeholder="Ej. Juan Carlos"
                    className="w-full px-3 py-2 text-[13px] bg-white border border-[#dfe1e6] rounded-md focus:ring-2 focus:ring-[#0b9349]/20 focus:border-[#0b9349] transition-all outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[12px] font-bold text-[#52637d]">Apellidos <span className="text-red-500">*</span></label>
                  <input
                    name="lastname"
                    defaultValue={editing?.lastname}
                    required
                    placeholder="Ej. Pérez Gómez"
                    className="w-full px-3 py-2 text-[13px] bg-white border border-[#dfe1e6] rounded-md focus:ring-2 focus:ring-[#0b9349]/20 focus:border-[#0b9349] transition-all outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[12px] font-bold text-[#52637d]">DNI <span className="text-red-500">*</span></label>
                  <input
                    name="dni"
                    defaultValue={editing?.dni}
                    required
                    maxLength={8}
                    pattern="\d{8}"
                    title="El DNI debe tener 8 dígitos numéricos"
                    placeholder="Número de DNI"
                        onInput={(e) => { e.currentTarget.value = e.currentTarget.value.replace(/\D/g, ''); }}
                    className="w-full px-3 py-2 text-[13px] bg-white border border-[#dfe1e6] rounded-md focus:ring-2 focus:ring-[#0b9349]/20 focus:border-[#0b9349] transition-all outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[12px] font-bold text-[#52637d]">Teléfono</label>
                  <input
                    name="phone"
                    defaultValue={editing?.phone ?? ''}
                    placeholder="Ej. 987654321"
                        maxLength={9}
                        onInput={(e) => { e.currentTarget.value = e.currentTarget.value.replace(/\D/g, ''); }}
                    className="w-full px-3 py-2 text-[13px] bg-white border border-[#dfe1e6] rounded-md focus:ring-2 focus:ring-[#0b9349]/20 focus:border-[#0b9349] transition-all outline-none"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[12px] font-bold text-[#52637d] flex items-center gap-1.5">
                    <BriefcaseIcon className="w-3.5 h-3.5" />
                    Rol en el Sistema <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="role"
                    defaultValue={editing?.role ?? Role.PERSONERO}
                    required
                    className="w-full px-3 py-2 text-[13px] font-medium bg-white border border-[#dfe1e6] rounded-md focus:ring-2 focus:ring-[#0b9349]/20 focus:border-[#0b9349] transition-all outline-none"
                  >
                    <option value={Role.PERSONERO}>Personero (Mesa específica)</option>
                    <option value={Role.COORDINADOR}>Coordinador (Supervisa local)</option>
                    <option value={Role.ADMIN}>Administrador (Acceso total)</option>
                  </select>
                </div>

                {editing && (
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[12px] font-bold text-[#52637d]">Contraseña <span className="text-gray-400 font-normal">(Opcional)</span></label>
                    <input
                      name="password"
                      type="password"
                      placeholder="Dejar en blanco para mantener la actual"
                      className="w-full px-3 py-2 text-[13px] bg-white border border-[#dfe1e6] rounded-md focus:ring-2 focus:ring-[#0b9349]/20 focus:border-[#0b9349] transition-all outline-none"
                    />
                  </div>
                )}

                    {/* Hidden Election ID */}
                    {activeElection && (
                      <input type="hidden" name="electionId" value={activeElection.id} />
                    )}
              </div>

              {/* Modal Footer */}
                  <div className="mt-6 flex justify-end gap-2 pt-4 border-t border-line relative z-20">
                <button
                  type="button"
                  onClick={closeModal}
                      disabled={isSubmitting}
                      className="px-4 py-2 text-xs font-bold text-[#172b4d] bg-[#f4f5f7] rounded-md hover:bg-[#dfe1e6] transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 text-xs cursor-pointer font-bold text-white bg-[#0b9349] rounded-md hover:bg-[#087d3e] transition-colors disabled:opacity-90 flex items-center justify-center min-w-[140px] gap-2"
                >
                      {isSubmitting ? (
                        <>
                          <svg className="h-4 w-4 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Guardando...
                        </>
                      ) : (
                        editing ? 'Guardar Cambios' : 'Crear Registro'
                      )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
}
