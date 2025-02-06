"use client";

import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const handleLogout = async () => {
      await signOut({ redirect: false });
      router.push("/login");
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return <p>Cargando...</p>;
  }

  return (
    <div>
      Bienvenido a la app, {session?.user?.name}!
      <button
        onClick={handleLogout}
        className="px-4 py-2 bg-red-500 text-white rounded"
      >
        Cerrar sesión
      </button>
    </div>
  );
}