"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function RegistrarEmpresa() {
    const { data: session } = useSession();
    const router = useRouter();
    const [nombre, setNombre] = useState("");
    const [ruc_cuit, setRucCuit] = useState("");
    const [direccion, setDireccion] = useState("");
    const [telefono, setTelefono] = useState("");
    const [mensaje, setMensaje] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!session || !session.user) {
            setMensaje("⚠️ Debes iniciar sesión para registrar una empresa.");
            return;
        }

        const res = await fetch("/api/empresas", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                nombre,
                ruc_cuit,
                direccion,
                telefono,
                propietarioId: session.user.id,
            }),
        });

        const data = await res.json();
        setMensaje(data.message || data.error);

        if (res.ok) {
            console.log("✅ Empresa registrada correctamente", data.empresa);

            // 🔄 Redirigir a empresa-dashboard sin recargar la página
            router.push("/empresa-dashboard");
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6">
            <h2 className="text-2xl font-bold mb-4">Registrar Empresa</h2>
            <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md">
                <input
                    type="text"
                    placeholder="Nombre"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <input
                    type="text"
                    placeholder="RUC/CUIT"
                    value={ruc_cuit}
                    onChange={(e) => setRucCuit(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <input
                    type="text"
                    placeholder="Dirección"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <input
                    type="text"
                    placeholder="Teléfono"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <button
                    type="submit"
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
                >
                    Crear Empresa
                </button>
            </form>
            {mensaje && <p className="mt-4 text-center text-gray-700">{mensaje}</p>}
        </div>
    );
}
