"use client";

import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [dashboardRoute, setDashboardRoute] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/login");
    } else if (session) {
      const userRole = session?.user?.role; // Suponiendo que el rol viene en la sesión

      if (userRole === "admin") {
        setDashboardRoute("/dashboard");
      } else if (userRole === "empresa") {
        setDashboardRoute("/empresa-dashboard");
      }
    }
  }, [status, session, router]);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white text-lg">
        Cargando...
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-900 text-white text-center px-6">
      <h1 className="text-3xl font-bold mb-4 animate-fade-in">Bienvenido</h1>

      {dashboardRoute ? (
        <button
          onClick={() => router.push(dashboardRoute)}
          className="mb-4 px-6 py-2 bg-blue-500 hover:bg-blue-600 transition rounded-md font-semibold"
        >
          Panel de Administración
        </button>
      ) : null}

      <button
        onClick={handleLogout}
        className="px-6 py-2 bg-red-500 hover:bg-red-600 transition rounded-md font-semibold"
      >
        Cerrar sesión
      </button>
    </div>
  );
}
