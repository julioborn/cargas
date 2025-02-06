"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

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
}

export default function EmpresaDashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const userId = session?.user?.id;

    const [empresa, setEmpresa] = useState<Empresa | null>(null);
    const [unidades, setUnidades] = useState<Unidad[]>([]);
    const [loading, setLoading] = useState(true);
    const [mensaje, setMensaje] = useState("");

    useEffect(() => {
        if (!userId) return;

        const fetchEmpresa = async () => {
            try {
                const res = await fetch(`/api/empresas/usuario/${userId}`);
                const data: Empresa | { error: string } = await res.json();

                if ("error" in data) {
                    setMensaje(data.error);
                } else {
                    setEmpresa(data);
                    fetchUnidades(data._id);
                }
            } catch (error) {
                console.error("❌ Error obteniendo empresa:", error);
            } finally {
                setLoading(false);
            }
        };

        const fetchUnidades = async (empresaId: string) => {
            try {
                const res = await fetch(`/api/unidades`);
                const data: Unidad[] = await res.json();
                setUnidades(data.filter((unidad) => unidad.empresaId === empresaId));
            } catch (error) {
                console.error("❌ Error obteniendo unidades:", error);
            }
        };

        fetchEmpresa();
    }, [userId]);

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
                setUnidades([]);
            } else {
                Swal.fire("Error", "No se pudo eliminar la empresa", "error");
            }
        }
    };

    if (status === "loading" || loading) {
        return <p className="text-center text-gray-600">Cargando...</p>;
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl text-white font-bold text-center mb-4">Datos de la Empresa</h1>
            {empresa ? (
                <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg mx-auto">
                    <strong className="text-xl text-gray-700">{empresa.nombre}</strong>
                    <p className="text-gray-700 mt-2"><strong>RUC/CUIT:</strong> {empresa.ruc_cuit}</p>
                    <p className="text-gray-700"><strong>Dirección:</strong> {empresa.direccion}</p>
                    <p className="text-gray-700"><strong>Teléfono:</strong> {empresa.telefono}</p>

                    <div className="mt-4 flex gap-4">
                        <button onClick={handleEditarEmpresa} className="bg-yellow-500 text-white px-2 py-2 rounded-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="size-6">
                                <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                            </svg>
                        </button>
                        <button onClick={handleEliminarEmpresa} className="bg-red-500 text-white px-2 py-2 rounded-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="size-6">
                                <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                            </svg>
                        </button>
                    </div>

                    <div className="mt-6">
                        <h2 className="text-xl font-bold">Unidades</h2>
                        <button
                            onClick={() => router.push("/registrar-unidad")}
                            className="mt-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg"
                        >
                            + Agregar Unidad
                        </button>
                        <ul className="mt-4">
                            {unidades.map((unidad) => (
                                <li key={unidad._id} className="border p-2 rounded mt-2 flex justify-between">
                                    {unidad.matricula} - {unidad.tipo}
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEditarEmpresa()} className="bg-yellow-500 text-white px-2 py-1 rounded">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="size-6">
                                                <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                            </svg>
                                        </button>
                                        <button onClick={() => handleEliminarEmpresa()} className="bg-red-500 text-white px-2 py-1 rounded">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="size-6">
                                                <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                            </svg>
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            ) : (
                <p className="text-red-500 text-center">No tienes una empresa registrada.</p>
            )}
        </div>
    );
}
