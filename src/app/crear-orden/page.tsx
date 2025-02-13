"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
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

interface Orden {
    _id: string;
    empresaId: string;
    unidadId: string | Unidad;
    choferId: string | Chofer;
    producto: string;
    litros?: number;
    monto?: number;
    estado: string;
    fechaEmision: string;
    fechaCarga: string;
}

export default function CrearOrden() {
    const { data: session } = useSession();
    const userId = session?.user?.id;
    const [ordenes, setOrdenes] = useState<Orden[]>([]);
    const [unidades, setUnidades] = useState<Unidad[]>([]);
    const [choferes, setChoferes] = useState<Chofer[]>([]);
    const [empresaId, setEmpresaId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedUnidad, setSelectedUnidad] = useState<string>("");
    const [selectedChofer, setSelectedChofer] = useState<string>("");
    const [selectedProducto, setSelectedProducto] = useState<string>("GASOIL_G2");
    const [litros, setLitros] = useState<string>("");
    const [monto, setMonto] = useState<string>("");
    const [fechaCarga, setFechaCarga] = useState<string>("");
    const router = useRouter();

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

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [resOrdenes, resUnidades, resChoferes] = await Promise.all([
                    fetch(`/api/ordenes?empresaId=${empresaId}`), // ✅ Solo trae órdenes de la empresa
                    fetch(`/api/unidades`),
                    fetch(`/api/choferes`),
                ]);

                const dataOrdenes: Orden[] = await resOrdenes.json();
                const dataUnidades: Unidad[] = await resUnidades.json();
                const dataChoferes: Chofer[] = await resChoferes.json();

                setUnidades(dataUnidades.filter(u => u.empresaId === empresaId));
                setChoferes(dataChoferes.filter(c => c.empresaId === empresaId));
                setOrdenes(dataOrdenes); // ✅ Ya viene filtrado desde la API
            } catch (error) {
                console.error("❌ Error obteniendo datos:", error);
            } finally {
                setLoading(false);
            }
        };

        if (empresaId) fetchData();
    }, [empresaId]);

    const handleUnidadChange = (unidadId: string) => {
        setSelectedUnidad(unidadId);

        // Buscar la unidad seleccionada
        const unidad = unidades.find(u => u._id === unidadId);

        // Si la unidad tiene un chofer anexado, seleccionarlo automáticamente
        if (unidad?.choferAnexado) {
            setSelectedChofer(unidad.choferAnexado);
        } else {
            setSelectedChofer(""); // Si no tiene, dejar el campo vacío
        }
    };

    const handleCrearOrden = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedUnidad || !selectedChofer) {
            Swal.fire("Error", "Debes seleccionar una unidad y un chofer.", "error");
            return;
        }

        if (!empresaId) {
            Swal.fire("Error", "No se pudo obtener el ID de la empresa.", "error");
            return;
        }

        const nuevaOrden = {
            empresaId, // 🔥 Asegurar que se envía
            unidadId: selectedUnidad,
            choferId: selectedChofer,
            producto: selectedProducto,
            litros: litros ? parseFloat(litros) : undefined,
            monto: monto ? parseFloat(monto) : undefined,
            fechaCarga: fechaCarga || undefined,
            estado: "PENDIENTE",
        };

        console.log("📤 Enviando orden a la API:", nuevaOrden); // 🔥 Verificar en consola

        const res = await fetch(`/api/ordenes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(nuevaOrden),
        });

        const data = await res.json();
        console.log("📥 Respuesta de la API:", data); // 🔥 Verificar respuesta

        if (res.ok) {
            setOrdenes([...ordenes, data]);
            Swal.fire("¡Orden Creada!", "La orden ha sido registrada correctamente.", "success").then(() => {
                router.push("/ordenes"); // 🔥 Redirigir después de confirmar con SweetAlert2
            });
            
            // Limpiar el formulario
            setSelectedUnidad("");
            setSelectedChofer("");
            setSelectedProducto("GASOIL_G2");
            setLitros("");
            setMonto("");
            setFechaCarga("");
        } else {
            Swal.fire("Error", "No se pudo registrar la orden", "error");
        }
    };

    if (status === "loading" || loading) {
        return (
            <div className="flex items-center justify-center h-screen text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-green-500"></div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto p-6 mt-20">

            <div className="flex flex-col rounded-md p-6 bg-white border-2 border-black">
            <h2 className="text-2xl font-bold">Crear Órden</h2>
                <form onSubmit={handleCrearOrden} className="p-4">

                    <label className="block font-semibold">Unidad</label>
                    <select
                        className="w-full p-2 border rounded mb-2"
                        value={selectedUnidad}
                        onChange={(e) => handleUnidadChange(e.target.value)}
                    >
                        <option value="">Seleccionar unidad</option>
                        {unidades.map((unidad) => (
                            <option key={unidad._id} value={unidad._id}>
                                {unidad.matricula}
                            </option>
                        ))}
                    </select>

                    <label className="block font-semibold">Chofer</label>
                    <select
                        className="w-full p-2 border rounded mb-2"
                        value={selectedChofer}
                        onChange={(e) => setSelectedChofer(e.target.value)}
                    >
                        <option value="">Seleccionar chofer</option>
                        {choferes.map((chofer) => (
                            <option key={chofer._id} value={chofer._id}>
                                {chofer.nombre} (DNI: {chofer.documento})
                            </option>
                        ))}
                    </select>

                    <label className="block font-semibold">Producto</label>
                    <select className="w-full p-2 border rounded mb-2" value={selectedProducto} onChange={(e) => setSelectedProducto(e.target.value)}>
                        <option value="GASOIL_G2">Gasoil G2</option>
                        <option value="GASOIL_G3">Gasoil G3</option>
                        <option value="NAFTA_SUPER">Nafta Súper</option>
                        <option value="NAFTA_ECO">Nafta Eco</option>
                    </select>

                    <label className="block font-semibold">Litros <span className="text-red-600">(Opcional)</span></label>
                    <input
                        type="number"
                        className="w-full p-2 border rounded mb-2"
                        placeholder="Cantidad de litros"
                        value={litros}
                        onChange={(e) => setLitros(e.target.value)}
                    />

                    <label className="block font-semibold">Monto <span className="text-red-600">(Opcional)</span></label>
                    <input
                        type="number"
                        className="w-full p-2 border rounded mb-2"
                        placeholder="Monto total"
                        value={monto}
                        onChange={(e) => setMonto(e.target.value)}
                    />

                    <label className="block font-semibold">Fecha de Carga <span className="text-red-600">(Opcional)</span></label>
                    <input
                        type="date"
                        className="w-full p-2 border rounded mb-2"
                        value={fechaCarga}
                        onChange={(e) => setFechaCarga(e.target.value)}
                    />

                    <button type="submit" className="w-fit bg-green-600 hover:bg-green-700 font-semibold text-white py-2 px-4 rounded mt-4">
                        + Crear Orden
                    </button>
                </form>
            </div>

        </div>
    );
}
