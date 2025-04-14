"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

interface Playero {
    _id: string;
    nombre: string;
    documento: string;
    ubicacionId?: string | { _id: string; nombre: string };
}

export default function Playeros() {
    const router = useRouter();
    const [playeros, setPlayeros] = useState<Playero[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState<string>("");

    useEffect(() => {
        const fetchPlayeros = async () => {
            try {
                const res = await fetch(`/api/playeros`);
                if (!res.ok) throw new Error("No se pudo obtener la lista de playeros");
                const data: Playero[] = await res.json();
                setPlayeros(data);
            } catch (error) {
                console.error("❌ Error obteniendo playeros:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPlayeros();
    }, []);

    const handleAgregarPlayero = async () => {
        try {
            // Obtener las ubicaciones disponibles
            const resUbicaciones = await fetch("/api/ubicaciones");
            if (!resUbicaciones.ok) throw new Error("Error al obtener ubicaciones");
            const ubicaciones = await resUbicaciones.json();
            const ubicacionOptions = ubicaciones
                .map((u: { _id: string; nombre: string }) => `<option value="${u._id}">${u.nombre}</option>`)
                .join("");

            const { value } = await Swal.fire({
                title: "Agregar Playero",
                html: `
                    <input id="swal-nombre" class="swal2-input" placeholder="Nombre del Playero">
                    <input id="swal-documento" class="swal2-input" placeholder="Documento">
                    <select id="swal-ubicacion" class="swal2-input">
                        <option value="">Selecciona una ubicación (opcional)</option>
                        ${ubicacionOptions}
                    </select>
            `,
                showCancelButton: true,
                confirmButtonText: "Agregar",
                preConfirm: () => {
                    const nombre = (document.getElementById("swal-nombre") as HTMLInputElement).value.trim();
                    const documento = (document.getElementById("swal-documento") as HTMLInputElement).value.trim();
                    const ubicacionId = (document.getElementById("swal-ubicacion") as HTMLSelectElement).value;
                    if (!nombre || !documento) {
                        Swal.showValidationMessage("Todos los campos son obligatorios");
                        return false;
                    }
                    return { nombre: nombre.toUpperCase(), documento, ubicacionId: ubicacionId || undefined };
                },
            });

            if (value) {
                const res = await fetch(`/api/playeros`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(value),
                });
                if (!res.ok) throw new Error("Error al registrar el playero");
                const nuevoPlayero = await res.json();
                Swal.fire("¡Agregado!", "Playero registrado correctamente.", "success");
                setPlayeros([...playeros, nuevoPlayero]);
            }
        } catch (error) {
            console.error("❌ Error registrando playero:", error);
            Swal.fire("Error", "No se pudo registrar el playero", "error");
        }
    };

    const handleEditarPlayero = async (playero: Playero) => {
        try {
            // Obtenemos las ubicaciones disponibles para construir el select
            const resUbicaciones = await fetch("/api/ubicaciones");
            let locationOptions = "";
            if (resUbicaciones.ok) {
                const ubicaciones = await resUbicaciones.json();
                locationOptions = ubicaciones
                    .map((u: { _id: string; nombre: string }) => {
                        // Si el playero ya tiene asignada una ubicación (y viene como objeto), la marcamos como seleccionada
                        const isSelected =
                            typeof playero.ubicacionId === "object" &&
                            playero.ubicacionId &&
                            playero.ubicacionId._id === u._id;
                        return `<option value="${u._id}" ${isSelected ? "selected" : ""}>${u.nombre}</option>`;
                    })
                    .join("");
            }

            const { value } = await Swal.fire({
                title: "Editar Playero",
                html: `
              <input id="swal-nombre" class="swal2-input" value="${playero.nombre}" placeholder="Nombre del Playero">
              <input id="swal-documento" class="swal2-input" value="${playero.documento}" placeholder="Documento">
              <select id="swal-ubicacion" class="swal2-input">
                <option value="">Selecciona una ubicación (opcional)</option>
                ${locationOptions}
              </select>
            `,
                showCancelButton: true,
                confirmButtonText: "Guardar cambios",
                preConfirm: () => {
                    const nombre = (document.getElementById("swal-nombre") as HTMLInputElement)
                        .value.trim()
                        .toUpperCase();
                    const documento = (document.getElementById("swal-documento") as HTMLInputElement)
                        .value.trim();
                    const ubicacionId = (document.getElementById("swal-ubicacion") as HTMLSelectElement).value;
                    if (!nombre || !documento) {
                        Swal.showValidationMessage("Nombre y documento son obligatorios");
                        return false;
                    }
                    return { nombre, documento, ubicacionId: ubicacionId || undefined };
                },
            });

            if (value) {
                const res = await fetch(`/api/playeros/${playero._id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(value),
                });
                if (!res.ok) {
                    const errResponse = await res.json();
                    throw new Error(errResponse.error || "Error al actualizar el playero");
                }
                const updatedPlayero = await res.json();
                Swal.fire("¡Actualizado!", "Playero editado correctamente.", "success");
                setPlayeros((prev) =>
                    prev.map((p) => (p._id === playero._id ? updatedPlayero : p))
                );
            }
        } catch (error) {
            console.error("❌ Error actualizando playero:", error);
            Swal.fire("Error", "No se pudo actualizar el playero", "error");
        }
    };

    const handleEliminarPlayero = async (playeroId: string) => {
        const confirmacion = await Swal.fire({
            title: "¿Eliminar playero?",
            text: "Esta acción no se puede deshacer.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, eliminar",
        });

        if (confirmacion.isConfirmed) {
            try {
                const res = await fetch(`/api/playeros/${playeroId}`, {
                    method: "DELETE",
                });
                if (!res.ok) {
                    const errResponse = await res.json();
                    throw new Error(errResponse.error || "Error al eliminar el playero");
                }
                Swal.fire("Eliminado", "El playero ha sido eliminado.", "success");
                setPlayeros((prev) => prev.filter((p) => p._id !== playeroId));
            } catch (error) {
                console.error("❌ Error eliminando playero:", error);
                Swal.fire("Error", "No se pudo eliminar el playero", "error");
            }
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-green-500"></div>
            </div>
        );
    }

    const filteredPlayeros = playeros.filter((playero) =>
        playero.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        playero.documento.includes(searchTerm)
    );

    return (
        <div className="max-w-2xl mx-auto p-6 mt-20">
            <div className="flex flex-col rounded-md p-6 bg-white border-2 border-black">
                <div className="flex justify-between mb-4 items-center">
                    <h2 className="text-2xl font-bold text-black">Playeros</h2>
                    <button
                        onClick={handleAgregarPlayero}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg w-fit"
                    >
                        + Agregar Playero
                    </button>
                </div>

                <div className="relative flex items-center border border-gray-400 rounded">
                    <input
                        type="text"
                        placeholder="Buscar por nombre o documento"
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
                        {filteredPlayeros.map((playero) => (
                            <li key={playero._id} className="border p-2 rounded mt-2 flex justify-between bg-white border-gray-400">
                                <div className="flex flex-col">
                                    <span className="text-gray-800 font-semibold">
                                        {playero.nombre.toUpperCase()}
                                    </span>
                                    <span className="text-gray-600">DNI: {playero.documento}</span>
                                    {playero.ubicacionId && (
                                        <span className="text-gray-600">
                                            Ubicación:{" "}
                                            {typeof playero.ubicacionId === "object"
                                                ? playero.ubicacionId.nombre
                                                : playero.ubicacionId}
                                        </span>
                                    )}
                                </div>
                                <div className="flex gap-2 items-center">
                                    <button
                                        onClick={() => handleEditarPlayero(playero)}
                                        className="bg-yellow-500 text-white px-2 py-1 rounded w-10 h-10"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth="1.5"
                                            stroke="currentColor"
                                            className="w-6 h-6"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                                            />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => handleEliminarPlayero(playero._id)}
                                        className="bg-red-500 text-white px-2 py-1 rounded w-10 h-10"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth="1.5"
                                            stroke="currentColor"
                                            className="w-6 h-6"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="m14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                                            />
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
                className="flex mt-6 p-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md items-center gap-2"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 30 26"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="w-6 h-6"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
                </svg>
                Volver
            </button>
        </div>
    );
}
