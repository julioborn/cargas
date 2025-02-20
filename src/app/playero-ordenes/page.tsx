"use client";

import { div } from "framer-motion/client";
import { useEffect, useState } from "react";
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
    playeroId?: Playero;
    codigoOrden: string;
}

export default function PlayeroOrdenes() {
    const [ordenes, setOrdenes] = useState<Orden[]>([]);

    useEffect(() => {
        const fetchOrdenes = async () => {
            try {
                // Se filtran órdenes autorizadas
                const params = new URLSearchParams({ estado: "AUTORIZADA" }).toString();
                const res = await fetch(`/api/ordenes?${params}`);
                if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
                const data = await res.json();
                setOrdenes(data);
            } catch (error) {
                console.error("Error al cargar órdenes:", error);
            }
        };
        fetchOrdenes();
    }, []);

    const finalizarCarga = async (ordenId: string) => {
        const { value: formValues } = await Swal.fire({
            title: "Finalizar Carga",
            html:
                '<input id="swal-input1" class="swal2-input" placeholder="Documento">' +
                '<input id="swal-input2" class="swal2-input" placeholder="Litros Cargados" type="number" step="0.01">',
            focusConfirm: false,
            preConfirm: () => {
                const documento = (document.getElementById("swal-input1") as HTMLInputElement).value;
                const litrosStr = (document.getElementById("swal-input2") as HTMLInputElement).value;
                const litros = parseFloat(litrosStr);
                if (!documento || isNaN(litros)) {
                    Swal.showValidationMessage("Debes ingresar el documento y los litros cargados");
                }
                return { documento, litros };
            },
        });

        if (formValues) {
            const { documento, litros } = formValues;
            const res = await fetch("/api/ordenes", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: ordenId, nuevoEstado: "CARGADA", documento, litros }),
            });
            if (res.ok) {
                Swal.fire("Actualizado", "La orden ha sido CARGADA.", "success");
                // Actualizamos la lista quitando la orden finalizada
                setOrdenes(prev => prev.filter(o => o._id !== ordenId));
            } else {
                Swal.fire("Error", "No se pudo actualizar la orden", "error");
            }
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 mt-16">
            <h1 className="text-3xl font-bold mb-6 text-center">Órdenes Autorizadas</h1>
            {ordenes.length === 0 ? (
                <p className="text-center text-gray-600">No hay órdenes autorizadas pendientes de carga.</p>
            ) : (
                <div className="bg-white rounded shadow">
                    <ul className="space-y-4">
                        {ordenes.map((orden) => (
                            <li key={orden._id} className="p-4 border rounded shadow">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="font-bold text-lg">
                                            {orden.empresaId.nombre} - Orden:{" "}
                                            <span className="text-green-600">{orden.codigoOrden}</span>
                                        </p>
                                        <p>
                                            <strong>Producto:</strong>{" "}
                                            {orden.producto.replace(/_/g, " ")}
                                        </p>
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
                                        <p>
                                            <strong>Estado:</strong>{" "}
                                            <span className="font-bold text-green-600">
                                                {orden.estado.replace(/_/g, " ")}
                                            </span>
                                        </p>
                                        {orden.unidadId && (
                                            <p>
                                                <strong>Matrícula:</strong> {orden.unidadId.matricula}
                                            </p>
                                        )}
                                        {orden.choferId && (
                                            <p>
                                                <strong>Chofer:</strong> {orden.choferId.nombre} (
                                                {orden.choferId.documento})
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => finalizarCarga(orden._id)}
                                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                                    >
                                        Finalizar Carga
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
