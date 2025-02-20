"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Empresa {
    nombre: string;
    // Agrega otros campos que necesites de la empresa
}

interface Unidad {
    matricula: string;
    // Otros campos si son necesarios
}

interface Chofer {
    nombre: string;
    documento: string;
}

interface Orden {
    _id: string;
    codigoOrden: string;
    producto: string;
    estado: string;
    fechaCarga: string;
    tanqueLleno: boolean;
    litros?: number;
    importe?: number;
    condicionPago?: string;
    fechaEmision?: string;
    empresaId?: Empresa;
    unidadId?: Unidad;
    choferId?: Chofer;
}

export default function ChoferOrdenes() {
    const { data: session, status } = useSession();
    const [ordenes, setOrdenes] = useState<Orden[]>([]);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        if (status === "loading") return; // Espera a que se cargue la sesión

        // Si no hay sesión o el usuario no es chofer, redirige al login
        if (!session || session.user.role !== "chofer") {
            router.push("/login");
            return;
        }

        const fetchOrdenes = async () => {
            try {
                const res = await fetch("/api/ordenes");
                const data = await res.json();
                console.log("Respuesta de /api/ordenes:", data);

                if (Array.isArray(data)) {
                    setOrdenes(data);
                } else {
                    // Si data no es un array, maneja el error
                    console.error("Se esperaba un array de órdenes, pero se recibió:", data);
                    setErrorMsg("Error: No se pudieron cargar las órdenes.");
                    setOrdenes([]);
                }
            } catch (error) {
                console.error("Error al obtener órdenes:", error);
                setErrorMsg("Error al obtener las órdenes.");
            }
        };

        fetchOrdenes();
    }, [session, status, router]);

    if (status === "loading" || !session) {
        return (
            <div className="flex justify-center items-center h-screen">
                Cargando...
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 mt-16">
            <h1 className="text-2xl font-bold text-center mb-6">
                Órdenes Asignadas
            </h1>
            {errorMsg && (
                <p className="text-center text-red-500 mb-4">{errorMsg}</p>
            )}
            {ordenes.length === 0 ? (
                <p className="text-center text-gray-600">
                    No tienes órdenes asignadas.
                </p>
            ) : (
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {ordenes.map((orden) => (
                        <div key={orden._id} className="bg-white rounded-lg shadow-lg p-6">
                            <h2 className="text-xl font-bold mb-4">Orden <span className="text-green-600">{orden.codigoOrden}</span></h2>
                            <div className="space-y-2 text-gray-700">
                                <p>
                                    <span className="font-semibold">Producto:</span>{" "}
                                    {orden.producto.replace(/_/g, " ")}
                                </p>
                                <p>
                                    <span className="font-semibold">Estado:</span>{" "}
                                    {orden.estado}
                                </p>
                                {orden.empresaId && (
                                    <p>
                                        <span className="font-semibold">Empresa:</span>{" "}
                                        {orden.empresaId.nombre}
                                    </p>
                                )}
                                {orden.unidadId && (
                                    <p>
                                        <span className="font-semibold">Matrícula:</span>{" "}
                                        {orden.unidadId.matricula}
                                    </p>
                                )}
                                {orden.choferId && (
                                    <p>
                                        <span className="font-semibold">Chofer:</span>{" "}
                                        {orden.choferId.nombre} ({orden.choferId.documento})
                                    </p>
                                )}
                                {/* <p>
                                    <span className="font-semibold">Fecha de Carga:</span>{" "}
                                    {new Date(orden.fechaCarga).toLocaleString()}
                                </p> */}
                                {/* Mostrar solo una de las tres opciones */}
                                {orden.tanqueLleno ? (
                                    <p>
                                        <span className="font-semibold">Tanque Lleno</span>
                                    </p>
                                ) : orden.litros ? (
                                    <p>
                                        <span className="font-semibold">Litros:</span> {orden.litros}
                                    </p>
                                ) : orden.importe ? (
                                    <p>
                                        <span className="font-semibold">Importe:</span> {orden.importe}
                                    </p>
                                ) : null}
                                {orden.condicionPago && (
                                    <p>
                                        <span className="font-semibold">Condición de Pago:</span>{" "}
                                        {orden.condicionPago}
                                    </p>
                                )}
                                {orden.fechaEmision && (
                                    <p>
                                        <span className="font-semibold">Fecha de Emisión:</span>{" "}
                                        {new Date(orden.fechaEmision).toLocaleString()}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
