import NextAuth from "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            name: string;
            email: string;
            role: "admin" | "empresa";
            empresaId?: string | null; // ✅ Agregar empresaId como opcional
        };
    }

    interface User {
        id: string;
        name: string;
        email: string;
        role: "admin" | "empresa";
        empresaId?: string | null; // ✅ Agregar empresaId como opcional
    }
}
