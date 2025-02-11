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

export default function Unidades() {
    const { data: session } = useSession();
    const userId = session?.user?.id;
    const router = useRouter();
    const [unidades, setUnidades] = useState<Unidad[]>([]);
    const [choferes, setChoferes] = useState<Chofer[]>([]);
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
                if (!data || !data._id) throw new Error("No se encontró el ID de la empresa");

                setEmpresaId(data._id);
            } catch (error) {
                console.error("❌ Error obteniendo empresa:", error);
            }
        };

        fetchEmpresa();
    }, [userId]);

    const fetchData = async () => {
        try {
            const resUnidades = await fetch(`/api/unidades`);
            const dataUnidades: Unidad[] = await resUnidades.json();
            const unidadesFiltradas = empresaId ? dataUnidades.filter(unidad => unidad.empresaId === empresaId) : [];
            setUnidades(unidadesFiltradas);

            const resChoferes = await fetch(`/api/choferes`);
            const dataChoferes: Chofer[] = await resChoferes.json();
            setChoferes(dataChoferes);
        } catch (error) {
            console.error("❌ Error obteniendo datos:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (empresaId) fetchData();
    }, [empresaId]);

    const handleAgregarUnidad = async () => {
        if (!empresaId) {
            Swal.fire("Error", "No se pudo obtener el ID de la empresa.", "error");
            return;
        }

        const { value } = await Swal.fire({
            title: "Agregar Nueva Unidad",
            html: `
                <input id="swal-matricula" class="swal2-input" placeholder="Matrícula">
                <select id="swal-tipo" class="swal2-input">
                    <option value="CAMION">CAMIÓN</option>
                    <option value="COLECTIVO">COLECTIVO</option>
                    <option value="UTILITARIO">UTILITARIO</option>
                    <option value="AUTOMOVIL">AUTOMÓVIL</option>
                    <option value="MOTO">MOTO</option>
                </select>
            `,
            showCancelButton: true,
            confirmButtonText: "Agregar",
            preConfirm: () => ({
                matricula: (document.getElementById("swal-matricula") as HTMLInputElement).value,
                tipo: (document.getElementById("swal-tipo") as HTMLSelectElement).value,
                empresaId, // Asegurar que la unidad tenga la empresa asociada
            }),
        });

        if (value) {
            const res = await fetch(`/api/unidades`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(value),
            });

            if (res.ok) {
                Swal.fire("¡Unidad Agregada!", "La unidad ha sido registrada correctamente.", "success");
                fetchData(); // 🔥 Recargar datos desde la API para reflejar la nueva unidad
            } else {
                Swal.fire("Error", "No se pudo agregar la unidad", "error");
            }
        }
    };

    const handleEditarUnidad = async (unidad: Unidad) => {
        const { value } = await Swal.fire({
            title: "Editar Unidad",
            html: `
                <input id="swal-matricula" class="swal2-input" value="${unidad.matricula}" placeholder="MATRÍCULA">
                <select id="swal-tipo" class="swal2-input">
                    <option value="CAMION" ${unidad.tipo === "CAMION" ? "selected" : ""}>CAMIÓN</option>
                    <option value="COLECTIVO" ${unidad.tipo === "COLECTIVO" ? "selected" : ""}>COLECTIVO</option>
                    <option value="UTILITARIO" ${unidad.tipo === "UTILITARIO" ? "selected" : ""}>UTILITARIO</option>
                    <option value="AUTOMOVIL" ${unidad.tipo === "AUTOMOVIL" ? "selected" : ""}>AUTOMÓVIL</option>
                    <option value="MOTO" ${unidad.tipo === "MOTO" ? "selected" : ""}>MOTO</option>
                </select>
            `,
            showCancelButton: true,
            confirmButtonText: "Guardar cambios",
            preConfirm: () => ({
                matricula: (document.getElementById("swal-matricula") as HTMLInputElement).value,
                tipo: (document.getElementById("swal-tipo") as HTMLSelectElement).value,
            }),
        });

        if (value) {
            const res = await fetch(`/api/unidades/${unidad._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(value),
            });

            if (res.ok) {
                Swal.fire("¡Actualizado!", "Unidad editada correctamente.", "success");
                setUnidades(unidades.map((u) => (u._id === unidad._id ? { ...u, ...value } : u)));
            } else {
                Swal.fire("Error", "No se pudo actualizar la unidad", "error");
            }
        }
    };

    const handleEliminarUnidad = async (unidadId: string) => {
        const confirmacion = await Swal.fire({
            title: "¿Eliminar unidad?",
            text: "Esta acción no se puede deshacer.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, eliminar",
        });

        if (confirmacion.isConfirmed) {
            const res = await fetch(`/api/unidades/${unidadId}`, {
                method: "DELETE",
            });

            if (res.ok) {
                Swal.fire("Eliminado", "La unidad ha sido eliminada.", "success");
                setUnidades(unidades.filter((unidad) => unidad._id !== unidadId));
            } else {
                Swal.fire("Error", "No se pudo eliminar la unidad", "error");
            }
        }
    };

    const handleAsignarChofer = async (unidad: Unidad) => {
        const { value: choferId } = await Swal.fire({
            title: "Asignar o cambiar chofer",
            input: "select",
            inputOptions: choferes.reduce((options, chofer) => {
                options[chofer._id] = `${chofer.nombre} (DNI: ${chofer.documento})`;
                return options;
            }, {} as Record<string, string>),
            inputPlaceholder: "Selecciona un chofer",
            showCancelButton: true,
            confirmButtonText: "Asignar",
            cancelButtonText: "Cancelar",
        });

        if (choferId) {
            const res = await fetch(`/api/unidades/${unidad._id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ choferAnexado: choferId }),
            });

            if (res.ok) {
                Swal.fire("¡Éxito!", "El chofer ha sido asignado correctamente.", "success");
                setUnidades(unidades.map(u => (u._id === unidad._id ? { ...u, choferAnexado: choferId } : u)));
            } else {
                Swal.fire("Error", "No se pudo asignar el chofer", "error");
            }
        }
    };

    const handleEliminarChofer = async (unidad: Unidad) => {
        const confirmacion = await Swal.fire({
            title: "¿Quitar chofer?",
            text: "Esta acción eliminará el chofer asignado a esta unidad.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, quitar",
        });

        if (confirmacion.isConfirmed) {
            const res = await fetch(`/api/unidades/${unidad._id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ choferAnexado: null }),
            });

            if (res.ok) {
                Swal.fire("¡Éxito!", "El chofer ha sido eliminado.", "success");
                setUnidades(unidades.map(u => (u._id === unidad._id ? { ...u, choferAnexado: null } : u)));
            } else {
                Swal.fire("Error", "No se pudo quitar el chofer", "error");
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

    const filteredUnidades = unidades.filter(unidad => {
        const chofer = choferes.find(c => c._id === unidad.choferAnexado);

        return (
            (unidad.matricula?.toLowerCase() ?? "").includes(searchTerm.toLowerCase()) ||
            (chofer?.nombre?.toLowerCase() ?? "").includes(searchTerm.toLowerCase()) ||
            (chofer?.documento?.toLowerCase() ?? "").includes(searchTerm.toLowerCase())
        );
    });

    return (
        <div className="max-w-2xl mx-auto p-6 mt-20">

            <div className="flex flex-col rounded-md p-6 bg-white border-2 border-black">
                <div className="flex justify-between mb-4 items-center">
                    <h2 className="text-2xl font-bold">Unidades</h2>
                    <button
                        onClick={handleAgregarUnidad}
                        className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md w-fit"
                    >
                        + Agregar Unidad
                    </button>
                </div>

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

                <div className="max-h-96 overflow-y-auto rounded p-2 mt-4">
                    <ul>
                        {filteredUnidades.map((unidad) => {
                            if (!unidad._id) return null; // Evitar elementos sin key
                            const chofer = choferes.find(c => c._id === unidad.choferAnexado);

                            return (
                                <li key={unidad._id} className="border border-gray-400 p-4 rounded mt-2 bg-white">

                                    {/* Unidad */}
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-800 text-lg font-bold">
                                            {unidad.tipo} - {unidad.matricula}
                                        </span>
                                    </div>

                                    {/* Chofer */}
                                    <p className="text-gray-600 text-md mt-2">
                                        <strong>Chofer:</strong> {chofer ? chofer.nombre : "Sin chofer asignado"}
                                    </p>
                                    {chofer && (
                                        <p className="text-gray-600 text-md">
                                            <strong>DNI:</strong> {chofer.documento}
                                        </p>
                                    )}

                                    {/* Botones */}
                                    <div className="flex gap-2 mt-4 justify-between">
                                        <div className="space-x-1">
                                            <button onClick={() => handleAsignarChofer(unidad)}
                                                className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">
                                                {unidad.choferAnexado ? "Cambiar Chofer" : "Asignar Chofer"}
                                            </button>
                                            {unidad.choferAnexado && (
                                                <button onClick={() => handleEliminarChofer(unidad)}
                                                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">
                                                    Quitar Chofer
                                                </button>
                                            )}
                                        </div>

                                        <div className="space-x-1">
                                            <button
                                                onClick={() => handleEditarUnidad(unidad)}
                                                className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleEliminarUnidad(unidad._id)}
                                                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </div>

            </div>

            <button
                onClick={() => router.push("/empresa-dashboard")}
                className="flex mt-6 p-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 30 26" strokeWidth="1.5" stroke="currentColor" className="size-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
                </svg>
                Volver al Panel de Empresa
            </button>

        </div>
    );
}
