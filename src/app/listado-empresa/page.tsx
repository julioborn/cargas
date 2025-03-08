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
    const userId = session?.user?.id;

    // Usaremos empresaFiltro para filtrar las órdenes.
    // Si el usuario es de rol "empresa", se asignará el ID obtenido de la API.
    const [empresaFiltro, setEmpresaFiltro] = useState("");
    const [ordenes, setOrdenes] = useState<Orden[]>([]);
    const [filtroEstado, setFiltroEstado] = useState("");
    const [fechaDesde, setFechaDesde] = useState("");
    const [fechaHasta, setFechaHasta] = useState("");
    const [loading, setLoading] = useState(false);
    const [empresas, setEmpresas] = useState<Empresa[]>([]);

    // Si el usuario es admin, permitimos elegir de todas las empresas.
    // Si es "empresa", obtenemos su empresa y la asignamos automáticamente.
    useEffect(() => {
        if (!userId) return;

        const fetchEmpresa = async () => {
            try {
                const res = await fetch(`/api/empresas/usuario/${userId}`);
                if (!res.ok) {
                    const errorText = await res.text();
                    throw new Error(`Error HTTP: ${res.status} - ${errorText}`);
                }
                const data = await res.json();
                if (!data || !data._id) throw new Error("No se encontró el ID de la empresa");
                // Asignamos el ID de la empresa al filtro
                setEmpresaFiltro(data._id);
                console.log("Empresa obtenida:", data);
            } catch (error) {
                console.error("❌ Error obteniendo empresa:", error);
            }
        };

        // Si el usuario tiene rol "empresa", lo obtenemos; de lo contrario, cargamos todas las empresas
        if (session?.user?.role === "empresa") {
            fetchEmpresa();
        } else {
            // Para admin, también se cargan todas las empresas para filtrar
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
    }, [userId, session?.user?.role]);

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

    // Llamada automática a fetchOrdenes cuando cambian los filtros
    useEffect(() => {
        // Solo se carga si hay empresaFiltro (ya sea obtenido automáticamente o seleccionado por admin)
        if (empresaFiltro) {
            fetchOrdenes();
        }
    }, [empresaFiltro, filtroEstado, fechaDesde, fechaHasta]);

    // Función para exportar a Excel
    const exportToExcel = () => {
        // Mapea las órdenes a un arreglo de objetos con los campos deseados
        const rows = ordenes.map((orden) => ({
            "Código": orden.codigoOrden,
            "Empresa": orden.empresaId.nombre,
            "Producto": orden.producto.replace(/_/g, " "),
            "Estado": orden.estado,
            "Fecha de Emisión": new Date(orden.fechaEmision).toLocaleDateString(),
            "Fecha de Carga": orden.fechaCarga ? new Date(orden.fechaCarga).toLocaleDateString() : "",
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

        // Crea la hoja de cálculo a partir del arreglo de objetos
        const worksheet = XLSX.utils.json_to_sheet(rows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Ordenes");

        // Escribe el libro en formato binario y fuerza la descarga
        const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        const dataBlob = new Blob([excelBuffer], { type: "application/octet-stream" });
        saveAs(dataBlob, "ListadoOrdenes.xlsx");
    };

    return (
        <div className="max-w-4xl mx-auto p-6 mt-16">
            <h1 className="text-3xl font-bold mb-6 text-center">Listado de Órdenes</h1>

            {/* Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {/* Si el usuario es admin, mostramos el filtro de Empresa */}
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
                        className="w-full p-2 border rounded"
                        value={fechaDesde}
                        onChange={(e) => setFechaDesde(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block font-semibold">Fecha Hasta</label>
                    <input
                        type="date"
                        className="w-full p-2 border rounded"
                        value={fechaHasta}
                        onChange={(e) => setFechaHasta(e.target.value)}
                    />
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
                        className="flex mb-4 px-4 py-2 bg-green-600 text-white rounded"
                    >
                        Descargar Excel
                    </button>
                    <div className="overflow-x-auto">
                        <table className="min-w-full border border-gray-300">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="px-4 py-2 border">Código</th>
                                    <th className="px-4 py-2 border">Empresa</th>
                                    <th className="px-4 py-2 border">Producto</th>
                                    <th className="px-4 py-2 border">Estado</th>
                                    <th className="px-4 py-2 border">Fecha Emisión</th>
                                    <th className="px-4 py-2 border">Fecha Carga</th>
                                    <th className="px-4 py-2 border">Litros</th>
                                    <th className="px-4 py-2 border">Unidad</th>
                                    <th className="px-4 py-2 border">Chofer</th>
                                    <th className="px-4 py-2 border">Monto</th>
                                    <th className="px-4 py-2 border">Viáticos</th>
                                    <th className="px-4 py-2 border">Ubicación</th>
                                    <th className="px-4 py-2 border">Playero</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white">
                                {ordenes.map((orden) => (
                                    <tr key={orden._id}>
                                        <td className="px-4 py-2 border font-semibold">{orden.codigoOrden}</td>
                                        <td className="px-4 py-2 border">{orden.empresaId.nombre}</td>
                                        <td className="px-4 py-2 border">{orden.producto.replace(/_/g, " ")}</td>
                                        <td className={`px-4 py-2 border ${orden.estado === "CARGADA"
                                                ? "text-red-600"
                                                : orden.estado === "AUTORIZADA"
                                                    ? "text-green-600"
                                                    : orden.estado === "PENDIENTE_AUTORIZACION"
                                                        ? "text-yellow-600"
                                                        : ""
                                            }`}>
                                            {orden.estado}
                                        </td>
                                        <td className="px-4 py-2 border">{new Date(orden.fechaEmision).toLocaleDateString()}</td>
                                        <td className="px-4 py-2 border">
                                            {orden.fechaCarga ? new Date(orden.fechaCarga).toLocaleDateString() : "-"}
                                        </td>
                                        <td className="px-4 py-2 border">
                                            {orden.tanqueLleno ? "Tanque Lleno" : (orden.litros !== undefined ? `${orden.litros} L` : "-")}
                                        </td>
                                        <td className="px-4 py-2 border">
                                            {typeof orden.unidadId === "object" && orden.unidadId ? orden.unidadId.matricula : "-"}
                                        </td>
                                        <td className="px-4 py-2 border">
                                            {typeof orden.choferId === "object" && orden.choferId ? `${orden.choferId.nombre} (${orden.choferId.documento})` : "-"}
                                        </td>
                                        <td className="px-4 py-2 border">{orden.monto !== undefined ? orden.monto : "-"}</td>
                                        <td className="px-4 py-2 border">
                                            {orden.viaticos && orden.viaticos.monto != null ? `${orden.viaticos.monto} ${orden.viaticos.moneda}` : "-"}
                                        </td>
                                        <td className="px-4 py-2 border">
                                            {typeof orden.ubicacionId === "object" && orden.ubicacionId ? orden.ubicacionId.nombre : "-"}
                                        </td>
                                        <td className="px-4 py-2 border">
                                            {typeof orden.playeroId === "object" && orden.playeroId ? `${orden.playeroId.nombre} (${orden.playeroId.documento})` : "-"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}
