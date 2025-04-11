"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";

interface Empresa {
    _id: string;
    nombre: string;
}

interface Chofer {
    _id: string;
    nombre: string;
    documento: string;
}

interface Empleado {
    _id: string;
    nombre: string;
    documento: string;
}

interface Playero {
    _id: string;
    nombre: string;
    documento: string;
}

interface Unidad {
    _id: string;
    matricula: string;
    tipo?: string;
    choferAnexado?: string;
    choferId?: string;
}

interface ExportSelection {
    choferes: boolean;
    empleados: boolean;
    playeros: boolean;
    unidades: boolean;
}

export default function EmpresasAdmin() {
    const [empresas, setEmpresas] = useState<Empresa[]>([]);
    const [selectedEmpresaId, setSelectedEmpresaId] = useState<string>("");
    const [choferes, setChoferes] = useState<Chofer[]>([]);
    const [empleados, setEmpleados] = useState<Empleado[]>([]);
    const [playeros, setPlayeros] = useState<Playero[]>([]);
    const [unidades, setUnidades] = useState<Unidad[]>([]);
    const [loading, setLoading] = useState(false);
    const [exportSelection, setExportSelection] = useState<ExportSelection>({
        choferes: false,
        empleados: false,
        playeros: false,
        unidades: false,
    });
    const [empresaSearch, setEmpresaSearch] = useState<string>("");

    // Encontramos la empresa seleccionada para usar su nombre al exportar
    const selectedEmpresa = empresas.find((e) => e._id === selectedEmpresaId);

    const empresasFiltradas = empresas.filter((empresa) =>
        empresa.nombre.toLowerCase().includes(empresaSearch.toLowerCase())
    );

    // Cargar lista de empresas al montar el componente
    useEffect(() => {
        const fetchEmpresas = async () => {
            try {
                const res = await fetch("/api/empresas");
                if (!res.ok) throw new Error("Error al cargar empresas");
                const data = await res.json();
                if (Array.isArray(data)) {
                    setEmpresas(data);
                } else {
                    console.error("La API de empresas no devolvió un array.");
                }
            } catch (error) {
                console.error(error);
                Swal.fire("Error", "No se pudieron cargar las empresas", "error");
            }
        };
        fetchEmpresas();
    }, []);

    // Cargar datos asociados a la empresa seleccionada
    useEffect(() => {
        if (!selectedEmpresaId) return;

        setLoading(true);

        const fetchData = async () => {
            try {
                const choferRes = await fetch(`/api/choferes?empresaId=${selectedEmpresaId}`);
                if (!choferRes.ok) throw new Error("Error al cargar choferes");
                const choferData = await choferRes.json();
                setChoferes(choferData); // Importante: primero cargamos los choferes

                const [empleadoRes, playeroRes, unidadRes] = await Promise.all([
                    fetch(`/api/empleados?empresaId=${selectedEmpresaId}`),
                    fetch(`/api/playeros?empresaId=${selectedEmpresaId}`),
                    fetch(`/api/unidades?empresaId=${selectedEmpresaId}`),
                ]);

                if (empleadoRes.ok) {
                    const data = await empleadoRes.json();
                    setEmpleados(data);
                }
                if (playeroRes.ok) {
                    const data = await playeroRes.json();
                    setPlayeros(data);
                }

                if (unidadRes.ok) {
                    const data = await unidadRes.json();

                    // Agregar nombre del chofer aquí con acceso al estado actualizado
                    const unidadesConChofer = data.map((u: Unidad) => {
                        const chofer = choferData.find((c: Chofer) => c._id === u.choferAnexado);
                        return {
                            ...u,
                            chofer: chofer ? chofer.nombre : "",
                        };
                    });

                    setUnidades(unidadesConChofer);
                    console.log("UNIDADES CON CHOFER:", unidadesConChofer);
                }
            } catch (error) {
                console.error(error);
                Swal.fire("Error", "No se pudieron cargar los datos de la empresa", "error");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [selectedEmpresaId]);

    // Función para manejar la selección de qué exportar
    const handleExportCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setExportSelection((prev) => ({
            ...prev,
            [name]: checked,
        }));
    };

    // Función para transformar los datos antes de exportar
    const transformDataForExport = (data: any[]) => {
        return data.map((row) => {
            const newRow = { ...row };

            // Eliminar campos innecesarios
            delete newRow._id;
            delete newRow.__v;

            // Si hay empresaId, lo convertimos en nombre
            if (newRow.empresaId) {
                newRow.empresa =
                    typeof newRow.empresaId === "object"
                        ? newRow.empresaId.nombre
                        : selectedEmpresa?.nombre || "";
                delete newRow.empresaId;
            }

            if ("choferAnexado" in newRow) {
                delete newRow.choferAnexado;
            }
            if ("choferId" in newRow) {
                delete newRow.choferId;
            }

            return newRow;
        });
    };

    // Función para exportar a Excel usando xlsx
    const exportToExcel = () => {
        if (
            !exportSelection.choferes &&
            !exportSelection.empleados &&
            !exportSelection.playeros &&
            !exportSelection.unidades
        ) {
            Swal.fire("Atención", "Seleccione al menos una categoría para descargar", "info");
            return;
        }

        const wb = XLSX.utils.book_new();

        if (exportSelection.choferes) {
            const transformedChoferes = transformDataForExport(choferes);
            const wsChoferes = XLSX.utils.json_to_sheet(transformedChoferes);
            XLSX.utils.book_append_sheet(wb, wsChoferes, "Choferes");
        }

        if (exportSelection.empleados) {
            const transformedEmpleados = transformDataForExport(empleados);
            const wsEmpleados = XLSX.utils.json_to_sheet(transformedEmpleados);
            XLSX.utils.book_append_sheet(wb, wsEmpleados, "Empleados");
        }

        if (exportSelection.playeros) {
            const transformedPlayeros = transformDataForExport(playeros);
            const wsPlayeros = XLSX.utils.json_to_sheet(transformedPlayeros);
            XLSX.utils.book_append_sheet(wb, wsPlayeros, "Playeros");
        }

        if (exportSelection.unidades) {
            const unidadesConChoferNombre = unidades.map((u) => {
                const chofer = choferes.find((c) => c._id === u.choferId);
                return {
                    ...u,
                    chofer: chofer ? chofer.nombre : "",
                };
            });

            const transformedUnidades = transformDataForExport(unidades);
            const wsUnidades = XLSX.utils.json_to_sheet(transformedUnidades);
            XLSX.utils.book_append_sheet(wb, wsUnidades, "Unidades");
        }

        const empresaNombre = selectedEmpresa?.nombre?.replace(/\s+/g, "_") || "empresa";
        const fileName = `datos_${empresaNombre}.xlsx`;

        XLSX.writeFile(wb, fileName);

    };

    // Función para renderizar tabla con estilos mejorados
    const renderTable = (
        data: any[],
        columns: { header: string; key: string }[]
    ) => {
        return (
            <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
                <thead className="bg-gray-100">
                    <tr>
                        {columns.map((col) => (
                            <th key={col.key} className="px-4 py-2 text-left border">
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, idx) => (
                        // Usamos idx como key si _id no está disponible en la transformación
                        <tr key={row._id || idx} className="hover:bg-gray-50">
                            {columns.map((col) => (
                                <td key={col.key} className="px-4 py-2 border">
                                    {row[col.key]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    };

    return (
        <div className="max-w-4xl mx-auto p-6 mt-20">
            <h1 className="text-3xl font-bold mb-6 text-center">Empresas</h1>

            {/* 🔍 Buscador y selección */}
            <div className="mb-6 space-y-3">
                {/* <input
                    type="text"
                    list="empresas-sugeridas"
                    placeholder="Buscar empresa..."
                    value={empresaSearch}
                    onChange={(e) => {
                        const valor = e.target.value;
                        setEmpresaSearch(valor);

                        const seleccionada = empresas.find(
                            (emp) => emp.nombre.toLowerCase() === valor.toLowerCase()
                        );
                        if (seleccionada) {
                            setSelectedEmpresaId(seleccionada._id);
                            setChoferes([]);
                            setEmpleados([]);
                            setPlayeros([]);
                            setUnidades([]);
                        }
                    }}
                    className="p-2 border border-gray-400 rounded w-full"
                />
                <datalist id="empresas-sugeridas">
                    {empresas.map((empresa) => (
                        <option key={empresa._id} value={empresa.nombre} />
                    ))}
                </datalist> */}

                <select
                    value={selectedEmpresaId}
                    onChange={(e) => setSelectedEmpresaId(e.target.value)}
                    className="p-2 border border-gray-400 rounded w-full"
                >
                    <option value="">Seleccione una Empresa</option>
                    {empresasFiltradas.map((empresa) => (
                        <option key={empresa._id} value={empresa._id}>
                            {empresa.nombre}
                        </option>
                    ))}
                </select>

                {/* ✅ Selección de categorías a exportar */}
                {selectedEmpresaId && (
                    <div className="space-y-2">
                        <h3 className="font-bold">Seleccione datos a descargar:</h3>
                        <div className="flex flex-wrap gap-4">
                            {["choferes", "empleados", "playeros", "unidades"].map((key) => (
                                <label key={key} className="flex items-center gap-1 capitalize">
                                    <input
                                        type="checkbox"
                                        name={key}
                                        checked={(exportSelection as any)[key]}
                                        onChange={handleExportCheckbox}
                                    />
                                    {key}
                                </label>
                            ))}
                        </div>
                        <button
                            onClick={exportToExcel}
                            className="mt-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                        >
                            Descargar Excel
                        </button>
                    </div>
                )}
            </div>

            {/* 📦 Datos cargados */}
            {loading ? (
                <p>Cargando datos...</p>
            ) : (
                selectedEmpresaId && (
                    <div>
                        <h2 className="text-2xl font-bold mb-4">Datos de la Empresa</h2>

                        <div className="mb-6">
                            <h3 className="font-bold mb-2">Choferes:</h3>
                            {choferes.length > 0
                                ? renderTable(choferes, [
                                    { header: "Nombre", key: "nombre" },
                                    { header: "Documento", key: "documento" },
                                ])
                                : <p>No hay choferes</p>}
                        </div>

                        <div className="mb-6">
                            <h3 className="font-bold mb-2">Empleados:</h3>
                            {empleados.length > 0
                                ? renderTable(empleados, [
                                    { header: "Nombre", key: "nombre" },
                                    { header: "Documento", key: "documento" },
                                ])
                                : <p>No hay empleados</p>}
                        </div>

                        <div className="mb-6">
                            <h3 className="font-bold mb-2">Playeros:</h3>
                            {playeros.length > 0
                                ? renderTable(playeros, [
                                    { header: "Nombre", key: "nombre" },
                                    { header: "Documento", key: "documento" },
                                ])
                                : <p>No hay playeros</p>}
                        </div>

                        <div className="mb-6">
                            <h3 className="font-bold mb-2">Unidades:</h3>
                            {unidades.length > 0
                                ? renderTable(unidades, [
                                    { header: "Matrícula", key: "matricula" },
                                    { header: "Chofer", key: "chofer" },
                                ])
                                : <p>No hay unidades</p>}
                        </div>
                    </div>
                )
            )}
        </div>
    );

}
