"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

interface Unidad {
    _id: string;
    empresaId: string;
    matricula: string;
    tipo: string;
    choferAnexado?: string | null;
}

interface Chofer {
    _id: string;
    empresaId: string;
    nombre: string;
    documento: string;
}

interface Orden {
    _id: string;
    empresaId: string;
    unidadId: string | Unidad;
    choferId: string | Chofer;
    producto: string;
    litros?: number;
    monto?: number;
    estado: string;
    fechaEmision: string;
    fechaCarga: string;
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

                <div className="grid grid-cols-2 gap-2 mb-4">
                    {/* 🔍 Buscador Principal */}
                    <div className="relative flex items-center border border-gray-400 rounded col-span-2">
                        <input
                            type="text"
                            placeholder="Buscar por matrícula, chofer o DNI"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="p-2 pr-10 w-full rounded outline-none"
                        />
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="1.5"
                            stroke="currentColor"
                            className="w-5 h-5 text-gray-600 absolute right-3"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                        </svg>
                    </div>

                    {/* 📅 Filtro Fecha de Emisión */}
                    <div className="flex flex-col">
                        <label className="font-semibold">Fecha de Emisión</label>
                        <input
                            type="date"
                            value={filtroFechaEmision}
                            onChange={(e) => setFiltroFechaEmision(e.target.value)}
                            className="p-2 border border-gray-400 rounded"
                        />
                    </div>

                    {/* 📅 Filtro Fecha de Carga */}
                    <div className="flex flex-col">
                        <label className="font-semibold">Fecha de Carga</label>
                        <input
                            type="date"
                            value={filtroFechaCarga}
                            onChange={(e) => setFiltroFechaCarga(e.target.value)}
                            className="p-2 border border-gray-400 rounded"
                        />
                    </div>

                    {/* 📌 Selector de Producto */}
                    <select
                        value={filtroProducto}
                        onChange={(e) => setFiltroProducto(e.target.value)}
                        className="p-2 border border-gray-400 rounded"
                    >
                        <option value="">Todos los Productos</option>
                        <option value="GASOIL_G2">Gasoil G2</option>
                        <option value="GASOIL_G3">Gasoil G3</option>
                        <option value="NAFTA_SUPER">Nafta Súper</option>
                        <option value="NAFTA_ECO">Nafta Eco</option>
                    </select>

                    {/* 🚦 Selector de Estado */}
                    <select
                        value={filtroEstado}
                        onChange={(e) => setFiltroEstado(e.target.value)}
                        className="p-2 border border-gray-400 rounded"
                    >
                        <option value="">Todos los Estados</option>
                        <option value="PENDIENTE_AUTORIZACION">Pendiente de Autorización</option>
                        <option value="PENDIENTE_CARGA">Pendiente de Carga</option>
                        <option value="CARGADA">Cargada</option>
                    </select>

                    {/* 🔄 Botón para limpiar filtros */}
                    <button
                        onClick={() => {
                            setFiltroProducto("");
                            setFiltroEstado("");
                            setFiltroFechaCarga("");
                            setFiltroFechaEmision("");
                        }}
                        className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-md w-fit text-sm"
                    >
                        Limpiar Filtros
                    </button>

                </div>

                {ordenes.length === 0 ? (
                    <p className="text-gray-600 text-center">No hay órdenes registradas.</p>
                ) : (
                    <div className="relative flex flex-col border border-gray-400 rounded col-span-2">
                        <ul className="max-h-96 overflow-y-auto">
                            {ordenesFiltradas.map((orden) => (
                                <li key={orden._id} className="border border-gray-400 p-4 rounded mt-2 bg-white flex-shrink-0">
                                    <p className="text-gray-800 font-bold">Producto: {orden.producto.replace(/_/g, " ")}</p>
                                    <p className="text-gray-600"><strong>Unidad: </strong>
                                        {typeof orden.unidadId === "object" ? orden.unidadId.matricula : "Desconocida"}
                                    </p>
                                    <p className="text-gray-600"><strong>Chofer: </strong>
                                        {typeof orden.choferId === "object" ? orden.choferId.nombre : "Sin asignar"}
                                    </p>
                                    <p className="text-gray-600"><strong>DNI: </strong>
                                        {typeof orden.choferId === "object" ? orden.choferId.documento : "Sin asignar"}
                                    </p>
                                    {orden.litros !== undefined && <p className="text-gray-600"><strong>Litros:</strong> {orden.litros} L</p>}
                                    {orden.monto !== undefined && <p className="text-gray-600"><strong>Monto:</strong> ${orden.monto}</p>}
                                    {orden.fechaEmision && <p className="text-gray-600"><strong>Fecha de Emisión:</strong> {new Date(orden.fechaEmision).toLocaleDateString()}</p>}
                                    {orden.fechaCarga && <p className="text-gray-600"><strong>Fecha de Carga:</strong> {new Date(orden.fechaCarga).toLocaleDateString()}</p>}
                                    <p className={`text-sm font-bold mt-2 ${orden.estado === "PENDIENTE_AUTORIZACION" ? "text-yellow-600" : orden.estado === "PENDIENTE_CARGA" ? "text-green-600" : "text-red-600"}`}>
                                        {orden.estado.replace(/_/g, " ")}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    </div>

                )}
            </div>
        </div>
    );
}

