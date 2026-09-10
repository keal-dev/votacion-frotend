"use client";

import Link from "next/link";
import EngineeringIcon from '@mui/icons-material/Engineering';

export default function MantenimientoPage() {
  return (
    <div className="min-h-screen bg-[#f4f5f7] flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.05)] p-8 text-center border border-[#dfe1e6] animate-in fade-in zoom-in duration-500">
        
        <div className="w-20 h-20 mx-auto bg-[#fff9e6] text-[#8a5a00] rounded-full flex items-center justify-center mb-6">
          <EngineeringIcon sx={{ fontSize: 40 }} />
        </div>
        
        <h1 className="text-2xl font-extrabold text-[#172b4d] mb-3">
          Sistema en Mantenimiento
        </h1>
        
        <p className="text-[14px] text-[#52637d] leading-relaxed mb-8">
          Estamos realizando actualizaciones importantes en la plataforma electoral para mejorar tu experiencia. 
          Por favor, intenta ingresar nuevamente más tarde.
        </p>

        <div className="pt-6 border-t border-[#dfe1e6]">
          <p className="text-[12px] text-[#8993a4] mb-4">
            ¿Eres administrador del sistema?
          </p>
          <Link 
            href="/login"
            className="inline-flex items-center justify-center px-6 py-2.5 bg-[#f4f5f7] hover:bg-[#dfe1e6] text-[#172b4d] font-bold text-sm rounded-lg transition-colors border border-[#dfe1e6]"
          >
            Ir al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
