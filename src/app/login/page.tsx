"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const [role, setRole] = useState("usuario"); // "usuario" abarca admin y empresa
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [documento, setDocumento] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Preparamos las credenciales a enviar según la opción seleccionada
        const credentials: Record<string, string> = { role };

        if (role === "chofer") {
            credentials.documento = documento;
        } else {
            credentials.email = email;
            credentials.password = password;
        }

        console.log("🔍 Intentando iniciar sesión con:", credentials);

        const result = await signIn("credentials", {
            ...credentials,
            redirect: false,
        });

        console.log("🔍 Respuesta del signIn:", result);

        if (result?.error) {
            setError("Credenciales incorrectas");
        } else {
            await fetch("/api/auth/session");
            router.refresh();

            setTimeout(async () => {
                const res = await fetch("/api/auth/session");
                const session = await res.json();
                console.log("🔍 Sesión después de login:", session);

                if (session?.user?.role === "chofer") {
                    router.push("/chofer-ordenes"); // Ruta exclusiva para choferes
                } else {
                    router.push("/dashboard"); // Para usuarios (admin/empresa)
                }
            }, 100);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center ">
            <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-sm">
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
                    Iniciar Sesión
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-gray-700 font-medium mb-1">
                            Tipo de Usuario
                        </label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="usuario">Administrador</option>
                            <option value="chofer">Chofer</option>
                        </select>
                    </div>

                    {role === "chofer" ? (
                        <div>
                            <label className="block text-gray-700 font-medium mb-1">
                                DNI
                            </label>
                            <input
                                type="text"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Ingrese su DNI"
                                value={documento}
                                onChange={(e) => setDocumento(e.target.value)}
                                required
                            />
                        </div>
                    ) : (
                        <>
                            <div>
                                <label className="block text-gray-700 font-medium mb-1">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="tu@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 font-medium mb-1">
                                    Contraseña
                                </label>
                                <input
                                    type="password"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Contraseña"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </>
                    )}

                    {error && (
                        <p className="text-red-500 text-sm text-center">{error}</p>
                    )}
                    <button
                        type="submit"
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
                    >
                        Ingresar
                    </button>
                </form>
            </div>
        </div>
    );
}
