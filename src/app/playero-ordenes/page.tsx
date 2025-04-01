"use client";

import { useSession } from "next-auth/react";
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
    empresaId: Empresa | string;
}

interface Playero {
    _id: string;
    nombre: string;
    documento: string;
    ubicacionId?: string | { _id: string; nombre: string };
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
    ubicacionId?: string | { _id: string; nombre: string };
    codigoOrden: string;
}

export default function PlayeroOrdenes() {
    const { data: session, status } = useSession();
    const [ordenes, setOrdenes] = useState<Orden[]>([]);
    const [searchOrderId, setSearchOrderId] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrdenes = async () => {
            try {
                const params = new URLSearchParams({ estado: "AUTORIZADA" }).toString();
                const res = await fetch(`/api/ordenes?${params}`);
                if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
                const data = await res.json();
                setOrdenes(data);
            } catch (error) {
                console.error("Error al cargar órdenes:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchOrdenes();
    }, []);

    const finalizarCarga = async (orden: Orden) => {
        try {
            const resUbicaciones = await fetch("/api/ubicaciones");
            if (!resUbicaciones.ok) throw new Error("Error al obtener ubicaciones");
            const ubicacionesData = await resUbicaciones.json();

            let defaultUbicacion = "";
            if (
                orden.playeroId &&
                typeof orden.playeroId === "object" &&
                orden.playeroId.ubicacionId &&
                typeof orden.playeroId.ubicacionId === "object"
            ) {
                defaultUbicacion = orden.playeroId.ubicacionId._id;
            }
            console.log("defaultUbicacion:", defaultUbicacion);

            const ubicacionOptions = ubicacionesData
                .map((u: { _id: string; nombre: string }) => {
                    const selected =
                        u._id.toString() === defaultUbicacion.toString() ? "selected" : "";
                    return `<option value="${u._id}" ${selected}>${u.nombre}</option>`;
                })
                .join("");

            const { value: formValues } = await Swal.fire({
                title: "Finalizar Carga",
                html:
                    `<select id="swal-ubicacion" class="swal2-input w-72">
            <option value="">Selecciona una ubicación</option>
            ${ubicacionOptions}
          </select>` +
                    '<input id="swal-input2" class="swal2-input w-72" placeholder="Litros Cargados" type="number" step="0.01">',
                focusConfirm: false,
                preConfirm: () => {
                    const ubicacion = (document.getElementById(
                        "swal-ubicacion"
                    ) as HTMLSelectElement).value;
                    const litrosStr = (document.getElementById("swal-input2") as HTMLInputElement).value;
                    const litros = parseFloat(litrosStr);
                    if (!ubicacion || isNaN(litros)) {
                        Swal.showValidationMessage("Debes seleccionar la ubicación y los litros cargados");
                        return false;
                    }
                    return { ubicacion, litros };
                },
            });

            if (formValues) {
                const { ubicacion, litros } = formValues;
                const res = await fetch("/api/ordenes", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: orden._id, nuevoEstado: "CARGADA", ubicacion, litros }),
                });
                if (res.ok) {
                    Swal.fire("Actualizado", "La orden ha sido CARGADA.", "success");
                    setOrdenes((prev) => prev.filter((o) => o._id !== orden._id));
                } else {
                    Swal.fire("Error", "No se pudo actualizar la orden", "error");
                }
            }
        } catch (error) {
            console.error("Error en finalizarCarga:", error);
            Swal.fire("Error", "Ocurrió un error al procesar la solicitud", "error");
        }
    };

    // Función para verificar tanto choferes como empleados
    const verifyPersona = async () => {
        const { value: dni } = await Swal.fire({
            title: "Verificar Chofer/Empleado",
            input: "text",
            inputLabel: "Ingresa el DNI",
            inputPlaceholder: "DNI",
            showCancelButton: true,
            preConfirm: (value) => {
                if (!value) {
                    Swal.showValidationMessage("Debes ingresar un DNI");
                }
                return value;
            },
        });
        if (dni) {
            try {
                // Buscar en choferes
                const resChoferes = await fetch(`/api/choferes?documento=${dni}`);
                let chofer;
                if (resChoferes.ok) {
                    const dataChofer = await resChoferes.json();
                    chofer = Array.isArray(dataChofer)
                        ? dataChofer.find((c: any) => c.documento === dni)
                        : dataChofer;
                }
                // Buscar en empleados
                const resEmpleados = await fetch(`/api/empleados?documento=${dni}`);
                let empleado;
                if (resEmpleados.ok) {
                    const dataEmpleado = await resEmpleados.json();
                    empleado = Array.isArray(dataEmpleado)
                        ? dataEmpleado.find((e: any) => e.documento === dni)
                        : dataEmpleado;
                }
                if (!chofer && !empleado) {
                    Swal.fire("Error", "No se encontró chofer o empleado", "error");
                    return;
                }
                if (chofer) {
                    let empresaNombre = "-";
                    if (typeof chofer.empresaId === "string") {
                        const resEmpresa = await fetch(`/api/empresas/${chofer.empresaId}`);
                        if (resEmpresa.ok) {
                            const empresaData = await resEmpresa.json();
                            empresaNombre = empresaData.nombre;
                        }
                    } else if (typeof chofer.empresaId === "object") {
                        empresaNombre = chofer.empresaId.nombre;
                    }
                    Swal.fire({
                        title: "Resultado",
                        html: `<p><strong>Tipo:</strong> Chofer</p>
                   <p><strong>Nombre:</strong> ${chofer.nombre}</p>
                   <p><strong>DNI:</strong> ${chofer.documento}</p>
                   <p><strong>Empresa:</strong> ${empresaNombre}</p>`,
                    });
                } else if (empleado) {
                    let empresaNombre = "-";
                    if (typeof empleado.empresaId === "string") {
                        const resEmpresa = await fetch(`/api/empresas/${empleado.empresaId}`);
                        if (resEmpresa.ok) {
                            const empresaData = await resEmpresa.json();
                            empresaNombre = empresaData.nombre;
                        }
                    } else if (typeof empleado.empresaId === "object") {
                        empresaNombre = empleado.empresaId.nombre;
                    }
                    Swal.fire({
                        title: "Resultado",
                        html: `<p><strong>Tipo:</strong> Empleado</p>
                   <p><strong>Nombre:</strong> ${empleado.nombre}</p>
                   <p><strong>DNI:</strong> ${empleado.documento}</p>
                   <p><strong>Empresa:</strong> ${empresaNombre}</p>`,
                    });
                }
            } catch (error) {
                console.error("Error al verificar chofer o empleado:", error);
                Swal.fire("Error", "No se pudo verificar la información", "error");
            }
        }
    };

    if (status === "loading" || loading) {
        return (
            <div className="flex items-center justify-center h-screen text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-green-500"></div>
            </div>
        );
    }

    const filteredOrdenes = ordenes.filter((orden) =>
        orden.codigoOrden.toLowerCase().includes(searchOrderId.toLowerCase())
    );

    return (
        <div className="max-w-4xl mx-auto p-6 mt-16">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-3xl font-bold">Órdenes Autorizadas</h1>
                <button
                    onClick={verifyPersona}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                    Verificar Chofer/Empleado
                </button>
            </div>
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Buscar por ID de orden"
                    value={searchOrderId}
                    onChange={(e) => setSearchOrderId(e.target.value)}
                    className="p-2 border border-gray-400 rounded w-full"
                />
            </div>
            {ordenes.length === 0 ? (
                <p className="text-center text-gray-600">
                    No hay órdenes autorizadas pendientes de carga.
                </p>
            ) : (
                <div className="bg-white rounded shadow">
                    <ul className="space-y-4">
                        {filteredOrdenes.map((orden) => (
                            <li key={orden._id} className="p-4 border rounded shadow">
                                <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                                    <div>
                                        <p className="text-gray-600 font-normal rounded border w-fit p-0.5 bg-gray-200">
                                            {orden.codigoOrden}
                                        </p>
                                        <p className="font-bold text-lg">{orden.empresaId.nombre}</p>
                                        <p>
                                            <strong>Producto:</strong>{" "}
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
                                            <strong>Fecha Emisión:</strong>{" "}
                                            {new Date(orden.fechaEmision).toLocaleDateString()}
                                        </p>
                                        {orden.fechaCarga && (
                                            <p className="text-gray-600">
                                                <strong>Fecha Carga:</strong>{" "}
                                                {new Date(orden.fechaCarga).toLocaleDateString()}
                                            </p>
                                        )}
                                        {orden.unidadId && (
                                            <p className="text-gray-600">
                                                <strong>Matrícula:</strong> {orden.unidadId.matricula}
                                            </p>
                                        )}
                                        {orden.choferId && (
                                            <p className="text-gray-600">
                                                <strong>Chofer:</strong>{" "}
                                                {orden.choferId.nombre} ({orden.choferId.documento})
                                            </p>
                                        )}
                                        <p className="text-gray-600">
                                            <span className="font-bold text-green-600">
                                                {orden.estado.replace(/_/g, " ")}
                                            </span>
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => finalizarCarga(orden)}
                                        className="w-fit bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 mt-4 md:mt-0"
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
