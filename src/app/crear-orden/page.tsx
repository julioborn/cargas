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
    importe?: number;
    estado: string;
    fechaEmision: string;
    fechaCarga: string;
    // Nuevo: viáticos como objeto
    viaticos?: {
        monto?: number;
        moneda: "ARS" | "USD" | "Gs";
    };
}

export default function CrearOrden() {
    const { data: session, status } = useSession();
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
    const [importe, setImporte] = useState<string>("");
    const [tanqueLleno, setTanqueLleno] = useState<boolean>(false);
    const [condicionPago, setCondicionPago] = useState<"Cuenta Corriente" | "Pago Anticipado">("Cuenta Corriente");
    // Estados nuevos para viáticos
    const [viaticosMonto, setViaticosMonto] = useState<string>("");
    const [viaticosMoneda, setViaticosMoneda] = useState<"ARS" | "USD" | "Gs">("ARS");
    // const [fechaCarga, setFechaCarga] = useState<string>("");
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
                    fetch(`/api/ordenes?empresaId=${empresaId}`),
                    fetch(`/api/unidades`),
                    fetch(`/api/choferes`),
                ]);
                const dataOrdenes: Orden[] = await resOrdenes.json();
                const dataUnidades: Unidad[] = await resUnidades.json();
                const dataChoferes: Chofer[] = await resChoferes.json();

                setUnidades(dataUnidades.filter(u => u.empresaId === empresaId));
                setChoferes(dataChoferes.filter(c => c.empresaId === empresaId));
                setOrdenes(dataOrdenes);
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
        const unidad = unidades.find(u => u._id === unidadId);
        if (unidad?.choferAnexado) {
            setSelectedChofer(unidad.choferAnexado);
        } else {
            setSelectedChofer("");
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
            empresaId,
            unidadId: selectedUnidad,
            choferId: selectedChofer,
            producto: selectedProducto,
            litros: tanqueLleno ? undefined : litros ? parseFloat(litros) : undefined,
            importe: tanqueLleno ? undefined : importe ? parseFloat(importe) : undefined,
            tanqueLleno,
            condicionPago,
            estado: "PENDIENTE_AUTORIZACION",
            // Agregamos viáticos
            viaticos: {
                monto: viaticosMonto ? parseFloat(viaticosMonto) : undefined,
                moneda: viaticosMoneda
            }
        };

        console.log("📤 Enviando orden a la API:", nuevaOrden);
        const res = await fetch(`/api/ordenes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(nuevaOrden),
        });

        const data = await res.json();
        console.log("📥 Respuesta de la API:", data);
        if (res.ok) {
            setOrdenes([...ordenes, data]);
            Swal.fire("¡Orden Creada!", "La orden ha sido registrada correctamente.", "success")
                .then(() => {
                    router.push("/ordenes");
                });
            // Limpiar el formulario
            setSelectedUnidad("");
            setSelectedChofer("");
            setSelectedProducto("GASOIL_G2");
            setLitros("");
            setImporte("");
            setViaticosMonto("");
            setViaticosMoneda("ARS");
        } else {
            Swal.fire("Error", "No se pudo registrar la orden", "error");
        }
    };

    const handleTanqueLlenoChange = () => {
        setTanqueLleno(!tanqueLleno);
        if (!tanqueLleno) {
            setLitros("");
            setImporte("");
        }
    };

    const handleInputChange = (field: "litros" | "importe", value: string) => {
        if (field === "litros") {
            setLitros(value);
            if (value) {
                setImporte("");
                setTanqueLleno(false);
            }
        } else {
            setImporte(value);
            if (value) {
                setLitros("");
                setTanqueLleno(false);
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

    return (
        <div className="max-w-2xl mx-auto p-6 mt-20">
            <div className="flex flex-col rounded-md p-6 bg-white border-2 border-black">
                <h2 className="text-2xl font-bold">Crear Orden</h2>
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

                    <label className="block font-semibold">Condición de Pago</label>
                    <select
                        className="w-full p-2 border rounded mb-2"
                        value={condicionPago}
                        onChange={(e) => setCondicionPago(e.target.value as "Cuenta Corriente" | "Pago Anticipado")}
                    >
                        <option value="Cuenta Corriente">Cuenta Corriente</option>
                        <option value="Pago Anticipado">Pago Anticipado</option>
                    </select>

                    <div className="flex space-x-2 items-center mb-2">
                        <label className="block font-semibold">Tanque Lleno</label>
                        <input
                            type="checkbox"
                            checked={tanqueLleno}
                            onChange={handleTanqueLlenoChange}
                            className="w-6 h-6"
                            disabled={!!litros || !!importe}
                        />
                    </div>

                    <label className="block font-semibold">Litros</label>
                    <input
                        type="number"
                        className="w-full p-2 border rounded mb-2"
                        placeholder="Cantidad de litros"
                        value={litros}
                        onChange={(e) => handleInputChange("litros", e.target.value)}
                        disabled={tanqueLleno || !!importe}
                    />

                    <label className="block font-semibold">Importe</label>
                    <input
                        type="number"
                        className="w-full p-2 border rounded mb-2"
                        placeholder="Importe"
                        value={importe}
                        onChange={(e) => handleInputChange("importe", e.target.value)}
                        disabled={tanqueLleno || !!litros}
                    />

                    <label className="block font-semibold">Viáticos <span className="text-red-600">(Opcional)</span></label>
                    <div className="flex space-x-2 mb-2">
                        <input
                            type="number"
                            className="w-1/2 p-2 border rounded"
                            placeholder="Monto"
                            value={viaticosMonto}
                            onChange={(e) => setViaticosMonto(e.target.value)}
                        />
                        <select
                            className="w-1/2 p-2 border rounded"
                            value={viaticosMoneda}
                            onChange={(e) => setViaticosMoneda(e.target.value as "ARS" | "USD" | "Gs")}
                        >
                            <option value="ARS">ARS</option>
                            <option value="USD">USD</option>
                            <option value="Gs">Gs</option>
                        </select>
                    </div>

                    <button type="submit" className="w-fit bg-green-600 hover:bg-green-700 font-semibold text-white py-2 px-4 rounded mt-4">
                        + Crear Orden
                    </button>
                </form>
            </div>
        </div>
    );
}
