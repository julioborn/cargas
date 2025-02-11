"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FiMenu, FiX, FiLogOut, FiUser } from "react-icons/fi";
import Image from "next/image";

export default function Header() {
    const { data: session } = useSession();
    const router = useRouter();
    const [menuAbierto, setMenuAbierto] = useState(false);

    return (
        <header className="bg-black text-white shadow-md fixed top-0 left-0 w-full z-50">
            <div className="max-w-6xl mx-auto px-6 py-4 flex justify-center items-center">
                {/* LOGO / NOMBRE */}
                <Link href="/" className="flex items-center space-x-2">
                    <Image
                        src="/cargas-black-header.png" // Ruta desde public/
                        alt="Logo"
                        width={200} // Ajusta el tamaño según tu necesidad
                        height={40} // Ajusta la altura según tu diseño
                        priority
                    />
                </Link>

                {/* MENU DE NAVEGACIÓN - VISIBLE EN PANTALLAS GRANDES
                <nav className="hidden md:flex space-x-6">
                    <Link href="/ordenes" className="hover:text-blue-400">Órdenes</Link>
                    <Link href="/unidades" className="hover:text-blue-400">Unidades</Link>
                    <Link href="/choferes" className="hover:text-blue-400">Choferes</Link>
                </nav> */}

                {/* ICONO DE MENÚ - SOLO EN MÓVILES */}
                <button
                    onClick={() => setMenuAbierto(!menuAbierto)}
                    className="md:hidden p-2 rounded focus:outline-none"
                >
                    {menuAbierto ? <FiX size={24} /> : <FiMenu size={24} />}
                </button>

                {/* MENÚ DESPLEGABLE PARA PERFIL Y CERRAR SESIÓN */}
                {menuAbierto && (
                    <div className="absolute top-12 right-6 bg-gray-800 shadow-md rounded-md py-2 w-40">
                        <Link href="/perfil" className="block px-4 py-2 hover:bg-gray-700">
                            <FiUser className="inline-block mr-2" /> Perfil
                        </Link>
                        <button
                            onClick={() => signOut()}
                            className="block w-full text-left px-4 py-2 text-red-500 hover:bg-gray-700"
                        >
                            <FiLogOut className="inline-block mr-2" /> Cerrar Sesión
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
}
