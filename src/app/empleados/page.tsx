"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

interface Empleado {
    _id: string;
    // Puede ser un string o un objeto con _id y nombre
    empresaId: { _id: string; nombre: string } | string;
    nombre: string;
    documento: string;
}

export default function Empleados() {
    const { data: session, status } = useSession();
    const userId = session?.user?.id;
    const router = useRouter();
    const [empleados, setEmpleados] = useState<Empleado[]>([]);
    const [empresaId, setEmpresaId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState<string>("");

    useEffect(() => {
        if (!userId) return;

        const fetchEmpresa = async () => {
            try {
                const res = await fetch(`/api/empresas/usuario/${userId}`);
                if (!res.ok) throw new Error(`Error HTTP: ${res.status} - ${res.statusText}`);

                const data = await res.json();
                console.log("🔍 Empresa obtenida:", data);

                if (!data || !data._id) throw new Error("No se encontró el ID de la empresa");

                setEmpresaId(data._id);
            } catch (error) {
                console.error("❌ Error obteniendo empresa:", error);
            }
        };

        fetchEmpresa();
    }, [userId]);

    useEffect(() => {
        const fetchEmpleados = async () => {
            try {
                const res = await fetch(`/api/empleados`);
                if (!res.ok) throw new Error("No se pudo obtener la lista de empleados");

                const data: Empleado[] = await res.json();
                const empleadosFiltrados = empresaId
                    ? data.filter(empleado => {
                        const id = typeof empleado.empresaId === "object" ? empleado.empresaId._id : empleado.empresaId;
                        return id === empresaId;
                    })
                    : [];
                setEmpleados(empleadosFiltrados);
            } catch (error) {
                console.error("❌ Error obteniendo empleados:", error);
            } finally {
                setLoading(false);
            }
        };

        if (empresaId) fetchEmpleados();
    }, [empresaId]);

    const handleAgregarEmpleado = async () => {
        if (!empresaId) {
            Swal.fire("Error", "No se pudo obtener el ID de la empresa", "error");
            return;
        }

        const { value } = await Swal.fire({
            title: "Agregar Empleado",
            html: `
                <input id="swal-nombre" class="swal2-input" placeholder="Nombre del Empleado">
                <input id="swal-documento" class="swal2-input" placeholder="Documento">
            `,
            showCancelButton: true,
            confirmButtonText: "Agregar",
            preConfirm: () => {
                const nombre = (document.getElementById("swal-nombre") as HTMLInputElement).value.trim();
                const documento = (document.getElementById("swal-documento") as HTMLInputElement).value.trim();

                if (!nombre || !documento) {
                    Swal.showValidationMessage("Todos los campos son obligatorios");
                    return false;
                }

                return { empresaId, nombre: nombre.toUpperCase(), documento };
            },
        });

        if (value) {
            try {
                const res = await fetch(`/api/empleados`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(value),
                });

                if (!res.ok) throw new Error("Error al registrar el empleado");

                const nuevoEmpleado = await res.json();
                Swal.fire("¡Agregado!", "Empleado registrado correctamente.", "success");
                setEmpleados([...empleados, nuevoEmpleado.empleado]);
            } catch (error) {
                console.error("❌ Error registrando empleado:", error);
                Swal.fire("Error", "No se pudo registrar el empleado", "error");
            }
        }
    };

    const handleEditarEmpleado = async (empleado: Empleado) => {
        const { value } = await Swal.fire({
            title: "Editar Empleado",
            html: `
                <input id="swal-nombre" class="swal2-input" value="${empleado.nombre}" placeholder="Nombre del Empleado">
                <input id="swal-documento" class="swal2-input" value="${empleado.documento}" placeholder="Documento">
            `,
            showCancelButton: true,
            confirmButtonText: "Guardar cambios",
            preConfirm: () => {
                return {
                    nombre: (document.getElementById("swal-nombre") as HTMLInputElement).value.trim().toUpperCase(),
                    documento: (document.getElementById("swal-documento") as HTMLInputElement).value.trim(),
                };
            },
        });

        if (value) {
            try {
                const res = await fetch(`/api/empleados/${empleado._id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(value),
                });

                if (!res.ok) throw new Error("Error al actualizar el empleado");

                Swal.fire("¡Actualizado!", "Empleado editado correctamente.", "success");
                setEmpleados(empleados.map(e => e._id === empleado._id ? { ...e, ...value } : e));
            } catch (error) {
                console.error("❌ Error actualizando empleado:", error);
                Swal.fire("Error", "No se pudo actualizar el empleado", "error");
            }
        }
    };

    const handleEliminarEmpleado = async (empleadoId: string) => {
        const confirmacion = await Swal.fire({
            title: "¿Eliminar empleado?",
            text: "Esta acción no se puede deshacer.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, eliminar",
        });

        if (confirmacion.isConfirmed) {
            try {
                const res = await fetch(`/api/empleados/${empleadoId}`, {
                    method: "DELETE",
                });

                if (!res.ok) throw new Error("Error al eliminar el empleado");

                Swal.fire("Eliminado", "El empleado ha sido eliminado.", "success");
                setEmpleados(empleados.filter(e => e._id !== empleadoId));
            } catch (error) {
                console.error("❌ Error eliminando empleado:", error);
                Swal.fire("Error", "No se pudo eliminar el empleado", "error");
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

    const filteredEmpleados = empleados.filter(empleado =>
        empleado.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        empleado.documento.includes(searchTerm)
    );

    return (
        <div className="max-w-2xl mx-auto p-6 mt-20">
            <div className="flex flex-col rounded-md p-6 bg-white border-2 border-black">
                <div className="flex justify-between mb-4 items-center">
                    <h2 className="text-2xl font-bold text-black">Empleados</h2>
                    <button
                        onClick={handleAgregarEmpleado}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg w-fit"
                        disabled={!empresaId}
                    >
                        + Agregar Empleado
                    </button>
                </div>

                <div className="relative flex items-center border border-gray-400 rounded col-span-2">
                    <input
                        type="text"
                        placeholder="Buscar por empleado o DNI"
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

                <div className="max-h-96 overflow-y-auto rounded p-2 mt-4">
                    <ul>
                        {filteredEmpleados.map(empleado => (
                            <li key={empleado._id} className="border p-2 rounded mt-2 flex justify-between bg-white border-gray-400">
                                <div className="flex flex-col">
                                    <span className="text-gray-800 font-semibold">
                                        {empleado.nombre.toUpperCase()}
                                    </span>
                                    <span className="text-gray-600">
                                        DNI: {empleado.documento}
                                    </span>
                                </div>
                                <div className="flex gap-2 items-center">
                                    <button
                                        onClick={() => handleEditarEmpleado(empleado)}
                                        className="bg-yellow-500 text-white px-2 py-1 rounded w-10 h-10"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth="1.5"
                                            stroke="currentColor"
                                            className="size-6"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => handleEliminarEmpleado(empleado._id)}
                                        className="bg-red-500 text-white px-2 py-1 rounded w-10 h-10"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth="1.5"
                                            stroke="currentColor"
                                            className="size-6"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                        </svg>
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
            <button
                onClick={() => router.push("/empresa-dashboard")}
                className="flex mt-6 p-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 30 26"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="size-6"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
                </svg>
                Volver
            </button>
        </div>
    );
}
