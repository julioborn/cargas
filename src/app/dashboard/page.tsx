"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FiLogOut, FiHome, FiSettings } from "react-icons/fi";

export interface IOrden extends Document {
    _id: string; // Asegúrate de que _id es un string
    empresaId: { _id: string; nombre: string }; // Incluir el nombre de la empresa
    unidad: string;
    litros: number;
    precio: number;
    estado: "pendiente" | "completada";
    fecha: Date;
}

export default function DashboardPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [ordenes, setOrdenes] = useState<IOrden[]>([]);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    useEffect(() => {
        const fetchOrdenes = async () => {
            try {
                const res = await fetch("/api/ordenes");
                const data = await res.json();
                setOrdenes(data.ordenes || []); // Evitar asignar `undefined`
            } catch (error) {
                console.error("Error al obtener órdenes:", error);
            }
        };

        if (status === "authenticated") {
            fetchOrdenes();
        }
    }, [status]);

    if (status === "loading") {
        return <p className="text-center text-gray-600 mt-10">Cargando...</p>;
    }

    return (
        <div className="flex min-h-screen">
            {/* Sidebar */}
            <aside className="w-64 bg-gray-800 text-white p-6 flex flex-col">
                <h2 className="text-xl font-bold mb-6">Dashboard</h2>
                <nav className="space-y-4">
                    <a href="#" className="flex items-center gap-2 text-gray-300 hover:text-white">
                        <FiHome /> Inicio
                    </a>
                    <a href="#" className="flex items-center gap-2 text-gray-300 hover:text-white">
                        <FiSettings /> Configuración
                    </a>
                </nav>
                <button
                    onClick={() => signOut()}
                    className="mt-auto bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded flex items-center gap-2"
                >
                    <FiLogOut /> Cerrar sesión
                </button>
            </aside>

            {/* Contenido principal */}
            <main className="flex-1 bg-gray-100 p-6">
                <header className="flex justify-between items-center bg-white p-4 shadow-md rounded-lg">
                    <h1 className="text-lg font-semibold">Bienvenido, {session?.user?.name}!</h1>
                </header>

                {/* Lista de órdenes */}
                <div className="mt-6 bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-bold mb-4">Órdenes de Carga</h2>
                    {ordenes.length === 0 ? (
                        <p className="text-gray-500">No hay órdenes registradas.</p>
                    ) : (
                        <table className="w-full border-collapse border border-gray-300">
                            <thead>
                                <tr className="bg-gray-200">
                                    <th className="border border-gray-300 px-4 py-2">Empresa</th>
                                    <th className="border border-gray-300 px-4 py-2">Unidad</th>
                                    <th className="border border-gray-300 px-4 py-2">Litros</th>
                                    <th className="border border-gray-300 px-4 py-2">Precio</th>
                                    <th className="border border-gray-300 px-4 py-2">Estado</th>
                                    <th className="border border-gray-300 px-4 py-2">Fecha</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ordenes.map((orden) => (
                                    <tr key={orden._id} className="text-center">
                                        <td className="border border-gray-300 px-4 py-2">{orden.empresaId.nombre}</td>
                                        <td className="border border-gray-300 px-4 py-2">{orden.unidad}</td>
                                        <td className="border border-gray-300 px-4 py-2">{orden.litros}L</td>
                                        <td className="border border-gray-300 px-4 py-2">${orden.precio}</td>
                                        <td className={`border px-4 py-2 font-bold ${orden.estado === "pendiente" ? "text-red-500" : "text-green-500"
                                            }`}>
                                            {orden.estado}
                                        </td>
                                        <td className="border border-gray-300 px-4 py-2">
                                            {new Date(orden.fecha).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </main>
        </div>
    );
}
