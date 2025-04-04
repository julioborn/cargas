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

    const ordenesOrdenadas = ordenes.slice().sort(
        (a, b) => new Date(b.fechaEmision).getTime() - new Date(a.fechaEmision).getTime()
    );

    return (
        <div className="max-w-6xl mx-auto p-6 mt-20">
            <div className="flex flex-col rounded-md p-6 bg-white border-2 border-black">
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
                        <option value="PENDIENTE_AUTORIZACION">Pendiente de Autorización</option>
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
                        {ordenesOrdenadas.map((orden) => (
                            <li key={orden._id} className="border border-gray-300 p-4 rounded mb-2">
                                <p className="text-gray-600 font-normal rounded border w-fit p-0.5 bg-gray-200">
                                    {orden.codigoOrden}
                                </p>
                                <p className="text-lg font-bold">{orden.empresaId.nombre}</p>
                                <p className="text-gray-600 font-bold">
                                    {orden.producto.replace(/_/g, " ")}
                                </p>

                                {orden.tanqueLleno ? (
                                    <p className="text-gray-600 font-normal">
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
                                <p className="text-gray-600">
                                    <strong>Pago: </strong> {orden.condicionPago}
                                </p>
                                {orden.choferId && (
                                    <p className="text-gray-600">
                                        <strong>Chofer:</strong> {orden.choferId.nombre} ({orden.choferId.documento})
                                    </p>
                                )}
                                {orden.unidadId && (
                                    <p className="text-gray-600">
                                        <strong>Matrícula:</strong> {orden.unidadId.matricula}
                                    </p>
                                )}
                                {orden.playeroId && typeof orden.playeroId !== "string" && (
                                    <p className="text-gray-600">
                                        <strong>Playero:</strong> {orden.playeroId.nombre} ({orden.playeroId.documento})
                                    </p>
                                )}
                                <p className="text-gray-600">
                                    <strong>Fecha Emisión:</strong> {new Date(orden.fechaEmision).toLocaleDateString()}
                                </p>
                                {orden.fechaCarga && (
                                    <p className="text-gray-600">
                                        <strong>Fecha Carga:</strong> {new Date(orden.fechaCarga).toLocaleDateString()}
                                    </p>
                                )}
                                {orden.viaticos && orden.viaticos.monto != null && (
                                    <p className="text-gray-600">
                                        <strong>Viáticos:</strong> {orden.viaticos.monto} {orden.viaticos.moneda}
                                    </p>
                                )}
                                <p className={`text-sm font-bold mt-2 ${orden.estado === "PENDIENTE_AUTORIZACION" ? "text-yellow-600" :
                                    orden.estado === "AUTORIZADA" ? "text-green-600" :
                                        "text-red-600"
                                    }`}>
                                    {orden.estado.replace(/_/g, " ")}
                                </p>
                                {/* 🛠️ Botones de Acción */}
                                <div className="flex gap-2 mt-2">
                                    {orden.estado === "PENDIENTE_AUTORIZACION" && (
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
