"use client";

import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Determinar la ruta del dashboard según el rol del usuario
  const dashboardRoute = useMemo(() => {
    if (!session) return null;
    return session.user.role === "admin" ? "/dashboard" :
      session.user.role === "empresa" ? "/empresa-dashboard" : null;
  }, [session]);

  // Redirigir si el usuario no está autenticado
  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center text-center px-6">
      <div className="flex flex-col rouded bg-white p-16 rounded-md shadow-md border border-black">
        <h1 className="text-3xl font-bold mb-4 animate-fade-in">Bienvenido</h1>
        {dashboardRoute && (
          <button
            onClick={() => router.push(dashboardRoute)}
            className="mb-4 px-6 py-2 text-white bg-green-500 hover:bg-green-600 transition-all duration-300 rounded-md font-semibold shadow-md hover:shadow-lg"
          >
            Panel de Administración
          </button>
        )}

        <button
          onClick={handleLogout}
          className="px-6 py-2 text-white bg-red-500 hover:bg-red-600 transition-all duration-300 rounded-md font-semibold shadow-md hover:shadow-lg"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
