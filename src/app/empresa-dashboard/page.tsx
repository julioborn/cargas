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
    estado: "PENDIENTE_AUTORIZACION" | "AUTORIZADA" | "PENDIENTE_CARGA" | "CARGA_FINALIZADA";
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
    const [unidades, setUnidades] = useState<Unidad[]>([]);
    const [choferes, setChoferes] = useState<Chofer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [mensaje, setMensaje] = useState("");
    const [menuAbierto, setMenuAbierto] = useState(false);
    const [ordenes, setOrdenes] = useState<Orden[]>([]);

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

                // 2️⃣ Obtener unidades
                const resUnidades = await fetch(`/api/unidades`);
                const dataUnidades: Unidad[] = await resUnidades.json();
                const unidadesFiltradas = dataUnidades.filter((unidad) => unidad.empresaId === dataEmpresa._id);
                setUnidades(unidadesFiltradas);

                // 3️⃣ Obtener choferes
                const resChoferes = await fetch(`/api/choferes`);
                const dataChoferes: Chofer[] = await resChoferes.json();
                const choferesFiltrados = dataChoferes.filter((chofer) => chofer.empresaId === dataEmpresa._id);
                setChoferes(choferesFiltrados);

                // 4️⃣ Obtener órdenes y enriquecer datos con unidades y choferes
                const resOrdenes = await fetch(`/api/ordenes`);
                const dataOrdenes: Orden[] = await resOrdenes.json();

                if (!Array.isArray(dataOrdenes)) {
                    console.error("❌ La API no devolvió un array en /api/ordenes", dataOrdenes);
                    return;
                }

                const ordenesConDatos = dataOrdenes.map((orden) => {
                    const unidad = unidadesFiltradas.find((u) => u._id === orden.unidadId);
                    const chofer = choferesFiltrados.find((c) => c._id === orden.choferId);

                    return {
                        ...orden,
                        unidadMatricula: unidad ? unidad.matricula : "Desconocida",
                        unidadTipo: unidad ? unidad.tipo : "Desconocido",
                        choferNombre: chofer ? chofer.nombre : "Desconocido",
                        choferDocumento: chofer ? chofer.documento : "Desconocido",
                    };
                });

                setOrdenes(ordenesConDatos);
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
            <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
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
                setUnidades([]);
            } else {
                Swal.fire("Error", "No se pudo eliminar la empresa", "error");
            }
        }
    };

    //Unidad
    const handleAgregarUnidad = async () => {
        if (!empresa?._id) {
            Swal.fire("Error", "No se encontró el ID de la empresa", "error");
            return;
        }

        const { value } = await Swal.fire({
            title: "Agregar Unidad",
            html: `
                <div style="display: flex; flex-direction: column; align-items: center; gap: 10px;">
                    <input id="swal-matricula" class="swal2-input" placeholder="MATRÍCULA" style="width: 90%; text-transform: uppercase;">
                    <select id="swal-tipo" class="swal2-input" style="width: 90%; text-transform: uppercase;">
                        <option value="CAMION">CAMIÓN</option>
                        <option value="COLECTIVO">COLECTIVO</option>
                        <option value="UTILITARIO">UTILITARIO</option>
                        <option value="AUTOMOVIL">AUTOMÓVIL</option>
                        <option value="MOTO">MOTO</option>
                    </select>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: "Agregar",
            preConfirm: () => {
                return {
                    empresaId: empresa._id,
                    matricula: (document.getElementById("swal-matricula") as HTMLInputElement).value.toUpperCase(),
                    tipo: (document.getElementById("swal-tipo") as HTMLSelectElement).value.toUpperCase(),
                    choferAnexado: null, // 🔥 Asegurar que la unidad nueva NO tenga chofer asignado
                };
            },
        });

        if (value) {
            const res = await fetch(`/api/unidades`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(value),
            });

            if (res.ok) {
                const nuevaUnidad = await res.json();
                Swal.fire("¡Agregada!", "Unidad registrada correctamente.", "success");

                setUnidades([...unidades, nuevaUnidad.unidad]); // ✅ Agregar la unidad con `choferAnexado: null`
            } else {
                Swal.fire("Error", "No se pudo registrar la unidad", "error");
            }
        }
    };
    const handleEditarUnidad = async (unidad: Unidad) => {
        const { value } = await Swal.fire({
            title: "Editar Unidad",
            html: `
                <div style="display: flex; flex-direction: column; align-items: center; gap: 10px;">
                    <input id="swal-matricula" class="swal2-input" value="${unidad.matricula}" placeholder="MATRÍCULA" style="width: 90%; text-transform: uppercase;">
                    <select id="swal-tipo" class="swal2-input" style="width: 90%; text-transform: uppercase;">
                        <option value="CAMION" ${unidad.tipo.toUpperCase() === "CAMION" ? "selected" : ""}>CAMIÓN</option>
                        <option value="COLECTIVO" ${unidad.tipo.toUpperCase() === "COLECTIVO" ? "selected" : ""}>COLECTIVO</option>
                        <option value="UTILITARIO" ${unidad.tipo.toUpperCase() === "UTILITARIO" ? "selected" : ""}>UTILITARIO</option>
                        <option value="AUTOMOVIL" ${unidad.tipo.toUpperCase() === "AUTOMOVIL" ? "selected" : ""}>AUTOMÓVIL</option>
                        <option value="MOTO" ${unidad.tipo.toUpperCase() === "MOTO" ? "selected" : ""}>MOTO</option>
                    </select>
                </div>
            `  ,
            showCancelButton: true,
            confirmButtonText: "Guardar cambios",
            preConfirm: () => {
                return {
                    matricula: (document.getElementById("swal-matricula") as HTMLInputElement).value,
                    tipo: (document.getElementById("swal-tipo") as HTMLSelectElement).value,
                };
            },
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
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Sí, eliminar",
        });

        if (confirmacion.isConfirmed) {
            const res = await fetch(`/api/unidades/${unidadId}`, {
                method: "DELETE",
            });

            if (res.ok) {
                Swal.fire("Eliminado", "La unidad ha sido eliminada.", "success");
                setUnidades(unidades.filter((unidad) => unidad._id !== unidadId)); // ✅ Actualizar estado
            } else {
                Swal.fire("Error", "No se pudo eliminar la unidad", "error");
            }
        }
    };
    const handleAnexarOQuitarChofer = async (unidad: Unidad) => {
        if (unidad.choferAnexado) {
            // ✅ Si hay un chofer asignado, dar opción para quitarlo
            const confirmacion = await Swal.fire({
                title: "¿Quitar chofer?",
                text: "Esta acción eliminará el chofer asignado a esta unidad.",
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Sí, quitar",
                cancelButtonText: "Cancelar"
            });

            if (confirmacion.isConfirmed) {
                const res = await fetch(`/api/unidades/${unidad._id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ choferAnexado: null }), // 🔥 Eliminar chofer
                });

                if (res.ok) {
                    const updatedUnidad = await res.json();
                    Swal.fire("¡Éxito!", "El chofer ha sido eliminado de la unidad.", "success");

                    setUnidades((prevUnidades) =>
                        prevUnidades.map((u) =>
                            u._id === unidad._id ? { ...u, choferAnexado: null } : u
                        )
                    );
                } else {
                    Swal.fire("Error", "No se pudo quitar el chofer", "error");
                }
            }
        } else {
            // ✅ Si no hay chofer asignado, permitir asignar uno
            const { value } = await Swal.fire({
                title: "Anexar Chofer",
                html: `
                    <select id="swal-chofer" class="swal2-input">
                        ${choferes.map((chofer) => `<option value="${chofer._id}">${chofer.nombre} (DNI: ${chofer.documento})</option>`).join("")}
                    </select>
                `,
                showCancelButton: true,
                confirmButtonText: "Anexar",
                preConfirm: () => {
                    return (document.getElementById("swal-chofer") as HTMLSelectElement).value;
                }
            });

            if (value) {
                const res = await fetch(`/api/unidades/${unidad._id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ choferAnexado: value }),
                });

                if (res.ok) {
                    const updatedUnidad = await res.json();
                    Swal.fire("¡Éxito!", "El chofer fue anexado a la unidad.", "success");

                    setUnidades((prevUnidades) =>
                        prevUnidades.map((u) =>
                            u._id === unidad._id ? { ...u, choferAnexado: updatedUnidad.unidad.choferAnexado } : u
                        )
                    );
                } else {
                    Swal.fire("Error", "No se pudo anexar el chofer", "error");
                }
            }
        }
    };

    //Chofer
    const handleAgregarChofer = async () => {
        if (!empresa?._id) {
            Swal.fire("Error", "No se encontró el ID de la empresa", "error");
            return;
        }

        const { value } = await Swal.fire({
            title: "Agregar Chofer",
            html: `
            <div style="display: flex; flex-direction: column; align-items: center; gap: 10px;">
                <input id="swal-nombre" class="swal2-input" placeholder="Nombre" style="width: 90%;">
                <input id="swal-documento" class="swal2-input" placeholder="Documento" style="width: 90%;">
            </div>
            `,
            showCancelButton: true,
            confirmButtonText: "Agregar",
            preConfirm: () => {
                return {
                    empresaId: empresa._id,
                    nombre: (document.getElementById("swal-nombre") as HTMLInputElement).value,
                    documento: (document.getElementById("swal-documento") as HTMLInputElement).value,
                };
            },
        });

        if (value) {
            const res = await fetch(`/api/choferes`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(value),
            });

            if (res.ok) {
                Swal.fire("¡Agregado!", "Chofer registrado correctamente.", "success");
                setChoferes([...choferes, value]); // Agrega el nuevo chofer a la lista
            } else {
                Swal.fire("Error", "No se pudo registrar el chofer", "error");
            }
        }
    };
    const handleEditarChofer = async (chofer: Chofer) => {
        const { value } = await Swal.fire({
            title: "Editar Chofer",
            html: `
                <input id="swal-nombre" class="swal2-input" value="${chofer.nombre}" placeholder="Nombre del Chofer">
                <input id="swal-documento" class="swal2-input" value="${chofer.documento}" placeholder="Documento">
            `,
            showCancelButton: true,
            confirmButtonText: "Guardar cambios",
            preConfirm: () => {
                return {
                    nombre: (document.getElementById("swal-nombre") as HTMLInputElement).value,
                    documento: (document.getElementById("swal-documento") as HTMLInputElement).value,
                };
            },
        });

        if (value) {
            const res = await fetch(`/api/choferes/${chofer._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(value),
            });

            if (res.ok) {
                Swal.fire("¡Actualizado!", "Chofer editado correctamente.", "success");
                setChoferes(choferes.map((c) => (c._id === chofer._id ? { ...c, ...value } : c)));
            } else {
                Swal.fire("Error", "No se pudo actualizar el chofer", "error");
            }
        }
    };
    const handleEliminarChofer = async (choferId: string) => {
        const confirmacion = await Swal.fire({
            title: "¿Eliminar chofer?",
            text: "Esta acción no se puede deshacer.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Sí, eliminar",
        });

        if (confirmacion.isConfirmed) {
            const res = await fetch(`/api/choferes/${choferId}`, {
                method: "DELETE",
            });

            if (res.ok) {
                Swal.fire("Eliminado", "El chofer ha sido eliminado.", "success");
                setChoferes(choferes.filter((chofer) => chofer._id !== choferId));
            } else {
                Swal.fire("Error", "No se pudo eliminar el chofer", "error");
            }
        }
    };

    //Orden
    const handleCrearOrden = async () => {
        const { value } = await Swal.fire({
            title: "Crear Orden",
            width: "450px", // 📏 Tamaño ajustado para evitar desbordes
            html: `
                <style>
                    .swal2-popup {
                        width: 450px !important; 
                        padding: 20px !important;
                        box-sizing: border-box !important;
                    }
                    .swal2-container {
                        padding: 0 !important;
                    }
                    .swal2-grid {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 12px;
                        justify-content: center;
                        width: 100%;
                    }
                    .swal2-field {
                        width: 100%;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        text-align: center;
                    }
                    .swal2-field label {
                        font-size: 14px;
                        font-weight: bold;
                        margin-bottom: 5px;
                    }
                    .swal2-input, .swal2-select {
                        width: 95% !important;
                        height: 36px !important;
                        font-size: 14px !important;
                        padding: 5px;
                        box-sizing: border-box !important;
                        border-radius: 5px;
                        border: 1px solid #ccc;
                    }
                </style>
    
                <div class="swal2-grid">
                    <div class="swal2-field">
                        <label>Unidad</label>
                        <select id="swal-unidad" class="swal2-select">
                            ${unidades.map((unidad) => `<option value="${unidad._id}">${unidad.matricula}</option>`).join("")}
                        </select>
                    </div>
    
                    <div class="swal2-field">
                        <label>Chofer</label>
                        <select id="swal-chofer" class="swal2-select">
                            ${choferes.map((chofer) => `<option value="${chofer._id}">${chofer.nombre}</option>`).join("")}
                        </select>
                    </div>
    
                    <div class="swal2-field">
                        <label>Producto</label>
                        <select id="swal-producto" class="swal2-select">
                            <option value="GASOIL_G2">Gasoil G2</option>
                            <option value="GASOIL_G3">Gasoil G3</option>
                            <option value="NAFTA_SUPER">Nafta Súper</option>
                            <option value="NAFTA_ECO">Nafta Eco</option>
                        </select>
                    </div>
    
                    <div class="swal2-field">
                        <label>Fecha de Carga</label>
                        <input id="swal-fecha-carga" class="swal2-input" type="date">
                    </div>
    
                    <div class="swal2-field">
                        <label>Litros (Opcional)</label>
                        <input id="swal-litros" class="swal2-input" type="number" placeholder="Cantidad de litros">
                    </div>
    
                    <div class="swal2-field">
                        <label>Monto (Opcional)</label>
                        <input id="swal-monto" class="swal2-input" type="number" placeholder="Monto total">
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: "Registrar",
            preConfirm: () => {
                return {
                    unidadId: (document.getElementById("swal-unidad") as HTMLSelectElement).value,
                    choferId: (document.getElementById("swal-chofer") as HTMLSelectElement).value,
                    producto: (document.getElementById("swal-producto") as HTMLSelectElement).value,
                    litros: parseFloat((document.getElementById("swal-litros") as HTMLInputElement).value) || undefined,
                    monto: parseFloat((document.getElementById("swal-monto") as HTMLInputElement).value) || undefined,
                    fechaCarga: (document.getElementById("swal-fecha-carga") as HTMLInputElement).value || undefined,
                };
            }
        });

        if (value) {
            console.log("Orden creada:", value);
        }
    };


    const formatText = (text: string) => {
        return text.replace(/_/g, " "); // Reemplaza los guiones bajos por espacios
    };


    return (
        <div className="p-6">
            <h1 className="text-2xl text-white font-bold text-center mb-4">Datos de la Empresa</h1>
            {empresa ? (
                <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg mx-auto relative">

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
                            className="p-2 bg-gray-200 rounded-full hover:bg-gray-300"
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

                    {/* Unidades */}
                    <div className="mt-6">
                        <h2 className="text-xl font-bold">Unidades</h2>
                        <button
                            onClick={handleAgregarUnidad}
                            className="mt-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg"
                        >
                            + Agregar Unidad
                        </button>

                        {/* 🔥 Cards en fila, cada una ocupa todo el ancho */}
                        <div className="mt-4 flex flex-col gap-4">
                            {unidades.map((unidad, index) => {
                                const chofer = choferes.find(c => c._id === unidad.choferAnexado);

                                return (
                                    <div key={unidad._id || index} className="bg-white shadow-lg rounded-lg p-5 flex flex-col gap-3">
                                        {/* 📌 Info de la Unidad */}
                                        <div className="flex flex-col">
                                            <h3 className="text-lg font-bold text-gray-800">{unidad.tipo} - {unidad.matricula}</h3>

                                            {/* Chofer Asignado */}
                                            <div className="mt-2 text-gray-600 text-sm">
                                                <p className="font-semibold">Chofer:</p>
                                                {chofer ? (
                                                    <>
                                                        <p>{chofer.nombre}</p>
                                                        <p className="text-xs text-gray-500">DNI: {chofer.documento}</p>
                                                    </>
                                                ) : (
                                                    <p className="text-red-500">Sin chofer asignado</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* 📌 Botones de Acción (Debajo de la Info) */}
                                        <div className="mt-4 flex flex-col items-center gap-2">
                                            <button
                                                onClick={() => handleAnexarOQuitarChofer(unidad)}
                                                className={`w-full flex items-center justify-center px-3 py-2 rounded text-white font-medium transition ${unidad.choferAnexado ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600"
                                                    }`}
                                            >
                                                {unidad.choferAnexado ? (
                                                    <>
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5 mr-2">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                        Desvincular Chofer
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5 mr-2">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                                        </svg>
                                                        Vincular Chofer
                                                    </>
                                                )}
                                            </button>

                                            <div className="flex justify-center w-full gap-4">
                                                <button
                                                    onClick={() => handleEditarUnidad(unidad)}
                                                    className="flex items-center justify-center bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded transition w-1/2"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5 mr-2">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                                    </svg>
                                                    Editar
                                                </button>

                                                <button
                                                    onClick={() => handleEliminarUnidad(unidad._id)}
                                                    className="flex items-center justify-center bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition w-1/2"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5 mr-2">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                                    </svg>
                                                    Eliminar
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Choferes */}
                    <div className="mt-6">
                        <h2 className="text-xl font-bold">Choferes</h2>
                        <button
                            onClick={handleAgregarChofer}
                            className="mt-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg"
                        >
                            + Agregar Chofer
                        </button>
                        <ul className="mt-4">
                            {choferes.map((chofer, index) => (
                                <li key={chofer._id || index} className="border p-2 rounded mt-2 flex justify-between">
                                    {chofer.nombre.toUpperCase()} - {chofer.documento}
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEditarChofer(chofer)} className="bg-yellow-500 text-white px-2 py-1 rounded">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                            </svg>
                                        </button>
                                        <button onClick={() => handleEliminarChofer(chofer._id)} className="bg-red-500 text-white px-2 py-1 rounded">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                            </svg>
                                        </button>
                                    </div>
                                </li>

                            ))}
                        </ul>
                    </div>

                    {/* Listado de Órdenes */}
                    <div className="mt-6">
                        <h2 className="text-xl font-bold">Órdenes</h2>
                        <button
                            onClick={handleCrearOrden}
                            className="mt-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg"
                        >
                            + Crear Orden
                        </button>
                        <ul className="mt-4">
                            {ordenes.map((orden) => (
                                <li key={orden._id} className="border p-2 rounded mt-2 flex flex-col">
                                    <span><strong>Producto:</strong> {formatText(orden.producto)}</span>
                                    <span><strong>Estado:</strong> {formatText(orden.estado)}</span>
                                    <span><strong>Vehículo:</strong> {orden.unidadTipo} - {orden.unidadMatricula}</span>
                                    <span><strong>Chofer:</strong> {orden.choferNombre} - {orden.choferDocumento}</span>
                                    {orden.litros && <span><strong>Litros:</strong> {orden.litros} L</span>}
                                    {orden.monto && <span><strong>Monto:</strong> $ {orden.monto}</span>}
                                    <span><strong>Fecha:</strong> {new Date(orden.fechaEmision).toLocaleDateString()}</span>
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