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
}

interface Unidad {
    _id: string;
    empresaId: string;
    matricula: string;
    tipo: string;
    choferAnexado?: string | null; // ✅ Ahora la propiedad está definida
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
    monto?: number;
    estado: "PENDIENTE_AUTORIZACION" | "PENDIENTE_CARGA" | "CARGA_COMPLETADA";
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
                // 1️⃣ Obtener empresa
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

    //Empresa
    const handleEditarEmpresa = async () => {
        if (!empresa) return;

        const { value } = await Swal.fire({
            title: "Editar Empresa",
            html: `
                <input id="swal-nombre" class="swal2-input" value="${empresa.nombre}" placeholder="Nombre">
                <input id="swal-ruc_cuit" class="swal2-input" value="${empresa.ruc_cuit}" placeholder="RUC/CUIT">
                <input id="swal-direccion" class="swal2-input" value="${empresa.direccion}" placeholder="Dirección">
                <input id="swal-telefono" class="swal2-input" value="${empresa.telefono}" placeholder="Teléfono">
            `,
            showCancelButton: true,
            confirmButtonText: "Guardar cambios",
            preConfirm: () => {
                return {
                    nombre: (document.getElementById("swal-nombre") as HTMLInputElement).value,
                    ruc_cuit: (document.getElementById("swal-ruc_cuit") as HTMLInputElement).value,
                    direccion: (document.getElementById("swal-direccion") as HTMLInputElement).value,
                    telefono: (document.getElementById("swal-telefono") as HTMLInputElement).value,
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
                <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg mx-auto relative border border-black">
                    {/* Datos de la Empresa */}
                    <div>
                        <strong className="text-xl text-gray-700">{empresa.nombre}</strong>
                        <p className="text-gray-700 mt-2"><strong>RUC/CUIT:</strong> {empresa.ruc_cuit}</p>
                        <p className="text-gray-700"><strong>Dirección:</strong> {empresa.direccion}</p>
                        <p className="text-gray-700"><strong>Teléfono:</strong> {empresa.telefono}</p>
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

                    <div className="flex justify-between">
                        {/* Unidades */}
                        <button
                            onClick={() => router.push("/unidades")}
                            className="mt-4 mb-4 px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md"
                        >
                            Unidades
                        </button>

                        {/* Choferes */}
                        <button
                            onClick={() => router.push("/choferes")}
                            className="mt-4 mb-4 px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md"
                        >
                            Choferes
                        </button>

                        {/* Listado de Órdenes */}
                        <button
                            onClick={() => router.push("/ordenes")}
                            className="mt-4 mb-4 px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md"
                        >
                            + Crear Orden
                        </button>
                    </div>

                </div>
            ) : (
                <p className="text-red-500 text-center">No tienes una empresa registrada.</p>
            )}
        </div>
    );
}