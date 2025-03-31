"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { FiSettings } from "react-icons/fi";

interface Empresa {
    _id: string;
    nombre: string;
    ruc_cuit: string;
    direccion: string;
    telefono: string;
    ciudad: string;
    pais: string;
}

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
    fechaEmision: string;
    fechaCarga?: string;
    unidadId: string;
    choferId: string;
    producto: "GASOIL_G2" | "GASOIL_G3" | "NAFTA_SUPER" | "NAFTA_ECO";
    litros?: number;
    importe?: number;
    estado: "PENDIENTE_AUTORIZACION" | "AUTORIZADA" | "CARGA_COMPLETADA";
    unidadMatricula?: string;
    unidadTipo?: string;
    choferNombre?: string;
    choferDocumento?: string;
}

export default function EmpresaDashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const userId = session?.user?.id;
    const [empresa, setEmpresa] = useState<Empresa | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [mensaje, setMensaje] = useState("");
    const [menuAbierto, setMenuAbierto] = useState(false);

    useEffect(() => {
        if (!userId) return;

        const fetchData = async () => {
            try {
                const resEmpresa = await fetch(`/api/empresas/usuario/${userId}`);
                const dataEmpresa: Empresa | { error: string } = await resEmpresa.json();
                if ("error" in dataEmpresa) {
                    setMensaje(dataEmpresa.error);
                    return;
                }
                setEmpresa(dataEmpresa);
            } catch (error) {
                console.error("❌ Error obteniendo datos:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [userId]);

    if (status === "loading" || loading) {
        return (
            <div className="flex items-center justify-center h-screen text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-green-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-900 text-red-500 text-lg">
                No tienes una empresa registrada.
            </div>
        );
    }

    const handleEditarEmpresa = async () => {
        if (!empresa) return;

        const { value } = await Swal.fire({
            title: "Editar Empresa",
            html: `
        <input id="swal-nombre" class="swal2-input" value="${empresa.nombre}" placeholder="Nombre">
        <input id="swal-ruc_cuit" class="swal2-input" value="${empresa.ruc_cuit}" placeholder="RUC/CUIT">
        <input id="swal-direccion" class="swal2-input" value="${empresa.direccion}" placeholder="Dirección">
        <input id="swal-telefono" class="swal2-input" value="${empresa.telefono}" placeholder="Teléfono">
        <input id="swal-telefono" class="swal2-input" value="${empresa.ciudad}" placeholder="Ciudad">
        <input id="swal-telefono" class="swal2-input" value="${empresa.pais}" placeholder="País">
        `,
            showCancelButton: true,
            confirmButtonText: "Guardar cambios",
            preConfirm: () => {
                return {
                    nombre: (document.getElementById("swal-nombre") as HTMLInputElement).value,
                    ruc_cuit: (document.getElementById("swal-ruc_cuit") as HTMLInputElement).value,
                    direccion: (document.getElementById("swal-direccion") as HTMLInputElement).value,
                    telefono: (document.getElementById("swal-telefono") as HTMLInputElement).value,
                    ciudad: (document.getElementById("swal-ciudad") as HTMLInputElement).value,
                    pais: (document.getElementById("swal-pais") as HTMLInputElement).value,
                };
            },
        });

        if (value) {
            const res = await fetch(`/api/empresas/${empresa._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(value),
            });

            if (res.ok) {
                Swal.fire("¡Actualizado!", "Empresa editada correctamente.", "success");
                setEmpresa({ ...empresa, ...value });
            } else {
                Swal.fire("Error", "No se pudo actualizar la empresa", "error");
            }
        }
    };

    const handleEliminarEmpresa = async () => {
        if (!empresa) return;

        const confirmacion = await Swal.fire({
            title: "¿Eliminar empresa?",
            text: "Se eliminarán también todas las unidades registradas. Esta acción no se puede deshacer.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Sí, eliminar",
        });

        if (confirmacion.isConfirmed) {
            const res = await fetch(`/api/empresas/${empresa._id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                Swal.fire("Eliminado", "La empresa y sus unidades han sido eliminadas.", "success");
                setEmpresa(null);
            } else {
                Swal.fire("Error", "No se pudo eliminar la empresa", "error");
            }
        }
    };

    return (
        <div className="p-6 mt-20">
            {empresa ? (
                <div className="bg-white p-6 rounded-lg shadow-md max-w-lg mx-auto relative border border-black text-center md:text-left">
                    {/* Datos de la Empresa */}
                    <div>
                        <h2 className="text-3xl font-semibold text-gray-800 mb-2">
                            {empresa.nombre}
                        </h2>
                        <div className="text-gray-600 space-y-2">
                            <p>
                                <span className="font-semibold text-gray-700 text-lg">RUC/CUIT:</span>{" "}
                                {empresa.ruc_cuit}
                            </p>
                            <p>
                                <span className="font-semibold text-gray-700 text-lg">Dirección:</span>{" "}
                                {empresa.direccion}
                            </p>
                            <p>
                                <span className="font-semibold text-gray-700 text-lg">Teléfono:</span>{" "}
                                {empresa.telefono}
                            </p>
                            <p>
                                <span className="font-semibold text-gray-700 text-lg">Ciudad:</span>{" "}
                                {empresa.ciudad}
                            </p>
                            <p>
                                <span className="font-semibold text-gray-700 text-lg">País:</span>{" "}
                                {empresa.pais}
                            </p>
                        </div>
                    </div>

                    {/* Botón de Configuración */}
                    <div className="absolute top-3 right-3">
                        <button
                            className="p-2 rounded-full"
                            onClick={() => setMenuAbierto(!menuAbierto)}
                        >
                            <FiSettings className="text-gray-700 text-lg" />
                        </button>
                    </div>

                    {/* Menú de Configuración */}
                    {menuAbierto && (
                        <div className="absolute top-12 right-3 bg-white shadow-lg rounded-lg p-2">
                            <button
                                onClick={handleEditarEmpresa}
                                className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                            >
                                Editar Empresa
                            </button>
                            <button
                                onClick={handleEliminarEmpresa}
                                className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
                            >
                                Eliminar Empresa
                            </button>
                        </div>
                    )}

                    {/* Botones - centrados en mobile */}
                    <div className="flex flex-col md:flex-row gap-2 mt-4 pt-4 border-t border-black w-3/4 mx-auto md:mx-0">
                        <button
                            onClick={() => router.push("/unidades")}
                            className="flex justify-center items-center gap-1 px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md"
                        >
                            Unidades
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
                                <path d="M6.5 3c-1.051 0-2.093.04-3.125.117A1.49 1.49 0 0 0 2 4.607V10.5h9V4.606c0-.771-.59-1.43-1.375-1.489A41.568 41.568 0 0 0 6.5 3ZM2 12v2.5A1.5 1.5 0 0 0 3.5 16h.041a3 3 0 0 1 5.918 0h.791a.75.75 0 0 0 .75-.75V12H2Z" />
                                <path d="M6.5 18a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM13.25 5a.75.75 0 0 0-.75.75v8.514a3.001 3.001 0 0 1 4.893 1.44c.37-.275.61-.719.595-1.227a24.905 24.905 0 0 0-1.784-8.549A1.486 1.486 0 0 0 14.823 5H13.25ZM14.5 18a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
                            </svg>
                        </button>

                        <button
                            onClick={() => router.push("/choferes")}
                            className="flex justify-center items-center gap-1 px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md"
                        >
                            Choferes
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                className="h-5 w-5"
                            >
                                <path d="M7 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM14.5 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM1.615 16.428a1.224 1.224 0 0 1-.569-1.175 6.002 6.002 0 0 1 11.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 0 1 7 18a9.953 9.953 0 0 1-5.385-1.572ZM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 0 0-1.588-3.755 4.502 4.502 0 0 1 5.874 2.636.818.818 0 0 1-.36.98A7.465 7.465 0 0 1 14.5 16Z" />
                            </svg>
                        </button>

                        <button
                            onClick={() => router.push("/ordenes")}
                            className="flex justify-center items-center gap-1 px-3.5 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md"
                        >
                            Ordenes
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                className="h-5 w-5"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M15.988 3.012A2.25 2.25 0 0 1 18 5.25v6.5A2.25 2.25 0 0 1 15.75 14H13.5V7A2.5 2.5 0 0 0 11 4.5H8.128a2.252 2.252 0 0 1 1.884-1.488A2.25 2.25 0 0 1 12.25 1h1.5a2.25 2.25 0 0 1 2.238 2.012ZM11.5 3.25a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 .75.75v.25h-3v-.25Z"
                                    clipRule="evenodd"
                                />
                                <path
                                    fillRule="evenodd"
                                    d="M2 7a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7Zm2 3.25a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1-.75-.75Zm0 3.5a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1-.75-.75Z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </button>
                    </div>
                </div>
            ) : (
                <p className="text-red-500 text-center">
                    No tienes una empresa registrada.
                </p>
            )}
        </div>
    );
}
