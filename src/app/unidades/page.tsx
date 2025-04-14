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
    const { data: session, status } = useSession();
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

            const resChoferes = await fetch(`/api/choferes?empresaId=${empresaId}`);
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
                            if (!unidad._id) return null;
                            const chofer = choferes.find(c => c._id === unidad.choferAnexado);

                            return (
                                <li key={unidad._id} className="border border-gray-400 p-4 rounded mt-2 bg-white">
                                    {/* Datos de la unidad */}
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-800 text-lg font-bold">
                                            {unidad.tipo} - {unidad.matricula}
                                        </span>
                                    </div>

                                    {/* Datos del chofer */}
                                    <p className="text-gray-600 text-md mt-2">
                                        <strong>Chofer:</strong> {chofer ? chofer.nombre : "Sin chofer asignado"}
                                    </p>
                                    {chofer && (
                                        <p className="text-gray-600 text-md">
                                            <strong>DNI:</strong> {chofer.documento}
                                        </p>
                                    )}

                                    {/* Botones de acciones (centrados y mejor organizados) */}
                                    <div className="flex flex-row sm:flex-row flex-wrap gap-2 mt-4 justify-center items-center">
                                        {/* Botones de chofer */}
                                        <button
                                            onClick={() => handleAsignarChofer(unidad)}
                                            className="w-auto px-3 py-2 text-sm sm:text-base bg-green-600 text-white rounded hover:bg-green-700"
                                        >
                                            {unidad.choferAnexado ? "Cambiar Chofer" : "Asignar Chofer"}
                                        </button>
                                        {unidad.choferAnexado && (
                                            <button
                                                onClick={() => handleEliminarChofer(unidad)}
                                                className="w-auto px-3 py-2 text-sm sm:text-base bg-red-500 text-white rounded hover:bg-red-600"
                                            >
                                                Quitar Chofer
                                            </button>
                                        )}

                                        {/* Botones de edición/eliminación (uno al lado del otro y centrados) */}
                                        <button
                                            onClick={() => handleEditarUnidad(unidad)}
                                            className="w-auto px-3 py-2 text-sm sm:text-base bg-yellow-500 text-white rounded hover:bg-yellow-600"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
                                                <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
                                                <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => handleEliminarUnidad(unidad._id)}
                                            className="w-auto px-3 py-2 text-sm sm:text-base bg-red-500 text-white rounded hover:bg-red-600"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
                                                <path fill-rule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clip-rule="evenodd" />
                                            </svg>
                                        </button>
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
                Volver
            </button>

        </div>
    );
}
