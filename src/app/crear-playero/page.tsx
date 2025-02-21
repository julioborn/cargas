"use client";

import { useState } from "react";
import Swal from "sweetalert2";

export default function CrearPlayero() {
    const [nombre, setNombre] = useState("");
    const [documento, setDocumento] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const res = await fetch("/api/playeros", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nombre, documento }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "Error al crear playero");
            } else {
                Swal.fire("Éxito", "Playero creado correctamente", "success");
                // Limpiar el formulario
                setNombre("");
                setDocumento("");
            }
        } catch (error) {
            setError("Error al crear playero");
        }
        setLoading(false);
    };

    return (
        <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded shadow-md">
            <h2 className="text-2xl font-bold mb-6 text-center">Crear Playero</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-gray-700 mb-1">
                        Nombre y Apellido
                    </label>
                    <input
                        type="text"
                        className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Ingrese nombre y apellido"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label className="block text-gray-700 mb-1">Documento</label>
                    <input
                        type="text"
                        className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Ingrese documento"
                        value={documento}
                        onChange={(e) => setDocumento(e.target.value)}
                        required
                    />
                </div>
                {error && <p className="text-red-500 text-center">{error}</p>}
                <button
                    type="submit"
                    className="w-full bg-green-600 text-white py-3 rounded hover:bg-green-700 transition duration-200"
                    disabled={loading}
                >
                    {loading ? "Creando..." : "Crear Playero"}
                </button>
            </form>
        </div>
    );
}
