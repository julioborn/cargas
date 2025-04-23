"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Empresa {
    _id: string;
    nombre: string;
}

interface Unidad {
    matricula: string;
}

interface Chofer {
    nombre: string;
    documento: string;
}

interface Playero {
    _id: string;
    nombre: string;
    documento: string;
}

interface Orden {
    codigoOrden: string;
    _id: string;
    empresaId: Empresa;
    producto: string;
    tanqueLleno: boolean;
    litros?: number;
    monto?: number;
    estado: string;
    fechaEmision: string;
    fechaCarga?: string;
    unidadId?: Unidad;
    choferId?: Chofer;
    playeroId?: string | Playero;
    condicionPago: "Cuenta Corriente" | "Pago Anticipado";
    viaticos?: {
        monto?: number;
        moneda: "ARS" | "USD" | "Gs";
    };
}

export default function Ordenes() {
    const { data: session } = useSession();
    const userId = session?.user?.id;
    const [ordenes, setOrdenes] = useState<Orden[]>([]);
    const [empresaId, setEmpresaId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [filtroProducto, setFiltroProducto] = useState<string>("");
    const [filtroEstado, setFiltroEstado] = useState<string>("");
    const [filtroFechaCarga, setFiltroFechaCarga] = useState<string>("");
    const [filtroFechaEmision, setFiltroFechaEmision] = useState<string>("");

    useEffect(() => {
        if (!userId) return;

        const fetchEmpresa = async () => {
            try {
                const res = await fetch(`/api/empresas/usuario/${userId}`);
                if (!res.ok) throw new Error(`Error HTTP: ${res.status} - ${res.statusText}`);

                const data = await res.json();
                if (!data || !data._id) throw new Error("No se encontró el ID de la empresa");

                setEmpresaId(data._id);
            } catch (error) {
                console.error("❌ Error obteniendo empresa:", error);
            }
        };

        fetchEmpresa();
    }, [userId]);

    useEffect(() => {
        if (!empresaId) return; // Si no hay empresaId, no hacer la consulta

        const fetchOrdenes = async () => {
            try {
                console.log("📡 Fetching orders for empresaId:", empresaId); // Depuración

                const res = await fetch(`/api/ordenes?empresaId=${empresaId}`);
                console.log("📡 Response status:", res.status); // Ver estado HTTP

                if (!res.ok) {
                    const errorText = await res.text();
                    throw new Error(`Error HTTP ${res.status}: ${errorText}`);
                }

                const dataOrdenes: Orden[] = await res.json();
                console.log("✅ Órdenes obtenidas:", dataOrdenes); // Depuración

                setOrdenes(dataOrdenes);
            } catch (error) {
                console.error("❌ Error obteniendo órdenes:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrdenes();
    }, [empresaId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-green-500"></div>
            </div>
        );
    }

    const ordenesFiltradas = ordenes.filter((orden) => {
        const unidad = typeof orden.unidadId === "object" ? orden.unidadId : null;
        const chofer = typeof orden.choferId === "object" ? orden.choferId : null;

        return (
            // 🔍 Filtro de búsqueda general (Matrícula, Chofer o DNI)
            (searchTerm
                ? (unidad?.matricula.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
                (chofer?.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
                (chofer?.documento.includes(searchTerm) ?? false)
                : true) &&

            // 📌 Filtro por Producto
            (filtroProducto ? orden.producto === filtroProducto : true) &&

            // 🚦 Filtro por Estado
            (filtroEstado ? orden.estado === filtroEstado : true) &&

            // 📅 Filtro por Fecha de Carga
            // 📅 Filtro por Fecha de Carga (corregido)
            (filtroFechaCarga && orden.fechaCarga
                ? new Date(orden.fechaCarga).toISOString().split("T")[0] === filtroFechaCarga
                : true) &&

            // 📅 Filtro por Fecha de Emisión
            (filtroFechaEmision ? orden.fechaEmision?.startsWith(filtroFechaEmision) : true)
        );
    });

    const ordenesOrdenadas = ordenesFiltradas.slice().sort(
        (a, b) => new Date(b.fechaEmision).getTime() - new Date(a.fechaEmision).getTime()
    );

    return (
        <div className="max-w-2xl mx-auto p-6 mt-20">

            <div className="flex flex-col rounded-md p-6 bg-white border-2 border-black">

                <div className="flex justify-between mb-4 items-center">
                    <h2 className="text-2xl font-bold">Órdenes</h2>
                    <button
                        onClick={() => router.push("/crear-orden")}
                        className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md w-fit"
                    >
                        + Crear Orden
                    </button>
                </div>

                {/* Filtros */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 bg-white border border-gray-300 rounded-lg p-4 shadow-sm">
                    {/* 🔍 Buscador */}
                    <div className="col-span-full relative">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Buscar</label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Buscar por matrícula, chofer o DNI"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 outline-none"
                            />
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth="1.5"
                                stroke="currentColor"
                                className="w-5 h-5 text-gray-500 absolute right-3 top-2.5"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                            </svg>
                        </div>
                    </div>

                    {/* 📅 Fecha de Emisión */}
                    <div className="flex flex-col">
                        <label className="text-sm font-semibold text-gray-700 mb-1">Fecha de Emisión</label>
                        <input
                            type="date"
                            value={filtroFechaEmision}
                            onChange={(e) => setFiltroFechaEmision(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 outline-none"
                        />
                    </div>

                    {/* 📅 Fecha de Carga */}
                    <div className="flex flex-col">
                        <label className="text-sm font-semibold text-gray-700 mb-1">Fecha de Carga</label>
                        <input
                            type="date"
                            value={filtroFechaCarga}
                            onChange={(e) => setFiltroFechaCarga(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 outline-none"
                        />
                    </div>

                    {/* ⛽ Producto */}
                    <div className="flex flex-col">
                        <label className="text-sm font-semibold text-gray-700 mb-1">Producto</label>
                        <select
                            value={filtroProducto}
                            onChange={(e) => setFiltroProducto(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 outline-none"
                        >
                            <option value="">Todos</option>
                            <option value="GASOIL_G2">Gasoil G2</option>
                            <option value="GASOIL_G3">Gasoil G3</option>
                            <option value="NAFTA_SUPER">Nafta Súper</option>
                            <option value="NAFTA_ECO">Nafta Eco</option>
                        </select>
                    </div>

                    {/* 🚦 Estado */}
                    <div className="flex flex-col">
                        <label className="text-sm font-semibold text-gray-700 mb-1">Estado</label>
                        <select
                            value={filtroEstado}
                            onChange={(e) => setFiltroEstado(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 outline-none"
                        >
                            <option value="">Todos</option>
                            <option value="PENDIENTE_AUTORIZACION">Pendiente de Autorización</option>
                            <option value="AUTORIZADA">Pendiente de Carga</option>
                            <option value="CARGADA">Cargada</option>
                        </select>
                    </div>

                    {/* ❌ Limpiar Filtros */}
                    <div className="flex items-end">
                        <button
                            onClick={() => {
                                setFiltroProducto("");
                                setFiltroEstado("");
                                setFiltroFechaCarga("");
                                setFiltroFechaEmision("");
                                setSearchTerm("");
                            }}
                            className="mt-auto px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-all"
                        >
                            Limpiar Filtros
                        </button>
                    </div>
                </div>


                {ordenes.length === 0 ? (
                    <p className="text-gray-600 text-center">No hay órdenes registradas.</p>
                ) : (
                    <div className="relative flex flex-col col-span-2">
                        <ul className="max-h-96 overflow-y-auto">
                            {ordenesOrdenadas.map((orden) => (
                                <li
                                    key={orden._id}
                                    className="bg-white rounded-lg shadow-md p-5 mb-4 border-l-4 transition-all duration-200 border-green-600 hover:border-green-700 hover:shadow-lg">
                                    {/* Header: Código y Estado */}
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                            {orden.codigoOrden}
                                        </span>
                                        <span
                                            className={`text-xs font-semibold uppercase tracking-wider ${orden.estado === "PENDIENTE_AUTORIZACION"
                                                ? "text-yellow-600"
                                                : orden.estado === "AUTORIZADA"
                                                    ? "text-green-600"
                                                    : "text-red-600"
                                                }`}
                                        >
                                            {orden.estado.replace(/_/g, " ")}
                                        </span>
                                    </div>

                                    {/* Empresa + Producto */}
                                    <h3 className="text-lg font-bold text-gray-800">{orden.empresaId.nombre}</h3>
                                    <p className="text-sm font-semibold text-gray-600 mb-2">
                                        {orden.producto.replace(/_/g, " ")}
                                    </p>

                                    {/* Cuerpo de detalles */}
                                    <div className="text-sm text-gray-700 space-y-1">
                                        {orden.tanqueLleno ? (
                                            <p><strong>Tanque:</strong> Lleno</p>
                                        ) : orden.litros ? (
                                            <p><strong>Litros:</strong> {orden.litros} L</p>
                                        ) : orden.monto ? (
                                            <p><strong>Monto:</strong> {orden.monto}</p>
                                        ) : null}

                                        <p><strong>Pago:</strong> {orden.condicionPago}</p>

                                        {orden.choferId && (
                                            <p>
                                                <strong>Chofer:</strong> {orden.choferId.nombre} ({orden.choferId.documento})
                                            </p>
                                        )}

                                        {orden.unidadId && (
                                            <p>
                                                <strong>Matrícula:</strong> {orden.unidadId.matricula}
                                            </p>
                                        )}

                                        {orden.playeroId && typeof orden.playeroId !== "string" && (
                                            <p>
                                                <strong>Playero:</strong> {orden.playeroId.nombre} ({orden.playeroId.documento})
                                            </p>
                                        )}

                                        <p>
                                            <strong>Fecha Emisión:</strong>{" "}
                                            {new Date(orden.fechaEmision).toLocaleDateString("es-AR")}
                                        </p>

                                        {orden.fechaCarga && (
                                            <p>
                                                <strong>Fecha Carga:</strong>{" "}
                                                {new Date(orden.fechaCarga).toLocaleDateString("es-AR")}
                                            </p>
                                        )}

                                        {orden.viaticos?.monto != null && (
                                            <p>
                                                <strong>Viáticos:</strong> {orden.viaticos.monto} {orden.viaticos.moneda}
                                            </p>
                                        )}
                                    </div>
                                </li>

                            ))}
                        </ul>
                    </div>
                )}

            </div>
        </div>
    );
}

