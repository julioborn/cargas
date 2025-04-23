"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
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
    litrosCargados?: number;
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

export default function OrdenesAdmin() {
    const { data: session } = useSession();
    const [ordenes, setOrdenes] = useState<Orden[]>([]);
    const [empresas, setEmpresas] = useState<Empresa[]>([]);
    const [filtros, setFiltros] = useState({
        empresaId: "",
        estado: "",
        fechaDesde: "",
        fechaHasta: "",
    });

    // Cargar empresas para los filtros
    useEffect(() => {
        const fetchEmpresas = async () => {
            try {
                const res = await fetch("/api/empresas");
                if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
                const data = await res.json();
                if (!Array.isArray(data)) {
                    console.error("La API de empresas no devuelve un array.");
                    return;
                }
                setEmpresas(data);
            } catch (error) {
                console.error("Error al cargar empresas:", error);
            }
        };
        fetchEmpresas();
    }, []);

    // Cargar las órdenes según los filtros
    useEffect(() => {
        const fetchOrdenes = async () => {
            try {
                const params = new URLSearchParams(
                    Object.fromEntries(Object.entries(filtros).filter(([_, v]) => v !== ""))
                ).toString();
                const res = await fetch(`/api/ordenes?${params}`);
                if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
                const data = await res.json();
                setOrdenes(data);
            } catch (error) {
                console.error("Error al cargar órdenes:", error);
            }
        };
        fetchOrdenes();
    }, [filtros]);

    // Función para actualizar el estado de la orden
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

    // Conversión de fecha para el input
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

    // Ordenar las órdenes por fecha de emisión descendente
    const ordenesOrdenadas = ordenes
        .slice()
        .sort(
            (a, b) =>
                new Date(b.fechaEmision).getTime() - new Date(a.fechaEmision).getTime()
        );

    return (
        <div className="max-w-6xl mx-auto p-6 mt-20">
            <div className="flex flex-col rounded-md p-6 bg-white border-2 border-black">
                <h2 className="text-2xl font-bold mb-2">Órdenes</h2>

                {/* Filtros */}
                <div className="flex flex-col sm:flex-row gap-4 mt-4">
                    <select
                        name="empresaId"
                        value={filtros.empresaId}
                        onChange={handleFiltroChange}
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
                        name="estado"
                        value={filtros.estado}
                        onChange={handleFiltroChange}
                        className="p-2 border border-gray-400 rounded w-full sm:w-auto"
                    >
                        <option value="">Todos los Estados</option>
                        <option value="PENDIENTE_AUTORIZACION">
                            Pendiente de Autorización
                        </option>
                        <option value="AUTORIZADA">Pendiente de Carga</option>
                        <option value="CARGADA">Cargada</option>
                    </select>
                    {/* Inputs de fecha (descomenta si los necesitas)
          <input
            type="date"
            name="fechaDesde"
            value={filtros.fechaDesde}
            onChange={handleFiltroChange}
            className="p-2 border border-gray-400 rounded w-full sm:w-auto"
          />
          <input
            type="date"
            name="fechaHasta"
            value={filtros.fechaHasta}
            onChange={handleFiltroChange}
            className="p-2 border border-gray-400 rounded w-full sm:w-auto"
          />
          */}
                </div>

                {/* Lista de Órdenes */}
                <div className="mt-4 relative flex flex-col border border-gray-200 rounded-lg shadow-sm bg-white">
                    <ul className="max-h-[480px] overflow-y-auto divide-y divide-gray-100">
                        {ordenesOrdenadas.map((orden) => {

                            return (
                                <li
                                    key={orden._id}
                                    className={`p-4 mb-2 bg-white hover:bg-gray-50 transition-all border-l-4iuxu rounded-md shadow-sm`}
                                >
                                    <div className="flex justify-between items-start">
                                        <p className="text-sm text-gray-500 font-mono bg-gray-100 px-2 py-0.5 rounded">
                                            {orden.codigoOrden}
                                        </p>
                                        <span
                                            className={`text-sm font-bold ${orden.estado === "PENDIENTE_AUTORIZACION"
                                                ? "text-yellow-600"
                                                : orden.estado === "AUTORIZADA"
                                                    ? "text-green-600"
                                                    : "text-red-600"
                                                }`}
                                        >
                                            {orden.estado.replace(/_/g, " ")}
                                        </span>
                                    </div>

                                    <h3 className="text-lg font-bold mt-1">{orden.empresaId.nombre}</h3>
                                    <p className="text-gray-700 font-semibold">{orden.producto.replace(/_/g, " ")}</p>

                                    {orden.tanqueLleno ? (
                                        <p className="text-gray-600"><strong>Tanque Lleno</strong></p>
                                    ) : orden.litros ? (
                                        <p className="text-gray-600"><strong>Litros Solicitados:</strong> {orden.litros} L</p>
                                    ) : orden.monto ? (
                                        <p className="text-gray-600"><strong>Monto:</strong> {orden.monto}</p>
                                    ) : null}

                                    {orden.estado === "CARGADA" && orden.litrosCargados !== undefined && (
                                        <p className="text-gray-600">
                                            <strong>Litros Cargados:</strong> {orden.litrosCargados} L
                                            {orden.litros !== undefined && orden.litrosCargados > orden.litros && (
                                                <span className="text-sm text-yellow-600 ml-2">(superó lo solicitado)</span>
                                            )}
                                        </p>
                                    )}

                                    <p className="text-gray-600"><strong>Pago:</strong> {orden.condicionPago}</p>

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
                                        <strong>Fecha Emisión:</strong> {new Date(orden.fechaEmision).toLocaleDateString("es-AR")}
                                    </p>

                                    {orden.fechaCarga && (
                                        <p className="text-gray-600">
                                            <strong>Fecha Carga:</strong> {new Date(orden.fechaCarga).toLocaleDateString("es-AR")}
                                        </p>
                                    )}

                                    {orden.viaticos?.monto != null && (
                                        <p className="text-gray-600">
                                            <strong>Viáticos:</strong> {orden.viaticos.monto} {orden.viaticos.moneda}
                                        </p>
                                    )}

                                    <div className="flex gap-2 mt-4">
                                        {orden.estado === "PENDIENTE_AUTORIZACION" && (
                                            <button
                                                onClick={() => actualizarEstado(orden._id, "AUTORIZADA")}
                                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-md text-sm font-semibold transition"
                                            >
                                                Autorizar
                                            </button>
                                        )}
                                        {orden.estado === "AUTORIZADA" && (
                                            <button
                                                onClick={() => actualizarEstado(orden._id, "CARGADA")}
                                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-md text-sm font-semibold transition"
                                            >
                                                Finalizar
                                            </button>
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </div>

            </div>
        </div>
    );
}
