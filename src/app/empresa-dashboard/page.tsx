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

    const handleAgregarUnidad = async () => {
        if (!empresa?._id) {
            Swal.fire("Error", "No se encontró el ID de la empresa", "error");
            return;
        }

        const { value } = await Swal.fire({
            title: "Agregar Unidad",
            html: `
            <div style="display: flex; flex-direction: column; align-items: center; gap: 10px;">
                <input id="swal-matricula" class="swal2-input" placeholder="Matrícula" style="width: 90%;">
                <select id="swal-tipo" class="swal2-input" style="width: 90%;">
                    <option value="camion">Camión</option>
                    <option value="colectivo">Colectivo</option>
                    <option value="utilitario">Utilitario</option>
                    <option value="automovil">Automóvil</option>
                    <option value="moto">Moto</option>
                </select>
            </div>
            `,
            showCancelButton: true,
            confirmButtonText: "Agregar",
            preConfirm: () => {
                return {
                    empresaId: empresa._id,
                    matricula: (document.getElementById("swal-matricula") as HTMLInputElement).value,
                    tipo: (document.getElementById("swal-tipo") as HTMLSelectElement).value,
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
                Swal.fire("¡Agregada!", "Unidad registrada correctamente.", "success");
                setUnidades([...unidades, value]); // Agrega la nueva unidad a la lista
            } else {
                Swal.fire("Error", "No se pudo registrar la unidad", "error");
            }
        }
    };

    if (status === "loading" || loading) {
        return <p className="text-center text-gray-600">Cargando...</p>;
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-center mb-4">Datos de la Empresa</h1>
            {empresa ? (
                <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg mx-auto">
                    <p className="text-gray-700"><strong>Nombre:</strong> {empresa.nombre}</p>
                    <p className="text-gray-700"><strong>RUC/CUIT:</strong> {empresa.ruc_cuit}</p>
                    <p className="text-gray-700"><strong>Dirección:</strong> {empresa.direccion}</p>
                    <p className="text-gray-700"><strong>Teléfono:</strong> {empresa.telefono}</p>

                    <div className="mt-6">
                        <h2 className="text-xl font-bold">Unidades</h2>
                        <button
                            onClick={handleAgregarUnidad}
                            className="mt-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg"
                        >
                            + Agregar Unidad
                        </button>
                        <ul className="mt-4">
                            {unidades.map((unidad) => (
                                <li key={unidad._id || unidad.matricula} className="border p-2 rounded mt-2">
                                    {unidad.matricula} - {unidad.tipo.toUpperCase()}
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
