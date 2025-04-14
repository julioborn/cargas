"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

interface Empresa {
    _id: string;
    nombre: string;
}

interface Orden {
    condicionPago: string;
    playeroId: any;
    ubicacionId: any;
    viaticos?: {
        monto?: number;
        moneda: "ARS" | "USD" | "Gs";
    };
    monto: string;
    choferId: any;
    unidadId: any;
    litros: string;
    tanqueLleno: any;
    _id: string;
    codigoOrden: string;
    empresaId: Empresa;
    producto: string;
    estado: string;
    fechaEmision: string;
    fechaCarga?: string;
    // Otras propiedades que necesites
}

export default function ListadoEmpresa() {
    const { data: session, status } = useSession();
    const [ordenes, setOrdenes] = useState<Orden[]>([]);
    const [empresaFiltro, setEmpresaFiltro] = useState("");
    const [filtroEstado, setFiltroEstado] = useState("");
    const [fechaDesde, setFechaDesde] = useState("");
    const [fechaHasta, setFechaHasta] = useState("");
    const [loading, setLoading] = useState(false);
    const [empresas, setEmpresas] = useState<Empresa[]>([]);

    // Si el usuario tiene rol "empresa", obtenemos su empresa y la asignamos automáticamente
    useEffect(() => {
        if (!session?.user?.id) return;

        if (session.user.role === "empresa") {
            const fetchEmpresa = async () => {
                try {
                    const res = await fetch(`/api/empresas/usuario/${session.user.id}`);
                    if (!res.ok) {
                        const errorText = await res.text();
                        throw new Error(`Error HTTP: ${res.status} - ${errorText}`);
                    }
                    const data = await res.json();
                    if (!data || !data._id) throw new Error("No se encontró el ID de la empresa");
                    setEmpresaFiltro(data._id);
                    console.log("Empresa obtenida:", data);
                } catch (error) {
                    console.error("❌ Error obteniendo empresa:", error);
                }
            };
            fetchEmpresa();
        } else {
            // Para admin se cargan todas las empresas para filtrar
            const fetchEmpresas = async () => {
                try {
                    const res = await fetch("/api/empresas");
                    if (!res.ok) throw new Error("Error al obtener empresas");
                    const data = await res.json();
                    setEmpresas(data);
                } catch (error) {
                    console.error(error);
                }
            };
            fetchEmpresas();
        }
    }, [session]);

    // Función para cargar las órdenes con los filtros
    const fetchOrdenes = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (empresaFiltro) params.append("empresaId", empresaFiltro);
            if (filtroEstado) params.append("estado", filtroEstado);
            if (fechaDesde) params.append("fechaDesde", fechaDesde);
            if (fechaHasta) params.append("fechaHasta", fechaHasta);

            console.log("Parámetros enviados:", params.toString());

            const res = await fetch(`/api/ordenes?${params.toString()}`);
            if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
            const data = await res.json();
            setOrdenes(data);
            console.log("Órdenes obtenidas:", data);
        } catch (error) {
            console.error("Error al cargar órdenes:", error);
        } finally {
            setLoading(false);
        }
    };

    // Se llama automáticamente cuando cambian los filtros (y si hay empresaFiltro)
    useEffect(() => {
        if (empresaFiltro) {
            fetchOrdenes();
        }
    }, [empresaFiltro, filtroEstado, fechaDesde, fechaHasta]);

    // Función para exportar a Excel
    const exportToExcel = () => {
        const rows = ordenes.map((orden) => ({
            "Código": orden.codigoOrden,
            "Empresa": orden.empresaId.nombre,
            "Producto": orden.producto.replace(/_/g, " "),
            "Estado": orden.estado,
            "Fecha de Emisión": new Date(orden.fechaEmision).toLocaleDateString("es-AR"),
            "Fecha de Carga": orden.fechaCarga ? new Date(orden.fechaCarga).toLocaleDateString("es-AR") : "",
            "Litros / Orden": orden.tanqueLleno
                ? "Tanque Lleno"
                : (orden.litros !== undefined ? orden.litros + " L" : ""),
            "Unidad": typeof orden.unidadId === "object" && orden.unidadId ? orden.unidadId.matricula : "",
            "Chofer": typeof orden.choferId === "object" && orden.choferId
                ? `${orden.choferId.nombre} (${orden.choferId.documento})`
                : "",
            "Monto": orden.monto !== undefined ? orden.monto : "",
            "Viáticos": orden.viaticos && orden.viaticos.monto != null
                ? `${orden.viaticos.monto} ${orden.viaticos.moneda}`
                : "",
            "Ubicación": typeof orden.ubicacionId === "object" && orden.ubicacionId ? orden.ubicacionId.nombre : "",
            "Playero": typeof orden.playeroId === "object" && orden.playeroId
                ? `${orden.playeroId.nombre} (${orden.playeroId.documento})`
                : ""
        }));

        const worksheet = XLSX.utils.json_to_sheet(rows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Ordenes");
        const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        const dataBlob = new Blob([excelBuffer], { type: "application/octet-stream" });
        saveAs(dataBlob, "ListadoOrdenes.xlsx");
    };

    return (
        <div className="max-w-4xl mx-auto p-6 mt-16">
            <h1 className="text-3xl font-bold mb-6 text-center">Listado de Órdenes</h1>

            {/* Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {session?.user?.role !== "empresa" && (
                    <div>
                        <label className="block font-semibold">Empresa</label>
                        <select
                            className="w-full p-2 border rounded"
                            value={empresaFiltro}
                            onChange={(e) => setEmpresaFiltro(e.target.value)}
                        >
                            <option value="">Todas las Empresas</option>
                            {empresas.map((empresa) => (
                                <option key={empresa._id} value={empresa._id}>
                                    {empresa.nombre}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
                <div>
                    <label className="block font-semibold">Estado</label>
                    <select
                        className="w-full p-2 border rounded"
                        value={filtroEstado}
                        onChange={(e) => setFiltroEstado(e.target.value)}
                    >
                        <option value="">Todos los Estados</option>
                        <option value="PENDIENTE_AUTORIZACION">Pendiente de Autorización</option>
                        <option value="AUTORIZADA">Autorizada</option>
                        <option value="CARGADA">Cargada</option>
                    </select>
                </div>
                <div>
                    <label className="block font-semibold">Fecha Desde</label>
                    <input
                        type="date"
                        className="w-full p-1 border rounded"
                        value={fechaDesde}
                        onChange={(e) => setFechaDesde(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block font-semibold">Fecha Hasta</label>
                    <input
                        type="date"
                        className="w-full p-1 border rounded"
                        value={fechaHasta}
                        onChange={(e) => setFechaHasta(e.target.value)}
                    />
                </div>
                {/* Botón para limpiar filtros (ocupa la fila completa en md) */}
                <div className="md:col-span-4">
                    <button
                        onClick={() => {
                            setEmpresaFiltro("");
                            setFiltroEstado("");
                            setFechaDesde("");
                            setFechaHasta("");
                        }}
                        className="w-fit px-2 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded"
                    >
                        Limpiar Filtros
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-green-500"></div>
                </div>
            ) : ordenes.length === 0 ? (
                <p className="text-center text-gray-600">
                    No se encontraron órdenes con esos filtros.
                </p>
            ) : (
                <>
                    <button
                        onClick={exportToExcel}
                        className="flex mb-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
                    >
                        Descargar Excel
                    </button>

                    {/* Visualización en cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {ordenes.map((orden) => (
                            <div
                                key={orden._id}
                                className="border border-gray-300 p-4 rounded bg-white shadow"
                            >
                                <div className="flex justify-between items-center">
                                    <p className="text-gray-600 font-normal rounded border w-fit p-0.5 bg-gray-200">
                                        {orden.codigoOrden}
                                    </p>
                                    <p
                                        className={`text-sm font-bold ${orden.estado === "PENDIENTE_AUTORIZACION"
                                                ? "text-yellow-600"
                                                : orden.estado === "AUTORIZADA"
                                                    ? "text-green-600"
                                                    : "text-red-600"
                                            }`}
                                    >
                                        {orden.estado.replace(/_/g, " ")}
                                    </p>
                                </div>
                                <h2 className="text-lg font-bold mt-2">{orden.empresaId.nombre}</h2>
                                <p className="text-gray-600 font-bold">
                                    {orden.producto.replace(/_/g, " ")}
                                </p>
                                <p className="text-gray-600">
                                    <strong>Pago:</strong> {orden.condicionPago}
                                </p>
                                {orden.tanqueLleno ? (
                                    <p className="text-gray-600">
                                        <strong>Tanque Lleno</strong>
                                    </p>
                                ) : orden.litros ? (
                                    <p className="text-gray-600">
                                        <strong>Litros:</strong> {orden.litros} L
                                    </p>
                                ) : orden.monto ? (
                                    <p className="text-gray-600">
                                        <strong>Monto:</strong> {orden.monto}
                                    </p>
                                ) : null}
                                {orden.viaticos && orden.viaticos.monto != null && (
                                    <p className="text-gray-600">
                                        <strong>Viáticos:</strong> {orden.viaticos.monto} {orden.viaticos.moneda}
                                    </p>
                                )}
                                {orden.unidadId && (
                                    <p className="text-gray-600">
                                        <strong>Matrícula:</strong> {orden.unidadId.matricula}
                                    </p>
                                )}
                                {orden.choferId && (
                                    <p className="text-gray-600">
                                        <strong>Chofer:</strong> {orden.choferId.nombre} ({orden.choferId.documento})
                                    </p>
                                )}
                                {orden.playeroId &&
                                    typeof orden.playeroId !== "string" && (
                                        <p className="text-gray-600">
                                            <strong>Playero:</strong> {orden.playeroId.nombre} ({orden.playeroId.documento})
                                        </p>
                                    )}
                                {orden.ubicacionId &&
                                    typeof orden.ubicacionId === "object" && (
                                        <p className="text-gray-600">
                                            <strong>Ubicación:</strong> {orden.ubicacionId.nombre}
                                        </p>
                                    )}
                                <p className="text-gray-600">
                                    <strong>Fecha Emisión:</strong> {new Date(orden.fechaEmision).toLocaleDateString("es-AR")}
                                </p>
                                {orden.fechaCarga && (
                                    <p className="text-gray-600">
                                        <strong>Fecha Carga:</strong> {new Date(orden.fechaCarga).toLocaleDateString("es-AR")}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
