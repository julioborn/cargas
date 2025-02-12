"use client";

import Image from "next/image";
import Link from "next/link";

export default function Header() {

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

            </div>
        </header>
    );
}
