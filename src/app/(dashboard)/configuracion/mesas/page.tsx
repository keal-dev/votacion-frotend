'use client'
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import * as XLSX from 'xlsx';
import { mesaService } from "@/services/mesa.service";
import { electionService } from "@/services/election.service";
import { Mesa } from "@/types/mesa.types";
import { Election } from "@/types/election.types";

export default function MesasPage() {
    const [mesas, setMesas] = useState<Mesa[]>([]);
    const [activeElection, setActiveElection] = useState<Election | null>(null);
    const [loading, setLoading] = useState(true);
    const [filterDistrito, setFilterDistrito] = useState<string>('ALL');
    const [filterCentroPoblado, setFilterCentroPoblado] = useState<string>('ALL');

    // Drag & Drop state
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadStatusText, setUploadStatusText] = useState('');
    const [csvRowCount, setCsvRowCount] = useState<number | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const loadData = async () => {
        try {
            setLoading(true);
            const elections = await electionService.getAll();
            const active = elections.find(e => e.activa);

            if (active) {
                setActiveElection(active);
                const mesasData = await mesaService.getByElection(active.id);
                setMesas(mesasData);
            }
        } catch (error) {
            console.error("Error loading data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Resetear filtro de centro poblado cuando cambia el distrito
    useEffect(() => {
        setFilterCentroPoblado('ALL');
    }, [filterDistrito]);

    const distritosUnicos = Array.from(new Set(mesas.map(m => m.local.distrito))).sort();

    const centrosPobladosDisponibles = Array.from(
        new Set(
            mesas
                .filter(m => (filterDistrito === 'ALL' || m.local.distrito === filterDistrito) && m.local.centro_poblado)
                .map(m => m.local.centro_poblado as string)
        )
    ).sort();

    const filteredMesas = mesas.filter(m => {
        const matchDistrito = filterDistrito === 'ALL' || m.local.distrito === filterDistrito;
        const matchCentroPoblado = filterCentroPoblado === 'ALL' || m.local.centro_poblado === filterCentroPoblado;
        return matchDistrito && matchCentroPoblado;
    });

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileSelection(e.dataTransfer.files[0]);
        }
    };

    const handleFileSelection = (file: File) => {
        setUploadError(null);
        setUploadSuccess(null);
        setCsvRowCount(null);

        if (file.type !== "text/csv" && !file.name.endsWith('.csv')) {
            setUploadError("Por favor, selecciona un archivo CSV válido.");
            return;
        }
        setSelectedFile(file);

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            if (text) {
                // Separar por salto de línea y filtrar líneas vacías
                const rows = text.split(/\r?\n/).filter(row => row.trim().length > 0);
                // Restar 1 por la cabecera
                const count = Math.max(0, rows.length - 1);
                setCsvRowCount(count);
            }
        };
        reader.readAsText(file);
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        try {
            setUploading(true);
            setUploadError(null);
            setUploadSuccess(null);
            setUploadProgress(0);
            setUploadStatusText("Preparando archivo...");
            
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => {
                    if (prev < 30) {
                        setUploadStatusText("Leyendo registros del CSV...");
                        return prev + 15;
                    }
                    if (prev < 70) {
                        setUploadStatusText("Validando datos...");
                        return prev + 10;
                    }
                    if (prev < 90) {
                        setUploadStatusText("Guardando en base de datos...");
                        return prev + 5;
                    }
                    return prev;
                });
            }, 300);

            const response = await mesaService.uploadCsv(selectedFile);
            
            clearInterval(progressInterval);
            setUploadProgress(100);
            setUploadStatusText("¡Proceso completado!");
            
            setUploadSuccess(`¡Éxito! Se importaron ${response.count} mesas correctamente.`);
            setSelectedFile(null);
            setCsvRowCount(null);
            loadData();
            
            setTimeout(() => {
                setUploading(false);
                setUploadProgress(0);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }, 1000);
            
        } catch (err: any) {
            console.error(err);
            setUploadProgress(0);
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
            setUploadError(err.response?.data?.message || "Ocurrió un error al procesar el archivo CSV.");
        }
    };

    const downloadTemplate = () => {
        const templateData = [
            {
                REGION: "LIMA",
                PROVINCIA: "LIMA",
                DISTRITO: "MIRAFLORES",
                CENTRO_POBLADO: "",
                LOCAL_NOMBRE: "IE JUANA ALARCO DE DAMMERT",
                LOCAL_DIRECCION: "AV BENAVIDES 2315",
                MESA_NUMERO: "045612",
                CANTIDAD_ELECTORES: 300
            },
            {
                REGION: "LIMA",
                PROVINCIA: "LIMA",
                DISTRITO: "MIRAFLORES",
                CENTRO_POBLADO: "",
                LOCAL_NOMBRE: "IE JUANA ALARCO DE DAMMERT",
                LOCAL_DIRECCION: "AV BENAVIDES 2315",
                MESA_NUMERO: "045613",
                CANTIDAD_ELECTORES: 298
            },
            {
                REGION: "CAJAMARCA",
                PROVINCIA: "JAEN",
                DISTRITO: "BELLAVISTA",
                CENTRO_POBLADO: "ROSARIO DE CHINGAMA",
                LOCAL_NOMBRE: "IE 16045",
                LOCAL_DIRECCION: "PLAZA PRINCIPAL",
                MESA_NUMERO: "012345",
                CANTIDAD_ELECTORES: 250
            }
        ];

        // Crear y descargar archivo XLSX real
        const worksheet = XLSX.utils.json_to_sheet(templateData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Mesas");
        XLSX.writeFile(workbook, "plantilla_mesas.xlsx");
    };

    return (
        <div className="mx-auto max-w-6xl">
            {/* Encabezado */}
            <div className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                    <h1 className="text-[24px] md:text-[28px] font-extrabold text-[#172b4d] tracking-tight">
                        Locales y Mesas de Votación
                    </h1>
                    <div className="flex items-center gap-2 text-xs mt-1.5">
                        <Link href="/configuracion" className="font-medium text-[#52637d] hover:text-[#0b9349] transition-colors">
                            Configuración
                        </Link>
                        <span className="text-[#c1c7d0]">›</span>
                        <span className="font-bold text-[#0b9349]">Mesas Electorales</span>
                    </div>
                </div>

                {activeElection && (
                    <div className="flex items-center gap-2 rounded-full bg-green-50 px-4 py-2 border border-green-200 shadow-sm mt-2 sm:mt-0">
                        <div className="w-2 h-2 rounded-full bg-[#0b9349] animate-pulse"></div>
                        <span className="text-[13px] font-bold text-[#0b9349]">{activeElection.nombre}</span>
                    </div>
                )}
            </div>

            {!activeElection && !loading ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
                    <h3 className="text-base font-bold text-amber-800 mb-2">No hay ninguna Elección Activa</h3>
                    <p className="text-sm text-amber-700">
                        Debes tener una elección marcada como ACTIVA para poder importar mesas. Ve a la sección de Elecciones y activa una.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Panel Izquierdo: Carga de CSV */}
                    <div className="lg:col-span-1 flex flex-col gap-4">
                        <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                            <h2 className="text-[15px] font-bold text-[#172b4d] mb-4 flex items-center gap-2">
                                <CloudUploadOutlinedIcon fontSize="small" className="text-[#0b9349]" />
                                Importar Mesas
                            </h2>

                            <p className="text-xs text-[#52637d] mb-4 leading-relaxed">
                                Descarga la plantilla en Excel, llénala con tus datos, <strong>guárdala como CSV</strong> y súbela aquí. El sistema registrará los locales y mesas automáticamente en la elección: <strong>{activeElection?.nombre}</strong>.
                            </p>

                            <button
                                onClick={downloadTemplate}
                                className="w-full flex justify-center items-center gap-2 rounded-lg border border-[#0b9349] bg-green-50/50 px-4 py-2.5 text-xs font-bold text-[#0b9349] transition hover:bg-[#0b9349] hover:text-white mb-5"
                            >
                                <FileDownloadOutlinedIcon fontSize="small" />
                                Descargar Plantilla Excel
                            </button>

                            {/* Dropzone */}
                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all duration-200 ${isDragging
                                        ? 'border-[#0b9349] bg-green-50'
                                        : 'border-[#dfe1e6] bg-[#fafbfc] hover:border-[#0b9349] hover:bg-green-50/30'
                                    }`}
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept=".csv"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files.length > 0) {
                                            handleFileSelection(e.target.files[0]);
                                        }
                                    }}
                                />

                                {selectedFile ? (
                                    <div className="flex flex-col items-center">
                                        <InsertDriveFileOutlinedIcon className="mb-2 text-[#0b9349]" style={{ fontSize: 40 }} />
                                        <p className="text-sm font-bold text-[#172b4d]">{selectedFile.name}</p>
                                            <p className="text-[11px] text-[#52637d] mt-1 mb-1">
                                            {(selectedFile.size / 1024).toFixed(1)} KB
                                        </p>
                                            {csvRowCount !== null && (
                                                <div className="mt-2 text-[12px] font-bold text-[#0b9349] bg-green-50 px-3 py-1.5 rounded-full border border-green-200">
                                                    {csvRowCount} mesas detectadas
                                                </div>
                                            )}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center">
                                        <div className="mb-3 rounded-full bg-white p-3 shadow-sm group-hover:scale-110 transition-transform">
                                            <CloudUploadOutlinedIcon className="text-[#0b9349]" />
                                        </div>
                                        <p className="text-[13px] font-bold text-[#172b4d]">
                                            Haz clic para subir o arrastra un archivo
                                        </p>
                                        <p className="mt-1 text-[11px] text-[#52637d]">
                                            Solo archivos .CSV
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Mensajes */}
                            {uploadError && (
                                <div className="mt-4 rounded-lg bg-red-50 p-3 text-xs font-medium text-red-600 border border-red-200">
                                    {uploadError}
                                </div>
                            )}

                            {uploadSuccess && (
                                <div className="mt-4 flex items-center gap-2 rounded-lg bg-green-50 p-3 text-xs font-bold text-[#0b9349] border border-green-200">
                                    <CheckCircleIcon fontSize="small" />
                                    {uploadSuccess}
                                </div>
                            )}

                            <button
                                onClick={handleUpload}
                                disabled={!selectedFile || uploading}
                                    className="mt-5 w-full cursor-pointer rounded-lg bg-[#0b9349] px-4 py-3 text-[13px] font-bold text-white shadow-sm transition hover:bg-[#087d3e] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Procesar e Importar
                            </button>
                        </div>
                    </div>

                    {/* Panel Derecho: Tabla de Mesas */}
                    <div className="lg:col-span-2">
                        <div className="rounded-2xl border border-line bg-white shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col h-full">
                                <div className="border-b border-line px-5 py-4 bg-[#f8fafc]">
                                    <div className="flex justify-between items-center mb-3">
                                        <h2 className="text-[15px] font-bold text-[#172b4d]">
                                            Mesas Registradas
                                        </h2>
                                        <span className="bg-[#e3fcee] text-[#0b9349] px-2.5 py-1 rounded-full text-xs font-bold border border-[#bbf4d5]">
                                            {filteredMesas.length} Totales
                                        </span>
                                    </div>

                                    {mesas.length > 0 && (
                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[11px] font-bold text-[#52637d]">DISTRITO:</span>
                                                <select
                                                    value={filterDistrito}
                                                    onChange={(e) => setFilterDistrito(e.target.value)}
                                                    className="rounded border border-line bg-white px-2 py-1 text-[12px] font-medium text-[#172b4d] outline-none shadow-sm focus:border-[#0b9349]"
                                                >
                                                    <option value="ALL">Todos</option>
                                                    {distritosUnicos.map(d => (
                                                        <option key={d} value={d}>{d}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {centrosPobladosDisponibles.length > 0 && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[11px] font-bold text-[#52637d]">C. POBLADO:</span>
                                                    <select
                                                        value={filterCentroPoblado}
                                                        onChange={(e) => setFilterCentroPoblado(e.target.value)}
                                                        className="rounded border border-line bg-white px-2 py-1 text-[12px] font-medium text-[#172b4d] outline-none shadow-sm focus:border-[#0b9349] max-w-[150px] truncate"
                                                    >
                                                        <option value="ALL">Todos</option>
                                                        {centrosPobladosDisponibles.map(cp => (
                                                            <option key={cp} value={cp}>{cp}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                            <div className="flex-1 overflow-auto max-h-[600px]">
                                <table className="w-full text-left text-sm text-[#52637d]">
                                    <thead className="sticky top-0 bg-[#f8fafc] text-xs font-extrabold uppercase text-[#52637d] shadow-sm z-10">
                                        <tr>
                                            <th className="px-5 py-3.5">Mesa N°</th>
                                            <th className="px-5 py-3.5">Local de Votación</th>
                                            <th className="px-5 py-3.5">Ubicación</th>
                                            <th className="px-5 py-3.5 text-center">Electores</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-line bg-white">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={4} className="px-5 py-10 text-center text-[#52637d]">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <div className="w-6 h-6 border-2 border-[#0b9349] border-t-transparent rounded-full animate-spin"></div>
                                                        <p className="text-xs font-bold">Cargando mesas...</p>
                                                    </div>
                                                </td>
                                            </tr>
                                            ) : filteredMesas.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-5 py-12 text-center text-[#52637d]">
                                                    <InsertDriveFileOutlinedIcon className="mb-2 text-[#dfe1e6]" style={{ fontSize: 48 }} />
                                                            <p className="font-bold text-[#172b4d]">No hay mesas que coincidan con los filtros</p>
                                                            {mesas.length === 0 && <p className="text-xs mt-1">Utiliza el panel izquierdo para importar mesas mediante CSV.</p>}
                                                </td>
                                            </tr>
                                        ) : (
                                                        filteredMesas.map((mesa) => (
                                                <tr key={mesa.id} className="hover:bg-[#f8fafc] transition-colors group">
                                                    <td className="px-5 py-3 font-bold text-[#172b4d]">
                                                        {mesa.numero_mesa}
                                                    </td>
                                                    <td className="px-5 py-3">
                                                        <div className="font-bold text-[#172b4d] text-[13px]">{mesa.local.nombre}</div>
                                                        <div className="text-[11px] text-[#52637d] mt-0.5">{mesa.local.direccion}</div>
                                                    </td>
                                                    <td className="px-5 py-3">
                                                                    <div className="text-[12px] font-medium">{mesa.local.centro_poblado ? `${mesa.local.centro_poblado} (${mesa.local.distrito})` : mesa.local.distrito}</div>
                                                        <div className="text-[11px] text-[#52637d]">{mesa.local.provincia}, {mesa.local.region}</div>
                                                    </td>
                                                    <td className="px-5 py-3 text-center">
                                                        <span className="inline-flex items-center justify-center bg-slate-100 px-2.5 py-1 rounded-full text-xs font-bold text-[#52637d]">
                                                            {mesa.cantidad_electores}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Modal de progreso de subida */}
            {uploading && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl transition-all">
                        <div className="flex flex-col items-center text-center">
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50 shadow-inner">
                                <CloudUploadOutlinedIcon className="text-[#0b9349] animate-bounce" style={{ fontSize: 32 }} />
                            </div>
                            <h3 className="mb-2 text-lg font-extrabold text-[#172b4d]">Importando Mesas</h3>
                            <p className="mb-6 text-[13px] text-[#52637d]">Por favor, no cierres esta ventana mientras procesamos el archivo.</p>
                            
                            <div className="w-full">
                                <div className="flex justify-between items-center mb-2 px-1">
                                    <span className="text-[11px] font-bold text-[#0b9349] uppercase tracking-wider">{uploadStatusText}</span>
                                    <span className="text-[11px] font-bold text-[#172b4d]">{uploadProgress}%</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden shadow-inner">
                                    <div 
                                        className="bg-[#0b9349] h-full rounded-full transition-all duration-300 ease-out relative" 
                                        style={{ width: `${uploadProgress}%` }}
                                    >
                                        <div className="absolute inset-0 bg-white/20 w-full h-full"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
