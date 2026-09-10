"use client";

import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import { useSettingsStore } from "@/store/settings.store";
import CampaignIcon from '@mui/icons-material/Campaign';
import MenuOutlinedIcon from '@mui/icons-material/MenuOutlined';

export default function DashboardLayoutWrapper({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { settings, fetchSettings } = useSettingsStore();

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    return (
        <div className="flex h-screen overflow-hidden flex-col md:flex-row">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            
            <main className="flex-1 flex flex-col min-w-0 overflow-y-auto relative">
                {settings?.maintenance_mode && (
                    <div className="bg-[#cf222e] text-white px-4 py-2 text-[13px] font-bold flex items-center justify-center gap-2 shadow-md z-20 shrink-0 tracking-wide uppercase">
                        ⚠️ Modo Mantenimiento Activo - Acceso restringido al público
                    </div>
                )}
                
                {settings?.global_announcement && (
                    <div className="bg-[#fff9e6] border-b border-[#f5d98b] text-[#8a5a00] px-4 py-2.5 text-sm font-semibold flex items-center justify-center gap-2 shadow-sm z-10 shrink-0">
                        <CampaignIcon fontSize="small" />
                        <span>{settings.global_announcement}</span>
                    </div>
                )}
                
                {/* Mobile Header */}
                <div className="md:hidden flex items-center justify-between p-[15px] bg-white border-b border-line shrink-0">
                    <div className="flex items-center gap-[10px]">
                        <div className="w-[30px] h-[30px] rounded-lg bg-green text-white grid place-items-center text-[16px] font-extrabold">✦</div>
                        <strong className="text-[14px] leading-[1.15] font-bold text-navy">{settings?.platform_name || 'Sistema Electoral'}</strong>
                    </div>
                    <button 
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-[8px] border border-line rounded-lg text-navy"
                    >
                        <MenuOutlinedIcon />
                    </button>
                </div>
                
                <div className="flex-1 p-[15px] md:p-[26px]">
                    {children}
                </div>
            </main>
        </div>
    );
}
