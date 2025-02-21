"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

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

interface Orden {
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
}

export default function Dashboard() {
    const { data: session } = useSession();
    const router = useRouter();
    const [ordenes, setOrdenes] = useState<Orden[]>([]);
    const [empresas, setEmpresas] = useState<Empresa[]>([]);
    const [filtros, setFiltros] = useState({
        empresaId: "",
        estado: "",
        fechaDesde: "",
        fechaHasta: "",
    });

    useEffect(() => {
        const fetchEmpresas = async () => {
            try {
                const res = await fetch("/api/empresas");
                if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
                const data = await res.json();

                console.log("📡 Empresas cargadas desde API:", data);

                if (!Array.isArray(data)) {
                    console.error("❌ Error: La API no devuelve un array.");
                    return;
                }

                setEmpresas(data);
            } catch (error) {
                console.error("❌ Error al cargar empresas:", error);
            }
        };
        fetchEmpresas();
    }, []);

    useEffect(() => {
        const fetchOrdenes = async () => {
            try {
                const params = new URLSearchParams(
                    Object.fromEntries(
                        Object.entries(filtros).filter(([_, v]) => v !== "")
                    )
                ).toString();

                const res = await fetch(`/api/ordenes?${params}`);
                if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
                const data = await res.json();
                console.log("Órdenes filtradas:", data);
                setOrdenes(data);
            } catch (error) {
                console.error("Error al cargar órdenes:", error);
            }
        };
        fetchOrdenes();
    }, [filtros]);

    const actualizarEstado = async (id: string, nuevoEstado: string) => {
        const res = await fetch("/api/ordenes", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, nuevoEstado }),
        });

        if (res.ok) {
            Swal.fire(
                "Actualizado",
                `La orden ha sido marcada como "${nuevoEstado}".`,
                "success"
            );
            setOrdenes((prev) =>
                prev.map((orden) =>
                    orden._id === id ? { ...orden, estado: nuevoEstado } : orden
                )
            );
        } else {
            Swal.fire("Error", "No se pudo actualizar la orden", "error");
        }
    };

    const formatFecha = (fecha: string) =>
        fecha ? new Date(fecha).toISOString().split("T")[0] : "";

    const handleFiltroChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFiltros((prev) => ({
            ...prev,
            [name]: name.includes("fecha") ? formatFecha(value) : value,
        }));
    };

    return (
        <div className="max-w-6xl mx-auto p-6 mt-20">
            <div className="flex flex-col rounded-md p-6 bg-white border-2 border-black">
                <h2 className="text-2xl font-bold">Panel de Administración</h2>
                <h2 className="text-2xl font-bold mt-2">Órdenes</h2>

                {/* 🔍 Filtros */}
                <div className="flex flex-col sm:flex-row gap-4 mt-4">
                    <select
                        value={filtros.empresaId}
                        onChange={(e) =>
                            setFiltros({ ...filtros, empresaId: e.target.value })
                        }
                        className="p-2 border border-gray-400 rounded w-full sm:w-auto"
                    >
                        <option value="">Todas las Empresas</option>
                        {empresas.map((empresa) => (
                            <option key={empresa._id} value={empresa._id}>
                                {empresa.nombre}
                            </option>
                        ))}
                    </select>

                    <select
                        value={filtros.estado}
                        onChange={(e) =>
                            setFiltros({ ...filtros, estado: e.target.value })
                        }
                        className="p-2 border border-gray-400 rounded w-full sm:w-auto"
                    >
                        <option value="">Todos los Estados</option>
                        <option value="PENDIENTE">Pendiente de Autorización</option>
                        <option value="AUTORIZADA">Pendiente de Carga</option>
                        <option value="CARGADA">Cargada</option>
                    </select>

                    {/* <input
                        type="date"
                        name="fechaDesde"
                        value={filtros.fechaDesde}
                        onChange={handleFiltroChange}
                        className="p-2 border border-gray-400 rounded w-full sm:w-auto"
                    /> */}

                    {/* <input
                        type="date"
                        name="fechaHasta"
                        value={filtros.fechaHasta}
                        onChange={handleFiltroChange}
                        className="p-2 border border-gray-400 rounded w-full sm:w-auto"
                    /> */}
                </div>

                {/* 📜 Lista de Órdenes */}
                <div className="mt-4 relative flex flex-col border border-gray-400 rounded col-span-2">
                    <ul className="max-h-96 overflow-y-auto">
                        {ordenes.map((orden) => (
                            <li key={orden._id} className="border border-gray-300 p-4 rounded mb-2">
                                <p className="text-lg font-bold">{orden.empresaId.nombre}</p>
                                <p>
                                    <strong>Producto:</strong>{" "}
                                    {orden.producto.replace(/_/g, " ")}
                                </p>
                                {/* Mostrar solo una de las 3 opciones */}
                                {orden.tanqueLleno ? (
                                    <p>
                                        <strong>Tanque Lleno</strong>
                                    </p>
                                ) : orden.litros ? (
                                    <p>
                                        <strong>Litros:</strong> {orden.litros} L
                                    </p>
                                ) : orden.monto ? (
                                    <p>
                                        <strong>Monto:</strong> {orden.monto}
                                    </p>
                                ) : null}
                                {orden.choferId && (
                                    <p>
                                        <strong>Chofer:</strong> {orden.choferId.nombre} (
                                        {orden.choferId.documento})
                                    </p>
                                )}
                                {orden.unidadId && (
                                    <p>
                                        <strong>Matrícula:</strong> {orden.unidadId.matricula}
                                    </p>
                                )}
                                <p>
                                    <strong>Fecha Emisión:</strong>{" "}
                                    {new Date(orden.fechaEmision).toLocaleDateString()}
                                </p>
                                {orden.fechaCarga && (
                                    <p>
                                        <strong>Fecha Carga:</strong>{" "}
                                        {new Date(orden.fechaCarga).toLocaleDateString()}
                                    </p>
                                )}
                                <p
                                    className={`text-sm font-bold mt-2 ${orden.estado === "PENDIENTE"
                                        ? "text-yellow-600"
                                        : orden.estado === "AUTORIZADA"
                                            ? "text-green-600"
                                            : "text-red-600"
                                        }`}
                                >
                                    {orden.estado.replace(/_/g, " ")}
                                </p>
                                {/* 🛠️ Botones de Acción */}
                                <div className="flex gap-2 mt-2">
                                    {orden.estado === "PENDIENTE" && (
                                        <button
                                            onClick={() => actualizarEstado(orden._id, "AUTORIZADA")}
                                            className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                                        >
                                            Autorizar
                                        </button>
                                    )}
                                    {orden.estado === "AUTORIZADA" && (
                                        <button
                                            onClick={() => actualizarEstado(orden._id, "CARGADA")}
                                            className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                                        >
                                            Finalizar
                                        </button>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}
