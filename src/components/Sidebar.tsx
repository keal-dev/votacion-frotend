"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/auth.store";
import { authService } from "@/services/auth.service";
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import { Settings } from "@mui/icons-material";
import { useSettingsStore } from "@/store/settings.store";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const settings = useSettingsStore((state) => state.settings);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Filtrar links basados en el rol del usuario
  const getFilteredLinks = () => {
    const allLinks = [
      { href: "/", label: "Inicio", icon: <HomeOutlinedIcon fontSize="small" />, roles: ["ADMIN", "COORDINADOR", "PERSONERO"] },
      { href: "/personero", label: "Mis Mesas", icon: <DashboardOutlinedIcon fontSize="small" />, roles: ["PERSONERO"] },
      { href: "/asignaciones", label: "Asignaciones", icon: <AssignmentOutlinedIcon fontSize="small" />, roles: ["ADMIN", "COORDINADOR"] },
      { href: "/resultados", label: "Resultados", icon: <BarChartOutlinedIcon fontSize="small" />, roles: ["ADMIN", "COORDINADOR"] },
      { href: "/auditoria", label: "Auditoría", icon: <FactCheckOutlinedIcon fontSize="small" />, roles: ["ADMIN", "COORDINADOR"] },
      { href: "/configuracion", label: "Configuración", icon: <Settings fontSize="small" />, roles: ["ADMIN", "COORDINADOR"] },
    ];

    if (!mounted || !user) return allLinks.filter(link => link.roles.includes("PERSONERO")); // Fallback seguro

    return allLinks.filter(link => link.roles.includes(user.role || "PERSONERO"));
  };

  const links = getFilteredLinks();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-58.5 bg-linear-to-b from-navy to-[#091522] text-white p-[22px_14px] flex flex-col transform transition-transform duration-300 ease-in-out overflow-y-auto md:relative md:translate-x-0 shrink-0 ${isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="flex gap-2.5 items-center justify-between px-2 pb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[11px] bg-white grid place-items-center shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0b9349" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round">
                {/* Caras de la caja 3D */}
                <polygon points="12,6 20,10 12,14 4,10" fill="#e3fcee" />
                <polygon points="4,10 12,14 12,21 4,17" fill="#90d5a4" />
                <polygon points="12,14 20,10 20,17 12,21" fill="#0b9349" />

                {/* Hoja (Papeleta) */}
                <polygon points="10,9 14,11 14,4 10,2" fill="white" />
                <line x1="11" y1="4.5" x2="13" y2="5.5" strokeWidth="1.5" />
                <line x1="11" y1="6.5" x2="13" y2="7.5" strokeWidth="1.5" />

                {/* Ranura de la caja (crea el efecto de profundidad) */}
                <line x1="9" y1="8.5" x2="15" y2="11.5" strokeWidth="2" />

                {/* Checkmark blanco en la cara frontal */}
                <path d="M 14.5 15.5 L 15.5 16.5 L 17.5 14" stroke="white" strokeWidth="2" />
              </svg>
            </div>
            <div>
              <strong className="text-[14px] leading-[1.15] font-bold">{'Elecciones REMU'}</strong>
              <small className="block text-[#9fb0c1] mt-0.5">{settings?.platform_name || "ERM"}</small>
            </div>
          </div>
          <button
            onClick={onClose}
            className="md:hidden text-white/70 hover:text-white"
          >
            <CloseOutlinedIcon />
          </button>
        </div>

        <div className="flex items-center gap-2.5  mb-5 px-2 py-2 rounded-xl">
          <div className="w-8 h-8 rounded-full bg-green text-white grid place-items-center text-[13px] font-bold shrink-0 uppercase">
            {mounted && user ? `${user.name.charAt(0)}${user.lastname.charAt(0)}` : 'US'}
          </div>
          <div className="overflow-hidden">
            <strong className="block text-[13px] text-white truncate leading-tight">
              {mounted && user ? `${user.name} ${user.lastname}` : 'Usuario'}
            </strong>
            <small className="block text-[#9fb0c1] text-[11px] truncate mt-[2px] capitalize">
              {mounted && user ? (user.role?.toLowerCase() || 'Sin rol') : 'Cargando...'}
            </small>
          </div>
        </div>

        <nav className="flex flex-col flex-1">
          {links.map((link) => {
            const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => onClose()}
                className={`flex gap-3.5 items-center px-3 py-1.5 rounded-md mb-[6px] text-[13px] font-medium transition-all duration-200 ${
                  isActive 
                    ? "bg-[#0b9349] text-white shadow-sm shadow-black/20" 
                    : "text-[#9fb0c1] hover:bg-white/10 hover:text-white"
                }`}
              >
                <span className={`flex items-center justify-center transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>
                  {link.icon}
                </span>
                {link.label}
              </Link>
            );
          })}

          <div className="mt-auto pt-4 border-t border-white/10">

            <button
              onClick={() => authService.logout()}
              className="w-full flex gap-3.5 items-center text-[#9fb0c1] px-3 py-1.5 rounded-md text-[13px] font-medium transition-all duration-200 hover:bg-red-500/10 hover:text-red-400 text-left"
            >
              <span className="flex items-center justify-center"><LogoutOutlinedIcon fontSize="small" /></span>
              Cerrar Sesión
            </button>
          </div>
        </nav>
      </aside>
    </>
  );
}
